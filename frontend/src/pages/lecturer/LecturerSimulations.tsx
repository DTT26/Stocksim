import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Square, Users, Edit3, UserPlus, Search, Filter, MoreVertical, Trash2, Copy, BarChart3, Clock, Target, PlusCircle, Activity } from 'lucide-react';
import { SimulationModal } from './components/SimulationModal';
import { ParticipantsModal } from './components/ParticipantsModal';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useModal } from '../../contexts/ModalContext';

export const LecturerSimulations = () => {
  const { showConfirm, showAlert } = useModal();
  const [simulations, setSimulations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [simulationToEdit, setSimulationToEdit] = useState<any>(null);
  const [simulationForParticipants, setSimulationForParticipants] = useState<any>(null);
  const [confirmState, setConfirmState] = useState<{isOpen: boolean, action: 'start'|'end'|'delete'|null, simId: string|null, simName?: string}>({
    isOpen: false, action: null, simId: null
  });
  
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const fetchSimulations = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/simulations`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setSimulations(data);
      }
    } catch (error) {
      console.error('Error fetching simulations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulations();
  }, []);

  const confirmUpdateStatus = (id: string, action: 'start' | 'end') => {
    setConfirmState({ isOpen: true, action, simId: id });
  };

  const confirmDeleteSimulation = (sim: any) => {
    setOpenDropdownId(null);
    setConfirmState({ isOpen: true, action: 'delete', simId: sim._id, simName: sim.name });
  };

  const handleUpdateStatus = async (id: string, action: 'start' | 'end') => {

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/simulations/${id}/${action}`, { 
        credentials: 'include',
        method: 'PATCH',
      });
      if (response.ok) {
        fetchSimulations();
      }
    } catch (error) {
      console.error(`Error ${action}ing simulation:`, error);
    }
  };

  const handleDeleteSimulation = async (id: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/simulations/${id}`, { 
        credentials: 'include',
        method: 'DELETE',
      });
      if (response.ok) {
        fetchSimulations();
      } else {
        const data = await response.json();
        console.error('Failed to delete simulation:', data);
      }
    } catch (error) {
      console.error('Error deleting simulation:', error);
    }
  };

  const handleOpenCreateModal = () => {
    setSimulationToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sim: any) => {
    setSimulationToEdit(sim);
    setIsModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleOpenParticipantsModal = (sim: any) => {
    setSimulationForParticipants(sim);
    setIsParticipantsModalOpen(true);
    setOpenDropdownId(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredSimulations = simulations.filter(sim => {
    const matchesSearch = sim.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'All') return matchesSearch;
    if (activeTab === 'Live') return matchesSearch && sim.status === 'ACTIVE';
    if (activeTab === 'Upcoming') return matchesSearch && sim.status === 'PUBLISHED';
    if (activeTab === 'Completed') return matchesSearch && sim.status === 'ENDED';
    if (activeTab === 'Draft') return matchesSearch && sim.status === 'DRAFT';
    return matchesSearch;
  });

  const tabLabels: Record<string, string> = {
    All: 'Tất cả',
    Live: 'Đang diễn ra',
    Upcoming: 'Sắp diễn ra',
    Completed: 'Đã kết thúc',
    Draft: 'Bản nháp',
  };

  const getStatusCounts = () => {
    return {
      All: simulations.length,
      Live: simulations.filter(s => s.status === 'ACTIVE').length,
      Upcoming: simulations.filter(s => s.status === 'PUBLISHED').length,
      Completed: simulations.filter(s => s.status === 'ENDED').length,
      Draft: simulations.filter(s => s.status === 'DRAFT').length,
    };
  };
  const counts = getStatusCounts();

  const getStatusBadgeText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'ĐANG DIỄN RA';
      case 'PUBLISHED': return 'SẮP DIỄN RA';
      case 'ENDED': return 'ĐÃ KẾT THÚC';
      case 'DRAFT': return 'BẢN NHÁP';
      default: return status;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Kỳ thi mô phỏng</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base">Khởi tạo, quản lý và theo dõi các kỳ thi giao dịch mô phỏng.</p>
        </div>
        <button 
          onClick={handleOpenCreateModal}
          className="w-full sm:w-auto justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-5 sm:px-6 rounded-xl transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" />
          Tạo kỳ thi mới
        </button>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col md:flex-row justify-between gap-3 sm:gap-4 border-b border-slate-200 dark:border-[#253047] pb-4">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {['All', 'Live', 'Upcoming', 'Completed', 'Draft'].map((tab) => (
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
              placeholder="Tìm kiếm kỳ thi..."
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

      {/* Grid of Simulation Cards */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          Đang tải danh sách kỳ thi...
        </div>
      ) : filteredSimulations.length === 0 ? (
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#253047] py-20 text-center flex flex-col items-center justify-center shadow-sm">
          <Target className="w-16 h-16 text-slate-400 dark:text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Chưa có kỳ thi nào</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Khởi tạo kỳ thi giao dịch đầu tiên để bắt đầu trải nghiệm cho sinh viên.</p>
          <button onClick={handleOpenCreateModal} className="bg-slate-100 dark:bg-[#172033] hover:bg-slate-200 dark:hover:bg-[#253047] text-slate-900 dark:text-white border border-slate-200 dark:border-[#253047] px-6 py-2 rounded-lg transition-colors font-medium">
            + Tạo kỳ thi mới
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSimulations.map((sim) => (
            <div key={sim._id} className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#253047] overflow-hidden group hover:border-indigo-500/30 transition-all shadow-sm dark:shadow-lg relative flex flex-col">
              {/* Top border colored by status */}
              <div className={`absolute top-0 left-0 w-full h-1 ${
                sim.status === 'ACTIVE' ? 'bg-emerald-500' :
                sim.status === 'PUBLISHED' ? 'bg-indigo-500' :
                sim.status === 'ENDED' ? 'bg-slate-500' : 'bg-amber-500'
              }`} />

              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider inline-flex items-center gap-1.5 border ${
                    sim.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                    sim.status === 'PUBLISHED' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' :
                    sim.status === 'ENDED' ? 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20' : 
                    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  }`}>
                    {sim.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                    {getStatusBadgeText(sim.status)}
                  </span>

                  {/* Dropdown Menu */}
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownId(openDropdownId === sim._id ? null : sim._id);
                      }}
                      className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white p-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#172033]"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    
                    {openDropdownId === sim._id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-[#172033] border border-slate-200 dark:border-[#253047] rounded-lg shadow-xl z-10 py-1 overflow-hidden">
                        <button onClick={() => handleOpenEditModal(sim)} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-indigo-500/20 flex items-center gap-2">
                          <Edit3 className="w-4 h-4" /> Chỉnh sửa chi tiết
                        </button>
                        <button onClick={() => handleOpenParticipantsModal(sim)} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-indigo-500/20 flex items-center gap-2">
                          <UserPlus className="w-4 h-4" /> Danh sách thí sinh
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-indigo-500/20 flex items-center gap-2">
                          <Copy className="w-4 h-4" /> Nhân bản kỳ thi
                        </button>
                        <div className="h-px bg-slate-100 dark:bg-[#253047] my-1" />
                        <button 
                          onClick={() => confirmDeleteSimulation(sim)} 
                          className="w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Xóa kỳ thi
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{sim.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[40px] mb-6">
                  {sim.description || 'Chưa có mô tả chi tiết.'}
                </p>

                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs uppercase mb-1">Thị trường</p>
                    <p className="text-slate-800 dark:text-white font-medium flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                      {sim.market === 'Vietnam' ? 'Việt Nam' : (sim.market || 'Việt Nam')}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs uppercase mb-1">Vốn khởi tạo</p>
                    <p className="text-slate-800 dark:text-white font-medium flex items-center gap-1.5 font-mono">
                      <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                      ${(sim.initialBalance >= 1000000 ? (sim.initialBalance / 1000) : (sim.initialBalance || 10000)).toLocaleString('en-US')}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs uppercase mb-1">Thí sinh</p>
                    <p className="text-slate-800 dark:text-white font-medium flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                      Thí sinh tham gia
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs uppercase mb-1">Thời gian</p>
                    <p className="text-slate-800 dark:text-white font-medium flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                      {new Date(sim.startDate).toLocaleDateString('vi-VN')} - {new Date(sim.endDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-4 border-t border-slate-200 dark:border-[#253047] bg-slate-50 dark:bg-[#172033]/50 flex gap-2">
                {(sim.status === 'DRAFT' || sim.status === 'PUBLISHED') && (
                  <button onClick={() => confirmUpdateStatus(sim._id, 'start')} className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 py-2 rounded-lg font-medium text-sm transition-colors">
                    <Play className="w-4 h-4 fill-current" /> Bắt đầu
                  </button>
                )}
                {sim.status === 'ACTIVE' && (
                  <button onClick={() => confirmUpdateStatus(sim._id, 'end')} className="flex-1 flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 py-2 rounded-lg font-medium text-sm transition-colors">
                    <Square className="w-4 h-4 fill-current" /> Kết thúc
                  </button>
                )}
                <Link to={`/lecturer/simulations/${sim._id}/results`} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
                  <BarChart3 className="w-4 h-4" /> Bảng kết quả
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals remain mostly unchanged in logic, but UI can be updated internally */}
      <SimulationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        simulationToEdit={simulationToEdit}
        onSaved={() => {
          setIsModalOpen(false);
          fetchSimulations();
        }}
      />
      
      <ParticipantsModal
        isOpen={isParticipantsModalOpen}
        onClose={() => setIsParticipantsModalOpen(false)}
        simulation={simulationForParticipants}
      />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ ...confirmState, isOpen: false })}
        onConfirm={() => {
          if (confirmState.simId && confirmState.action) {
            if (confirmState.action === 'delete') {
              handleDeleteSimulation(confirmState.simId);
            } else {
              handleUpdateStatus(confirmState.simId, confirmState.action);
            }
          }
        }}
        title={
          confirmState.action === 'delete'
            ? 'Xóa kỳ thi'
            : `${confirmState.action === 'start' ? 'Bắt đầu' : 'Kết thúc'} kỳ thi`
        }
        message={
          confirmState.action === 'delete'
            ? `Bạn có chắc chắn muốn xóa kỳ thi "${confirmState.simName || 'này'}"? Hành động này không thể hoàn tác.`
            : `Bạn có chắc chắn muốn ${confirmState.action === 'start' ? 'bắt đầu' : 'kết thúc'} kỳ thi này không?`
        }
        confirmText={
          confirmState.action === 'delete'
            ? 'Xác nhận xóa'
            : `Xác nhận ${confirmState.action === 'start' ? 'bắt đầu' : 'kết thúc'}`
        }
        type={
          confirmState.action === 'delete'
            ? 'danger'
            : confirmState.action === 'start'
            ? 'info'
            : 'warning'
        }
      />
    </div>
  );
};
