import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, ExternalLink, ArrowRight, Target, TrendingUp, TrendingDown,
  Clock, CheckCircle2, ChevronRight, BarChart2
} from 'lucide-react';
import { useSimulatorStore } from '../engine/useSimulatorStore';
import { formatMoneyVND, formatPercent } from '../../../utils/tradingAnalytics';
import { useI18n } from '../../../contexts/I18nContext';

export const TradingJournalPanel: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const session = useSimulatorStore((s) => s.session);
  const positions = useSimulatorStore((s) => s.positions) || [];
  const history = useSimulatorStore((s) => s.history) || [];

  const initialBalance = session?.config.initialBalance || 100000000;
  const currentEquity = session?.equity || initialBalance;
  const netPnL = currentEquity - initialBalance;
  const winningTrades = history.filter((h) => h.netPnL > 0);
  const winRate = history.length > 0 ? parseFloat(((winningTrades.length / history.length) * 100).toFixed(1)) : 0;

  return (
    <div className="w-full lg:w-[320px] lg:border-l border-[#e6e8ea] dark:border-[#2a2e39] bg-white dark:bg-[#131722] shrink-0 h-full flex flex-col text-[#1e2329] dark:text-[#d1d4dc] font-sans">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#e6e8ea] dark:border-[#2a2e39] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {t('journal.title', 'Nhật ký Giao dịch')}
            </h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {t('journal.subtitle', 'Ghi chú & Nhật ký phiên')}
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate('/student/journal')}
          title="Mở toàn bộ trang Nhật ký"
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-[#253047] transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Banner Link to Full Dashboard */}
        <div
          onClick={() => navigate('/student/journal')}
          className="p-3 rounded-xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/25 hover:border-blue-500/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {t('journal.perfAnalysis', 'Phân tích Hiệu suất Chi tiết')}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('journal.perfDesc', 'Xem tổng quan, biểu đồ và lịch sử lệnh')}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>
        </div>

        {/* Quick Session Stats */}
        <div className="bg-slate-50 dark:bg-[#172033] border border-slate-200 dark:border-[#253047] rounded-xl p-3.5 space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">{t('journal.currentSession', 'Phiên hiện tại:')}</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {session?.name || `${session?.symbol || 'STOCK'} Phiên`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Lợi nhuận ròng
              </span>
              <span
                className={`text-sm font-bold ${
                  netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {formatMoneyVND(netPnL, true)}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Tỷ lệ thắng
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {formatPercent(winRate, false)}
              </span>
            </div>
          </div>
        </div>

        {/* Open Positions in Session */}
        {positions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('journal.openPositions', 'Vị thế đang mở')} ({positions.length})
              </span>
            </div>
            <div className="space-y-2">
              {positions.map((pos) => {
                const isLong = pos.side === 'LONG';
                return (
                  <div
                    key={pos.id}
                    onClick={() => navigate('/student/journal')}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#172033] border border-blue-500/30 hover:border-blue-500/60 cursor-pointer transition-all flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                            isLong
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : 'bg-rose-500/15 text-rose-500'
                          }`}
                        >
                          {pos.side}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {pos.symbol}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {pos.lot} lot
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Entry: {pos.entryPrice}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-blue-500 uppercase px-1.5 py-0.5 bg-blue-500/10 rounded border border-blue-500/20">
                        OPEN
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Trades in Session */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('journal.recentTrades', 'Lệnh đã đóng')} ({history.length})
            </span>
            <button
              onClick={() => navigate('/student/journal')}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              {t('journal.viewAll', 'Xem tất cả')}
            </button>
          </div>

          {history.length === 0 ? (
            <div className="py-8 text-center bg-slate-50/50 dark:bg-[#172033]/50 rounded-xl border border-dashed border-slate-200 dark:border-[#253047]">
              <Clock className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t('journal.noTrades', 'Chưa có lệnh nào đóng')}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {t('journal.noTradesDesc', 'Các lệnh chốt lời/cắt lỗ sẽ hiện ở đây')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.slice(-5).reverse().map((trade) => {
                const isProfit = trade.netPnL > 0;
                return (
                  <div
                    key={trade.id}
                    onClick={() => navigate('/student/journal')}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#172033] border border-slate-200/80 dark:border-[#253047] hover:border-blue-500/50 cursor-pointer transition-all flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                            trade.side === 'LONG'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : 'bg-rose-500/15 text-rose-500'
                          }`}
                        >
                          {trade.side}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {trade.symbol}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {trade.lot} lot
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {trade.entryPrice} → {trade.exitPrice}
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-bold block ${
                          isProfit ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {formatMoneyVND(trade.netPnL, true)}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase">
                        {trade.closeReason}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#e6e8ea] dark:border-[#2a2e39] shrink-0 bg-slate-50 dark:bg-[#161f31]/40">
        <button
          data-tour="open-full-journal-btn"
          onClick={() => navigate('/student/journal')}
          className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
        >
          <span>{t('journal.fullJournalBtn', 'Mở Nhật ký Giao dịch Đầy đủ')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
