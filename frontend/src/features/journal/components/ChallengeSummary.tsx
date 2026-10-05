import React from 'react';
import { Trophy, Hash, Target, TrendingUp, TrendingDown, ShieldCheck } from 'lucide-react';
import { useI18n } from '../../../contexts/I18nContext';

export interface ChallengeSummaryStats {
  activeLevelName: string;
  totalAttempts: number;
  totalTrades: number;
  winRate: number;
  netPnLUSD: number;
  statusText?: string;
}

interface ChallengeSummaryProps {
  stats: ChallengeSummaryStats;
}

export const ChallengeSummary: React.FC<ChallengeSummaryProps> = ({ stats }) => {
  const { lang } = useI18n();
  const isProfit = stats.netPnLUSD >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 font-sans">
      {/* 1. Level / Attempts */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-3.5 sm:p-5 shadow-sm min-w-0">
        <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate font-mono">
            {lang === 'vi' ? 'Cấp độ / Lượt thi' : 'Current Tier / Attempts'}
          </span>
          <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
        </div>
        <div className="text-base sm:text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate font-sans">
          {stats.activeLevelName || (lang === 'vi' ? 'Cấp $10,000' : '$10,000 Tier')}
        </div>
        <div className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1 font-medium truncate font-mono flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span>{stats.statusText || (lang === 'vi' ? `${stats.totalAttempts} lượt thi đã ghi nhận` : `${stats.totalAttempts} recorded attempts`)}</span>
        </div>
      </div>

      {/* 2. Total Trades */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-3.5 sm:p-5 shadow-sm min-w-0">
        <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate font-mono">
            {lang === 'vi' ? 'Tổng lệnh thử thách' : 'Challenge Trades'}
          </span>
          <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
        </div>
        <div className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate font-mono">
          {stats.totalTrades}
        </div>
        <div className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5 sm:mt-1 font-medium truncate font-mono">
          {lang === 'vi' ? 'Lệnh khớp trong thử thách' : 'Executed in challenge'}
        </div>
      </div>

      {/* 3. Win Rate */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-3.5 sm:p-5 shadow-sm min-w-0">
        <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate font-mono">
            {lang === 'vi' ? 'Tỷ lệ thắng' : 'Win Rate'}
          </span>
          <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
        </div>
        <div className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate font-mono">
          {stats.winRate.toFixed(1)}%
        </div>
        <div className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5 sm:mt-1 font-medium truncate font-mono">
          {lang === 'vi' ? 'Tỷ lệ lệnh có lãi' : 'Profitable trade ratio'}
        </div>
      </div>

      {/* 4. Net P&L in USD */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-3.5 sm:p-5 shadow-sm min-w-0">
        <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate font-mono">
            {lang === 'vi' ? 'Lợi nhuận ròng (P&L)' : 'Net P&L (USD)'}
          </span>
          {isProfit ? (
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 shrink-0" />
          )}
        </div>
        <div
          className={`text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tight truncate font-mono ${
            isProfit
              ? 'text-emerald-600 dark:text-[#089981]'
              : 'text-rose-600 dark:text-[#f23645]'
          }`}
        >
          {isProfit ? '+' : ''}${stats.netPnLUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        <div className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5 sm:mt-1 font-medium truncate font-mono">
          {lang === 'vi' ? 'Đã trừ phí hoa hồng sàn' : 'Net of simulated fees'}
        </div>
      </div>
    </div>
  );
};
