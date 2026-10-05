import React from 'react';
import { LayoutDashboard, LineChart, PieChart, ListFilter } from 'lucide-react';

export type JournalTabId = 'overview' | 'analysis' | 'breakdown' | 'trades';

interface SessionTabsProps {
  activeTab: JournalTabId;
  onChangeTab: (tab: JournalTabId) => void;
  tradesCount: number;
}

export const SessionTabs: React.FC<SessionTabsProps> = ({
  activeTab,
  onChangeTab,
  tradesCount
}) => {
  const tabs: { id: JournalTabId; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: 'overview',
      label: 'Tổng quan',
      icon: <LayoutDashboard className="w-4 h-4" />
    },
    {
      id: 'analysis',
      label: 'Phân tích',
      icon: <LineChart className="w-4 h-4" />
    },
    {
      id: 'breakdown',
      label: 'Chi tiết',
      icon: <PieChart className="w-4 h-4" />
    },
    {
      id: 'trades',
      label: 'Lịch sử lệnh',
      icon: <ListFilter className="w-4 h-4" />,
      count: tradesCount
    }
  ];

  return (
    <div className="flex border-b border-slate-200 dark:border-[#253047] overflow-x-auto scrollbar-none gap-2 sm:gap-6">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`flex items-center gap-2 py-3 px-3 sm:px-1 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
              isActive
                ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
