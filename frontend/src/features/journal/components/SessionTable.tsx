import React from 'react';
import { ArrowRight, CheckCircle2, Calendar } from 'lucide-react';
import type { JournalSession } from '../types/journalTypes';
import { formatMoneyVND, formatPercent } from '../../../utils/tradingAnalytics';

interface SessionTableProps {
  sessions: JournalSession[];
  onSelectSession: (sessionId: string) => void;
}

export const SessionTable: React.FC<SessionTableProps> = ({
  sessions,
  onSelectSession
}) => {
  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl overflow-hidden shadow-sm">
      {/* Mobile Card List View (< sm) */}
      <div className="divide-y divide-slate-100 dark:divide-[#1f283e] sm:hidden">
        {sessions.map((session) => {
          const isProfit = session.netPnL >= 0;
          const formattedDate = session.startedAt
            ? new Date(session.startedAt).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })
            : 'N/A';

          return (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className="p-3.5 flex flex-col gap-2.5 hover:bg-slate-50/80 dark:hover:bg-[#161f31] transition-colors cursor-pointer group active:bg-slate-100 dark:active:bg-[#172033]"
            >
              {/* Top Row: Name, Symbol, Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {session.name}
                    </span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                      {session.symbol}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {session.simulationName}
                  </p>
                </div>

                <div className="shrink-0">
                  {session.status === 'ACTIVE' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      ĐANG MỞ
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-slate-400" />
                      ĐÃ ĐÓNG
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Grid: 2 columns */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-[#161f31]/60 border border-slate-100 dark:border-[#253047]/60 text-xs">
                <div>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 block uppercase">
                    P&L
                  </span>
                  <span
                    className={`font-bold ${
                      isProfit
                        ? 'text-emerald-600 dark:text-[#089981]'
                        : 'text-rose-600 dark:text-[#f23645]'
                    }`}
                  >
                    {formatMoneyVND(session.netPnL, true)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 block uppercase">
                    Tỷ lệ thắng / Lệnh
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        session.winRate >= 50
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatPercent(session.winRate, false)}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      ({session.tradesCount})
                    </span>
                  </div>
                </div>

                <div className="pt-1 border-t border-slate-200/50 dark:border-[#253047]/50 col-span-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formattedDate}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Tài sản: {formatMoneyVND(session.endingBalance || session.balance)}
                  </span>
                </div>
              </div>

              {/* Bottom Action Hint */}
              <div className="flex items-center justify-end text-blue-600 dark:text-blue-400 text-xs font-semibold gap-1 pt-0.5">
                <span>Xem chi tiết</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View (>= sm) */}
      <div className="hidden sm:block overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[820px]">
          <thead className="bg-slate-50 dark:bg-[#172033] border-b border-slate-200 dark:border-[#253047] text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
            <tr>
              <th className="py-3.5 px-3.5 sm:px-4">Phiên giao dịch</th>
              <th className="py-3.5 px-3">Kỳ thi mô phỏng</th>
              <th className="py-3.5 px-3">Bắt đầu</th>
              <th className="py-3.5 px-2.5 text-center">Lệnh</th>
              <th className="py-3.5 px-2.5 text-center">Tỷ lệ thắng</th>
              <th className="py-3.5 px-3 text-right">Lợi nhuận (P&L)</th>
              <th className="py-3.5 px-3 text-right">Giá trị tài sản</th>
              <th className="py-3.5 px-3 sm:px-4 text-right sticky right-0 z-10 bg-slate-50 dark:bg-[#172033] shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.3)]">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1f283e]">
            {sessions.map((session) => {
              const isProfit = session.netPnL >= 0;
              const formattedDate = session.startedAt
                ? new Date(session.startedAt).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })
                : 'N/A';

              return (
                <tr
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className="hover:bg-slate-50/80 dark:hover:bg-[#161f31] transition-colors cursor-pointer group"
                >
                  {/* Session Name & Status */}
                  <td className="py-3.5 px-3.5 sm:px-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                          <span>{session.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {session.symbol}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {session.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              ĐANG MỞ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-slate-400" />
                              ĐÃ ĐÓNG
                            </span>
                          )}
                          {session.timeframe && (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                              • {session.timeframe}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Simulation */}
                  <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 font-medium max-w-[170px] truncate" title={session.simulationName}>
                    {session.simulationName}
                  </td>

                  {/* Started Date */}
                  <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 text-xs">
                    {formattedDate}
                  </td>

                  {/* Trades Count */}
                  <td className="py-3.5 px-2.5 text-center font-semibold text-slate-800 dark:text-slate-200">
                    {session.tradesCount}
                  </td>

                  {/* Win Rate */}
                  <td className="py-3.5 px-2.5 text-center">
                    <span
                      className={`inline-block font-bold text-xs px-2 py-0.5 rounded ${
                        session.winRate >= 50
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatPercent(session.winRate, false)}
                    </span>
                  </td>

                  {/* P&L */}
                  <td className="py-3.5 px-3 text-right font-bold text-sm">
                    <span
                      className={
                        isProfit
                          ? 'text-emerald-600 dark:text-[#089981]'
                          : 'text-rose-600 dark:text-[#f23645]'
                      }
                    >
                      {formatMoneyVND(session.netPnL, true)}
                    </span>
                  </td>

                  {/* Portfolio Value */}
                  <td className="py-3.5 px-3 text-right font-semibold text-slate-900 dark:text-white">
                    {formatMoneyVND(session.endingBalance || session.balance)}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-3 sm:px-4 text-right sticky right-0 z-10 bg-white dark:bg-[#111827] group-hover:bg-slate-50 dark:group-hover:bg-[#161f31] shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.3)] transition-colors">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform cursor-pointer shrink-0"
                    >
                      <span>Xem</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
