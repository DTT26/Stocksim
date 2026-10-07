import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { TradingTerminal } from './features/market/TradingTerminal';

import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentAssignments } from './pages/student/Assignments';
import { StudentAssignmentDetail } from './pages/student/AssignmentDetail';
import { SimulationsList } from './pages/shared/Simulations';
import { SimulationDetail } from './pages/shared/SimulationDetail';
import { Leaderboard } from './pages/shared/Leaderboard';
import { LecturerDashboard } from './pages/lecturer/LecturerDashboard';
import { LecturerSimulations } from './pages/lecturer/LecturerSimulations';
import { LecturerAssignments } from './pages/lecturer/LecturerAssignments';
import { LecturerStudents } from './pages/lecturer/LecturerStudents';
import { LecturerSimulationStudents } from './pages/lecturer/LecturerSimulationStudents';
import { LecturerStudentDetail } from './pages/lecturer/LecturerStudentDetail';
import { LecturerPerformance } from './pages/lecturer/LecturerPerformance';
import { LecturerProfile } from './pages/lecturer/LecturerProfile';
import { LecturerSimulationResults } from './pages/lecturer/LecturerSimulationResults';
import { LecturerLayout } from './layouts/LecturerLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/Users';
import { AdminSimulations } from './pages/admin/AdminSimulations';
import { AdminProfile } from './pages/admin/AdminProfile';

import { StudentLayout } from './layouts/StudentLayout';
import { StudentJournal } from './pages/student/Journal';
import { SessionDetailPage } from './pages/student/SessionDetailPage';
import { StudentTradeDetail } from './pages/student/TradeDetail';
import { StudentProfile } from './pages/student/Profile';

import { LandingPage } from './pages/shared/LandingPage';
import { AiLearningDashboard } from './features/ai/AiLearningDashboard';

import { PaymentSuccess } from './pages/shared/PaymentSuccess';
import { PaymentCancel } from './pages/shared/PaymentCancel';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-[#080C14] text-white">Loading...</div>;
  }

  return (
    <Routes>
      {/* Payment Callbacks (PayOS) */}
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/cancel" element={<PaymentCancel />} />

      {/* Route for Trading Terminal (Isolated) */}
      <Route path="/trade" element={<Navigate to="/trade/btcusdt" replace />} />
      <Route path="/trade/:simulationId" element={
        <div className="h-screen w-screen bg-[#131722] overflow-hidden flex flex-col text-[#d1d4dc] transition-colors">
          <TradingTerminal />
        </div>
      } />

      {/* Student Routes (Isolated Layout) */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route element={<StudentLayout />}>
          <Route path="/student">
            <Route index element={<StudentDashboard />} />
            <Route path="simulations" element={<SimulationsList />} />
            <Route path="simulations/:id" element={<SimulationDetail />} />
            <Route path="assignments" element={<StudentAssignments />} />
            <Route path="assignments/:id" element={<StudentAssignmentDetail />} />
            <Route path="performance" element={<Navigate to="/student/journal" replace />} />
            <Route path="journal" element={<StudentJournal />} />
            <Route path="journal/:sessionId" element={<SessionDetailPage />} />
            <Route path="journal/trade/:tradeId" element={<StudentTradeDetail />} />
            <Route path="learning-dashboard" element={<AiLearningDashboard />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Route>
      </Route>

      {/* Lecturer Routes (Isolated Layout) */}
      <Route element={<ProtectedRoute allowedRoles={['lecturer']} />}>
        <Route element={<LecturerLayout />}>
          <Route path="/lecturer">
            <Route index element={<LecturerDashboard />} />
            <Route path="simulations" element={<LecturerSimulations />} />
            <Route path="simulations/:simulationId/students" element={<LecturerSimulationStudents />} />
            <Route path="simulations/:id/results" element={<LecturerSimulationResults />} />
            <Route path="assignments" element={<LecturerAssignments />} />
            <Route path="students" element={<LecturerStudents />} />
            <Route path="students/:id" element={<LecturerStudentDetail />} />
            <Route path="performance" element={<LecturerPerformance />} />
            <Route path="profile" element={<LecturerProfile />} />
          </Route>
        </Route>
      </Route>

      {/* Admin Routes (Isolated Layout) */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin">
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="simulations" element={<AdminSimulations />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>
        </Route>
      </Route>

      {/* Homepage Route */}
      <Route path="/" element={
        !user ? <LandingPage /> :
        user.role === 'admin' ? <Navigate to="/admin" /> :
        user.role === 'lecturer' ? <Navigate to="/lecturer" /> :
        <Navigate to="/student" />
      } />
      <Route path="/landing" element={<LandingPage />} />

      {/* App Shell Routes (shared/fallback) */}
      <Route element={<AppLayout />}>
        {/* Learning Dashboard direct route */}
        <Route path="learning-dashboard" element={<AiLearningDashboard />} />

        {/* Shared Routes (require login but any role, legacy paths) */}
        <Route element={<ProtectedRoute />}>
          <Route path="simulations">
            <Route index element={<SimulationsList />} />
            <Route path=":id" element={<SimulationDetail />} />
          </Route>
          <Route path="journal" element={<Navigate to="/student/journal" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;

