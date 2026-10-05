import { useState, useEffect } from 'react';
import { Edit3, CheckCircle, Clock, Users, Search, Filter, BookOpen, PlusCircle, Target, Lock, MoreVertical, ClipboardCheck, ListChecks } from 'lucide-react';
import { AssignmentModal } from './components/AssignmentModal';
import { AssignStudentsModal } from './components/AssignStudentsModal';
import { SubmissionListModal } from './components/SubmissionListModal';

export const LecturerAssignments = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [simulations, setSimulations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState<any>(null);
  const [assignmentToAssign, setAssignmentToAssign] = useState<any>(null);
  const [assignmentForSubmissions, setAssignmentForSubmissions] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const headers = { };

      const [assRes, simRes] = await Promise.all([
        fetch(`${apiUrl}/assignments`, { credentials: 'include', headers }),
        fetch(`${apiUrl}/simulations`, { credentials: 'include', headers })
      ]);

      if (assRes.ok && simRes.ok) {
        setAssignments(await assRes.json());
        setSimulations(await simRes.json());
      }
    } catch (error) {
      console.error('Error fetching assignments data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/assignments/${id}/status`, { 
        credentials: 'include',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error updating assignment status:', error);
    }
  };

  const handleOpenCreateModal = () => {
    setAssignmentToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ass: any) => {
    setAssignmentToEdit(ass);
    setIsModalOpen(true);
  };

  const handleOpenAssignModal = (ass: any) => {
    setAssignmentToAssign(ass);
    setIsAssignModalOpen(true);
  };

  const filteredAssignments = assignments.filter(ass => {
    const matchesSearch = ass.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'All') return matchesSearch;
    if (activeTab === 'Open') return matchesSearch && ass.status === 'OPEN';
    if (activeTab === 'Closed') return matchesSearch && ass.status === 'CLOSED';
    if (activeTab === 'Draft') return matchesSearch && ass.status === 'DRAFT';
    return matchesSearch;
  });

  const tabLabels: Record<string, string> = {
    All: 'Tất cả',
    Open: 'Đang mở',
    Closed: 'Đã đóng',
    Draft: 'Bản nháp',
  };

  const counts = {
    All: assignments.length,
    Open: assignments.filter(a => a.status === 'OPEN').length,
    Closed: assignments.filter(a => a.status === 'CLOSED').length,
    Draft: assignments.filter(a => a.status === 'DRAFT').length,
  };

  const getStatusBadgeText = (status: string) => {
    switch (status) {
      case 'OPEN': return 'ĐANG MỞ';
      case 'CLOSED': return 'ĐÃ ĐÓNG';
      case 'DRAFT': return 'BẢN NHÁP';
      default: return status;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Quản lý bài tập</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base">Tạo bài tập thực hành giao dịch và đánh giá bài nộp của sinh viên.</p>
        </div>
        <button 
          onClick={handleOpenCreateModal}
          className="w-full sm:w-auto justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-5 sm:px-6 rounded-xl transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" />
          Tạo bài tập mới
        </button>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col md:flex-row justify-between gap-3 sm:gap-4 border-b border-slate-200 dark:border-[#253047] pb-4">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {['All', 'Open', 'Closed', 'Draft'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab
                  ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172033] border border-transparent'
              }`}
            >
              {tabLabels[tab]} <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${activeTab === tab ? 'bg-indigo-600/20 text-indigo-600 dark:text-indigo-300' : 'bg-slate-100 dark:bg-[#253047] text-slate-600 dark:text-slate-300'}`}>{(counts as any)[tab]}</span>
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
          <div className="relative group flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500" />
            <input
              type="text"
              placeholder="Tìm kiếm bài tập..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full transition-colors"
            />
          </div>
          <button className="p-2 shrink-0 border border-slate-200 dark:border-[#253047] rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#172033] transition-colors cursor-pointer" title="Bộ lọc">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Assignments Display: Mobile Cards (< md) & Desktop Table (>= md) */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#253047] shadow-sm dark:shadow-lg overflow-hidden">
        {/* Mobile Card List (md:hidden) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-[#253047]">
          {loading ? (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs">Đang tải danh sách bài tập...</p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
              <BookOpen className="w-8 h-8 opacity-20 mb-1" />
              <p className="text-sm font-medium text-slate-900 dark:text-white">Chưa có bài tập nào.</p>
              {searchQuery && <p className="text-xs text-slate-500 dark:text-slate-400">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>}
            </div>
          ) : (
            filteredAssignments.map((ass) => {
              const isOverdue = ass.deadline && new Date(ass.deadline) < new Date();
              return (
                <div key={ass._id} className="p-4 space-y-3 hover:bg-slate-50 dark:hover:bg-[#172033]/60 transition-colors">
                  {/* Header: Icon + Title + Symbol + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${ass.status === 'CLOSED' ? 'bg-slate-100 dark:bg-slate-500/10 text-slate-500 dark:text-slate-400' : 'bg-amber-500/10 text-amber-500'}`}>
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            {ass.title}
                          </h4>
                          {ass.symbol && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                              {ass.symbol}
                            </span>
                          )}
                        </div>
                        {ass.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{ass.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-flex items-center gap-1 border shrink-0 ${
                      ass.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 
                      ass.status === 'DRAFT' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                      'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20'
                    }`}>
                      {ass.status === 'OPEN' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                      {getStatusBadgeText(ass.status)}
                    </span>
                  </div>

                  {/* Meta details: Simulation, Deadline, Checklist */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-0.5">
                    <div className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate max-w-[150px]">{ass.simulationId?.name || 'Kỳ thi không xác định'}</span>
                    </div>

                    {ass.deadline && (
                      <div className="flex items-center gap-1">
                        <Clock className={`w-3.5 h-3.5 shrink-0 ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`} />
                        <span className={isOverdue ? 'text-rose-500 font-medium' : ''}>
                          {new Date(ass.deadline).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    )}

                    {ass.requirements && ass.requirements.length > 0 && (
                      <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                        <ListChecks className="w-3.5 h-3.5 shrink-0" />
                        <span>{ass.requirements.length} tiêu chí checklist</span>
                      </div>
                    )}
                  </div>

                  {/* Action Row */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-[#253047]/60">
                    <button 
                      onClick={() => setAssignmentForSubmissions(ass)}
                      className="flex-1 py-1.5 px-3 bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      <span>Bài nộp ({ass.submissionCount || 0})</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleOpenAssignModal(ass)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Giao cho sinh viên"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                      
                      <button 
                        onClick={() => handleOpenEditModal(ass)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
                        title="Chỉnh sửa bài tập"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {ass.status === 'OPEN' ? (
                        <button 
                          onClick={() => handleUpdateStatus(ass._id, 'CLOSED')}
                          className="p-1.5 text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Đóng bài tập"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpdateStatus(ass._id, 'OPEN')}
                          className="p-1.5 text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Mở bài tập"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto scrollbar-hide no-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-[#172033]/50 border-b border-slate-200 dark:border-[#253047] text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="px-6 py-4 font-semibold">Chi tiết bài tập</th>
                <th className="px-6 py-4 font-semibold">Kỳ thi mô phỏng</th>
                <th className="px-6 py-4 font-semibold text-center">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-center">Hạn nộp</th>
                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#253047]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p>Đang tải danh sách bài tập...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <BookOpen className="w-10 h-10 opacity-20 mb-2" />
                      <p className="text-slate-900 dark:text-white font-medium">Chưa có bài tập nào.</p>
                      {searchQuery && <p className="text-sm text-slate-500 dark:text-slate-400">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((ass) => (
                  <tr key={ass._id} className="hover:bg-slate-50 dark:hover:bg-[#172033] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg mt-0.5 ${ass.status === 'CLOSED' ? 'bg-slate-100 dark:bg-slate-500/10 text-slate-500 dark:text-slate-400' : 'bg-amber-500/10 text-amber-500'}`}>
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{ass.title}</h4>
                            {ass.symbol && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                                {ass.symbol}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 max-w-sm">{ass.description}</p>
                          {ass.requirements && ass.requirements.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-indigo-600 dark:text-indigo-400">
                              <ListChecks className="w-3.5 h-3.5" />
                              <span>{ass.requirements.length} tiêu chí checklist</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                        <Target className="w-4 h-4 text-emerald-500" />
                        {ass.simulationId?.name || 'Kỳ thi không xác định'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider inline-flex items-center gap-1.5 border ${
                        ass.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 
                        ass.status === 'DRAFT' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                        'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20'
                      }`}>
                        {ass.status === 'OPEN' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                        {getStatusBadgeText(ass.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5">
                        <Clock className={`w-4 h-4 ${new Date(ass.deadline) < new Date() ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`} />
                        <span className={new Date(ass.deadline) < new Date() ? 'text-rose-500' : ''}>
                          {new Date(ass.deadline).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setAssignmentForSubmissions(ass)}
                          className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                          title="Xem bài nộp và chấm điểm"
                        >
                          <ClipboardCheck className="w-4 h-4" />
                          <span>Bài nộp ({ass.submissionCount || 0})</span>
                        </button>

                        <button 
                          onClick={() => handleOpenAssignModal(ass)}
                          className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Giao cho sinh viên"
                        >
                          <Users className="w-5 h-5" />
                        </button>
                        
                        <button 
                          onClick={() => handleOpenEditModal(ass)}
                          className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa bài tập"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>

                        {ass.status === 'OPEN' ? (
                          <button 
                            onClick={() => handleUpdateStatus(ass._id, 'CLOSED')}
                            className="p-2 text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors ml-1 cursor-pointer"
                            title="Đóng bài tập"
                          >
                            <Lock className="w-5 h-5" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleUpdateStatus(ass._id, 'OPEN')}
                            className="p-2 text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors ml-1 cursor-pointer"
                            title="Mở bài tập"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <AssignmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        simulations={simulations}
        assignmentToEdit={assignmentToEdit}
        onSaved={() => {
          setIsModalOpen(false);
          fetchData();
        }}
      />
      
      <AssignStudentsModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        assignment={assignmentToAssign}
        onSaved={() => {
          setIsAssignModalOpen(false);
          fetchData();
        }}
      />

      <SubmissionListModal
        isOpen={!!assignmentForSubmissions}
        assignment={assignmentForSubmissions}
        onClose={() => {
          setAssignmentForSubmissions(null);
          fetchData();
        }}
      />
    </div>
  );
};
