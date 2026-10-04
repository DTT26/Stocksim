import React from 'react';
import { Layers, ChevronDown } from 'lucide-react';

interface JournalHeaderProps {
  simulations: { id: string; name: string }[];
  selectedSimulation: string;
  onSelectSimulation: (simId: string) => void;
}

export const JournalHeader: React.FC<JournalHeaderProps> = ({
  simulations,
  selectedSimulation,
  onSelectSimulation
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200 dark:border-[#253047]">
      <div>
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Nhật ký Giao dịch
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm md:text-base mt-1 sm:mt-1.5 max-w-2xl">
          Xem lại các phiên giao dịch, phân tích hiệu suất và học hỏi từ từng lệnh giao dịch.
        </p>
      </div>

      {/* Simulation Selector Dropdown */}
      <div className="relative w-full md:w-auto min-w-0 sm:min-w-[220px]">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
          Kỳ thi mô phỏng
        </label>
        <div className="relative">
          <select
            value={selectedSimulation}
            onChange={(e) => onSelectSimulation(e.target.value)}
            className="w-full appearance-none bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] text-slate-900 dark:text-white text-xs sm:text-sm font-semibold rounded-xl px-3.5 py-2.5 pr-9 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer shadow-sm"
          >
            <option value="ALL">Tất cả kỳ thi</option>
            {simulations.map(sim => (
              <option key={sim.id} value={sim.id}>
                {sim.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
