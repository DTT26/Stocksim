import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, X, ChevronDown, User, LogOut, UserPlus, Play, CheckCircle, ShieldAlert, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import { UserAvatar } from '../UserAvatar';

import { useNotificationStore } from '../../stores/useNotificationStore';

interface AdminTopbarProps {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export const AdminTopbar = ({ mobileOpen, setMobileOpen }: AdminTopbarProps) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, fetchNotifications, markAllAsRead, reset } = useNotificationStore();

  useEffect(() => {
    if (!user?._id) {
      reset();
      return;
    }
    fetchNotifications();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [user?._id, fetchNotifications, reset]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b border-[#e2e8f0] dark:border-[#1e293b] bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md sticky top-0 z-30 px-4 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg cursor-pointer"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <div className="hidden md:flex relative max-w-md w-full group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm người dùng, kỳ thi mô phỏng..."
            className="w-full bg-slate-100 dark:bg-[#172033] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-white text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-[#172033] focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172033] rounded-lg transition-colors cursor-pointer"
          title={isDarkMode ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
        >
          {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
            className="relative p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#172033] rounded-lg transition-colors cursor-pointer"
            title="Thông báo"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white dark:border-[#111827]">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-[#172033] rounded-xl shadow-2xl border border-slate-200 dark:border-[#1e293b] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-slate-200 dark:border-[#1e293b] flex justify-between items-center bg-slate-50 dark:bg-[#111827]">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Thông báo</h3>
                <button onClick={() => markAllAsRead()} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium cursor-pointer">Đánh dấu đã đọc tất cả</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    Không có thông báo mới
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n._id || n.id} className={`p-4 border-b border-slate-100 dark:border-[#1e293b] last:border-0 hover:bg-slate-50 dark:hover:bg-[#111827]/50 transition-colors cursor-pointer flex gap-3 ${!n.read ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''}`}>
                      <div className="mt-0.5 w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#111827] flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-[#1e293b]">
                        <Bell className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-sm font-medium ${!n.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{n.title}</p>
                          {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></div>}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{n.message || n.description}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium uppercase">
                          {n.createdAt ? new Date(n.createdAt).toLocaleDateString('vi-VN') : ''}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-[#1e293b]"></div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
            className="flex items-center gap-3 p-1 pl-2 pr-3 hover:bg-slate-100 dark:hover:bg-[#172033] rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-[#1e293b] cursor-pointer"
          >
            <UserAvatar 
              src={user?.picture} 
              name={user?.name || 'Quản trị viên'} 
              size="w-8 h-8" 
              className="border border-slate-200 dark:border-[#1e293b]" 
            />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">{user?.name || 'Quản trị viên'}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Quản trị viên</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-[#172033] rounded-xl shadow-2xl border border-slate-200 dark:border-[#1e293b] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-slate-200 dark:border-[#1e293b] bg-slate-50 dark:bg-[#111827]">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{user?.email}</p>
              </div>
              <div className="p-1.5">
                <Link to="/admin/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                  <User className="w-4 h-4" /> Hồ sơ cá nhân
                </Link>
              </div>
              <div className="p-1.5 border-t border-slate-200 dark:border-[#1e293b]">
                <button onClick={() => logout()} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer">
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
