import { Users, GraduationCap, Shield, Target, ArrowRight, UserPlus, Play, CheckCircle, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface UserData {
  _id: string;
  name?: string;
  email: string;
  picture?: string;
  role: string;
  status: string;
  createdAt?: string;
}

interface SimulationData {
  _id: string;
  name: string;
  status: string;
}

export const AdminDashboard = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [simulations, setSimulations] = useState<SimulationData[]>([]);
  const [pendingAppsCount, setPendingAppsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const [usersRes, simsRes, appsRes] = await Promise.all([
          fetch(`${apiUrl}/users`, { credentials: 'include' }),
          fetch(`${apiUrl}/simulations`, { credentials: 'include' }),
          fetch(`${apiUrl}/lecturer-applications?status=PENDING`, { credentials: 'include' }).catch(() => null),
        ]);

        if (usersRes.ok) setUsers(await usersRes.json());
        if (simsRes.ok) setSimulations(await simsRes.json());
        if (appsRes && appsRes.ok) {
          const aData = await appsRes.json();
          if (Array.isArray(aData)) setPendingAppsCount(aData.length);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Không thể tải dữ liệu bảng điều khiển.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalUsers = users.length;
  const studentsCount = users.filter(u => u.role === 'student').length;
  const lecturersCount = users.filter(u => u.role === 'lecturer').length;
  const adminsCount = users.filter(u => u.role === 'admin').length;

  const liveCount = simulations.filter(s => s.status === 'active' || s.status === 'live').length;
  const upcomingCount = simulations.filter(s => s.status === 'upcoming' || s.status === 'draft').length;
  const completedCount = simulations.filter(s => s.status === 'completed' || s.status === 'ended').length;

  const recentUsers = [...users].sort((a, b) => {
    if (a.createdAt && b.createdAt) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return 0;
  }).slice(0, 5);

  // Mock activities — no backend endpoint
  const activities = [
    { icon: <UserPlus className="w-4 h-4 text-blue-400" />, text: 'Người dùng mới đăng ký', time: '2 phút trước' },
    { icon: <ShieldAlert className="w-4 h-4 text-amber-400" />, text: 'Cập nhật vai trò người dùng thành Giảng viên', time: '1 giờ trước' },
    { icon: <Play className="w-4 h-4 text-emerald-400" />, text: 'Kỳ thi bắt đầu: Giao dịch VN30', time: '3 giờ trước' },
    { icon: <CheckCircle className="w-4 h-4 text-slate-400" />, text: 'Kỳ thi hoàn thành: Thị trường Mỹ', time: 'Hôm qua' },
    { icon: <AlertTriangle className="w-4 h-4 text-rose-400" />, text: 'Tài khoản người dùng bị tạm khóa', time: '2 ngày trước' },
  ];

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      student: 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20',
      lecturer: 'bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20',
      admin: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20',
    };
    return styles[role] || styles.student;
  };

  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 gap-4 p-4 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 opacity-80" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Đã có lỗi xảy ra</h2>
        <p className="text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors cursor-pointer text-sm">
          Thử lại
        </button>
      </div>
    );
  }

  // SVG Donut chart helper
  const DonutSegment = ({ percent, offset, color }: { percent: number; offset: number; color: string }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeLen = (percent / 100) * circumference;
    const strokeOffset = circumference - (offset / 100) * circumference;
    return (
      <circle
        cx="50" cy="50" r={radius}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeDasharray={`${strokeLen} ${circumference - strokeLen}`}
        strokeDashoffset={-strokeOffset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
    );
  };

  const roleData = totalUsers > 0 ? [
    { label: 'Học viên', count: studentsCount, pct: (studentsCount / totalUsers) * 100, color: '#3B82F6' },
    { label: 'Giảng viên', count: lecturersCount, pct: (lecturersCount / totalUsers) * 100, color: '#A855F7' },
    { label: 'Quản trị viên', count: adminsCount, pct: (adminsCount / totalUsers) * 100, color: '#F59E0B' },
  ] : [];

  const simStatusData = simulations.length > 0 ? [
    { label: 'Đang diễn ra', count: liveCount, color: '#10B981' },
    { label: 'Sắp diễn ra', count: upcomingCount, color: '#3B82F6' },
    { label: 'Đã kết thúc', count: completedCount, color: '#6B7280' },
  ] : [];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-10 min-w-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Bảng điều khiển Quản trị</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base">
          Chào mừng trở lại, <span className="text-blue-600 dark:text-blue-400 font-medium">{currentUser?.name || 'Quản trị viên'}</span>. Dưới đây là tình hình hoạt động tổng quan của StockSim.
        </p>
      </div>

      {/* Pending Lecturer Applications Alert */}
      {pendingAppsCount > 0 && (
        <div className="bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-transparent border border-purple-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-600/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Có {pendingAppsCount} yêu cầu đăng ký làm Giảng viên đang chờ duyệt!
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  Cần xử lý
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Các học viên đã nộp hồ sơ xin cấp quyền Giảng viên để tổ chức kỳ thi và giao bài tập.
              </p>
            </div>
          </div>
          <Link
            to="/admin/users?tab=requests"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 whitespace-nowrap cursor-pointer"
          >
            <span>Xem và phê duyệt ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Tổng người dùng', value: totalUsers, icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />, color: 'blue', sub: `${users.filter(u => u.status === 'active' || u.status === 'ACTIVE').length} đang hoạt động` },
          { label: 'Học viên', value: studentsCount, icon: <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />, color: 'blue', sub: null },
          { label: 'Giảng viên', value: lecturersCount, icon: <Shield className="w-5 h-5 sm:w-6 sm:h-6" />, color: 'purple', sub: null },
          { label: 'Kỳ thi mô phỏng', value: simulations.length, icon: <Target className="w-5 h-5 sm:w-6 sm:h-6" />, color: 'emerald', sub: liveCount > 0 ? `${liveCount} Đang diễn ra` : null },
        ].map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-[#111827] p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-[#1e293b] shadow-sm dark:shadow-lg hover:border-blue-500/30 transition-colors group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-${card.color}-500/5 rounded-bl-full group-hover:bg-${card.color}-500/10 transition-colors pointer-events-none`}></div>
            <div className="flex items-start justify-between relative z-10">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {loading ? <span className="inline-block w-10 h-8 bg-slate-200 dark:bg-[#1e293b] rounded animate-pulse"></span> : card.value}
                </h3>
                {card.sub && !loading && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">{card.sub}</p>
                )}
              </div>
              <div className={`p-2 sm:p-2.5 bg-${card.color}-500/10 text-${card.color}-500 dark:text-${card.color}-400 rounded-lg shrink-0`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Users by Role Donut */}
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-[#1e293b] shadow-sm dark:shadow-lg p-4 sm:p-6 transition-colors min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">Người dùng theo vai trò</h2>
          {loading ? (
            <div className="flex items-center justify-center h-44 sm:h-48">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : totalUsers === 0 ? (
            <div className="flex flex-col items-center justify-center h-44 sm:h-48 text-slate-400 dark:text-slate-500">
              <Users className="w-10 h-10 opacity-20 mb-2" />
              <p className="text-sm">Chưa có người dùng nào</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-8 justify-center sm:justify-start">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {roleData.reduce((acc: any[], seg) => {
                    acc.push(seg);
                    return acc;
                  }, [] as any[]).length && roleData.map((seg, i) => {
                    const offset = roleData.slice(0, i).reduce((sum, s) => sum + s.pct, 0);
                    return <DonutSegment key={i} percent={seg.pct} offset={offset} color={seg.color} />;
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{totalUsers}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Tổng</span>
                </div>
              </div>
              <div className="flex flex-col gap-2.5 sm:gap-3 w-full sm:flex-1">
                {roleData.map((seg, i) => (
                  <div key={i} className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }}></div>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{seg.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{seg.count}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">({seg.pct.toFixed(0)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Simulation Status Bar Chart */}
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-[#1e293b] shadow-sm dark:shadow-lg p-4 sm:p-6 transition-colors min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">Trạng thái kỳ thi</h2>
          {loading ? (
            <div className="flex items-center justify-center h-44 sm:h-48">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : simulations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-44 sm:h-48 text-slate-400 dark:text-slate-500">
              <Target className="w-10 h-10 opacity-20 mb-2" />
              <p className="text-sm">Chưa có kỳ thi nào</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              {simStatusData.map((item, i) => {
                const pct = simulations.length > 0 ? (item.count / simulations.length) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5 sm:mb-2 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{item.label}</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{item.count}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-[#1e293b] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-slate-200 dark:border-[#1e293b] flex justify-between items-center text-xs sm:text-sm">
                <span className="text-slate-500 dark:text-slate-400">Tổng số kỳ thi</span>
                <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{simulations.length}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Recent Users + Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Users */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-[#1e293b] shadow-sm dark:shadow-lg overflow-hidden transition-colors min-w-0">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#1e293b] flex justify-between items-center bg-slate-50 dark:bg-[#172033]">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Người dùng gần đây</h2>
            <Link to="/admin/users" className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition-colors">
              Xem tất cả người dùng <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>

          {/* Mobile Cards View (< sm) */}
          <div className="divide-y divide-slate-100 dark:divide-[#1e293b] sm:hidden">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3.5 animate-pulse">
                  <div className="h-5 bg-slate-100 dark:bg-[#1e293b] rounded mb-2"></div>
                  <div className="h-4 bg-slate-100 dark:bg-[#1e293b] rounded w-2/3"></div>
                </div>
              ))
            ) : recentUsers.length === 0 ? (
              <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">Không tìm thấy người dùng nào.</div>
            ) : (
              recentUsers.map(u => (
                <div key={u._id} className="p-3.5 flex flex-col gap-2 hover:bg-slate-50/60 dark:hover:bg-[#172033]/50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {u.picture ? (
                        <img src={u.picture} alt="" className="w-8 h-8 rounded-full border border-slate-200 dark:border-[#1e293b] shrink-0 object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 text-blue-500 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                          {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{u.name || 'Chưa đặt tên'}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{u.email}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border shrink-0 ${getRoleBadge(u.role)}`}>
                      {u.role === 'student' ? 'Học viên' : u.role === 'lecturer' ? 'Giảng viên' : u.role === 'admin' ? 'Quản trị viên' : u.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100/70 dark:border-[#1e293b]/70">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-flex items-center gap-1 border ${
                      (u.status === 'active' || u.status === 'ACTIVE')
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${(u.status === 'active' || u.status === 'ACTIVE') ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                      {(u.status === 'active' || u.status === 'ACTIVE') ? 'Hoạt động' : 'Tạm khóa'}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (>= sm) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 dark:bg-[#172033]/50 border-b border-slate-200 dark:border-[#1e293b] text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-5 py-3 font-semibold">Người dùng</th>
                  <th className="px-5 py-3 font-semibold">Vai trò</th>
                  <th className="px-5 py-3 font-semibold">Trạng thái</th>
                  <th className="px-5 py-3 font-semibold text-right">Ngày tham gia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1e293b]">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-5 py-4" colSpan={4}>
                        <div className="h-6 bg-slate-100 dark:bg-[#1e293b] rounded animate-pulse"></div>
                      </td>
                    </tr>
                  ))
                ) : recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-slate-400 dark:text-slate-500">Không tìm thấy người dùng nào.</td>
                  </tr>
                ) : (
                  recentUsers.map(u => (
                    <tr key={u._id} className="hover:bg-slate-50/60 dark:hover:bg-[#172033]/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {u.picture ? (
                            <img src={u.picture} alt="" className="w-8 h-8 rounded-full border border-slate-200 dark:border-[#1e293b] shrink-0 object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 text-blue-500 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                              {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{u.name || 'Chưa đặt tên'}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${getRoleBadge(u.role)}`}>
                          {u.role === 'student' ? 'Học viên' : u.role === 'lecturer' ? 'Giảng viên' : u.role === 'admin' ? 'Quản trị viên' : u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-flex items-center gap-1 border ${
                          (u.status === 'active' || u.status === 'ACTIVE')
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${(u.status === 'active' || u.status === 'ACTIVE') ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          {(u.status === 'active' || u.status === 'ACTIVE') ? 'Hoạt động' : 'Tạm khóa'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-500 dark:text-slate-400 text-xs font-medium">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-[#1e293b] shadow-sm dark:shadow-lg overflow-hidden transition-colors min-w-0">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#1e293b] bg-slate-50 dark:bg-[#172033]">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Hoạt động gần đây</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-[#1e293b]">
            {activities.map((act, i) => (
              <div key={i} className="p-3.5 sm:p-4 flex items-start gap-3 hover:bg-slate-50/60 dark:hover:bg-[#172033]/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#172033] flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-[#1e293b] mt-0.5">
                  {act.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium">{act.text}</p>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
