import { Router } from 'express';
import { 
  createSimulation, 
  getSimulations, 
  getSimulationById, 
  updateSimulationStatus,
  editSimulation,
  deleteSimulation,
  startSimulation,
  endSimulation,
  joinSimulation,
  leaveSimulation,
  getSimulationParticipants,
  getMyParticipation,
  getMyParticipationsList,
  getLeaderboard,
  addStudentToSimulation,
  removeStudentFromSimulation,
  approveParticipant,
  rejectParticipant,
  getLecturerDashboardStats,
  getLecturerStudentsOverview,
  getStudentSimulationPerformance
} from '../controllers/simulationController';
import { protect, lecturer, optionalProtect } from '../middleware/authMiddleware';

const router = Router();

router.route('/')
  .get(optionalProtect, getSimulations as any)
  .post(protect, lecturer, createSimulation as any);

router.get('/dashboard/stats', protect, lecturer, getLecturerDashboardStats as any);
router.get('/students/overview', protect, lecturer, getLecturerStudentsOverview as any);
router.get('/participations/me', protect, getMyParticipationsList as any);

router.route('/:id')
  .get(optionalProtect, getSimulationById as any)
  .put(protect, lecturer, editSimulation as any)
  .delete(protect, lecturer, deleteSimulation as any);

router.patch('/:id/status', protect, lecturer, updateSimulationStatus as any);
router.patch('/:id/start', protect, lecturer, startSimulation as any);
router.patch('/:id/end', protect, lecturer, endSimulation as any);

router.post('/:id/join', protect, joinSimulation as any);
router.post('/:id/add-student', protect, lecturer, addStudentToSimulation as any);
router.patch('/:id/participants/:participantId/approve', protect, lecturer, approveParticipant as any);
router.patch('/:id/participants/:participantId/reject', protect, lecturer, rejectParticipant as any);
router.delete('/:id/leave', protect, leaveSimulation as any);

router.get('/:id/participants', optionalProtect, getSimulationParticipants as any);
router.get('/:id/participants/:participantId/performance', protect, lecturer, getStudentSimulationPerformance as any);
router.get('/:id/participants/me', protect, getMyParticipation as any);

router.get('/:id/leaderboard', optionalProtect, getLeaderboard as any);

router.delete('/:id/participants/:studentId', protect, lecturer, removeStudentFromSimulation as any);

export default router;
