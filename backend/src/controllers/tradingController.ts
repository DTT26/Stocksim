import { Request, Response } from 'express';
import { TradingService } from '../services/tradingService';

const resolveUserId = (req: any): string | null => {
  if (req.user?._id) return req.user._id.toString();
  if (req.params?.userId) return req.params.userId;
  if (req.body?.userId) return req.body.userId;
  if (req.query?.userId) return req.query.userId as string;
  return null;
};

export const openLong = async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { symbol, margin, leverage, currentPrice, stopLoss, takeProfit } = req.body;
    
    if (!userId || !symbol || !margin || !leverage || !currentPrice) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const result = await TradingService.openLong(userId, symbol, margin, leverage, currentPrice, stopLoss, takeProfit);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const openShort = async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { symbol, margin, leverage, currentPrice, stopLoss, takeProfit } = req.body;
    
    if (!userId || !symbol || !margin || !leverage || !currentPrice) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const result = await TradingService.openShort(userId, symbol, margin, leverage, currentPrice, stopLoss, takeProfit);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const closePosition = async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { symbol, side, currentPrice, closeQty } = req.body;
    
    if (!userId || !symbol || !side || !currentPrice) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const result = await TradingService.closePosition(userId, symbol, side, currentPrice, closeQty);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateTPSL = async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { symbol, side, takeProfit, stopLoss } = req.body;
    
    if (!userId || !symbol || !side) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const result = await TradingService.updateTPSL(userId, symbol, side, takeProfit, stopLoss);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const addMargin = async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { symbol, side, amount } = req.body;
    
    if (!userId || !symbol || !side || !amount) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const result = await TradingService.addMargin(userId, symbol, side, amount);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getPortfolio = async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing userId" });
    }

    const portfolio = await TradingService.getPortfolio(userId);
    res.status(200).json({ success: true, data: portfolio });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const transactions = await TradingService.getTransactions(userId || undefined);
    res.status(200).json({ success: true, data: transactions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const placeLimitOrder = async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { symbol, side, limitPrice, margin, leverage, stopLoss, takeProfit, orderType } = req.body;
    if (!userId || !symbol || !side || !limitPrice || !margin || !leverage) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }
    const result = await TradingService.placeLimitOrder(userId, symbol, side, limitPrice, margin, leverage, stopLoss, takeProfit, orderType);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const cancelLimitOrder = async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { orderId } = req.body;
    if (!userId || !orderId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const result = await TradingService.cancelLimitOrder(userId, orderId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const checkTriggers = async (req: Request, res: Response) => {
  try {
    const { userId, prices } = req.body;
    if (!userId || !prices) {
      return res.status(400).json({ success: false, message: "Missing parameters" });
    }
    const result = await TradingService.checkPriceTriggers(userId, prices);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
