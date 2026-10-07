import { useState, useEffect } from 'react';
import { X, Search, Check, Users, User, ShieldAlert } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  studentId?: string;
}

interface AssignStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: any | null;
  onSaved: () => void;
}

export const AssignStudentsModal = ({ isOpen, onClose, assignment, onSaved }: AssignStudentsModalProps) => {
  const [students, setStudents] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && assignment) {
      setSearchTerm('');
      fetchStudents();
      // Pre-select already assigned students
      if (assignment.assignedTo && Array.isArray(assignment.assignedTo)) {
        setSelectedIds(assignment.assignedTo.map((id: any) => typeof id === 'string' ? id : id._id || id));
      } else {
        setSelectedIds([]);
      }
    }
  }, [isOpen, assignment]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const simId = assignment?.simulationId?._id || assignment?.simulationId;
      
      if (simId) {
        const simRes = await fetch(`${apiUrl}/simulations/${simId}/participants`, { credentials: 'include' });
        if (simRes.ok) {
          const parts = await simRes.json();
          if (Array.isArray(parts) && parts.length > 0) {
            const enrolled = parts
              .filter((p: any) => p.userId && (p.status === 'ACTIVE' || p.status === 'APPROVED'))
              .map((p: any) => ({
                _id: p.userId._id || p.userId,
                name: p.userId.name || 'Học viên',
                email: p.userId.email || '',
                studentId: p.userId.studentId || ''
              }));
            if (enrolled.length > 0) {
              setStudents(enrolled);
              return;
            }
          }
        }
      }

      const response = await fetch(`${apiUrl}/users?role=student`, { credentials: 'include' });
      if (response.ok) {
        setStudents(await response.json());
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!assignment) return;
    
    setSaving(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/assignments/${assignment._id}/assign`, { 
        credentials: 'include',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: selectedIds })
      });
      
      if (response.ok) {
        onSaved();
      }
    } catch (error) {
      console.error('Error assigning students:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredStudents.length && filteredStudents.length > 0) {
      const filteredIds = filteredStudents.map(s => s._id);
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      const filteredIds = filteredStudents.map(s => s._id);
      const newSelection = new Set([...selectedIds, ...filteredIds]);
      setSelectedIds(Array.from(newSelection));
    }
  };

  if (!isOpen) return null;

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const allFilteredSelected = filteredStudents.length > 0 && 
    filteredStudents.every(s => selectedIds.includes(s._id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 dark:bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[85vh] border border-slate-200 dark:border-[#262626] transition-colors">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200 dark:border-[#262626] flex justify-between items-center bg-slate-50/80 dark:bg-[#000000]">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Giao bài tập cho sinh viên
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Bài tập: <span className="text-slate-900 dark:text-white font-medium">{assignment?.title}</span></p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1c1c1f] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 flex-1 overflow-hidden flex flex-col gap-4 bg-white dark:bg-[#09090b]">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Tìm kiếm sinh viên theo tên hoặc email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl py-2.5 pl-10 pr-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Selection Controls */}
          <div className="flex justify-between items-center px-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold font-mono">
                {selectedIds.length}
              </div>
              Sinh viên đã chọn
            </span>
            <button 
              onClick={toggleAll}
              className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors cursor-pointer"
            >
              {allFilteredSelected ? 'Bỏ chọn tất cả kết quả' : 'Chọn tất cả kết quả'}
            </button>
          </div>

          {/* Student List */}
          <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#121214] rounded-xl border border-slate-200 dark:border-[#262626]">
            {loading ? (
              <div className="flex flex-col justify-center items-center h-full min-h-[200px] text-slate-400 dark:text-slate-500">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                Đang tải danh sách sinh viên...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-full min-h-[200px] text-slate-400 dark:text-slate-500 p-6 text-center">
                <ShieldAlert className="w-10 h-10 mb-3 opacity-20" />
                <p>Không tìm thấy sinh viên nào.</p>
                {searchTerm && <p className="text-sm mt-1">Thử nhập từ khóa tìm kiếm khác.</p>}
              </div>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-[#262626]">
                {filteredStudents.map(student => {
                  const isSelected = selectedIds.includes(student._id);
                  return (
                    <li 
                      key={student._id} 
                      onClick={() => toggleStudent(student._id)}
                      className={`flex items-center gap-4 p-3.5 sm:p-4 cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-indigo-50/50 dark:bg-indigo-500/10 hover:bg-indigo-50 dark:hover:bg-indigo-500/15' 
                          : 'hover:bg-slate-100/70 dark:hover:bg-[#1c1c1f]'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          isSelected 
                            ? 'bg-indigo-600 border-indigo-600' 
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121214]'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isSelected 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-slate-200 dark:bg-[#262626] text-slate-600 dark:text-slate-400'
                        }`}>
                          {student.name ? student.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                        </div>
                        <div className="flex flex-col">
                          <span className={`font-semibold text-sm ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                            {student.name || 'Người dùng'}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 text-xs">{student.email}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-[#262626] flex justify-end gap-3 bg-slate-50/80 dark:bg-[#000000]">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Check className="w-4 h-4" />
            )}
            Lưu phân bổ bài tập
          </button>
        </div>
      </div>
    </div>
  );
};
