import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import type { JournalFilterState } from '../types/journalTypes';
import { useI18n } from '../../../contexts/I18nContext';

interface JournalFiltersProps {
  filters: JournalFilterState;
  onFilterChange: (filters: Partial<JournalFilterState>) => void;
  onReset: () => void;
  availableSymbols: string[];
}

export const JournalFilters: React.FC<JournalFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  availableSymbols
}) => {
  const { lang, t } = useI18n();
  const hasActiveFilters = Boolean(
    filters.search || filters.status !== 'ALL' || filters.symbol !== 'ALL'
  );

  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-3 sm:p-4 shadow-sm">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 sm:gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder={t('journal.searchPlaceholder', 'Tìm kiếm phiên hoặc mã giao dịch...')}
            className="w-full bg-slate-50 dark:bg-[#172033] border border-slate-200 dark:border-[#253047] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm rounded-xl pl-9 pr-3.5 py-2 sm:py-2.5 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Filter Controls Row on Mobile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Status Dropdown */}
          <div className="flex-1 sm:flex-none sm:min-w-[130px]">
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ status: e.target.value as any })}
              className="w-full bg-slate-50 dark:bg-[#172033] border border-slate-200 dark:border-[#253047] text-slate-900 dark:text-white text-xs sm:text-sm font-medium rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
            >
              <option value="ALL">{t('journal.allStatuses', 'Tất cả trạng thái')}</option>
              <option value="ACTIVE">{t('journal.activeStatus', 'Đang diễn ra')}</option>
              <option value="COMPLETED">{t('journal.completedStatus', 'Đã kết thúc')}</option>
            </select>
          </div>

          {/* Symbol Dropdown */}
          <div className="flex-1 sm:flex-none sm:min-w-[130px]">
            <select
              value={filters.symbol}
              onChange={(e) => onFilterChange({ symbol: e.target.value })}
              className="w-full bg-slate-50 dark:bg-[#172033] border border-slate-200 dark:border-[#253047] text-slate-900 dark:text-white text-xs sm:text-sm font-medium rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
            >
              <option value="ALL">{t('journal.allSymbols', 'Tất cả mã')}</option>
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
              className="flex items-center justify-center gap-1 px-3 py-2 sm:py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer shrink-0"
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
