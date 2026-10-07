import React from 'react';
import { X, Clock, ShieldAlert, Target, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';
import type { JournalTrade } from '../types/journalTypes';
import { formatMoneyVND, formatPercent, formatHoldingTime } from '../../../utils/tradingAnalytics';
import { useI18n } from '../../../contexts/I18nContext';

interface TradeDetailDrawerProps {
  trade: JournalTrade | null;
  onClose: () => void;
}

export const TradeDetailDrawer: React.FC<TradeDetailDrawerProps> = ({ trade, onClose }) => {
  const { lang } = useI18n();

  if (!trade) return null;

  const isLong = trade.side === 'LONG' || trade.side === 'BUY';
  const isProfit = trade.pnl >= 0;

  const entryTimeFormatted = trade.entryTime || trade.openTime
    ? new Date((trade.entryTime || trade.openTime)!).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')
    : 'N/A';

  const exitTimeFormatted = trade.exitTime || trade.closeTime
    ? new Date((trade.exitTime || trade.closeTime)!).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')
    : (lang === 'vi' ? 'Vị thế đang mở' : 'Open position');

  let durationMins = trade.holdingTimeMinutes;
  if (durationMins === undefined && (trade.entryTime || trade.openTime) && (trade.exitTime || trade.closeTime)) {
    const s = new Date((trade.openTime || trade.entryTime)!).getTime();
    const e = new Date((trade.closeTime || trade.exitTime)!).getTime();
    durationMins = Math.max(0, (e - s) / (1000 * 60));
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-[#111827] border-l border-slate-200 dark:border-[#253047] h-full shadow-2xl flex flex-col justify-between text-slate-900 dark:text-white animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 dark:border-[#253047] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`p-2 rounded-xl flex items-center justify-center ${
                isLong ? 'bg-emerald-500/15 text-emerald-500' : 'text-rose-500 bg-rose-500/15'
              }`}
            >
              {isLong ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg tracking-tight">{trade.symbol}</h3>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    isLong
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {trade.side}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">ID: {trade.id}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* P&L Highlight Card */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              isProfit
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
            }`}
          >
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider block text-slate-500 dark:text-slate-400">
                {lang === 'vi' ? 'Lợi nhuận Ròng Thực tế' : 'Realized Net P&L'}
              </span>
              <div className="text-2xl font-extrabold mt-0.5">
                {formatMoneyVND(trade.pnl, true)}
              </div>
            </div>
            {trade.returnRate !== undefined && (
              <span className="text-sm font-bold px-2.5 py-1 rounded-lg bg-white/60 dark:bg-black/20">
                {formatPercent(trade.returnRate, true)}
              </span>
            )}
          </div>

          {/* Pricing & Volume Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              {lang === 'vi' ? 'Giá Khớp lệnh & Khối lượng' : 'Execution & Volume Details'}
            </h4>
            <div className="bg-slate-50 dark:bg-[#161f31] rounded-xl p-4 border border-slate-200/60 dark:border-[#253047]/60 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  {lang === 'vi' ? 'Giá Mở vị thế' : 'Entry Price'}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatMoneyVND(trade.entryPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  {lang === 'vi' ? 'Giá Đóng vị thế' : 'Exit Price'}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {trade.exitPrice ? formatMoneyVND(trade.exitPrice) : (lang === 'vi' ? 'Đang mở' : 'Open')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  {lang === 'vi' ? 'Khối lượng / Lot' : 'Volume / Lots'}
                </span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {trade.quantity || trade.lot || '1'}
                </span>
              </div>
              {trade.closeReason && (
                <div className="flex justify-between pt-2 border-t border-slate-200/40 dark:border-slate-700/40">
                  <span className="text-slate-500 dark:text-slate-400">
                    {lang === 'vi' ? 'Lý do Đóng lệnh' : 'Exit Reason'}
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {trade.closeReason}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Risk Setup (SL / TP) */}
          {(trade.sl || trade.tp) && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                {lang === 'vi' ? 'Lệnh Quản trị Rủi ro' : 'Risk Management Orders'}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-[#161f31] rounded-xl p-3 border border-slate-200/60 dark:border-[#253047]/60">
                  <div className="flex items-center gap-1.5 text-xs text-rose-500 font-semibold mb-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{lang === 'vi' ? 'Cắt lỗ (SL)' : 'Stop Loss (SL)'}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {trade.sl ? formatMoneyVND(trade.sl) : (lang === 'vi' ? 'Không có' : 'None')}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-[#161f31] rounded-xl p-3 border border-slate-200/60 dark:border-[#253047]/60">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold mb-1">
                    <Target className="w-3.5 h-3.5" />
                    <span>{lang === 'vi' ? 'Chốt lời (TP)' : 'Take Profit (TP)'}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {trade.tp ? formatMoneyVND(trade.tp) : (lang === 'vi' ? 'Không có' : 'None')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Timing & Holding */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              {lang === 'vi' ? 'Thời gian & Thời lượng' : 'Timing & Duration'}
            </h4>
            <div className="bg-slate-50 dark:bg-[#161f31] rounded-xl p-4 border border-slate-200/60 dark:border-[#253047]/60 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  {lang === 'vi' ? 'Thời gian Mở lệnh' : 'Open Time'}
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{entryTimeFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  {lang === 'vi' ? 'Thời gian Đóng lệnh' : 'Close Time'}
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{exitTimeFormatted}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                <span className="text-slate-500 dark:text-slate-400">
                  {lang === 'vi' ? 'Thời gian Giữ lệnh' : 'Holding Duration'}
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatHoldingTime(durationMins)}
                </span>
              </div>
            </div>
          </div>

          {/* Setup Tag / Strategy */}
          {trade.setupTag && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                {lang === 'vi' ? 'Chiến lược / Setup' : 'Strategy / Setup'}
              </h4>
              <div className="flex items-center gap-2 p-3 bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl text-sm font-semibold">
                <Tag className="w-4 h-4" />
                <span>{trade.setupTag}</span>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-[#253047] bg-slate-50 dark:bg-[#161f31]/50">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-sm transition-colors cursor-pointer"
          >
            {lang === 'vi' ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
