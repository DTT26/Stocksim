import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { useI18n } from '../../../contexts/I18nContext';

export interface ChallengeFilterState {
  search: string;
  status: 'ALL' | 'ACTIVE' | 'PASSED' | 'FAILED';
  level: string;
  symbol: string;
}

interface ChallengeFiltersProps {
  filters: ChallengeFilterState;
  onFilterChange: (filters: Partial<ChallengeFilterState>) => void;
  onReset: () => void;
  availableSymbols: string[];
  availableLevels: { id: string; name: string }[];
}

export const ChallengeFilters: React.FC<ChallengeFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  availableSymbols,
  availableLevels
}) => {
  const { lang } = useI18n();
  const hasActiveFilters = Boolean(
    filters.search || filters.status !== 'ALL' || filters.level !== 'ALL' || filters.symbol !== 'ALL'
  );

  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-3 sm:p-4 shadow-sm font-sans">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 sm:gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder={lang === 'vi' ? 'Tìm kiếm cấp độ, mã giao dịch...' : 'Search challenge tier, symbol...'}
            className="w-full bg-slate-50 dark:bg-[#172033] border border-slate-200 dark:border-[#253047] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm rounded-xl pl-9 pr-3.5 py-2 sm:py-2.5 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono"
          />
        </div>

        {/* Filter Controls Row */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          {/* Level Dropdown */}
          <div className="flex-1 sm:flex-none sm:min-w-[140px]">
            <select
              value={filters.level}
              onChange={(e) => onFilterChange({ level: e.target.value })}
              className="w-full bg-slate-50 dark:bg-[#172033] border border-slate-200 dark:border-[#253047] text-slate-900 dark:text-white text-xs sm:text-sm font-medium rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer transition-all font-mono"
            >
              <option value="ALL">{lang === 'vi' ? 'Tất cả cấp độ' : 'All Tiers'}</option>
              {availableLevels.map(lvl => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex-1 sm:flex-none sm:min-w-[130px]">
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ status: e.target.value as any })}
              className="w-full bg-slate-50 dark:bg-[#172033] border border-slate-200 dark:border-[#253047] text-slate-900 dark:text-white text-xs sm:text-sm font-medium rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer transition-all font-mono"
            >
              <option value="ALL">{lang === 'vi' ? 'Tất cả kết quả' : 'All Outcomes'}</option>
              <option value="ACTIVE">{lang === 'vi' ? 'Đang thi (ACTIVE)' : 'Active'}</option>
              <option value="PASSED">{lang === 'vi' ? 'Đã đạt (PASSED)' : 'Passed'}</option>
              <option value="FAILED">{lang === 'vi' ? 'Vi phạm (FAILED)' : 'Breached'}</option>
            </select>
          </div>

          {/* Symbol Dropdown */}
          <div className="flex-1 sm:flex-none sm:min-w-[120px]">
            <select
              value={filters.symbol}
              onChange={(e) => onFilterChange({ symbol: e.target.value })}
              className="w-full bg-slate-50 dark:bg-[#172033] border border-slate-200 dark:border-[#253047] text-slate-900 dark:text-white text-xs sm:text-sm font-medium rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer transition-all font-mono"
            >
              <option value="ALL">{lang === 'vi' ? 'Tất cả mã' : 'All Symbols'}</option>
              {availableSymbols.map(sym => (
                <option key={sym} value={sym}>
                  {sym}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center justify-center gap-1 px-3 py-2 sm:py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer shrink-0 font-mono"
              title={lang === 'vi' ? 'Đặt lại bộ lọc' : 'Reset filters'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'vi' ? 'Đặt lại' : 'Reset'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
