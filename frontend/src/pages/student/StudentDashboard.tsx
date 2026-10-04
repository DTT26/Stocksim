import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Target, BookOpen, Clock, ArrowRight, Trophy, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { challengeApi } from '../../services/challengeApi';
import { tradingApi } from '../../services/tradingApi';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [wallet, setWallet] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [challengeData, setChallengeData] = useState<any>(null);
  const [challengeStats, setChallengeStats] = useState<{
    totalTrades: number;
    winTrades: number;
    winRate: number;
    totalParticipatedChallenges: number;
  }>({
    totalTrades: 0,
    winTrades: 0,
    winRate: 0,
    totalParticipatedChallenges: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        const [walletRes, assRes, chalRes, txRes] = await Promise.all([
          fetch(`${apiUrl}/wallet`, { credentials: 'include', headers }).catch(() => null),
          fetch(`${apiUrl}/assignments/my`, { credentials: 'include', headers }).catch(() => null),
          challengeApi.getMyChallenge().catch(() => null),
          tradingApi.getTransactions().catch(() => null)
        ]);

        if (walletRes && walletRes.ok) {
          const wData = await walletRes.json();
          setWallet(wData);
        }

        if (assRes && assRes.ok) {
          const aData = await assRes.json();
          if (Array.isArray(aData)) {
            setAssignments(aData);
          }
        }

        if (chalRes && chalRes.success) {
          setChallengeData(chalRes.challenge);
          if (chalRes.stats) {
            setChallengeStats(chalRes.stats);
          }
        }

        // Tự động đối soát từ lịch sử giao dịch đóng của Thử Thách Quỹ (CHALLENGE)
        if (txRes && txRes.success && Array.isArray(txRes.data)) {
          const chalClosedTrades = txRes.data.filter(
            (t: any) => t.accountType === 'CHALLENGE' && (t.type === 'CLOSE_POSITION' || t.description?.includes('Đóng'))
          );
          if (chalClosedTrades.length > 0) {
            const total = chalClosedTrades.length;
            const wins = chalClosedTrades.filter((t: any) => (t.amount || 0) > 0 || (t.metadata?.pnl || 0) > 0).length;
            const rate = parseFloat(((wins / total) * 100).toFixed(1));
            setChallengeStats(prev => ({
              ...prev,
              totalTrades: total,
              winTrades: wins,
              winRate: rate
            }));
          }
        }
      } catch (e) {
        console.warn('Dashboard fetch error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const currentBalance = wallet?.availableBalance ?? wallet?.balance ?? user?.balance ?? 100000;
  const upcomingAssignments = assignments.filter(
    a => a.studentStatus === 'NOT_STARTED' || a.studentStatus === 'IN_PROGRESS' || a.status === 'OPEN'
  ).slice(0, 3);

  // Tính số lượng thử thách quỹ đã tham gia
  const totalChallengesJoined = challengeStats.totalParticipatedChallenges > 0
    ? challengeStats.totalParticipatedChallenges
    : ((challengeData?.history?.length || 0) + (challengeData?.status && challengeData.status !== 'NOT_STARTED' ? 1 : 0));

  const getChallengeStatusBadge = () => {
    if (!challengeData || challengeData.status === 'NOT_STARTED') {
      return 'Chưa tham gia quỹ';
    }
    if (challengeData.status === 'ACTIVE') {
      return `Đang tham gia Cấp ${challengeData.currentLevel || 1}`;
    }
    if (challengeData.status === 'PAUSED') {
      return `Tạm dừng Cấp ${challengeData.currentLevel || 1}`;
    }
    if (challengeData.status === 'PASSED') {
      return `Đã hoàn thành Cấp ${challengeData.currentLevel || 1}`;
    }
    if (challengeData.status === 'FAILED') {
      return `Đã dừng ở Cấp ${challengeData.currentLevel || 1}`;
    }
    return `${totalChallengesJoined} thử thách`;
  };

  // Performance history: nếu chưa có giao dịch, hiển thị đường gốc ổn định
  const performanceHistory = [
    { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), value: currentBalance },
    { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), value: currentBalance },
    { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), value: currentBalance },
    { date: new Date().toISOString(), value: currentBalance }
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 min-w-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Xin chào, {user?.name || 'Học viên'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base">
          Tổng quan thử thách quỹ và các nhiệm vụ học tập của bạn.
        </p>
      </div>

      {/* KPI Cards: 3 cards (đã xóa card tài sản mô phỏng, thay thế kỳ thi bằng thử thách quỹ) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6">
        {/* Card 1: Thử thách quỹ tham gia */}
        <Link to="/trade/btcusdt?challenge=true" className="block group">
          <div className="bg-white dark:bg-[#111827] p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-[#253047] shadow-sm dark:shadow-lg relative overflow-hidden transition-all group-hover:border-emerald-500/50">
            <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
              <Target className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-500" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 relative z-10">
              Thử thách quỹ tham gia
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white relative z-10 font-mono">
              {totalChallengesJoined}
            </h3>
            <div className="mt-3 sm:mt-4 flex items-center gap-2 relative z-10">
              <span className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 px-2 py-0.5 sm:py-1 rounded">
                <Target className="w-3 h-3 mr-1" />
                {getChallengeStatusBadge()}
              </span>
            </div>
          </div>
        </Link>

        {/* Card 2: Tỷ lệ thắng (Win Rate) tham gia thử thách quỹ */}
        <div className="bg-white dark:bg-[#111827] p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-[#253047] shadow-sm dark:shadow-lg relative overflow-hidden group transition-colors">
          <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-amber-500" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 relative z-10">
            Tỷ lệ thắng (Win Rate)
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white relative z-10 font-mono">
            {challengeStats.winRate}%
          </h3>
          <div className="mt-3 sm:mt-4 flex items-center gap-2 relative z-10">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {challengeStats.totalTrades > 0
                ? `${challengeStats.winTrades}/${challengeStats.totalTrades} lệnh thắng (Thử thách quỹ)`
                : 'Cập nhật theo lệnh đóng thử thách quỹ'}
            </span>
          </div>
        </div>

        {/* Card 3: Bài tập cần nộp */}
        <Link to="/student/assignments" className="block group">
          <div className="bg-white dark:bg-[#111827] p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-[#253047] shadow-sm dark:shadow-lg relative overflow-hidden transition-all group-hover:border-rose-500/50">
            <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
              <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-rose-500" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 relative z-10">
              Bài tập cần nộp
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white relative z-10 font-mono">
              {upcomingAssignments.length}
            </h3>
            <div className="mt-3 sm:mt-4 flex items-center gap-2 relative z-10">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Từ giảng viên phụ trách
              </span>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="xl:col-span-2 space-y-6 min-w-0">


          {/* Performance Chart */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#253047] shadow-sm dark:shadow-lg p-4 sm:p-6 transition-colors min-w-0">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Hiệu suất danh mục</h2>
              <Link to="/student/journal" className="text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors">
                Nhật ký giao dịch <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </div>
            <div className="h-[220px] sm:h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceHistory} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#253047' : '#f1f5f9'} vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(str) => new Date(str).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' })}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#111827' : '#ffffff',
                      borderColor: isDark ? '#253047' : '#e2e8f0',
                      borderRadius: '0.5rem',
                      color: isDark ? '#fff' : '#0f172a',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px'
                    }}
                    itemStyle={{ color: '#6366F1' }}
                    formatter={(value: any) => [`$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Giá trị tài sản']}
                    labelFormatter={(label: any) => new Date(label).toLocaleDateString('vi-VN')}
                  />
                  <Area type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6 min-w-0">
          {/* Assignments */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#253047] shadow-sm dark:shadow-lg p-4 sm:p-6 transition-colors">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Bài tập sắp tới</h2>
              <Link to="/student/assignments" className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                Xem tất cả
              </Link>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {upcomingAssignments.map(assignment => {
                const id = assignment._id || assignment.id;
                return (
                  <Link key={id} to={`/student/assignments/${id}`} className="block group">
                    <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-[#253047] bg-slate-50 dark:bg-[#172033] group-hover:border-indigo-500/50 transition-colors">
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded font-bold uppercase shrink-0 bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20">
                          {assignment.status || 'Đang làm'}
                        </span>
                        <span className="flex items-center text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
                          {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }) : '—'}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">{assignment.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                        {assignment.simulationId?.name || assignment.simulation || 'Kỳ thi mô phỏng'}
                      </p>
                    </div>
                  </Link>
                );
              })}
              {upcomingAssignments.length === 0 && (
                <div className="text-center p-6 text-slate-400 dark:text-slate-500 text-sm">
                  Không có bài tập nào cần làm lúc này!
                </div>
              )}
            </div>
          </div>

          {/* CTA: Register as Lecturer */}
          {user?.role === 'student' && (
            <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-blue-500/10 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-blue-950/30 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-5 shadow-sm transition-all">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Trở thành Giảng viên StockSim
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Bạn muốn tạo kỳ thi mô phỏng, giao đề bài và chấm điểm học viên? Đăng ký ngay để Admin xét duyệt.
                  </p>
                  <Link
                    to="/student/profile#lecturer-registration"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    <span>Đăng ký làm Giảng viên trong Hồ sơ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
