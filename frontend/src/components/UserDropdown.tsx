import { useState, useRef, useEffect } from 'react';
import { LogOut, LayoutDashboard, Trophy } from 'lucide-react';
import { googleLogout } from '@react-oauth/google';
import { Link } from 'react-router-dom';
import { UserAvatar } from './UserAvatar';
import { useI18n } from '../contexts/I18nContext';

interface User {
  name: string;
  email: string;
  picture?: string;
  balance?: number;
  role?: string;
}

interface UserDropdownProps {
  user: User;
  onLogout: () => void;
  isChallenge?: boolean;
  challengeLevelName?: string;
  accountRankName?: string;
  certCount?: number;
}

export const UserDropdown = ({ 
  user, 
  onLogout, 
  isChallenge = false, 
  challengeLevelName,
  accountRankName,
  certCount
}: UserDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { lang } = useI18n();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      googleLogout();
    } catch (e) {
      console.warn('googleLogout error:', e);
    }
    await onLogout();
  };

  const dashboardRoute = user.role === 'admin' ? '/admin' : user.role === 'lecturer' ? '/lecturer' : '/student';

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full overflow-hidden hover:ring-2 hover:ring-gray-300 dark:hover:ring-[#2a2e39] transition-all focus:outline-none cursor-pointer"
        title={user.name}
      >
        <UserAvatar src={user.picture} name={user.name} size="w-full h-full" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-[#2a2e39] rounded-lg shadow-xl z-50 text-sm text-gray-800 dark:text-[#d1d4dc] font-sans flex flex-col py-1">
          {/* User Info */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-[#2a2e39]">
            <UserAvatar src={user.picture} name={user.name} size="w-10 h-10" textClassName="text-base" />
            <div className="flex flex-col min-w-0">
              <span className="text-gray-900 dark:text-white font-bold text-base truncate">{user.name}</span>
              <span className="text-xs text-gray-500 dark:text-[#787b86] truncate">{user.email}</span>
            </div>
          </div>

          {/* Account Rank Info (Cho user biết tài khoản đang đạt tới cấp độ nào) */}
          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-[#2a2e39] bg-amber-500/5 dark:bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Trophy className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 dark:text-[#787b86] block font-medium">{lang === 'vi' ? 'Hạng tài khoản đạt được' : 'Account rank achieved'}</span>
                <span className="font-bold text-xs text-amber-600 dark:text-amber-300">
                  {accountRankName || (lang === 'vi' ? 'Cấp 1 - Tập Sự' : 'Level 1 - Beginner')}
                </span>
              </div>
            </div>
            {certCount !== undefined && certCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold">
                {certCount}/6 {lang === 'vi' ? 'Bằng' : 'Certs'}
              </span>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1 border-b border-gray-100 dark:border-[#2a2e39]">
            <Link to={dashboardRoute} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#2a2e39] flex items-center gap-3 transition-colors text-blue-600 dark:text-blue-400 font-medium">
              <LayoutDashboard className="w-4 h-4" />
              <span>{lang === 'vi' ? 'Trang tổng quan' : 'Dashboard'}</span>
            </Link>
          </div>

          <div className="py-1">
            <button 
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#2a2e39] flex items-center gap-3 transition-colors text-red-600 dark:text-red-400"
            >
              <LogOut className="w-4 h-4" />
              <span>{lang === 'vi' ? 'Đăng xuất' : 'Log out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

