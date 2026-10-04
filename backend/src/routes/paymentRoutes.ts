import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { protect, optionalProtect } from '../middleware/authMiddleware';

const router = Router();
const PYTHON_URL = (process.env.PYTHON_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, '');

// 1. Create Checkout Link (Requires Auth)
router.post('/create-checkout', protect, async (req: any, res: Response) => {
  try {
    const userId = req.user?._id?.toString();
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : req.cookies?.token;
    const authHeader = token ? `Bearer ${token}` : req.headers.authorization;
    const url = `${PYTHON_URL}/api/v1/payment/create-checkout`;

    let lastError: any = null;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(userId ? { 'x-user-id': userId } : {}),
            ...(authHeader ? { Authorization: authHeader } : {})
          },
          body: JSON.stringify(req.body),
          signal: AbortSignal.timeout(35000)
        });

        if (!resp.ok) {
          if ((resp.status === 502 || resp.status === 503 || resp.status === 504) && attempt < maxAttempts) {
            console.warn(`[Payment Route] Python returned ${resp.status} on attempt ${attempt}. Retrying in 5s for cold-start...`);
            await new Promise(r => setTimeout(r, 5000));
            continue;
          }
          const errorText = await resp.text();
          const isHtml = errorText.trim().startsWith('<') || errorText.includes('<!DOCTYPE html');
          const cleanMsg = isHtml
            ? `Cổng thanh toán đang khởi động lại (${resp.status} Bad Gateway). Vui lòng thử lại sau 20-30 giây.`
            : errorText.slice(0, 300);
          return res.status(resp.status).json({ success: false, message: cleanMsg });
        }

        const data = await resp.json();
        return res.status(resp.status).json(data);
      } catch (err: any) {
        lastError = err;
        if (attempt < maxAttempts) {
          console.warn(`[Payment Route] Connection error on attempt ${attempt}: ${err?.message}. Retrying...`);
          await new Promise(r => setTimeout(r, 4000));
        }
      }
    }

    return res.status(500).json({ 
      success: false, 
      message: 'Máy chủ thanh toán đang khởi động lại trên Render. Vui lòng bấm thử lại sau 20-30 giây.' 
    });
  } catch (error: any) {
    console.error('Error forwarding create-checkout to python:', error);
    return res.status(500).json({ success: false, message: 'Lỗi kết nối cổng thanh toán. Vui lòng thử lại.' });
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
