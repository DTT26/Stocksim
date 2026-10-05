import React, { useState, useMemo } from 'react';
import type { JournalSession, JournalTrade } from '../types/journalTypes';
import { TradeDetailDrawer } from './TradeDetailDrawer';
import { formatMoneyVND, formatPercent } from '../../../utils/tradingAnalytics';
import { Search, RotateCcw, Eye, ListFilter, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

interface TradesTabProps {
  session: JournalSession;
}

export const TradesTab: React.FC<TradesTabProps> = ({ session }) => {
  const trades = session.trades || [];

  // Filter states
  const [search, setSearch] = useState('');
  const [sideFilter, setSideFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [resultFilter, setResultFilter] = useState<'ALL' | 'PROFIT' | 'LOSS'>('ALL');

  // Selected trade for Drawer
  const [selectedTrade, setSelectedTrade] = useState<JournalTrade | null>(null);

  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      // Symbol search
      if (search.trim()) {
        const query = search.trim().toUpperCase();
        if (!t.symbol.toUpperCase().includes(query)) return false;
      }

      // Side filter
      if (sideFilter !== 'ALL') {
        const isLong = t.side === 'LONG' || t.side === 'BUY';
        if (sideFilter === 'BUY' && !isLong) return false;
        if (sideFilter === 'SELL' && isLong) return false;
      }

      // Result filter
      if (resultFilter === 'PROFIT' && t.pnl <= 0) return false;
      if (resultFilter === 'LOSS' && t.pnl >= 0) return false;

      return true;
    });
  }, [trades, search, sideFilter, resultFilter]);

  const handleResetFilters = () => {
    setSearch('');
    setSideFilter('ALL');
    setResultFilter('ALL');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 min-w-0">
      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-2.5 sm:gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm mã (VD: BTC, ETH, SOL)..."
            className="w-full bg-slate-50 dark:bg-[#161f31] border border-slate-200 dark:border-[#253047] text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm rounded-xl pl-9 pr-3 py-2 sm:py-2.5 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Side & Result Filters Row */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Side Filter */}
          <div className="flex-1 sm:flex-none sm:min-w-[120px]">
            <select
              value={sideFilter}
              onChange={(e) => setSideFilter(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-[#161f31] border border-slate-200 dark:border-[#253047] text-slate-900 dark:text-white text-xs sm:text-sm font-medium rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả vị thế</option>
              <option value="BUY">Mua / Long</option>
              <option value="SELL">Bán / Short</option>
            </select>
          </div>

          {/* Result Filter */}
          <div className="flex-1 sm:flex-none sm:min-w-[120px]">
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-[#161f31] border border-slate-200 dark:border-[#253047] text-slate-900 dark:text-white text-xs sm:text-sm font-medium rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả kết quả</option>
              <option value="PROFIT">Có lãi</option>
              <option value="LOSS">Thua lỗ</option>
            </select>
          </div>

          {/* Reset */}
          {(search || sideFilter !== 'ALL' || resultFilter !== 'ALL') && (
            <button
              onClick={handleResetFilters}
              className="flex items-center justify-center gap-1 px-3 py-2 sm:py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Trades Container */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl overflow-hidden shadow-sm">
        {filteredTrades.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <ListFilter className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 mx-auto mb-2 sm:mb-3" />
            <h4 className="font-bold text-slate-800 dark:text-white text-sm sm:text-base">Không tìm thấy lệnh phù hợp</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc để xem các lệnh đã thực hiện.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Trades Cards View (< md) */}
            <div className="divide-y divide-slate-100 dark:divide-[#1f283e] md:hidden">
              {filteredTrades.map((trade, idx) => {
                const isLong = trade.side === 'LONG' || trade.side === 'BUY';
                const isProfit = trade.pnl > 0;
                const isLoss = trade.pnl < 0;

                const entryStr = trade.entryTime || trade.openTime
                  ? new Date((trade.entryTime || trade.openTime)!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '-';
                const exitStr = trade.exitTime || trade.closeTime
                  ? new Date((trade.exitTime || trade.closeTime)!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '-';

                return (
                  <div
                    key={trade.id || idx}
                    onClick={() => setSelectedTrade(trade)}
                    className="p-3.5 flex flex-col gap-2.5 hover:bg-slate-50/70 dark:hover:bg-[#161f31] transition-colors cursor-pointer active:bg-slate-100 dark:active:bg-[#172033]"
                  >
                    {/* Top Row: #, Symbol, Side, P&L */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400 font-bold">
                          #{idx + 1}
                        </span>
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs font-bold text-slate-900 dark:text-white">
                          {trade.symbol}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                            isLong
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isLong ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {trade.side}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                            trade.status === 'OPEN'
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {trade.status === 'OPEN' ? 'ĐANG MỞ' : 'ĐÃ ĐÓNG'}
                        </span>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-sm font-extrabold ${
                            isProfit
                              ? 'text-emerald-600 dark:text-[#089981]'
                              : isLoss
                              ? 'text-rose-600 dark:text-[#f23645]'
                              : 'text-slate-500'
                          }`}
                        >
                          {formatMoneyVND(trade.pnl, true)}
                        </span>
                        {trade.returnRate !== undefined && (
                          <span className={`block text-[10px] font-bold ${trade.returnRate >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {formatPercent(trade.returnRate, true)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Entry, Exit, Qty */}
                    <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-slate-50 dark:bg-[#161f31]/60 text-[11px] border border-slate-100 dark:border-[#253047]/60">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Giá vào</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatMoneyVND(trade.entryPrice)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Giá ra</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {trade.exitPrice ? formatMoneyVND(trade.exitPrice) : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Khối lượng</span>
                        <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                          {trade.quantity || trade.lot || '1'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Times and Details Link */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1 text-[10px]">
                        <Clock className="w-3 h-3" />
                        {entryStr} – {exitStr}
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold text-[11px] flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Chi tiết
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap min-w-[900px]">
                <thead className="bg-slate-50 dark:bg-[#172033] border-b border-slate-200 dark:border-[#253047] text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">Mã</th>
                    <th className="py-3 px-2 text-center">Vị thế</th>
                    <th className="py-3 px-3 text-right">Giá vào</th>
                    <th className="py-3 px-3 text-right">Giá ra</th>
                    <th className="py-3 px-2 text-center">K.Lượng</th>
                    <th className="py-3 px-3">Thời gian vào</th>
                    <th className="py-3 px-3">Thời gian ra</th>
                    <th className="py-3 px-3 text-right">Lãi/Lỗ</th>
                    <th className="py-3 px-2 text-right">Tỷ suất</th>
                    <th className="py-3 px-2 text-center">Trạng thái</th>
                    <th className="py-3 px-3 sm:px-4 text-right sticky right-0 z-10 bg-slate-50 dark:bg-[#172033] shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.3)]">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1f283e]">
                  {filteredTrades.map((trade, idx) => {
                    const isLong = trade.side === 'LONG' || trade.side === 'BUY';
                    const isProfit = trade.pnl > 0;
                    const isLoss = trade.pnl < 0;

                    const entryStr = trade.entryTime || trade.openTime
                      ? new Date((trade.entryTime || trade.openTime)!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '-';
                    const exitStr = trade.exitTime || trade.closeTime
                      ? new Date((trade.exitTime || trade.closeTime)!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '-';

                    return (
                      <tr
                        key={trade.id || idx}
                        onClick={() => setSelectedTrade(trade)}
                        className="hover:bg-slate-50/70 dark:hover:bg-[#161f31] transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 font-mono text-slate-400 text-xs">
                          {idx + 1}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">
                            {trade.symbol}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                              isLong
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {trade.side}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                          {formatMoneyVND(trade.entryPrice)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                          {trade.exitPrice ? formatMoneyVND(trade.exitPrice) : '-'}
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                          {trade.quantity || trade.lot || '1'}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                          {entryStr}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                          {exitStr}
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold">
                          <span
                            className={
                              isProfit
                                ? 'text-emerald-600 dark:text-[#089981]'
                                : isLoss
                                ? 'text-rose-600 dark:text-[#f23645]'
                                : 'text-slate-500'
                            }
                          >
                            {trade.status === 'OPEN' && (!trade.pnl || trade.pnl === 0) ? '$0.00' : formatMoneyVND(trade.pnl, true)}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right font-semibold text-xs">
                          {trade.returnRate !== undefined ? (
                            <span className={trade.returnRate > 0 ? 'text-emerald-500' : trade.returnRate < 0 ? 'text-rose-500' : 'text-slate-500'}>
                              {formatPercent(trade.returnRate, true)}
                            </span>
                          ) : '-'}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              trade.status === 'OPEN'
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {trade.status === 'OPEN' ? 'ĐANG MỞ' : 'ĐÃ ĐÓNG'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 sm:px-4 text-right sticky right-0 z-10 bg-white dark:bg-[#111827] group-hover:bg-slate-50 dark:group-hover:bg-[#161f31] shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.3)] transition-colors">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer shrink-0"
                          >
                            <Eye className="w-3.5 h-3.5 shrink-0" />
                            <span>Chi tiết</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Trade Detail Drawer */}
      <TradeDetailDrawer
        trade={selectedTrade}
        onClose={() => setSelectedTrade(null)}
      />
    </div>
  );
};
