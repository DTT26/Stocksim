import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../../contexts/I18nContext';
import type { JournalTrade } from '../types/journalTypes';

export interface ChallengeHistoryItem {
  id: string;
  levelId: number;
  levelName: string;
  capitalUSD: number;
  currentEquityUSD: number;
  status: 'ACTIVE' | 'PASSED' | 'FAILED' | 'PAUSED' | 'ABANDONED';
  startedAt: string;
  endedAt?: string;
  tradesCount: number;
  winRate: number;
  profitUSD: number;
  breachReason?: string;
  isDemo?: boolean;
  trades: JournalTrade[];
}

interface ChallengeHistoryTableProps {
  challenges: ChallengeHistoryItem[];
  onOpenChallengeModal?: () => void;
}

export const ChallengeHistoryTable: React.FC<ChallengeHistoryTableProps> = ({
  challenges,
  onOpenChallengeModal
}) => {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(challenges[0]?.id || null);

  // Keep expandedId synced to newest attempt when challenges load or change
  useEffect(() => {
    if (challenges.length > 0) {
      if (!expandedId || !challenges.some(c => c.id === expandedId)) {
        setExpandedId(challenges[0].id);
      }
    }
  }, [challenges]);

  const getStatusBadge = (status: ChallengeHistoryItem['status']) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            {lang === 'vi' ? 'ĐANG THI' : 'ACTIVE'}
          </span>
        );
      case 'PASSED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {lang === 'vi' ? 'ĐẠT MỤC TIÊU' : 'PASSED'}
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 rounded-full whitespace-nowrap">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            {lang === 'vi' ? 'VI PHẠM' : 'BREACHED'}
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-500/10 border border-slate-500/25 px-2 py-0.5 rounded-full whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {lang === 'vi' ? 'TẠM DỪNG' : 'PAUSED'}
          </span>
        );
      case 'ABANDONED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-500/10 border border-slate-500/25 px-2 py-0.5 rounded-full whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {lang === 'vi' ? 'ĐÃ DỪNG' : 'ENDED'}
          </span>
        );
      default:
        return null;
    }
  };

  if (challenges.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-8 sm:p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-3">
          <Trophy className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-slate-800 dark:text-white">
          {lang === 'vi' ? 'Không tìm thấy dữ liệu thử thách' : 'No challenge records found'}
        </h4>
        <p className="text-xs text-slate-400 mt-1.5 mb-4 max-w-sm mx-auto">
          {lang === 'vi'
            ? 'Không có đợt thử thách quỹ nào phù hợp với bộ lọc tìm kiếm hiện tại.'
            : 'No funded challenge attempts match the selected criteria.'}
        </p>
        {onOpenChallengeModal && (
          <button
            onClick={onOpenChallengeModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-lg text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>{lang === 'vi' ? 'Đăng ký Thử Thách Quỹ' : 'Start Funded Challenge'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl overflow-hidden shadow-sm">
      {/* Mobile Card List View (< sm) */}
      <div className="divide-y divide-slate-100 dark:divide-[#1f283e] sm:hidden">
        {challenges.map((chal) => {
          const isProfit = chal.profitUSD >= 0;
          const isExpanded = expandedId === chal.id;
          const formattedDate = chal.startedAt
            ? new Date(chal.startedAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })
            : 'N/A';

          return (
            <div key={chal.id} className="p-4 space-y-3">
              <div 
                className="flex items-start justify-between cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : chal.id)}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{chal.levelName}</span>
                      {chal.isDemo && (
                        <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono">DEMO</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {formattedDate} • Vốn: ${(chal.capitalUSD || 10000).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {getStatusBadge(chal.status)}
                  <button className="p-1 text-slate-400 hover:text-white">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {chal.breachReason && chal.status === 'FAILED' && (
                <div className="text-[11px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-mono">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{chal.breachReason}</span>
                </div>
              )}

              {/* Metrics Grid Mobile */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-[#172033] p-2.5 rounded-lg text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block">{lang === 'vi' ? 'Số lệnh' : 'Trades'}</span>
                  <span className="font-bold text-slate-200">{chal.tradesCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{lang === 'vi' ? 'Thắng' : 'Win rate'}</span>
                  <span className={`font-bold ${chal.winRate >= 50 ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {chal.winRate.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{lang === 'vi' ? 'Lợi nhuận' : 'P&L'}</span>
                  <span className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isProfit ? '+' : ''}${chal.profitUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Mobile Expanded Trades */}
              {isExpanded && (
                <div className="pt-2 border-t border-slate-100 dark:border-[#1f283e] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
                    <span>{lang === 'vi' ? 'Chi tiết lệnh' : 'Executed Orders'}</span>
                    <span className="text-[11px] font-mono text-slate-500">{chal.trades.length} {lang === 'vi' ? 'lệnh' : 'trades'}</span>
                  </div>

                  {chal.trades.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2 text-center">
                      {lang === 'vi' ? 'Chưa có lệnh nào trong kỳ thử thách này' : 'No trades executed in this challenge yet'}
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-[#1f283e] font-mono text-xs">
                      {chal.trades.map((t, idx) => (
                        <div key={t.id || idx} className="py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.side === 'LONG' || t.side === 'BUY' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                              {t.side}
                            </span>
                            <span className="font-bold text-slate-200">{t.symbol}</span>
                            {t.status === 'OPEN' && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-bold uppercase">MỞ</span>
                            )}
                          </div>
                          <div className="text-right">
                            {t.status === 'OPEN' ? (
                              <span className="text-slate-400 text-xs italic">Đang mở</span>
                            ) : (
                              <span className={`font-bold ${(t.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {(t.pnl || 0) >= 0 ? '+' : ''}${(t.pnl || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Table View (>= sm) */}
      <div className="hidden sm:block overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-[#172033] border-b border-slate-200 dark:border-[#253047] text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 font-mono">
            <tr>
              <th className="py-3 px-3.5 sm:px-4">{lang === 'vi' ? 'Kỳ thi / Cấp độ' : 'Challenge Tier'}</th>
              <th className="py-3 px-2.5 text-right">{lang === 'vi' ? 'Vốn cấp' : 'Capital'}</th>
              <th className="py-3 px-2.5">{lang === 'vi' ? 'Thời gian' : 'Date'}</th>
              <th className="py-3 px-2 text-center">{lang === 'vi' ? 'Lệnh' : 'Trades'}</th>
              <th className="py-3 px-2 text-center">{lang === 'vi' ? 'Thắng' : 'Win%'}</th>
              <th className="py-3 px-2.5 text-right">{lang === 'vi' ? 'Lợi nhuận P&L' : 'P&L'}</th>
              <th className="py-3 px-2.5 text-right">{lang === 'vi' ? 'Tài sản' : 'Equity'}</th>
              <th className="py-3 px-2.5 text-center">{lang === 'vi' ? 'Trạng thái' : 'Status'}</th>
              <th className="py-3 px-3 sm:px-4 text-right sticky right-0 z-10 bg-slate-50 dark:bg-[#172033] shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.1)] dark:shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.4)]">
                {lang === 'vi' ? 'Thao tác' : 'Action'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1f283e] font-sans">
            {challenges.map((chal) => {
              const isProfit = chal.profitUSD >= 0;
              const isExpanded = expandedId === chal.id;
              const formattedDate = chal.startedAt
                ? new Date(chal.startedAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })
                : 'N/A';

              return (
                <React.Fragment key={chal.id}>
                  <tr 
                    onClick={() => setExpandedId(isExpanded ? null : chal.id)}
                    className={`transition-colors cursor-pointer group ${
                      isExpanded 
                        ? 'bg-slate-100/70 dark:bg-[#172033]' 
                        : 'hover:bg-slate-50/80 dark:hover:bg-[#151d2e]'
                    }`}
                  >
                    {/* Level */}
                    <td className="py-3 px-3.5 sm:px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                          <Trophy className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{chal.levelName}</span>
                            {chal.isDemo && (
                              <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono">DEMO</span>
                            )}
                          </div>
                          {chal.breachReason && chal.status === 'FAILED' && (
                            <div className="text-[11px] text-rose-400 font-mono truncate max-w-[240px]">
                              {chal.breachReason}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Capital */}
                    <td className="py-3 px-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ${chal.capitalUSD.toLocaleString()}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-2.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {formattedDate}
                    </td>

                    {/* Trades count */}
                    <td className="py-3 px-2 text-center font-mono font-bold text-slate-700 dark:text-slate-200">
                      {chal.tradesCount}
                    </td>

                    {/* Win rate */}
                    <td className="py-3 px-2 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        chal.winRate >= 50
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                          : 'text-slate-600 dark:text-slate-400 bg-slate-500/10'
                      }`}>
                        {chal.winRate.toFixed(1)}%
                      </span>
                    </td>

                    {/* Profit */}
                    <td className="py-3 px-2.5 text-right font-mono font-bold">
                      <span className={isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {isProfit ? '+' : ''}${chal.profitUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </span>
                    </td>

                    {/* Equity */}
                    <td className="py-3 px-2.5 text-right font-mono font-extrabold text-slate-900 dark:text-white">
                      ${chal.currentEquityUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-2.5 text-center">
                      {getStatusBadge(chal.status)}
                    </td>

                    {/* Sticky Action Column */}
                    <td className={`py-3 px-3 sm:px-4 text-right sticky right-0 z-10 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.1)] dark:shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.4)] transition-colors ${
                      isExpanded 
                        ? 'bg-slate-100 dark:bg-[#172033]' 
                        : 'bg-white dark:bg-[#111827] group-hover:bg-slate-50 dark:group-hover:bg-[#151d2e]'
                    }`}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(isExpanded ? null : chal.id);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors whitespace-nowrap cursor-pointer pr-1"
                      >
                        <span>{isExpanded ? (lang === 'vi' ? 'Thu gọn' : 'Collapse') : (lang === 'vi' ? 'Xem lệnh' : 'View Trades')}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Trades Row */}
                  {isExpanded && (
                    <tr className="bg-slate-50/50 dark:bg-[#0B1120]">
                      <td colSpan={9} className="p-3 sm:p-4 border-y border-slate-200 dark:border-[#212E48]">
                        <div className="w-full space-y-3">
                          {/* Inner Header Bar */}
                          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-[#1E293B]">
                            <div className="flex items-center gap-2 min-w-0">
                              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300 truncate">
                                {lang === 'vi' 
                                  ? `Danh sách lệnh kiểm toán • ${chal.levelName}`
                                  : `Audited Orders Log • ${chal.levelName}`}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-800/40 text-blue-400 font-mono text-[9px] shrink-0">
                                SHA-256
                              </span>
                            </div>

                            <button
                              onClick={() => navigate('/trade/btcusdt')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-sm"
                            >
                              <span>{lang === 'vi' ? 'Terminal' : 'Terminal'}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </button>
                          </div>

                          {chal.trades.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 font-mono text-xs space-y-1.5">
                              <p className="text-slate-300 font-semibold">
                                {lang === 'vi' 
                                  ? 'Chưa có lệnh giao dịch nào được khớp trong đợt thử thách này.'
                                  : 'No orders executed or matched in this challenge period yet.'}
                              </p>
                              <p className="text-slate-500 text-[11px]">
                                {lang === 'vi'
                                  ? 'Khi bạn vào lệnh mua/bán ở chế độ Thử Thách Quỹ, nhật ký chi tiết sẽ tự động lưu và kiểm toán tại đây.'
                                  : 'When you execute buy/sell orders in Challenge mode, audit records will automatically appear here.'}
                              </p>
                            </div>
                          ) : (
                            <div className="w-full overflow-x-auto custom-scrollbar rounded-lg border border-slate-200/60 dark:border-[#1c273d]">
                              <table className="w-full text-left font-mono text-xs whitespace-nowrap">
                                <thead className="bg-slate-100/70 dark:bg-[#121a2b]">
                                  <tr className="text-slate-500 dark:text-slate-400 text-[10px] uppercase border-b border-slate-200 dark:border-[#1C273D]">
                                    <th className="py-2.5 px-3">{lang === 'vi' ? 'Mã' : 'Symbol'}</th>
                                    <th className="py-2.5 px-2 text-center">{lang === 'vi' ? 'Vị thế' : 'Side'}</th>
                                    <th className="py-2.5 px-2.5 text-right">{lang === 'vi' ? 'Giá vào' : 'Entry'}</th>
                                    <th className="py-2.5 px-2.5 text-right">{lang === 'vi' ? 'Giá đóng' : 'Exit'}</th>
                                    <th className="py-2.5 px-2 text-right">{lang === 'vi' ? 'Lot' : 'Lot'}</th>
                                    <th className="py-2.5 px-2.5 text-right">{lang === 'vi' ? 'Lợi nhuận P&L' : 'PnL'}</th>
                                    <th className="py-2.5 px-2 text-center">{lang === 'vi' ? 'SL / TP' : 'SL / TP'}</th>
                                    <th className="py-2.5 px-3 text-right pr-4">{lang === 'vi' ? 'Thời gian' : 'Time'}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-[#172236]">
                                  {chal.trades.map((trade, tIdx) => {
                                    const isWin = (trade.pnl || 0) >= 0;
                                    const isOpen = trade.status === 'OPEN';
                                    const slText = trade.sl ? `$${trade.sl.toLocaleString()}` : '—';
                                    const tpText = trade.tp ? `$${trade.tp.toLocaleString()}` : '—';

                                    return (
                                      <tr key={trade.id || tIdx} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="py-2 px-3 font-bold text-white flex items-center gap-1.5">
                                          <span>{trade.symbol}</span>
                                          {isOpen && (
                                            <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold uppercase tracking-wider">
                                              {lang === 'vi' ? 'MỞ' : 'OPEN'}
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                            trade.side === 'LONG' || trade.side === 'BUY'
                                              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                                              : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                                          }`}>
                                            {trade.side}
                                          </span>
                                        </td>
                                        <td className="py-2 px-2.5 text-right text-slate-300">
                                          ${trade.entryPrice ? trade.entryPrice.toLocaleString() : 'N/A'}
                                        </td>
                                        <td className="py-2 px-2.5 text-right text-slate-300">
                                          {isOpen ? (
                                            <span className="text-slate-500 italic text-[11px]">{lang === 'vi' ? '— (Mở)' : '— (Open)'}</span>
                                          ) : (
                                            `$${trade.exitPrice ? trade.exitPrice.toLocaleString() : 'N/A'}`
                                          )}
                                        </td>
                                        <td className="py-2 px-2 text-right text-slate-400">
                                          {trade.quantity || trade.lot || 1}
                                        </td>
                                        <td className="py-2 px-2.5 text-right font-bold">
                                          {isOpen ? (
                                            <span className="text-slate-400 text-[11px] font-normal italic">
                                              {lang === 'vi' ? 'Chưa chốt' : 'Unrealized'}
                                            </span>
                                          ) : (
                                            <span className={isWin ? 'text-emerald-400' : 'text-rose-400'}>
                                              {isWin ? '+' : ''}${(trade.pnl || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-2 px-2 text-center text-slate-400 text-[11px]">
                                          {trade.sl || trade.tp ? `${slText}/${tpText}` : '—'}
                                        </td>
                                        <td className="py-2 px-3 text-right text-slate-400 text-[11px] pr-4">
                                          {trade.entryTime ? new Date(trade.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
