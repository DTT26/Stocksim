import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Target, BookOpen, Activity, User, LogOut, Menu, LineChart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';

interface StudentSidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export const StudentSidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: StudentSidebarProps) => {
  const location = useLocation();
  const { logout } = useAuth();
  const { lang, t } = useI18n();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    }
  };

  const menuItems = [
    { name: t('dash.title', 'Trang tổng quan'), path: '/student', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: t('dash.simulations', 'Kỳ thi mô phỏng'), path: '/student/simulations', icon: <Target className="w-5 h-5" /> },
    { name: t('dash.assignments', 'Bài tập'), path: '/student/assignments', icon: <BookOpen className="w-5 h-5" /> },
    { name: t('dash.journal', 'Nhật ký giao dịch'), path: '/student/journal', icon: <Activity className="w-5 h-5" /> },
  ];

  const rawLastStock = localStorage.getItem('lastSelectedStock');
  const lastSelectedStock = (rawLastStock && rawLastStock.toLowerCase() !== 'fpt') ? rawLastStock : 'btcusdt';

  const bottomItems = [
    { name: t('dash.backToChart', 'Quay lại biểu đồ'), path: `/trade/${lastSelectedStock}`, icon: <LineChart className="w-5 h-5" /> },
    { name: t('dash.profile', 'Hồ sơ cá nhân'), path: '/student/profile', icon: <User className="w-5 h-5" /> },
  ];

  const sidebarClasses = `fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-[#111827] border-r border-[#e2e8f0] dark:border-[#253047] transition-all duration-300
    ${collapsed ? 'w-[80px]' : 'w-[260px]'}
    ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
  `;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={sidebarClasses}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#e2e8f0] dark:border-[#253047]">
          {!collapsed && (
            <Link to="/student" className="flex items-center px-2">
              <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Stock<span className="text-indigo-600 dark:text-indigo-500">Sim</span></span>
            </Link>
          )}
          {collapsed && (
            <Link to="/student" className="mx-auto flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-[#172033] transition-colors">
              <span className="text-xl font-black text-indigo-600">S</span>
            </Link>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            className="hidden md:flex p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#172033] rounded-lg transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1.5 scrollbar-hide">
          <div className="mb-2 px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {!collapsed && t('dash.mainMenu', 'Menu chính')}
          </div>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/student' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative
                  ${isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-semibold' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172033]'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.name : undefined}
              >
                <div className={`${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'}`}>
                  {item.icon}
                </div>
                {!collapsed && <span className="text-[15px]">{item.name}</span>}
                {isActive && !collapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 dark:bg-indigo-500 rounded-r-full" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="p-3 border-t border-[#e2e8f0] dark:border-[#253047] flex flex-col gap-1.5">
          {bottomItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group
                  ${isActive 
                    ? 'bg-slate-100 dark:bg-[#172033] text-slate-900 dark:text-white font-semibold' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172033]'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.name : undefined}
              >
                <div className={`${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'}`}>
                  {item.icon}
                </div>
                {!collapsed && <span className="text-[15px]">{item.name}</span>}
              </Link>
            );
          })}
          
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-rose-600 dark:text-rose-500/80 hover:text-rose-700 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 w-full cursor-pointer
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? (lang === 'vi' ? 'Đăng xuất' : 'Log out') : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="font-medium text-[15px]">{lang === 'vi' ? 'Đăng xuất' : 'Log out'}</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
