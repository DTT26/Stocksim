import { useState, useEffect } from 'react';
import { X, UserPlus, User, Search, Users, ShieldAlert, Mail, Trash2, Check, Clock } from 'lucide-react';
import { ConfirmModal } from '../../../components/ConfirmModal';

interface ParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulation: any | null;
}

export const ParticipantsModal = ({ isOpen, onClose, simulation }: ParticipantsModalProps) => {
  const [participants, setParticipants] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [confirmState, setConfirmState] = useState<{isOpen: boolean, studentId: string|null}>({
    isOpen: false, studentId: null
  });

  useEffect(() => {
    if (isOpen && simulation) {
      setSearchQuery('');
      setSelectedStudent('');
      fetchData();
    }
  }, [isOpen, simulation]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const headers = {};

      const [partRes, stuRes] = await Promise.all([
        fetch(`${apiUrl}/simulations/${simulation._id}/participants`, { credentials: 'include', headers }),
        fetch(`${apiUrl}/users?role=student`, { credentials: 'include', headers })
      ]);

      if (partRes.ok && stuRes.ok) {
        setParticipants(await partRes.json());
        setAllStudents(await stuRes.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (participantId: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const res = await fetch(`${apiUrl}/simulations/${simulation._id}/participants/${participantId}/approve`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (participantId: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const res = await fetch(`${apiUrl}/simulations/${simulation._id}/participants/${participantId}/reject`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddStudent = async () => {
    if (!selectedStudent) return;
    setAdding(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      
      const response = await fetch(`${apiUrl}/simulations/${simulation._id}/add-student`, { 
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudent })
      });

      if (response.ok) {
        const newParticipant = await response.json();
        setParticipants([...participants, newParticipant]);
        setSelectedStudent('');
        setSearchQuery('');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to add student');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while adding student');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/simulations/${simulation._id}/participants/${studentId}`, { 
        credentials: 'include',
        method: 'DELETE',
      });

      if (response.ok) {
        setParticipants(participants.filter(p => (p.userId?._id || p.userId) !== studentId));
        setConfirmState({ isOpen: false, studentId: null });
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to remove student');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while removing student');
    }
  };

  if (!isOpen || !simulation) return null;

  const isEnded = simulation.status === 'ENDED';

  const participantIds = participants.map(p => p.userId?._id || p.userId);
  const availableStudents = allStudents.filter(stu => !participantIds.includes(stu._id));
  const filteredAvailable = availableStudents.filter(stu => 
    (stu.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (stu.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const pendingParticipants = participants.filter(p => p.status === 'PENDING');
  const activeParticipants = participants.filter(p => p.status === 'ACTIVE' || !p.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 dark:bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] border border-slate-200 dark:border-[#262626] transition-colors">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200 dark:border-[#262626] flex justify-between items-center bg-slate-50/80 dark:bg-[#000000]">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Quản lý thí sinh tham gia
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">{simulation.name}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1c1c1f] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col bg-white dark:bg-[#09090b] gap-5">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded-xl text-sm flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Pending Requests Section */}
          {pendingParticipants.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <h3 className="text-sm font-bold text-amber-500 dark:text-amber-400 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Yêu cầu chờ duyệt ({pendingParticipants.length})
              </h3>
              <ul className="divide-y divide-amber-500/20">
                {pendingParticipants.map(p => (
                  <li key={p._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                        {p.userId?.name ? p.userId.name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{p.userId?.name || 'Thí sinh'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{p.userId?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(p._id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Duyệt
                      </button>
                      <button
                        onClick={() => handleReject(p._id)}
                        className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                      >
                        <X className="w-3.5 h-3.5" />
                        Từ chối
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Add Student Section */}
          {!isEnded && (
            <div className="bg-slate-50 dark:bg-[#121214] p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-[#262626]">
              <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3">Thêm sinh viên trực tiếp</label>
            
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sinh viên khả dụng..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#09090b] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm transition-all"
                  />
                </div>
              </div>

              {searchQuery && (
                <div className="mt-2 border border-slate-200 dark:border-[#262626] rounded-xl overflow-hidden max-h-40 overflow-y-auto bg-white dark:bg-[#09090b] shadow-lg">
                  {filteredAvailable.length > 0 ? (
                    <ul className="divide-y divide-slate-200 dark:divide-[#262626]">
                      {filteredAvailable.map(stu => (
                        <li 
                          key={stu._id} 
                          onClick={() => { setSelectedStudent(stu._id); setSearchQuery(stu.name || stu.email); }}
                          className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-[#1c1c1f] cursor-pointer text-sm flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                              {stu.name ? stu.name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                            </div>
                            <span className="text-slate-900 dark:text-white font-medium">{stu.name || stu.email}</span>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{stu.email}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500 text-center">Không tìm thấy sinh viên nào khớp với "{searchQuery}"</div>
                  )}
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleAddStudent}
                  disabled={adding || !selectedStudent}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium text-sm shadow-sm cursor-pointer"
                >
                  {adding ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  Thêm sinh viên đã chọn
                </button>
              </div>
            </div>
          )}

          {/* Current Active Participants List */}
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              Thí sinh đang tham gia
              <span className="bg-slate-100 dark:bg-[#262626] text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs font-mono font-semibold">{activeParticipants.length}</span>
            </h3>
            
            <div className="bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl overflow-hidden flex-1 flex flex-col">
              {loading ? (
                <div className="p-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  Đang tải danh sách thí sinh...
                </div>
              ) : activeParticipants.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                  <Users className="w-12 h-12 mb-4 opacity-20" />
                  <p>Chưa có thí sinh nào tham gia.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-200 dark:divide-[#262626] overflow-y-auto">
                  {activeParticipants.map(p => (
                    <li key={p._id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-100/70 dark:hover:bg-[#1c1c1f] transition-colors gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-md">
                          {p.userId?.name ? p.userId.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{p.userId?.name || 'Người dùng'}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" /> {p.userId?.email}
                          </p>
                        </div>
                      </div>
                      <div className="sm:text-right flex items-center sm:block bg-white dark:bg-[#09090b] sm:bg-transparent sm:dark:bg-transparent p-2 sm:p-0 rounded-lg border border-slate-200 dark:border-[#262626] sm:border-none">
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500 mr-2 sm:mr-0 sm:block sm:mb-1">Tham gia</span>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {new Date(p.joinedAt || p.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      {!isEnded && (
                        <button 
                          onClick={() => setConfirmState({ isOpen: true, studentId: p.userId?._id || p.userId })}
                          className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors ml-2 cursor-pointer"
                          title="Xóa khỏi kỳ thi"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, studentId: null })}
        onConfirm={() => {
          if (confirmState.studentId) {
            handleRemoveStudent(confirmState.studentId);
          }
        }}
        title="Xóa thí sinh"
        message="Bạn có chắc chắn muốn xóa sinh viên này khỏi kỳ thi mô phỏng? Hành động này không thể hoàn tác."
        confirmText="Xác nhận xóa"
        type="danger"
      />
    </div>
  );
};
