import { Users, BookOpen, Activity, Target, TrendingUp, Clock, PlusCircle, ChevronRight, BarChart3, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SimulationModal } from './components/SimulationModal';

export const LecturerDashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [stats, setStats] = useState({
    simulations: 0,
    students: 0,
    assignments: 0,
    avgReturn: 0
  });
  const [simulations, setSimulations] = useState<any[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<{ chartData: any[], recentActivity: any[] }>({ chartData: [], recentActivity: [] });
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const headers = { };

        const [simRes, stuRes, assRes, statsRes] = await Promise.all([
          fetch(`${apiUrl}/simulations`, { credentials: 'include', headers }),
          fetch(`${apiUrl}/users?role=student`, { credentials: 'include', headers }),
          fetch(`${apiUrl}/assignments`, { credentials: 'include', headers }),
          fetch(`${apiUrl}/simulations/dashboard/stats`, { credentials: 'include', headers })
        ]);

        if (simRes.ok && stuRes.ok && assRes.ok && statsRes.ok) {
          const sims = await simRes.json();
          const students = await stuRes.json();
          const assignments = await assRes.json();
          const dStats = await statsRes.json();

          const activeAss = assignments.filter((a: any) => a.status !== 'COMPLETED' && a.status !== 'DRAFT');
          setActiveAssignments(activeAss);
          setDashboardStats({
            chartData: dStats.chartData || [],
            recentActivity: dStats.recentActivity || []
          });

          const chartData = dStats.chartData || [];
          const totalAvg = chartData.length > 0 
            ? chartData.reduce((acc: number, curr: any) => acc + curr.avgReturn, 0) / chartData.length 
            : 0;

          setStats({
            simulations: sims.filter((s: any) => s.status === 'ACTIVE').length,
            students: students.length,
            assignments: activeAss.length,
            avgReturn: parseFloat(totalAvg.toFixed(2))
          });
          
          setSimulations(sims.filter((s: any) => s.status === 'ACTIVE').slice(0, 4));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Xin chào, {user?.name || 'Giảng viên'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base">
            Quản lý kỳ thi mô phỏng, bài tập và theo dõi hiệu suất sinh viên.
          </p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer text-sm sm:text-base"
        >
          <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          Tạo kỳ thi mô phỏng
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
        <div className="bg-white dark:bg-[#111827] p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-[#253047] shadow-sm dark:shadow-lg relative overflow-hidden group transition-colors">
          <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <Activity className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-500" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 relative z-10">Kỳ thi đang diễn ra</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white relative z-10">{loading ? '-' : stats.simulations}</h3>
          <div className="mt-3 sm:mt-4 flex items-center gap-2 relative z-10">
            <span className="text-xs text-slate-400 dark:text-slate-500">Đang hoạt động</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-[#253047] shadow-sm dark:shadow-lg relative overflow-hidden group transition-colors">
          <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <Users className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-500" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 relative z-10">Tổng số sinh viên</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white relative z-10">{loading ? '-' : stats.students}</h3>
          <div className="mt-3 sm:mt-4 flex items-center gap-2 relative z-10">
            <span className="text-xs text-slate-400 dark:text-slate-500">Đã đăng ký trong hệ thống</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-[#253047] shadow-sm dark:shadow-lg relative overflow-hidden group transition-colors">
          <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-amber-500" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 relative z-10">Bài tập đang mở</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white relative z-10">{loading ? '-' : stats.assignments}</h3>
          <div className="mt-3 sm:mt-4 flex items-center gap-2 relative z-10">
            <span className="text-xs text-slate-400 dark:text-slate-500">Đang chờ hoàn thành</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-[#253047] shadow-sm dark:shadow-lg relative overflow-hidden group transition-colors">
          <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <TrendingUp className="w-12 h-12 sm:w-16 sm:h-16 text-rose-500" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 relative z-10">Tỷ suất sinh lời TB</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-300 relative z-10">
            {loading ? '-' : (stats.avgReturn > 0 ? `+${stats.avgReturn}%` : '0.00%')}
          </h3>
          <div className="mt-3 sm:mt-4 flex items-center gap-2 relative z-10">
            <span className="text-xs text-slate-400 dark:text-slate-500 italic">Trên các kỳ thi đang diễn ra</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Column (Simulations & Chart) */}
        <div className="xl:col-span-2 space-y-6 min-w-0">
          {/* Performance Overview */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#253047] shadow-sm dark:shadow-lg p-4 sm:p-6 transition-colors min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                Tổng quan hiệu suất sinh viên
              </h2>
              <div className="flex bg-slate-100 dark:bg-[#172033] rounded-lg p-1 border border-slate-200 dark:border-[#253047] self-start sm:self-auto">
                {['7N', '30N', '3T', '1Năm'].map(range => (
                  <button
                    key={range}
                    className={`px-2.5 sm:px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      range === '30N' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            
            {(!dashboardStats.chartData || dashboardStats.chartData.length === 0) ? (
              <div className="h-[200px] sm:h-[250px] w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-[#253047] rounded-xl bg-slate-50 dark:bg-[#172033]/50 p-4 text-center">
                <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 dark:text-slate-500 mb-2 sm:mb-3" />
                <p className="text-slate-600 dark:text-slate-400 font-medium text-sm sm:text-base">Chưa có dữ liệu</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm mt-1 max-w-sm">
                  Hiện chưa có dữ liệu tỷ suất sinh lời cho các kỳ thi mô phỏng của bạn.
                </p>
              </div>
            ) : (
              <div className="h-[220px] sm:h-[250px] w-full min-w-0 mt-2 sm:mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardStats.chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#172033' : '#ffffff', 
                        borderColor: isDark ? '#253047' : '#e2e8f0', 
                        borderRadius: '8px',
                        color: isDark ? '#fff' : '#0f172a',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        fontSize: '12px'
                      }}
                      itemStyle={{ color: isDark ? '#fff' : '#0f172a' }}
                    />
                    <Bar dataKey="avgReturn" radius={[4, 4, 0, 0]}>
                      {(dashboardStats.chartData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.avgReturn >= 0 ? '#10b981' : '#f43f5e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Active Simulations */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#253047] shadow-sm dark:shadow-lg p-4 sm:p-6 transition-colors">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                Kỳ thi đang diễn ra
              </h2>
            </div>
            
            {loading ? (
              <div className="text-center py-10 sm:py-12 text-slate-400 dark:text-slate-500 text-sm">Đang tải kỳ thi mô phỏng...</div>
            ) : simulations.length === 0 ? (
              <div className="text-center py-10 sm:py-12 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-[#172033] rounded-xl border border-slate-200 dark:border-[#253047] text-sm">
                Không có kỳ thi nào đang diễn ra.
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {simulations.map((sim) => (
                  <div key={sim._id} className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-[#253047] bg-slate-50 dark:bg-[#172033] hover:border-indigo-500/50 transition-colors group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1.5 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            ĐANG DIỄN RA
                          </span>
                          <span className="text-[11px] text-slate-500 bg-slate-100 dark:bg-[#111827] px-2 py-0.5 rounded border border-slate-200 dark:border-[#253047]">
                            {sim.market || 'Việt Nam'}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{sim.name}</h3>
                        <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1.5 mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> ? Sinh viên</span>
                          <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> ${(sim.initialBalance >= 1000000 ? (sim.initialBalance / 1000) : (sim.initialBalance || 10000)).toLocaleString('en-US')}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Kết thúc {new Date(sim.endDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:flex md:flex-col gap-2 shrink-0 pt-2 md:pt-0 w-full md:w-auto">
                        <Link to={`/lecturer/simulations`} className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors text-center shadow-lg shadow-indigo-600/20">
                          Quản lý
                        </Link>
                        <Link to={`/lecturer/simulations/${sim._id}/results`} className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-[#253047] dark:hover:bg-[#2a3655] text-slate-800 dark:text-white text-xs sm:text-sm font-medium rounded-lg transition-colors text-center border border-slate-300 dark:border-[#3b4b72]">
                          Kết quả
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 sm:mt-6 text-center">
              <Link to="/lecturer/simulations" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium text-xs sm:text-sm flex items-center justify-center gap-1 transition-colors">
                Xem tất cả kỳ thi <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column (Assignments & Activity) */}
        <div className="space-y-6 min-w-0">
          {/* Active Assignments */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#253047] shadow-sm dark:shadow-lg p-4 sm:p-6 transition-colors">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />
                Bài tập đang mở
              </h2>
            </div>
            
            {activeAssignments.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-[#172033] rounded-xl border border-slate-200 dark:border-[#253047] text-xs sm:text-sm p-4">
                Hiện không có bài tập nào.
                <br />
                <Link to="/lecturer/assignments" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs sm:text-sm font-medium mt-2 inline-block">Tạo bài tập mới</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activeAssignments.slice(0, 4).map((assignment) => (
                  <Link to={`/lecturer/assignments`} key={assignment._id} className="block p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-[#253047] bg-slate-50 dark:bg-[#172033] hover:border-amber-500/50 transition-colors group">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">{assignment.title}</h3>
                    <div className="flex justify-between items-center mt-2 gap-2">
                      <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" /> Hạn nộp {new Date(assignment.deadline).toLocaleDateString('vi-VN')}
                      </span>
                      <span className="text-[10px] sm:text-xs bg-amber-500/10 text-amber-600 dark:text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 font-medium shrink-0">
                        {assignment.status === 'OPEN' ? 'Đang mở' : assignment.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Student Activity */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#253047] shadow-sm dark:shadow-lg p-4 sm:p-6 transition-colors">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
                Hoạt động gần đây
              </h2>
            </div>
            
            {(!dashboardStats.recentActivity || dashboardStats.recentActivity.length === 0) ? (
              <div className="text-center py-8 sm:py-12 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-[#172033] rounded-xl border border-slate-200 dark:border-[#253047] text-xs sm:text-sm">
                <p>Không có hoạt động gần đây.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {(dashboardStats.recentActivity || []).map((activity) => (
                  <div key={activity.id} className="flex gap-3 p-2.5 sm:p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-[#172033] transition-colors">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold text-xs sm:text-sm">
                      {activity.studentName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-slate-800 dark:text-white">
                        <span className="font-semibold text-slate-900 dark:text-white">{activity.studentName}</span> {activity.action}
                      </p>
                      <p className="text-[11px] sm:text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">{activity.simulationName}</p>
                      <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {new Date(activity.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <SimulationModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        simulationToEdit={null}
        onSaved={() => {
          setIsCreateModalOpen(false);
          window.location.reload(); 
        }}
      />
    </div>
  );
};
