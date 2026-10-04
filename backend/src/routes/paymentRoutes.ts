import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { protect, optionalProtect } from '../middleware/authMiddleware';

const router = Router();
const PYTHON_URL = (process.env.PYTHON_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, '');

import crypto from 'crypto';

const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || '36b42cdb-88d3-495a-86c0-8ab0ec569930';
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || '4be5cbe4-49ed-4440-b086-3b8b58e9ddd0';
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || 'ab22898958a2c88fb47eeda5c8c0447a540252f2071a6f6476bd81ac33510b5c';

function createPayOSSignature(data: Record<string, any>, checksumKey: string): string {
  const sortedKeys = ['amount', 'cancelUrl', 'description', 'orderCode', 'returnUrl'];
  const signData = sortedKeys
    .filter(k => data[k] !== undefined && data[k] !== null)
    .map(k => `${k}=${data[k]}`)
    .join('&');
  return crypto.createHmac('sha256', checksumKey).update(signData).digest('hex');
}

async function createDirectPayOSCheckout(userId: string, body: any): Promise<any> {
  const isPro = String(body.plan || '').toUpperCase().includes('PRO');
  const amount = isPro ? 299000 : 129000;
  const shortUid = String(userId).slice(-8);
  const description = `${isPro ? 'PRO' : 'PLUS'} ${shortUid}`.slice(0, 25);
  const orderCode = Math.floor(100000000 + Math.random() * 800000000);
  
  const returnUrl = body.returnUrl || process.env.PAYOS_RETURN_URL || 'http://localhost:5173/payment/success';
  const cancelUrl = body.cancelUrl || process.env.PAYOS_CANCEL_URL || 'http://localhost:5173/payment/cancel';

  const payload: Record<string, any> = {
    orderCode,
    amount,
    description,
    cancelUrl,
    returnUrl
  };

  payload.signature = createPayOSSignature(payload, PAYOS_CHECKSUM_KEY);

  const res = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
    method: 'POST',
    headers: {
      'x-client-id': PAYOS_CLIENT_ID,
      'x-api-key': PAYOS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const json: any = await res.json();
  if (json.code === '00' && json.data?.checkoutUrl) {
    try {
      const db = mongoose.connection.db;
      if (db) {
        await db.collection('payments').insertOne({
          user_id: String(userId),
          order_code: orderCode,
          plan: isPro ? 'PRO' : 'PLUS',
          amount,
          status: 'PENDING',
          payment_provider: 'PAYOS',
          checkout_url: json.data.checkoutUrl,
          qr_code: json.data.qrCode,
          created_at: new Date(),
          paid_at: null
        });
      }
    } catch (dbErr) {
      console.warn('Could not save pending payment to DB:', dbErr);
    }

    return {
      success: true,
      orderCode,
      checkoutUrl: json.data.checkoutUrl,
      qrCode: json.data.qrCode
    };
  }

  throw new Error(json.desc || 'PayOS API error');
}

// 1. Create Checkout Link (Requires Auth)
router.post('/create-checkout', protect, async (req: any, res: Response) => {
  const userId = req.user?._id?.toString();
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : req.cookies?.token;
  const authHeader = token ? `Bearer ${token}` : req.headers.authorization;
  const url = `${PYTHON_URL}/api/v1/payment/create-checkout`;

  // 1. Try Python microservice with fast timeout (4s)
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(userId ? { 'x-user-id': userId } : {}),
        ...(authHeader ? { Authorization: authHeader } : {})
      },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(4000)
    });

    if (resp.ok) {
      const data = await resp.json();
      return res.status(resp.status).json(data);
    }
  } catch (pythonErr: any) {
    console.warn('[Payment Route] Python service offline or sleeping. Seamlessly using Direct PayOS Checkout fallback:', pythonErr.message);
  }

  // 2. Direct PayOS fallback: Generates real VietQR link immediately without python dependency!
  try {
    const directResult = await createDirectPayOSCheckout(userId, req.body);
    return res.json(directResult);
  } catch (directErr: any) {
    console.error('[Payment Route] Direct PayOS checkout failed:', directErr);
    return res.status(500).json({ success: false, message: directErr.message || 'Lỗi kết nối cổng thanh toán. Vui lòng thử lại.' });
  }
});

// 2. PayOS Webhook (Public with PayOS Signature verification)
router.post('/payos-webhook', async (req: Request, res: Response) => {
  try {
    const resp = await fetch(`${PYTHON_URL}/api/v1/payment/payos-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const data = await resp.json();
    return res.status(resp.status).json(data);
  } catch (error: any) {
    console.error('Error forwarding payos-webhook to python:', error);
    return res.status(500).json({ success: false, message: 'Webhook processing error' });
  }
});


// 3. Verify Order with PayOS directly (Requires Auth)
router.get('/verify-order/:orderCode', protect, async (req: any, res: Response) => {
  const userId = req.user?._id?.toString();
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : req.cookies?.token;
  const authHeader = token ? `Bearer ${token}` : req.headers.authorization;

  try {
    const resp = await fetch(`${PYTHON_URL}/api/v1/payment/verify-order/${req.params.orderCode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(userId ? { 'x-user-id': userId } : {}),
        ...(authHeader ? { Authorization: authHeader } : {})
      },
      signal: AbortSignal.timeout(6000)
    });

    if (resp.ok) {
      const data = await resp.json();
      return res.status(resp.status).json(data);
    }
  } catch (error: any) {
    console.warn(`[Payment] verify-order via python service failed: ${error?.message || error}. Checking MongoDB...`);
  }

  // Fallback to MongoDB payments collection if python service is unavailable
  try {
    const db = mongoose.connection.db;
    const orderNum = parseInt(req.params.orderCode, 10);
    if (db && !isNaN(orderNum)) {
      const pay = await db.collection('payments').findOne({ order_code: orderNum });
      if (pay && pay.status === 'PAID') {
        return res.json({
          success: true,
          status: 'PAID',
          is_premium: true,
          orderCode: orderNum,
          message: 'Giao dịch đã được xác nhận thanh toán.'
        });
      }
    }
    return res.json({
      success: true,
      status: 'PENDING',
      is_premium: false,
      orderCode: req.params.orderCode,
      message: 'Giao dịch đang chờ xử lý'
    });
  } catch (dbErr: any) {
    console.error('Error in MongoDB payment verify fallback:', dbErr);
    return res.status(500).json({ success: false, message: 'Lỗi xác minh thanh toán' });
  }
});

export default router;
