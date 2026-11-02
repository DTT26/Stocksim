
const GMAIL_COLORS = [
  'bg-emerald-600 text-white',
  'bg-rose-600 text-white',
  'bg-amber-600 text-white',
  'bg-purple-600 text-white',
  'bg-blue-600 text-white',
  'bg-teal-600 text-white',
  'bg-indigo-600 text-white'
];

function getGmailAvatarBg(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GMAIL_COLORS.length;
  return GMAIL_COLORS[index];
}

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, MoreVertical, UserX, UserCheck, Shield, ChevronLeft, ChevronRight, AlertTriangle, Users, X, ArrowUpDown, GraduationCap } from 'lucide-react';
import { LecturerRequestsTab } from './components/LecturerRequestsTab';

interface UserData {
  _id: string;
  name?: string;
  email: string;
  picture?: string;
  role: string;
  status: string;
  createdAt?: string;
}

// --- Modals ---
const EditRoleModal = ({ user, onClose, onSave }: { user: UserData; onClose: () => void; onSave: (userId: string, newRole: string) => void }) => {
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [confirming, setConfirming] = useState(false);

  const handleSave = () => {
    if (selectedRole === user.role) { onClose(); return; }
    if (!confirming) { setConfirming(true); return; }
    onSave(user._id, selectedRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#09090b] rounded-2xl border border-slate-200 dark:border-[#262626] shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-[#262626] flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit User Role</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-[#1c1c1f]"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-4">
            {user.picture ? (
              <img src={user.picture} alt="" referrerPolicy="no-referrer" className="w-12 h-12 rounded-full border border-slate-200 dark:border-[#262626] object-cover" />
            ) : (
              <div className={`w-12 h-12 rounded-full ${getGmailAvatarBg(user.email || user.name || '')} flex items-center justify-center text-lg font-bold shrink-0 shadow-sm`}>
    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
  </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-slate-900 dark:text-white truncate">{user.name || 'Unknown'}</p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Role</label>
            <select
              value={selectedRole}
              onChange={e => { setSelectedRole(e.target.value); setConfirming(false); }}
              className="w-full bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm cursor-pointer"
            >
              <option value="student" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">Student</option>
              <option value="lecturer" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">Lecturer</option>
              <option value="admin" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">Admin</option>
            </select>
          </div>
          {confirming && selectedRole !== user.role && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 text-xs sm:text-sm">
              ⚠️ Are you sure you want to change this user's role from <strong>{user.role}</strong> to <strong>{selectedRole}</strong>?
            </div>
          )}
        </div>
        <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-[#262626] flex justify-end gap-3 bg-slate-50/50 dark:bg-[#000000]">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl transition-colors cursor-pointer">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-600/20 cursor-pointer">
            {confirming ? 'Confirm Change' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

const SuspendModal = ({ user, onClose, onConfirm }: { user: UserData; onClose: () => void; onConfirm: () => void }) => {
  const isActive = user.status === 'ACTIVE' || user.status === 'active';
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#09090b] rounded-2xl border border-slate-200 dark:border-[#262626] shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-[#262626]">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{isActive ? 'Suspend User?' : 'Activate User?'}</h3>
        </div>
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-4">
            {user.picture ? (
              <img src={user.picture} alt="" referrerPolicy="no-referrer" className="w-12 h-12 rounded-full border border-slate-200 dark:border-[#262626] object-cover" />
            ) : (
              <div className={`w-12 h-12 rounded-full ${getGmailAvatarBg(user.email || user.name || '')} flex items-center justify-center text-lg font-bold shrink-0 shadow-sm`}>
    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
  </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-slate-900 dark:text-white truncate">{user.name || 'Unknown'}</p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {isActive
              ? 'Are you sure you want to suspend this account? The user will lose access to the platform.'
              : 'Are you sure you want to activate this account? The user will regain access to the platform.'}
          </p>
        </div>
        <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-[#262626] flex justify-end gap-3 bg-slate-50/50 dark:bg-[#000000]">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl transition-colors cursor-pointer">Cancel</button>
          <button onClick={onConfirm} className={`px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-colors shadow-lg cursor-pointer ${
            isActive ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
          }`}>
            {isActive ? 'Suspend User' : 'Activate User'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Page ---
export const AdminUsers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'requests' ? 'requests' : 'users';
  const [activeTab, setActiveTab] = useState<'users' | 'requests'>(initialTab);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editRoleUser, setEditRoleUser] = useState<UserData | null>(null);
  const [suspendUser, setSuspendUser] = useState<UserData | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'requests') {
      setActiveTab('requests');
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const res = await fetch(`${apiUrl}/lecturer-applications?status=PENDING`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setPendingRequestsCount(data.length);
          }
        }
      } catch (e) {
        // ignore
      }
    };
    fetchPendingCount();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      let queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('search', searchTerm);
      if (roleFilter) queryParams.append('role', roleFilter);

      const response = await fetch(`${apiUrl}/users?${queryParams.toString()}`, { credentials: 'include' });
      if (response.ok) {
        setUsers(await response.json());
      } else {
        setError('Unable to load users.');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, roleFilter]);

  // Close action menu on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleStatusChange = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = (currentStatus === 'ACTIVE' || currentStatus === 'active') ? 'DISABLED' : 'ACTIVE';
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/users/${userId}/status`, {
        credentials: 'include',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) fetchUsers();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/users/${userId}/role`, {
        credentials: 'include',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (response.ok) fetchUsers();
    } catch (err) {
      console.error('Error updating role:', err);
    }
  };

  // Client-side filtering & sorting
  let filtered = [...users];
  if (statusFilter) {
    filtered = filtered.filter(u => {
      const s = (u.status || 'ACTIVE').toUpperCase();
      if (statusFilter === 'active') return s === 'ACTIVE';
      return s !== 'ACTIVE';
    });
  }
  if (sortBy === 'newest') filtered.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  if (sortBy === 'oldest') filtered.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  if (sortBy === 'nameAZ') filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  if (sortBy === 'nameZA') filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      student: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      lecturer: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      admin: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };
    return styles[role] || styles.student;
  };

  if (error && !loading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500 dark:text-slate-400 gap-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 opacity-80" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Unable to load users</h2>
        <p>{error}</p>
        <button onClick={fetchUsers} className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">Try Again</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">User Management</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base">View, search, filter and manage users in the system.</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-[#262626] gap-2">
        <button
          onClick={() => { setActiveTab('users'); setSearchParams({}); }}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Tất cả người dùng ({users.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('requests'); setSearchParams({ tab: 'requests' }); }}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'requests'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Đăng ký Giảng viên</span>
          {pendingRequestsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
              {pendingRequestsCount} chờ duyệt
            </span>
          )}
        </button>
      </div>

      {activeTab === 'requests' ? (
        <LecturerRequestsTab 
          onRoleChanged={fetchUsers} 
          onPendingCountChange={setPendingRequestsCount} 
        />
      ) : (
        /* Toolbar & Table Card */
        <div className="bg-white dark:bg-[#09090b] rounded-2xl border border-slate-200 dark:border-[#262626] shadow-sm dark:shadow-lg overflow-hidden">
        <div className="p-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search */}
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="col-span-1 flex items-center gap-1.5 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl px-3 py-2">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                <option value="" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">All Roles</option>
                <option value="student" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">Student</option>
                <option value="lecturer" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">Lecturer</option>
                <option value="admin" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">Admin</option>
              </select>
            </div>
            <div className="col-span-1 flex items-center gap-1.5 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl px-3 py-2">
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                <option value="" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">All Status</option>
                <option value="active" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">Active</option>
                <option value="suspended" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">Suspended</option>
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1 flex items-center gap-1.5 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl px-3 py-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                <option value="newest" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">Newest</option>
                <option value="oldest" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">Oldest</option>
                <option value="nameAZ" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">Name A-Z</option>
                <option value="nameZA" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">Name Z-A</option>
              </select>
            </div>
          </div>
        </div>

        {/* --- MOBILE CARDS VIEW (Visible only on < md screens) --- */}
        <div className="block md:hidden border-t border-slate-200 dark:border-[#262626]">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 bg-slate-50 dark:bg-[#121214] rounded-xl animate-pulse h-28" />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="py-12 text-center p-4">
              <Users className="w-10 h-10 opacity-20 mx-auto mb-2 text-slate-400" />
              <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">No users found</p>
              <p className="text-xs text-slate-500 mt-1">Try changing your search or filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-[#262626]">
              {paginated.map(u => {
                const isUserActive = u.status === 'ACTIVE' || u.status === 'active';
                return (
                  <div key={u._id} className="p-4 space-y-3 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                    {/* Top Row: User Avatar + Name + Email + Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {u.picture ? (
                          <img src={u.picture} alt="" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full border border-slate-200 dark:border-[#262626] object-cover shrink-0" />
                        ) : (
                          <div className={`w-10 h-10 rounded-full ${getGmailAvatarBg(u.email || u.name || '')} flex items-center justify-center text-sm font-bold shrink-0 shadow-sm`}>
    {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
  </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{u.name || 'Unknown'}</p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs truncate" title={u.email}>{u.email}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-flex items-center gap-1 border shrink-0 ${
                        isUserActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isUserActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        {isUserActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>

                    {/* Middle Row: Role and Joined Date */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-[#262626]/50">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 dark:text-slate-500">Role:</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${getRoleBadge(u.role)}`}>
                          {u.role}
                        </span>
                      </div>
                      <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                        Joined: {u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </span>
                    </div>

                    {/* Bottom Row: Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => setEditRoleUser(u)}
                        className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-[#18181b] dark:hover:bg-[#262626] text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5 text-blue-500" /> Edit Role
                      </button>
                      <button
                        onClick={() => setSuspendUser(u)}
                        className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          isUserActive 
                            ? 'bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400' 
                            : 'bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isUserActive ? (
                          <>
                            <UserX className="w-3.5 h-3.5" /> Suspend
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" /> Activate
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* --- DESKTOP TABLE VIEW (Visible only on >= md screens) --- */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-[800px] w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/80 dark:bg-[#121214] border-y border-slate-200 dark:border-[#262626] text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-5 py-3.5 font-semibold">User</th>
                <th className="px-5 py-3.5 font-semibold">Email</th>
                <th className="px-5 py-3.5 font-semibold">Role</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold">Joined Date</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#262626]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-4"><div className="h-6 bg-slate-100 dark:bg-[#18181b] rounded animate-pulse"></div></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                      <Users className="w-10 h-10 opacity-20 mb-2" />
                      <p className="font-medium text-slate-700 dark:text-slate-300">No users found</p>
                      <p className="text-sm">Try changing your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map(u => {
                  const isUserActive = u.status === 'ACTIVE' || u.status === 'active';
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {u.picture ? (
                            <img src={u.picture} alt="" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full border border-slate-200 dark:border-[#262626] object-cover shrink-0" />
                          ) : (
                            <div className={`w-9 h-9 rounded-full ${getGmailAvatarBg(u.email || u.name || '')} flex items-center justify-center text-xs font-bold shrink-0 shadow-sm`}>
    {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
  </div>
                          )}
                          <span className="font-semibold text-slate-900 dark:text-white">{u.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs max-w-[200px] truncate" title={u.email}>{u.email}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${getRoleBadge(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-flex items-center gap-1 border ${
                          isUserActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isUserActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          {isUserActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="relative inline-block" ref={openMenuId === u._id ? menuRef : null}>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === u._id ? null : u._id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18181b] rounded-lg transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenuId === u._id && (
                            <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-[#121214] rounded-xl shadow-2xl border border-slate-200 dark:border-[#262626] overflow-hidden z-40">
                              <button
                                onClick={() => { setEditRoleUser(u); setOpenMenuId(null); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                              >
                                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Edit Role
                              </button>
                              <button
                                onClick={() => { setSuspendUser(u); setOpenMenuId(null); }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                                  isUserActive ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10' : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                                }`}
                              >
                                {isUserActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                {isUserActive ? 'Suspend User' : 'Activate User'}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-[#262626] flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <span>Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] text-slate-700 dark:text-slate-300 rounded-lg px-2 py-1 text-xs outline-none cursor-pointer">
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
            <div className="flex items-center gap-1 flex-wrap justify-center">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-lg disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-[#1c1c1f] transition-colors flex items-center gap-1 cursor-pointer">
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button key={pageNum} onClick={() => setPage(pageNum)} className={`w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    page === pageNum ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#18181b]'
                  }`}>
                    {pageNum}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-lg disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-[#1c1c1f] transition-colors flex items-center gap-1 cursor-pointer">
                Next <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Modals */}
      {editRoleUser && (
        <EditRoleModal user={editRoleUser} onClose={() => setEditRoleUser(null)} onSave={handleRoleChange} />
      )}
      {suspendUser && (
        <SuspendModal user={suspendUser} onClose={() => setSuspendUser(null)} onConfirm={() => { handleStatusChange(suspendUser._id, suspendUser.status || 'ACTIVE'); setSuspendUser(null); }} />
      )}
    </div>
  );
};
