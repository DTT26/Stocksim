import React from 'react';
import { Calendar, Hash, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { formatMoneyVND, formatPercent } from '../../../utils/tradingAnalytics';
import type { JournalSummaryStats } from '../types/journalTypes';

interface JournalSummaryProps {
  stats: JournalSummaryStats;
}

export const JournalSummary: React.FC<JournalSummaryProps> = ({ stats }) => {
  const isProfit = stats.netPnL >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {/* Total Sessions */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-3.5 sm:p-5 shadow-sm min-w-0">
        <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            Tổng số phiên
          </span>
          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
        </div>
        <div className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
          {stats.totalSessions}
        </div>
        <div className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5 sm:mt-1 font-medium truncate">
          Phiên đã ghi nhận
        </div>
      </div>

      {/* Total Trades */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-3.5 sm:p-5 shadow-sm min-w-0">
        <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            Tổng số lệnh
          </span>
          <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
        </div>
        <div className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
          {stats.totalTrades}
        </div>
        <div className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5 sm:mt-1 font-medium truncate">
          Lệnh đã thực thi
        </div>
      </div>

      {/* Win Rate */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-3.5 sm:p-5 shadow-sm min-w-0">
        <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            Tỷ lệ thắng
          </span>
          <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
        </div>
        <div className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
          {formatPercent(stats.winRate, false)}
        </div>
        <div className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5 sm:mt-1 font-medium truncate">
          Tỷ lệ lệnh có lãi
        </div>
      </div>

      {/* Net P&L */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-3.5 sm:p-5 shadow-sm min-w-0">
        <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            Lợi nhuận ròng (P&L)
          </span>
          {isProfit ? (
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 shrink-0" />
          )}
        </div>
        <div
          className={`text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tight truncate ${
            isProfit
              ? 'text-emerald-600 dark:text-[#089981]'
              : 'text-rose-600 dark:text-[#f23645]'
          }`}
        >
          {formatMoneyVND(stats.netPnL, true)}
        </div>
        <div className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5 sm:mt-1 font-medium truncate">
          Lũy kế thực tế
        </div>
      </div>
    </div>
  );
};
