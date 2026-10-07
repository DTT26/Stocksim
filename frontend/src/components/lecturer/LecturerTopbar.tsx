import { useState, useRef, useEffect } from 'react';
import { 
  Search, Bell, Menu, X, ChevronDown, Sun, Moon, 
  CheckCircle2, AlertCircle, AlertTriangle, BookOpen, 
  Award, UserPlus, UserMinus, CheckCheck, Check
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import { UserAvatar } from '../UserAvatar';
import { useNotificationStore, type AppNotification } from '../../stores/useNotificationStore';

interface LecturerTopbarProps {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export const LecturerTopbar = ({ mobileOpen, setMobileOpen }: LecturerTopbarProps) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isDarkMode = theme === 'dark';

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    if (!user?._id) {
      useNotificationStore.getState().reset();
      return;
    }

    fetchNotifications();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [user?._id, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.read) {
      markAsRead(n._id || n.id);
    }
    setShowNotifications(false);
    if (n.link) {
      navigate(n.link);
    }
  };

  const formatTimeAgo = (timeStr?: string | number) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Vừa xong';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return 'Hôm qua';
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SIMULATION_APPROVED':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      case 'SIMULATION_REJECTED':
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
            <AlertCircle className="w-4 h-4" />
          </div>
        );
      case 'SIMULATION_KICKED':
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
            <UserMinus className="w-4 h-4" />
          </div>
        );
      case 'SIMULATION_JOIN':
        return (
          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
            <UserPlus className="w-4 h-4" />
          </div>
        );
      case 'ASSIGNMENT_NEW':
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
        );
      case 'ASSIGNMENT_DUE':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      case 'ASSIGNMENT_SUBMITTED':
        return (
          <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 shadow-xs">
            <CheckCheck className="w-4 h-4" />
          </div>
        );
      case 'ASSIGNMENT_GRADED':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
            <Award className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 shadow-xs">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <header className="h-16 border-b border-[#e2e8f0] dark:border-[#253047] bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md sticky top-0 z-30 px-4 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg cursor-pointer"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <div className="hidden md:flex relative max-w-md w-full group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">
            <Search className="w-4 h-4" />
          </div>
          <input 
            type="text" 
            placeholder="Tìm kiếm kỳ thi, sinh viên, bài tập..." 
            className="w-full bg-slate-100 dark:bg-[#172033] border border-slate-200 dark:border-[#253047] text-slate-900 dark:text-white text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#172033] focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
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
            onClick={() => { 
              const nextState = !showNotifications;
              setShowNotifications(nextState); 
              setShowProfileMenu(false); 
              if (nextState) fetchNotifications();
            }}
            className="relative p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#172033] rounded-lg transition-colors cursor-pointer"
            title="Thông báo"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-[#111827] flex items-center justify-center leading-none shadow-sm animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-84 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-[#172033] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#253047] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-3.5 px-4 border-b border-slate-200 dark:border-[#253047] flex justify-between items-center bg-slate-50/80 dark:bg-[#111827]/80 backdrop-blur-xs">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Thông báo</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 rounded-full">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAllAsRead()}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>

              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-[#253047]/60">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div 
                      key={notification._id || notification.id} 
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-3.5 flex gap-3 items-start transition-colors cursor-pointer group ${
                        !notification.read 
                          ? 'bg-indigo-50/40 dark:bg-indigo-500/10 hover:bg-indigo-50/80 dark:hover:bg-indigo-500/15' 
                          : 'hover:bg-slate-50 dark:hover:bg-[#111827]/60'
                      }`}
                    >
                      {getNotificationIcon(notification.type)}

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <p className={`text-xs font-semibold leading-tight truncate ${
                            !notification.read ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 shrink-0 bg-indigo-500 rounded-full mt-1"></span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-1.5">
                          {notification.message || notification.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            {formatTimeAgo(notification.createdAt || notification.timestamp)}
                          </span>
                          {notification.link && (
                            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              Xem chi tiết &rarr;
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-2.5 text-slate-400">
                      <Bell className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Không có thông báo mới</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">
                      Mọi thông báo về mô phỏng và bài tập sẽ xuất hiện tại đây.
                    </p>
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-2.5 bg-slate-50/80 dark:bg-[#111827]/80 border-t border-slate-200 dark:border-[#253047] text-center">
                  <button 
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/lecturer/simulations');
                    }}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer transition-colors"
                  >
                    Quản lý mô phỏng &rarr;
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-[#253047]"></div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
            className="flex items-center gap-3 p-1 pl-2 pr-3 hover:bg-slate-100 dark:hover:bg-[#172033] rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-[#253047] cursor-pointer"
          >
            <UserAvatar 
              src={user?.picture} 
              name={user?.name || 'Giảng viên'} 
              size="w-8 h-8" 
              className="border border-slate-200 dark:border-[#253047]" 
            />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">{user?.name || 'Giảng viên'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Giảng viên</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-[#172033] rounded-xl shadow-xl border border-slate-200 dark:border-[#253047] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-slate-200 dark:border-[#253047] bg-slate-50 dark:bg-[#111827]">
                <p className="font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{user?.email}</p>
              </div>
              <div className="p-2">
                <Link to="/lecturer/profile" onClick={() => setShowProfileMenu(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                  Hồ sơ cá nhân
                </Link>
              </div>
              <div className="p-2 border-t border-slate-200 dark:border-[#253047]">
                <button onClick={() => logout()} className="w-full text-left px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer">
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
