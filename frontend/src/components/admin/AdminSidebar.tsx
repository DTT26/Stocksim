import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Target, User, LogOut, Menu, ChevronLeft, LineChart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminSidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export const AdminSidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: AdminSidebarProps) => {
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    }
  };

  const menuItems = [
    { name: 'Trang tổng quan', path: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Người dùng', path: '/admin/users', icon: <Users className="w-5 h-5" /> },
    { name: 'Kỳ thi mô phỏng', path: '/admin/simulations', icon: <Target className="w-5 h-5" /> },
  ];

  const rawLastStock = localStorage.getItem('lastSelectedStock');
  const lastSelectedStock = (rawLastStock && rawLastStock.toLowerCase() !== 'fpt') ? rawLastStock : 'btcusdt';

  const bottomItems = [
    { name: 'Quay lại biểu đồ', path: `/trade/${lastSelectedStock}`, icon: <LineChart className="w-5 h-5" /> },
    { name: 'Hồ sơ cá nhân', path: '/admin/profile', icon: <User className="w-5 h-5" /> },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const sidebarClasses = `fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-[#111827] border-r border-[#e2e8f0] dark:border-[#1e293b] transition-all duration-300
    ${collapsed ? 'w-[80px]' : 'w-[260px]'}
    ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
  `;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={sidebarClasses}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#e2e8f0] dark:border-[#1e293b]">
          {!collapsed && (
            <Link to="/admin" className="flex items-center px-2">
              <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Stock<span className="text-blue-600 dark:text-blue-400">Sim</span></span>
            </Link>
          )}
          {collapsed && (
            <Link to="/admin" className="mx-auto flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1f293d] transition-colors">
              <span className="text-xl font-black text-blue-600">S</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#172033] rounded-lg transition-colors cursor-pointer"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1 scrollbar-hide">
          {!collapsed && (
            <div className="mb-3 px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Quản lý
            </div>
          )}
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative
                  ${active
                    ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172033]'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.name : undefined}
              >
                <div className={active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'}>
                  {item.icon}
                </div>
                {!collapsed && <span className="font-medium text-[15px]">{item.name}</span>}
                {active && !collapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 dark:bg-blue-500 rounded-r-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-[#e2e8f0] dark:border-[#1e293b] flex flex-col gap-1">
          {bottomItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group
                  ${active
                    ? 'bg-slate-100 dark:bg-[#172033] text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172033]'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.name : undefined}
              >
                <div className={active ? 'text-slate-900 dark:text-white' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'}>
                  {item.icon}
                </div>
                {!collapsed && <span className="font-medium text-[15px]">{item.name}</span>}
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-rose-600 dark:text-rose-500/80 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 w-full cursor-pointer
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? 'Đăng xuất' : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="font-medium text-[15px]">Đăng xuất</span>}
          </button>

          {/* Footer tagline */}
          {!collapsed && (
            <div className="mt-3 px-3 pb-2 text-center">
              <p className="text-[10px] text-slate-400 dark:text-slate-600 font-medium uppercase tracking-wider">StockSim</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">Teach Today · Trade Tomorrow</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
