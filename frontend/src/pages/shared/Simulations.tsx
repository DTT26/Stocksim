import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  DollarSign,
  BarChart2,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Activity,
  BookOpen,
  Search,
  Clock,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';
import { useI18n } from '../../contexts/I18nContext';

export const SimulationsList = () => {
  const { showAlert } = useModal();
  const { lang, t } = useI18n();
  const [simulations, setSimulations] = useState<any[]>([]);
  const [participations, setParticipations] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Active' | 'Upcoming' | 'Completed'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'capital_high' | 'capital_low' | 'name'>('newest');

  const fetchData = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const [simRes, partRes, assRes] = await Promise.all([
        fetch(`${apiUrl}/simulations`, { credentials: 'include', headers }),
        fetch(`${apiUrl}/simulations/participations/me`, { credentials: 'include', headers }),
        fetch(`${apiUrl}/assignments/my`, { credentials: 'include', headers }).catch(() => null)
      ]);

      if (simRes.ok) {
        setSimulations(await simRes.json());
      }
      if (partRes.ok) {
        setParticipations(await partRes.json());
      }
      if (assRes && assRes.ok) {
        const assData = await assRes.json();
        setAssignments(Array.isArray(assData) ? assData : []);
      } else {
        setAssignments([]);
      }
    } catch (error) {
      console.error('Error fetching simulations data:', error);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleJoinSimulation = async (simId: string) => {
    setJoiningId(simId);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/simulations/${simId}/join`, {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        fetchData();
        showAlert({
          title: lang === 'vi' ? 'Thành công' : 'Success',
          message: lang === 'vi' ? 'Gửi yêu cầu tham gia mô phỏng thành công!' : 'Simulation join request submitted successfully!',
          type: 'success'
        });
      } else {
        const data = await response.json();
        showAlert({
          title: lang === 'vi' ? 'Tham gia mô phỏng thất bại' : 'Failed to Join Simulation',
          message: data.message || (lang === 'vi' ? 'Tham gia mô phỏng thất bại' : 'Failed to join simulation'),
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error joining simulation:', error);
      showAlert({
        title: lang === 'vi' ? 'Lỗi' : 'Error',
        message: lang === 'vi' ? 'Có lỗi xảy ra khi tham gia mô phỏng' : 'An error occurred while joining simulation',
        type: 'error'
      });
    } finally {
      setJoiningId(null);
    }
  };

  const hasJoined = (simId: string) => {
    return participations.some(p => p.simulationId === simId || p.simulationId?._id === simId);
  };

  const getParticipation = (simId: string) => {
    return participations.find(p => p.simulationId === simId || p.simulationId?._id === simId);
  };

  // KPI Calculations
  const activeSimsCount = useMemo(() => {
    return simulations.filter(s => s.status === 'ACTIVE').length;
  }, [simulations]);

  const bestReturn = useMemo(() => {
    const list = participations
      .map(p => typeof p.returnRate === 'number' ? p.returnRate : (p.pnlPercent || 0))
      .filter(r => !isNaN(r));
    if (list.length > 0) {
      return Math.max(...list);
    }
    return 0;
  }, [participations]);

  const pendingAssignmentsCount = useMemo(() => {
    return assignments.filter((a: any) => {
      const status = a.studentStatus || a.status;
      return status !== 'COMPLETED' && status !== 'GRADED' && status !== 'SUBMITTED';
    }).length;
  }, [assignments]);

  // Tab counts
  const counts = useMemo(() => ({
    All: simulations.length,
    Active: simulations.filter(s => s.status === 'ACTIVE').length,
    Upcoming: simulations.filter(s => s.status === 'PUBLISHED' || s.status === 'DRAFT').length,
    Completed: simulations.filter(s => s.status === 'ENDED').length
  }), [simulations]);

  // Filtering and sorting
  const filteredSimulations = useMemo(() => {
    return simulations
      .filter(sim => {
        if (filter === 'Active' && sim.status !== 'ACTIVE') return false;
        if (filter === 'Upcoming' && sim.status !== 'PUBLISHED' && sim.status !== 'DRAFT') return false;
        if (filter === 'Completed' && sim.status !== 'ENDED') return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = (sim.name || '').toLowerCase().includes(q);
          const matchDesc = (sim.description || '').toLowerCase().includes(q);
          const matchMarket = (sim.market || '').toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchMarket) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt || b.startDate || 0).getTime() - new Date(a.createdAt || a.startDate || 0).getTime();
        }
        if (sortBy === 'capital_high') {
          return (b.initialBalance || 0) - (a.initialBalance || 0);
        }
        if (sortBy === 'capital_low') {
          return (a.initialBalance || 0) - (b.initialBalance || 0);
        }
        if (sortBy === 'name') {
          return (a.name || '').localeCompare(b.name || '');
        }
        return 0;
      });
  }, [simulations, filter, searchQuery, sortBy]);

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return lang === 'vi' ? 'Tùy chọn' : 'Open / Optional';
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCapital = (amount?: number, market?: string) => {
    if (amount === undefined || amount === null) return '100,000,000 ₫';
    if (market === 'VN' || market === 'HOSE' || market === 'HNX' || amount >= 1000000) {
      return `${amount.toLocaleString('vi-VN')} ₫`;
    }
    return `$${amount.toLocaleString('en-US')}`;
  };

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* 2. Compact Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {lang === 'vi' ? 'Kỳ thi mô phỏng' : 'Simulation Exams'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            {lang === 'vi' 
              ? 'Tham gia kỳ thi giao dịch mô phỏng, rèn luyện với vốn ảo và theo dõi hiệu suất của bạn.' 
              : 'Join simulated trading exams, practice with virtual capital, and track your performance.'}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#172033] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-[#253047]">
            {simulations.length} {lang === 'vi' ? 'Kỳ thi' : 'Exams'}
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {activeSimsCount} {lang === 'vi' ? 'Đang diễn ra' : 'Active'}
          </span>
        </div>
      </div>

      {/* 3. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Active Simulations */}
        <div className="bg-white dark:bg-[#111827] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#253047] shadow-sm relative overflow-hidden group transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {lang === 'vi' ? 'Kỳ thi đang diễn ra' : 'Active Simulations'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {activeSimsCount}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{lang === 'vi' ? 'đang hoạt động' : 'active'}</span>
          </div>
        </div>

        {/* Best Return */}
        <div className="bg-white dark:bg-[#111827] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#253047] shadow-sm relative overflow-hidden group transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {lang === 'vi' ? 'Tỷ suất sinh lời cao nhất' : 'Best Return Rate'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-bold font-mono ${
                bestReturn >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {bestReturn >= 0 ? `+${bestReturn.toFixed(2)}%` : `${bestReturn.toFixed(2)}%`}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{lang === 'vi' ? 'trên các kỳ thi' : 'across all exams'}</span>
          </div>
        </div>

        {/* Assignments */}
        <div className="bg-white dark:bg-[#111827] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#253047] shadow-sm relative overflow-hidden group transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {lang === 'vi' ? 'Bài tập cần làm' : 'Pending Assignments'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {pendingAssignmentsCount}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{lang === 'vi' ? 'đang mở / chờ làm' : 'open / pending'}</span>
          </div>
        </div>
      </div>

      {/* 4. Horizontal Filter Bar & Search */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#253047] shadow-sm p-2 sm:p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {(['All', 'Active', 'Upcoming', 'Completed'] as const).map(tab => {
            const labelMap: Record<string, string> = {
              'All': lang === 'vi' ? 'Tất cả' : 'All',
              'Active': lang === 'vi' ? 'Đang diễn ra' : 'Active',
              'Upcoming': lang === 'vi' ? 'Sắp diễn ra' : 'Upcoming',
              'Completed': lang === 'vi' ? 'Đã kết thúc' : 'Completed'
            };
            const isActive = filter === tab;
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-[#172033] border border-transparent'
                }`}
              >
                <span>{labelMap[tab]}</span>
                <span
                  className={`text-[10px] sm:text-[11px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-[#1a2337] text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {counts[tab]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={lang === 'vi' ? 'Tìm kiếm kỳ thi mô phỏng...' : 'Search simulation exams...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#172033] border border-slate-200 dark:border-[#253047] text-slate-900 dark:text-white placeholder:text-slate-400 text-xs rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-50 dark:bg-[#172033] border border-slate-200 dark:border-[#253047] text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl pl-3 pr-7 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none transition-all"
            >
              <option value="newest">{lang === 'vi' ? 'Mới nhất' : 'Newest'}</option>
              <option value="capital_high">{lang === 'vi' ? 'Vốn cao nhất' : 'Highest Capital'}</option>
              <option value="capital_low">{lang === 'vi' ? 'Vốn thấp nhất' : 'Lowest Capital'}</option>
              <option value="name">{lang === 'vi' ? 'Tên A-Z' : 'Name A-Z'}</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 5. Simulation Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-sm">{lang === 'vi' ? 'Đang tải kỳ thi mô phỏng...' : 'Loading simulation exams...'}</span>
        </div>
      ) : filteredSimulations.length === 0 ? (
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#253047] shadow-sm p-12 text-center text-slate-500 dark:text-slate-400">
          <BarChart2 className="w-10 h-10 opacity-30 mx-auto mb-2 text-slate-400" />
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
            {lang === 'vi' ? 'Không tìm thấy kỳ thi nào' : 'No simulation exams found'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'vi' ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.' : 'Try changing filters or search keywords.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
          {filteredSimulations.map(sim => {
            const joined = hasJoined(sim._id);
            const participation = getParticipation(sim._id);
            const pnlRate = participation?.returnRate ?? (participation?.pnlPercent ?? 0);
            const isApproved = participation?.status === 'ACTIVE';
            const isPending = participation?.status === 'PENDING';
            const isRejected = participation?.status === 'REJECTED';

            const statusBorder =
              sim.status === 'ACTIVE'
                ? 'border-l-4 border-l-emerald-500'
                : sim.status === 'ENDED'
                ? 'border-l-4 border-l-slate-400 dark:border-l-slate-600'
                : 'border-l-4 border-l-indigo-500';

            return (
              <div
                key={sim._id}
                className={`bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#253047] shadow-sm hover:shadow-md transition-all p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden group ${statusBorder}`}
              >
                {/* Top Section */}
                <div>
                  {/* 6. Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {/* Status Badge */}
                      {sim.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {lang === 'vi' ? 'ĐANG DIỄN RA' : 'ACTIVE'}
                        </span>
                      ) : sim.status === 'ENDED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                          {lang === 'vi' ? 'ĐÃ KẾT THÚC' : 'ENDED'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          {lang === 'vi' ? 'SẮP DIỄN RA' : 'UPCOMING'}
                        </span>
                      )}

                      {/* Simulation Name */}
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {sim.name}
                      </h3>
                    </div>

                    {/* Top-Right Participants */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0 bg-slate-50 dark:bg-[#172033] px-2.5 py-1 rounded-lg border border-slate-100 dark:border-[#253047]/60">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sim.participantsCount ?? 0} {lang === 'vi' ? 'Thí sinh' : 'Participants'}</span>
                    </div>
                  </div>

                  {/* Description (max 2 lines) */}
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 min-h-[2.5rem] leading-relaxed">
                    {sim.description || (lang === 'vi' ? 'Rèn luyện quản lý danh mục đầu tư với cổ phiếu thực chiến trong môi trường mô phỏng.' : 'Practice portfolio management with live assets in a simulated environment.')}
                  </p>

                  {/* 7. Simulation Information Row */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3.5 bg-slate-50/80 dark:bg-[#172033]/60 rounded-xl border border-slate-100 dark:border-[#253047]/60 my-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block mb-0.5">
                        {lang === 'vi' ? 'Vốn ban đầu' : 'Initial Capital'}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-white font-mono truncate block text-xs sm:text-sm">
                        {formatCapital(sim.initialBalance, sim.market)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block mb-0.5">
                        {lang === 'vi' ? 'Thị trường' : 'Market'}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-white truncate block text-xs sm:text-sm">
                        {sim.market || (lang === 'vi' ? 'Việt Nam' : 'Vietnam')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block mb-0.5">
                        {lang === 'vi' ? 'Kết thúc' : 'End Date'}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-white font-mono truncate block text-xs sm:text-sm">
                        {formatDate(sim.endDate)}
                      </span>
                    </div>
                  </div>

                  {/* 8. Participation Status Panel */}
                  {joined ? (
                    isApproved ? (
                      <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-3 my-2 text-xs">
                        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-indigo-100/70 dark:border-indigo-900/30">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                            {lang === 'vi' ? 'HIỆU SUẤT CỦA BẠN' : 'YOUR PERFORMANCE'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {lang === 'vi' ? 'ĐANG THAM GIA' : 'JOINED'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                              {lang === 'vi' ? 'Giá trị danh mục' : 'Portfolio Value'}
                            </span>
                            <span className="font-bold text-slate-800 dark:text-white font-mono truncate block text-xs">
                              {formatCapital(
                                participation.portfolioValue || participation.currentBalance || sim.initialBalance,
                                sim.market
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                              {lang === 'vi' ? 'Tỷ suất sinh lời' : 'Return Rate'}
                            </span>
                            <span
                              className={`font-bold font-mono text-xs ${
                                pnlRate >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {pnlRate >= 0 ? '+' : ''}
                              {pnlRate.toFixed(2)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                              {lang === 'vi' ? 'Xếp hạng' : 'Rank'}
                            </span>
                            <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400 text-xs">
                              {participation.rank
                                ? `#${participation.rank} / ${participation.totalParticipants || sim.participantsCount || 1}`
                                : `#1 / ${sim.participantsCount || 1}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : isPending ? (
                      <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-xl p-3 my-2 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                          <div>
                            <span className="font-bold text-amber-800 dark:text-amber-400 block text-xs">
                              {lang === 'vi' ? 'Chờ phê duyệt' : 'Pending Approval'}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {lang === 'vi' ? 'Yêu cầu tham gia đang chờ Giảng viên duyệt' : 'Join request pending lecturer approval'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 shrink-0">
                          {lang === 'vi' ? 'CHỜ DUYỆT' : 'PENDING'}
                        </span>
                      </div>
                    ) : (
                      <div className="bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 rounded-xl p-3 my-2 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-rose-800 dark:text-rose-400 block text-xs">
                            {lang === 'vi' ? 'Yêu cầu bị từ chối' : 'Request Rejected'}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {lang === 'vi' ? 'Bạn có thể xin nộp lại yêu cầu tham gia' : 'You can reapply to join'}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 shrink-0">
                          {lang === 'vi' ? 'TỪ CHỐI' : 'REJECTED'}
                        </span>
                      </div>
                    )
                  ) : (
                    /* 10. Not Joined */
                    <div className="bg-slate-50/60 dark:bg-[#172033]/40 border border-slate-100 dark:border-[#253047]/40 rounded-xl p-2.5 my-2 text-xs flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">{lang === 'vi' ? 'Trạng thái tham gia:' : 'Participation status:'}</span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                        {lang === 'vi' ? 'Chưa tham gia' : 'Not Joined'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                {joined ? (
                  isApproved ? (
                    /* 9. Active Simulation Actions */
                    <div className="flex items-center gap-2 mt-auto pt-3">
                      <Link
                        to={`/trade/${sim._id}`}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-all"
                      >
                        <span>{lang === 'vi' ? 'Vào phòng thi' : 'Enter Exam'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/leaderboard?sim=${sim._id}`}
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-[#172033] dark:hover:bg-[#253047] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[#253047] font-semibold rounded-xl text-xs sm:text-sm transition-colors text-center"
                      >
                        {lang === 'vi' ? 'Bảng xếp hạng' : 'Leaderboard'}
                      </Link>
                      <Link
                        to="/student/journal"
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-[#172033] dark:hover:bg-[#253047] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[#253047] font-semibold rounded-xl text-xs sm:text-sm transition-colors text-center"
                      >
                        {lang === 'vi' ? 'Nhật ký' : 'Journal'}
                      </Link>
                    </div>
                  ) : isPending ? (
                    <div className="flex items-center gap-2 mt-auto pt-3">
                      <button
                        disabled
                        className="flex-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Clock className="w-4 h-4" />
                        <span>{lang === 'vi' ? 'Chờ Giảng viên duyệt...' : 'Waiting for Approval...'}</span>
                      </button>
                      <Link
                        to={`/leaderboard?sim=${sim._id}`}
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-[#172033] dark:hover:bg-[#253047] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[#253047] font-semibold rounded-xl text-xs sm:text-sm transition-colors text-center"
                      >
                        {lang === 'vi' ? 'Bảng xếp hạng' : 'Leaderboard'}
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-auto pt-3">
                      <button
                        onClick={() => handleJoinSimulation(sim._id)}
                        disabled={joiningId === sim._id}
                        className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {joiningId === sim._id ? (
                          <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <PlusCircle className="w-4 h-4" />
                        )}
                        <span>{lang === 'vi' ? 'Xin nộp lại yêu cầu' : 'Reapply to Join'}</span>
                      </button>
                      <Link
                        to={`/leaderboard?sim=${sim._id}`}
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-[#172033] dark:hover:bg-[#253047] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[#253047] font-semibold rounded-xl text-xs sm:text-sm transition-colors text-center"
                      >
                        {lang === 'vi' ? 'Bảng xếp hạng' : 'Leaderboard'}
                      </Link>
                    </div>
                  )
                ) : (
                  /* 10. Simulation Not Joined Action */
                  <div className="flex items-center gap-2 mt-auto pt-3">
                    <button
                      onClick={() => handleJoinSimulation(sim._id)}
                      disabled={joiningId === sim._id || sim.status === 'ENDED'}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
                    >
                      {joiningId === sim._id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <PlusCircle className="w-4 h-4" />
                      )}
                      <span>{lang === 'vi' ? 'Tham gia kỳ thi' : 'Join Exam'}</span>
                    </button>
                    <Link
                      to={`/leaderboard?sim=${sim._id}`}
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-[#172033] dark:hover:bg-[#253047] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[#253047] font-semibold rounded-xl text-xs sm:text-sm transition-colors text-center"
                    >
                      {lang === 'vi' ? 'Bảng xếp hạng' : 'Leaderboard'}
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
