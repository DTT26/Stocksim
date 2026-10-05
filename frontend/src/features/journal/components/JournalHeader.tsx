import React from 'react';
import { Layers, Trophy, ChevronDown } from 'lucide-react';
import { useI18n } from '../../../contexts/I18nContext';

interface JournalHeaderProps {
  simulations: { id: string; name: string }[];
  selectedSimulation: string;
  onSelectSimulation: (simId: string) => void;
  activeMainTab?: 'SIMULATION' | 'CHALLENGE';
  challengeLevels?: { id: string; name: string }[];
  selectedChallengeLevel?: string;
  onSelectChallengeLevel?: (lvlId: string) => void;
}

export const JournalHeader: React.FC<JournalHeaderProps> = ({
  simulations,
  selectedSimulation,
  onSelectSimulation,
  activeMainTab = 'SIMULATION',
  challengeLevels = [],
  selectedChallengeLevel = 'ALL',
  onSelectChallengeLevel
}) => {
  const { lang, t } = useI18n();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200 dark:border-[#253047]">
      <div>
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
            activeMainTab === 'CHALLENGE'
              ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
              : 'bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
          }`}>
            {activeMainTab === 'CHALLENGE' ? (
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
            ) : (
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {activeMainTab === 'CHALLENGE'
              ? (lang === 'vi' ? 'Nhật ký Thử thách Quỹ' : 'Funded Challenge Journal')
              : t('journal.pageTitle', 'Nhật ký Giao dịch')}
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm md:text-base mt-1 sm:mt-1.5 max-w-2xl">
          {activeMainTab === 'CHALLENGE'
            ? (lang === 'vi'
                ? 'Kiểm toán chi tiết các kỳ thi cấp vốn, lịch sử vi phạm, tỷ lệ lệnh và lợi nhuận tích lũy.'
                : 'Audit funded challenge attempts, risk breaches, win ratios, and net performance.')
            : t('journal.pageSubtitle', 'Xem lại các phiên giao dịch, phân tích hiệu suất và học hỏi từ từng lệnh giao dịch.')}
        </p>
      </div>

      {/* Selector Dropdown on the right */}
      <div className="relative w-full md:w-auto min-w-0 sm:min-w-[220px]">
        {activeMainTab === 'CHALLENGE' ? (
          <>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 font-mono">
              {lang === 'vi' ? 'Cấp độ thử thách' : 'Challenge Tier'}
            </label>
            <div className="relative">
              <select
                value={selectedChallengeLevel}
                onChange={(e) => onSelectChallengeLevel && onSelectChallengeLevel(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] text-slate-900 dark:text-white text-xs sm:text-sm font-semibold rounded-xl px-3.5 py-2.5 pr-9 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer shadow-sm font-mono"
              >
                <option value="ALL">{lang === 'vi' ? 'Tất cả cấp độ' : 'All Tiers'}</option>
                {challengeLevels.map(lvl => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </>
        ) : (
          <>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              {t('journal.examFilter', 'Kỳ thi mô phỏng')}
            </label>
            <div className="relative">
              <select
                value={selectedSimulation}
                onChange={(e) => onSelectSimulation(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] text-slate-900 dark:text-white text-xs sm:text-sm font-semibold rounded-xl px-3.5 py-2.5 pr-9 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer shadow-sm"
              >
                <option value="ALL">{t('journal.allExams', 'Tất cả kỳ thi')}</option>
                {simulations.map(sim => (
                  <option key={sim.id} value={sim.id}>
                    {sim.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
