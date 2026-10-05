import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Simulation from '../models/Simulation';
import SimulationParticipant from '../models/SimulationParticipant';
import Assignment from '../models/Assignment';
import User from '../models/User';
import Submission from '../models/Submission';
import Order from '../models/Order';
import PaperTradingSession from '../models/PaperTradingSession';
import PaperTradingHistory from '../models/PaperTradingHistory';
import { createNotification } from './notificationController';


// POST /api/simulations (Lecturer/Admin only)
export const createSimulation = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, initialBalance, market, startDate, endDate } = req.body;

    const simulation = new Simulation({
      name,
      description,
      initialBalance,
      market,
      startDate,
      endDate,
      createdBy: req.user._id,
      status: 'DRAFT',
    });

    const createdSimulation = await simulation.save();
    res.status(201).json(createdSimulation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// GET /api/simulations
export const getSimulations = async (req: AuthRequest, res: Response) => {
  try {
    // Nếu là student hoặc khách viếng thăm, lấy những simulation đã PUBLISHED, ACTIVE, ENDED
    let filter = {};
    if (!req.user || req.user.role === 'student') {
      filter = { status: { $in: ['PUBLISHED', 'ACTIVE', 'ENDED'] } };
    }
    
    const simulations = await Simulation.find(filter).populate('createdBy', 'name email').lean();

    const simIds = simulations.map(s => s._id);
    const participantCounts = await SimulationParticipant.aggregate([
      { $match: { simulationId: { $in: simIds } } },
      { $group: { _id: '$simulationId', count: { $sum: 1 } } }
    ]);

    const countMap = new Map();
    participantCounts.forEach((p: any) => {
      countMap.set(p._id.toString(), p.count);
    });

    const enrichedSimulations = simulations.map(sim => ({
      ...sim,
      participantsCount: countMap.get(sim._id.toString()) || 0
    }));

    res.json(enrichedSimulations);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// GET /api/simulations/:id
export const getSimulationById = async (req: AuthRequest, res: Response) => {
  try {
    const simulation = await Simulation.findById(req.params.id).populate('createdBy', 'name email');
    if (!simulation) {
      return res.status(404).json({ message: 'Simulation not found' });
    }
    res.json(simulation);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// PATCH /api/simulations/:id/status (Lecturer/Admin only)
export const updateSimulationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const simulation = await Simulation.findById(req.params.id);
    if (!simulation) {
      return res.status(404).json({ message: 'Simulation not found' });
    }

    // Tùy chọn: Kiểm tra xem người sửa có phải người tạo không

    simulation.status = req.body.status || simulation.status;
    const updatedSimulation = await simulation.save();
    res.json(updatedSimulation);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// POST /api/simulations/:id/join (Student only)
export const joinSimulation = async (req: AuthRequest, res: Response) => {
  try {
    const simulationId = req.params.id;
    const userId = req.user._id;

    const simulation = await Simulation.findById(simulationId);
    if (!simulation) {
      return res.status(404).json({ message: 'Simulation not found' });
    }

    if (simulation.status !== 'PUBLISHED' && simulation.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'Cannot join this simulation at current status' });
    }

    // Check if already requested or joined
    const existing = await SimulationParticipant.findOne({ simulationId, userId });
    if (existing) {
      if (existing.status === 'PENDING') {
        return res.status(400).json({ message: 'Yêu cầu tham gia của bạn đang chờ phê duyệt' });
      }
      if (existing.status === 'ACTIVE') {
        return res.status(400).json({ message: 'Bạn đã ở trong simulation này' });
      }
      if (existing.status === 'REJECTED') {
        existing.status = 'PENDING';
        await existing.save();
        return res.status(200).json({ message: 'Đã nộp lại yêu cầu tham gia thành công!', participant: existing });
      }
    }

    const participant = new SimulationParticipant({
      simulationId,
      userId,
      initialBalance: simulation.initialBalance,
      currentBalance: simulation.initialBalance,
      portfolioValue: 0,
      totalProfit: 0,
      returnRate: 0,
      status: 'PENDING'
    });

    await participant.save();

    await createNotification(userId, {
      title: 'Yêu cầu tham gia mô phỏng',
      message: `Bạn đã gửi yêu cầu tham gia cuộc thi "${simulation.name}". Đang chờ Giảng viên phê duyệt.`,
      type: 'SIMULATION_JOIN',
      link: '/student/simulations'
    });

    if (simulation.createdBy) {
      await createNotification(simulation.createdBy, {
        title: 'Yêu cầu tham gia mới',
        message: `Sinh viên ${req.user.name || req.user.email} muốn tham gia "${simulation.name}".`,
        type: 'SIMULATION_JOIN',
        link: `/lecturer/simulations/${simulation._id}/students`
      });
    }

    res.status(201).json({ message: 'Yêu cầu tham gia đã gửi. Vui lòng chờ Giảng viên phê duyệt!', participant });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Bạn đã gửi yêu cầu tham gia simulation này' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// PATCH /api/simulations/:id/participants/:participantId/approve (Lecturer/Admin only)
export const approveParticipant = async (req: AuthRequest, res: Response) => {
  try {
    const { id, participantId } = req.params;
    const participant = await SimulationParticipant.findOne({ _id: participantId, simulationId: id });
    if (!participant) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu tham gia' });
    }
    participant.status = 'ACTIVE';
    await participant.save();

    const sim = await Simulation.findById(id);
    await createNotification(participant.userId, {
      title: 'Tham gia mô phỏng thành công',
      message: `Chúc mừng! Giảng viên đã duyệt bạn vào cuộc thi "${sim?.name || 'Mô phỏng'}". Hãy bắt đầu giao dịch ngay!`,
      type: 'SIMULATION_APPROVED',
      link: `/trade/${id}`
    });

    res.json({ message: 'Đã chấp nhận sinh viên vào simulation', participant });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

// PATCH /api/simulations/:id/participants/:participantId/reject (Lecturer/Admin only)
export const rejectParticipant = async (req: AuthRequest, res: Response) => {
  try {
    const { id, participantId } = req.params;
    const participant = await SimulationParticipant.findOne({ _id: participantId, simulationId: id });
    if (!participant) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu tham gia' });
    }
    participant.status = 'REJECTED';
    await participant.save();

    const sim = await Simulation.findById(id);
    await createNotification(participant.userId, {
      title: 'Yêu cầu tham gia bị từ chối',
      message: `Yêu cầu tham gia cuộc thi "${sim?.name || 'Mô phỏng'}" của bạn đã bị từ chối.`,
      type: 'SIMULATION_REJECTED',
      link: '/student/simulations'
    });

    res.json({ message: 'Đã từ chối yêu cầu tham gia', participant });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

// POST /api/simulations/:id/add-student (Lecturer/Admin only)
export const addStudentToSimulation = async (req: AuthRequest, res: Response) => {
  try {
    const simulationId = req.params.id;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: 'studentId is required' });
    }

    const simulation = await Simulation.findById(simulationId);
    if (!simulation) {
      return res.status(404).json({ message: 'Simulation not found' });
    }

    // Check if already joined
    const existing = await SimulationParticipant.findOne({ simulationId, userId: studentId });
    if (existing) {
      return res.status(400).json({ message: 'Student is already in this simulation' });
    }

    const participant = new SimulationParticipant({
      simulationId,
      userId: studentId,
      initialBalance: simulation.initialBalance,
      currentBalance: simulation.initialBalance,
      portfolioValue: 0,
      totalProfit: 0,
      returnRate: 0,
      status: 'ACTIVE'
    });

    await participant.save();

    await createNotification(studentId, {
      title: 'Được thêm vào cuộc thi mô phỏng',
      message: `Bạn đã được Giảng viên thêm vào cuộc thi "${simulation.name}". Hãy vào tham gia ngay!`,
      type: 'SIMULATION_APPROVED',
      link: `/trade/${simulation._id}`
    });
    
    // Populate user info to return
    const populatedParticipant = await SimulationParticipant.findById(participant._id)
      .populate('userId', 'name email picture');
      
    res.status(201).json(populatedParticipant);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Student is already in this simulation' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// DELETE /api/simulations/:id/participants/:studentId (Lecturer/Admin only)
export const removeStudentFromSimulation = async (req: AuthRequest, res: Response) => {
  try {
    const simulationId = req.params.id;
    const studentId = req.params.studentId;

    const simulation = await Simulation.findById(simulationId);
    if (!simulation) {
      return res.status(404).json({ message: 'Simulation not found' });
    }

    const participant = await SimulationParticipant.findOne({ simulationId, userId: studentId });
    if (!participant) {
      return res.status(404).json({ message: 'Student is not in this simulation' });
    }

    await participant.deleteOne();

    await createNotification(studentId, {
      title: 'Rời khỏi cuộc thi mô phỏng',
      message: `Bạn đã bị xóa khỏi cuộc thi mô phỏng "${simulation.name}".`,
      type: 'SIMULATION_KICKED',
      link: '/student/simulations'
    });

    res.json({ message: 'Student removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// PUT /api/simulations/:id (Lecturer/Admin only)
export const editSimulation = async (req: AuthRequest, res: Response) => {
  try {
    const simulation = await Simulation.findById(req.params.id);
    if (!simulation) {
      return res.status(404).json({ message: 'Simulation not found' });
    }

    const { name, description, initialBalance, market, startDate, endDate } = req.body;
    
    simulation.name = name || simulation.name;
    simulation.description = description || simulation.description;
    simulation.initialBalance = initialBalance || simulation.initialBalance;
    simulation.market = market || simulation.market;
    simulation.startDate = startDate || simulation.startDate;
    simulation.endDate = endDate || simulation.endDate;

    const updatedSimulation = await simulation.save();
    res.json(updatedSimulation);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// PATCH /api/simulations/:id/start (Lecturer/Admin only)
export const startSimulation = async (req: AuthRequest, res: Response) => {
  try {
    const simulation = await Simulation.findById(req.params.id);
    if (!simulation) {
      return res.status(404).json({ message: 'Simulation not found' });
    }
    simulation.status = 'ACTIVE';
    const updatedSimulation = await simulation.save();
    res.json(updatedSimulation);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// PATCH /api/simulations/:id/end (Lecturer/Admin only)
export const endSimulation = async (req: AuthRequest, res: Response) => {
  try {
    const simulation = await Simulation.findById(req.params.id);
    if (!simulation) {
      return res.status(404).json({ message: 'Simulation not found' });
    }
    simulation.status = 'ENDED';
    const updatedSimulation = await simulation.save();
    res.json(updatedSimulation);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// DELETE /api/simulations/:id (Lecturer/Admin only)
export const deleteSimulation = async (req: AuthRequest, res: Response) => {
  try {
    const simulation = await Simulation.findById(req.params.id);
    if (!simulation) {
      return res.status(404).json({ message: 'Simulation not found' });
    }

    if (req.user.role !== 'admin' && simulation.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this simulation' });
    }

    await SimulationParticipant.deleteMany({ simulationId: req.params.id });
    await simulation.deleteOne();

    res.json({ message: 'Simulation deleted successfully' });
  } catch (error) {
    console.error('Error deleting simulation:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// DELETE /api/simulations/:id/leave (Student only)
export const leaveSimulation = async (req: AuthRequest, res: Response) => {
  try {
    const simulationId = req.params.id;
    const userId = req.user._id;

    const simulation = await Simulation.findById(simulationId);
    if (!simulation) {
      return res.status(404).json({ message: 'Simulation not found' });
    }

    if (simulation.status === 'ACTIVE') {
      return res.status(400).json({ message: 'Cannot leave an active simulation. It is already in progress.' });
    }

    const participant = await SimulationParticipant.findOne({ simulationId, userId });
    if (!participant) {
      return res.status(404).json({ message: 'You have not joined this simulation' });
    }

    await participant.deleteOne();
    res.json({ message: 'Successfully left the simulation' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// GET /api/simulations/:id/participants
export const getSimulationParticipants = async (req: AuthRequest, res: Response) => {
  try {
    const simulationId = req.params.id;
    const simulation = await Simulation.findById(simulationId);
    if (!simulation) {
      return res.status(404).json({ message: 'Simulation not found' });
    }

    const participants = await SimulationParticipant.find({ simulationId })
      .populate('userId', 'name email picture status')
      .sort({ createdAt: -1 });

    const assignments = await Assignment.find({ simulationId });
    const assignmentIds = assignments.map(a => a._id);
    const totalAssignments = assignments.length;

    const submissions = await Submission.find({ assignmentId: { $in: assignmentIds } });

    const studentUserIds = participants.map(p => (p.userId as any)?._id).filter(Boolean);

    // Count orders from Order model
    const orderCounts = await Order.aggregate([
      { $match: { userId: { $in: studentUserIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 }, filledCount: { $sum: { $cond: [{ $eq: ['$status', 'FILLED'] }, 1, 0] } } } }
    ]);
    const orderCountMap = new Map<string, number>();
    orderCounts.forEach(oc => orderCountMap.set(oc._id.toString(), oc.count));

    // Also count paper trades
    const paperSessions = await PaperTradingSession.find({ user: { $in: studentUserIds } }).select('_id user');
    const sessionToUserMap = new Map<string, string>();
    paperSessions.forEach(s => sessionToUserMap.set(s._id.toString(), s.user.toString()));
    const paperSessionIds = paperSessions.map(s => s._id);

    if (paperSessionIds.length > 0) {
      const paperTrades = await PaperTradingHistory.aggregate([
        { $match: { session: { $in: paperSessionIds } } },
        { $group: { _id: '$session', count: { $sum: 1 } } }
      ]);
      paperTrades.forEach(pt => {
        const uId = sessionToUserMap.get(pt._id.toString());
        if (uId) {
          orderCountMap.set(uId, (orderCountMap.get(uId) || 0) + pt.count);
        }
      });
    }

    const initialSimBalance = simulation.initialBalance || 100000000;

    const enrichedParticipants = participants.map(p => {
      const u = p.userId as any;
      const uIdStr = u?._id?.toString() || '';
      const userSubmissions = submissions.filter(s => s.studentId?.toString() === uIdStr);
      const submittedCount = userSubmissions.length;
      const gradedCount = userSubmissions.filter(s => s.status === 'GRADED').length;
      const pendingGradingCount = userSubmissions.filter(s => s.status === 'SUBMITTED').length;

      const initBal = p.initialBalance || initialSimBalance;
      const curBal = p.currentBalance ?? initBal;
      const portVal = p.portfolioValue > 0 ? p.portfolioValue : curBal;
      const totProf = p.totalProfit !== 0 ? p.totalProfit : (portVal - initBal);
      const retRate = p.returnRate !== 0 
        ? p.returnRate 
        : (initBal > 0 ? parseFloat(((totProf / initBal) * 100).toFixed(2)) : 0);

      const pObj = p.toObject();
      return {
        ...pObj,
        ordersCount: orderCountMap.get(uIdStr) || 0,
        portfolioValue: portVal,
        totalProfit: totProf,
        returnRate: retRate,
        assignmentStats: {
          submitted: submittedCount,
          total: totalAssignments,
          graded: gradedCount,
          pending: pendingGradingCount
        }
      };
    });

    res.json(enrichedParticipants);
  } catch (error) {
    console.error('Error fetching simulation participants:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// GET /api/simulations/participations/me
export const getMyParticipationsList = async (req: AuthRequest, res: Response) => {
  try {
    const participations = await SimulationParticipant.find({ userId: req.user._id }).lean();

    const enrichedParticipations = await Promise.all(
      participations.map(async (part) => {
        const higherRankCount = await SimulationParticipant.countDocuments({
          simulationId: part.simulationId,
          returnRate: { $gt: part.returnRate || 0 }
        });
        const totalInSim = await SimulationParticipant.countDocuments({
          simulationId: part.simulationId
        });
        return {
          ...part,
          rank: higherRankCount + 1,
          totalParticipants: totalInSim
        };
      })
    );

    res.json(enrichedParticipations);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// GET /api/simulations/:id/participants/me
export const getMyParticipation = async (req: AuthRequest, res: Response) => {
  try {
    const participant = await SimulationParticipant.findOne({ 
      simulationId: req.params.id, 
      userId: req.user._id 
    }).populate('simulationId');

    if (!participant) {
      return res.status(404).json({ message: 'Participation not found' });
    }
    res.json(participant);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// GET /api/simulations/:id/leaderboard
export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const sortBy = req.query.sortBy === 'return' ? '-returnRate' : '-totalProfit';
    
    // Tạm thời lấy data mock/sẵn có từ model SimulationParticipant
    // Sau này có thể join/tính toán lại dựa vào data của Member 2
    const leaderboard = await SimulationParticipant.find({ simulationId: req.params.id })
      .sort(sortBy)
      .populate('userId', 'name email picture')
      .limit(100);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// GET /api/simulations/dashboard/stats
export const getLecturerDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const lecturerId = req.user._id;

    // 1. Get simulations created by this lecturer (or all if none created yet)
    let simulations = await Simulation.find({ createdBy: lecturerId });
    if (simulations.length === 0) {
      simulations = await Simulation.find();
    }
    const simulationIds = simulations.map(sim => sim._id);

    // 2. Count total unique students
    const uniqueStudentIds = await SimulationParticipant.distinct('userId', {
      simulationId: { $in: simulationIds }
    });
    const totalEnrolledStudents = uniqueStudentIds.length || (await User.countDocuments({ role: 'student' }));

    // 3. Count active assignments
    const activeAssignments = await Assignment.countDocuments({ status: 'OPEN' });

    // 4. Calculate average simulation return/score
    const overallStats = await SimulationParticipant.aggregate([
      { $match: { simulationId: { $in: simulationIds } } },
      { $group: { _id: null, avgReturn: { $avg: '$returnRate' } } }
    ]);
    const avgScore = overallStats.length > 0 ? parseFloat(overallStats[0].avgReturn.toFixed(1)) : 0;

    // 5. Chart Data (Average return rate per simulation)
    const chartData = await SimulationParticipant.aggregate([
      { $match: { simulationId: { $in: simulationIds } } },
      { $group: { _id: '$simulationId', avgReturn: { $avg: '$returnRate' } } }
    ]);

    const formattedChartData = simulations.map(sim => {
      const match = chartData.find(d => d._id.toString() === sim._id.toString());
      return {
        id: sim._id,
        name: sim.name,
        avgReturn: match ? parseFloat(match.avgReturn.toFixed(1)) : 0
      };
    });

    // 6. Needs attention students (Negative return rate or PENDING approval)
    const needsAttention = await SimulationParticipant.find({
      simulationId: { $in: simulationIds },
      $or: [{ returnRate: { $lt: 0 } }, { status: 'PENDING' }]
    })
      .limit(6)
      .populate('userId', 'name email')
      .populate('simulationId', 'name');

    const formattedAttention = needsAttention.map(item => ({
      id: item._id,
      name: (item.userId as any)?.name || (item.userId as any)?.email || 'Sinh viên',
      issue: item.status === 'PENDING' 
        ? `Đang chờ duyệt vào ${(item.simulationId as any)?.name || 'Simulation'}`
        : `Lợi nhuận ${item.returnRate.toFixed(1)}% tại ${(item.simulationId as any)?.name || 'Simulation'}`,
      severity: item.status === 'PENDING' ? 'high' : item.returnRate < -5 ? 'high' : 'medium'
    }));

    // 7. Recent activity
    const recentParticipants = await SimulationParticipant.find({
      simulationId: { $in: simulationIds }
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('userId', 'name email')
      .populate('simulationId', 'name');

    const recentActivity = recentParticipants.map(item => ({
      id: item._id,
      studentName: (item.userId as any)?.name || (item.userId as any)?.email || 'Sinh viên',
      action: item.status === 'PENDING' ? 'đã đăng ký chờ duyệt vào' : 'đã tham gia mô phỏng',
      simulationName: (item.simulationId as any)?.name || 'Simulation',
      date: (item as any).createdAt || new Date()
    }));

    res.json({
      totalEnrolledStudents,
      avgScore,
      activeAssignments,
      chartData: formattedChartData,
      needsAttention: formattedAttention,
      recentActivity
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// GET /api/simulations/students/overview (Lecturer only)
export const getLecturerStudentsOverview = async (req: AuthRequest, res: Response) => {
  try {
    const lecturerId = req.user._id;

    // 1. Get simulations created by this lecturer (or all if none created yet, e.g. seeded simulations)
    let simulations = await Simulation.find({ createdBy: lecturerId }).sort({ createdAt: -1 });
    if (simulations.length === 0) {
      simulations = await Simulation.find().sort({ createdAt: -1 });
    }
    const simulationIds = simulations.map(sim => sim._id);

    // 2. Get all participants across these simulations
    const allParticipants = await SimulationParticipant.find({
      simulationId: { $in: simulationIds }
    }).populate('userId', 'name email picture status');

    // 3. Count unique students across lecturer's simulations
    const uniqueStudentIds = new Set<string>();
    allParticipants.forEach(p => {
      const u = p.userId as any;
      if (u && u._id) {
        uniqueStudentIds.add(u._id.toString());
      }
    });

    const totalStudents = uniqueStudentIds.size;
    const activeStudents = allParticipants.filter(p => p.status === 'ACTIVE').length;
    const pendingRequests = allParticipants.filter(p => p.status === 'PENDING').length;

    // 4. Map each simulation with participant breakdown & mini participant list for search
    const simulationCards = simulations.map(sim => {
      const simParticipants = allParticipants.filter(
        p => p.simulationId.toString() === sim._id.toString()
      );
      const totalParticipants = simParticipants.length;
      const activeParticipants = simParticipants.filter(p => p.status === 'ACTIVE').length;
      const pendingParticipants = simParticipants.filter(p => p.status === 'PENDING').length;

      return {
        _id: sim._id,
        name: sim.name,
        description: sim.description,
        status: sim.status,
        market: sim.market || 'VN',
        startDate: sim.startDate,
        endDate: sim.endDate,
        initialBalance: sim.initialBalance,
        totalParticipants,
        activeParticipants,
        pendingParticipants,
        participants: simParticipants.map(p => ({
          _id: p._id,
          userId: (p.userId as any)?._id,
          name: (p.userId as any)?.name || 'Sinh viên',
          email: (p.userId as any)?.email || '',
          status: p.status
        }))
      };
    });

    res.json({
      summary: {
        totalStudents,
        activeStudents,
        pendingRequests
      },
      simulations: simulationCards
    });
  } catch (error) {
    console.error('Error getting lecturer students overview:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// GET /api/simulations/:id/participants/:participantId/performance (Lecturer only)
export const getStudentSimulationPerformance = async (req: AuthRequest, res: Response) => {
  try {
    const { id: simulationId, participantId } = req.params;

    let participant = await SimulationParticipant.findOne({
      _id: participantId,
      simulationId
    }).populate('userId', 'name email picture status');

    if (!participant) {
      participant = await SimulationParticipant.findOne({
        userId: participantId,
        simulationId
      }).populate('userId', 'name email picture status');
    }

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    const simulation = await Simulation.findById(simulationId);
    if (!simulation) {
      return res.status(404).json({ message: 'Simulation not found' });
    }

    const studentUser = participant.userId as any;
    const studentId = studentUser._id;

    // Fetch assignments for this simulation
    const assignments = await Assignment.find({ simulationId });
    const assignmentIds = assignments.map(a => a._id);

    // Fetch submissions for this student
    const submissions = await Submission.find({
      assignmentId: { $in: assignmentIds },
      studentId
    });

    const totalAssigned = assignments.length;
    const submittedCount = submissions.length;
    const gradedCount = submissions.filter(s => s.status === 'GRADED').length;
    const pendingCount = submissions.filter(s => s.status === 'SUBMITTED').length;

    // Fetch recent trading activity from Order and PaperTradingHistory
    const orders = await Order.find({ userId: studentId }).sort({ createdAt: -1 }).limit(20);
    const paperSessions = await PaperTradingSession.find({ user: studentId }).select('_id');
    const paperSessionIds = paperSessions.map(s => s._id);

    let paperTrades: any[] = [];
    if (paperSessionIds.length > 0) {
      paperTrades = await PaperTradingHistory.find({
        session: { $in: paperSessionIds }
      }).sort({ closeTime: -1 }).limit(20);
    }

    // Normalize recent trades
    const recentTrades: any[] = [];
    orders.forEach(o => {
      recentTrades.push({
        id: o._id.toString(),
        time: o.createdAt,
        symbol: o.symbol,
        side: o.side === 'LONG' ? 'BUY' : o.side === 'SHORT' ? 'SELL' : o.side,
        quantity: o.quantity,
        price: o.price,
        pnl: 0,
        status: o.status
      });
    });

    paperTrades.forEach(pt => {
      recentTrades.push({
        id: pt._id.toString(),
        time: pt.closeTime || pt.createdAt,
        symbol: pt.symbol,
        side: pt.side === 'LONG' ? 'BUY' : 'SELL',
        quantity: pt.lot,
        price: pt.exitPrice || pt.entryPrice,
        pnl: pt.netPnL || pt.grossPnL || 0,
        status: 'FILLED'
      });
    });

    // Sort by time descending
    recentTrades.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    const filledOrdersCount = orders.filter(o => o.status === 'FILLED').length + paperTrades.length;

    const initialBalance = participant.initialBalance || simulation.initialBalance || 100000000;
    const currentBalance = participant.currentBalance ?? initialBalance;
    const portfolioValue = participant.portfolioValue > 0 ? participant.portfolioValue : currentBalance;
    const totalProfit = participant.totalProfit !== 0 ? participant.totalProfit : (portfolioValue - initialBalance);
    const returnRate = participant.returnRate !== 0 
      ? participant.returnRate 
      : (initialBalance > 0 ? parseFloat(((totalProfit / initialBalance) * 100).toFixed(2)) : 0);

    res.json({
      student: {
        _id: studentUser._id,
        name: studentUser.name || 'Sinh viên',
        email: studentUser.email,
        picture: studentUser.picture,
        participantStatus: participant.status
      },
      simulation: {
        _id: simulation._id,
        name: simulation.name,
        market: simulation.market || 'VN',
        joinedAt: participant.joinedAt || (participant as any).createdAt,
        status: simulation.status
      },
      tradingActivity: {
        totalOrders: orders.length + paperTrades.length,
        totalFilledOrders: filledOrdersCount,
        currentBalance,
        portfolioValue,
        totalProfit,
        returnRate
      },
      assignmentProgress: {
        assigned: totalAssigned,
        submitted: submittedCount,
        graded: gradedCount,
        pending: pendingCount,
        assignments: assignments.map(a => {
          const sub = submissions.find(s => s.assignmentId.toString() === a._id.toString());
          return {
            _id: a._id,
            title: a.title,
            symbol: a.symbol,
            deadline: a.deadline,
            status: sub ? sub.status : 'NOT_SUBMITTED',
            score: sub ? sub.score : null,
            submittedAt: sub ? sub.submittedAt : null
          };
        })
      },
      recentTrades: recentTrades.slice(0, 15)
    });
  } catch (error) {
    console.error('Error fetching student simulation performance:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

