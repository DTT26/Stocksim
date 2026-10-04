import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { ChallengeService } from '../services/challengeService';
import Transaction, { TransactionType } from '../models/Transaction';

// GET /api/challenge/levels
export const getLevels = (req: AuthRequest, res: Response) => {
  try {
    const levels = ChallengeService.getLevels();
    res.json({ success: true, levels });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/challenge/me
export const getMyChallenge = async (req: AuthRequest, res: Response) => {
  try {
    const challenge = await ChallengeService.getUserChallenge(req.user._id, req.user.name);

    // Tính toán thống kê các lệnh đã đóng trong Thử Thách Quỹ (accountType: 'CHALLENGE')
    const challengeTrades = await Transaction.find({
      userId: req.user._id,
      accountType: 'CHALLENGE',
      type: TransactionType.CLOSE_POSITION
    });

    const totalTrades = challengeTrades.length;
    const winTrades = challengeTrades.filter(t => (t.amount || 0) > 0).length;
    const winRate = totalTrades > 0 ? Number(((winTrades / totalTrades) * 100).toFixed(1)) : 0;
    const totalParticipatedChallenges = (challenge.history?.length || 0) + (challenge.status && challenge.status !== 'NOT_STARTED' ? 1 : 0);

    res.json({ 
      success: true, 
      challenge,
      stats: {
        totalTrades,
        winTrades,
        winRate,
        totalParticipatedChallenges
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/challenge/start
export const startLevel = async (req: AuthRequest, res: Response) => {
  try {
    const { levelId } = req.body;
    if (!levelId) {
      return res.status(400).json({ success: false, message: 'levelId là bắt buộc' });
    }

    const challenge = await ChallengeService.startChallenge(req.user._id, req.user.name, Number(levelId));
    res.json({ success: true, challenge, message: 'Kích hoạt bài thi thành công' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /api/challenge/reset
export const resetChallenge = async (req: AuthRequest, res: Response) => {
  try {
    const result = await ChallengeService.resetChallenge(req.user._id);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message, challenge: result.challenge });
    }
    res.json({ success: true, challenge: result.challenge, message: result.message });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/challenge/pause
export const pauseChallenge = async (req: AuthRequest, res: Response) => {
  try {
    const challenge = await ChallengeService.pauseChallenge(req.user._id);
    res.json({ success: true, challenge, message: 'Đã tạm dừng bài thi' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/challenge/resume
export const resumeChallenge = async (req: AuthRequest, res: Response) => {
  try {
    const challenge = await ChallengeService.resumeChallenge(req.user._id);
    res.json({ success: true, challenge, message: 'Đã tiếp tục bài thi' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/challenge/end
export const endChallenge = async (req: AuthRequest, res: Response) => {
  try {
    const challenge = await ChallengeService.endChallenge(req.user._id);
    res.json({ success: true, challenge, message: 'Đã kết thúc bài thi' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/challenge/evaluate
export const evaluateRisk = async (req: AuthRequest, res: Response) => {
  try {
    const { unrealizedPnLUSD, hasExecutedTradeToday } = req.body;
    const challenge = await ChallengeService.evaluateRisk(
      req.user._id,
      Number(unrealizedPnLUSD || 0),
      Boolean(hasExecutedTradeToday)
    );
    res.json({ success: true, challenge });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
