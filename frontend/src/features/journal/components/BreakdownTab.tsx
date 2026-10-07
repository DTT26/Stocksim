import React from 'react';
import type { JournalSession } from '../types/journalTypes';
import {
  groupTradesBySymbol,
  groupTradesBySide,
  groupTradesByDay,
  groupTradesByHoldingTime,
  formatMoneyVND,
  formatPercent
} from '../../../utils/tradingAnalytics';
import { Layers, ArrowLeftRight, Calendar, Clock, Bookmark } from 'lucide-react';
import { useI18n } from '../../../contexts/I18nContext';

interface BreakdownTabProps {
  session: JournalSession;
}

export const BreakdownTab: React.FC<BreakdownTabProps> = ({ session }) => {
  const { lang } = useI18n();
  const trades = session.trades || [];

  const symbolData = groupTradesBySymbol(trades);
  const sideData = groupTradesBySide(trades);
  const dayData = groupTradesByDay(trades);
  const holdingTimeData = groupTradesByHoldingTime(trades);

  // Group by setupTag/strategy if any exist
  const strategiesMap = new Map<string, typeof trades>();
  trades.forEach(t => {
    if (t.setupTag) {
      if (!strategiesMap.has(t.setupTag)) strategiesMap.set(t.setupTag, []);
      strategiesMap.get(t.setupTag)!.push(t);
    }
  });

  const strategyData = Array.from(strategiesMap.entries()).map(([strategy, stratTrades]) => {
    const wins = stratTrades.filter(t => t.pnl > 0).length;
    const total = stratTrades.length;
    const totalPnL = stratTrades.reduce((sum, t) => sum + t.pnl, 0);
    return {
      strategy,
      trades: total,
      winRate: total > 0 ? parseFloat(((wins / total) * 100).toFixed(1)) : 0,
      avgPnL: total > 0 ? Math.round(totalPnL / total) : 0,
      totalPnL
    };
  }).sort((a, b) => b.totalPnL - a.totalPnL);

  // Long vs Short ratio
  const longSide = sideData.find(s => s.side === 'LONG') || sideData[0];
  const shortSide = sideData.find(s => s.side === 'SHORT') || sideData[1];
  const totalSidesCount = (longSide?.trades || 0) + (shortSide?.trades || 0);
  const longRatio = totalSidesCount > 0 ? Math.round(((longSide?.trades || 0) / totalSidesCount) * 100) : 50;
  const shortRatio = 100 - longRatio;

  if (!trades.length) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-12 text-center shadow-sm">
        <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {lang === 'vi' ? 'Chưa có dữ liệu phân tích chi tiết' : 'No Detailed Breakdown Data'}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          {lang === 'vi' 
            ? 'Bắt đầu giao dịch để phân tích các mã, thời gian nắm giữ và vị thế hoạt động hiệu quả nhất cho chiến lược của bạn.' 
            : 'Start trading to analyze symbols, holding durations, and sides that work best for your strategy.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300 min-w-0">
      {/* 1. SYMBOL & LONG/SHORT ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance by Symbol */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              <span>{lang === 'vi' ? 'Hiệu suất theo Mã Cổ phiếu/Crypto' : 'Performance by Symbol'}</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">{lang === 'vi' ? 'Sắp xếp theo Tổng Lãi/Lỗ' : 'Sorted by Total P&L'}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-[#253047] pb-2">
                <tr>
                  <th className="py-2.5 px-3">{lang === 'vi' ? 'Mã' : 'Symbol'}</th>
                  <th className="py-2.5 px-3 text-center">{lang === 'vi' ? 'Số lệnh' : 'Trades'}</th>
                  <th className="py-2.5 px-3 text-center">{lang === 'vi' ? 'Tỷ lệ Thắng' : 'Win Rate'}</th>
                  <th className="py-2.5 px-3 text-right">{lang === 'vi' ? 'Lãi/Lỗ TB' : 'Avg P&L'}</th>
                  <th className="py-2.5 px-3 text-right">{lang === 'vi' ? 'Tổng Lãi/Lỗ' : 'Total P&L'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f283e]">
                {symbolData.map((item) => (
                  <tr key={item.symbol} className="hover:bg-slate-50/50 dark:hover:bg-[#161f31]/50">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">
                        {item.symbol}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400 font-medium">
                      {item.trades}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        item.winRate >= 50
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        {formatPercent(item.winRate, false)}
                      </span>
                    </td>
                    <td className={`py-3 px-3 text-right font-medium text-xs ${
                      item.avgPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {formatMoneyVND(item.avgPnL, true)}
                    </td>
                    <td className={`py-3 px-3 text-right font-bold ${
                      item.totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {formatMoneyVND(item.totalPnL, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Long vs Short */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-indigo-500" />
              <span>{lang === 'vi' ? 'Vị thế Mua (Long) vs Bán (Short)' : 'Long vs Short Positions'}</span>
            </h3>
            <span className="text-xs text-slate-400">{lang === 'vi' ? 'Xu hướng vị thế' : 'Position bias'}</span>
          </div>

          {/* Ratio Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-emerald-600 dark:text-emerald-400">{lang === 'vi' ? 'MUA / LONG' : 'BUY / LONG'} ({longRatio}%)</span>
              <span className="text-rose-600 dark:text-rose-400">{lang === 'vi' ? 'BÁN / SHORT' : 'SELL / SHORT'} ({shortRatio}%)</span>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full flex overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${longRatio}%` }}
              />
              <div
                className="bg-rose-500 h-full transition-all duration-500"
                style={{ width: `${shortRatio}%` }}
              />
            </div>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-[#253047]">
                <tr>
                  <th className="py-2.5 px-3">{lang === 'vi' ? 'Chỉ số' : 'Metric'}</th>
                  <th className="py-2.5 px-3 text-right text-emerald-500 font-bold">{lang === 'vi' ? 'Mua (Long)' : 'Buy (Long)'}</th>
                  <th className="py-2.5 px-3 text-right text-rose-500 font-bold">{lang === 'vi' ? 'Bán (Short)' : 'Sell (Short)'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f283e] text-xs">
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-500 dark:text-slate-400">{lang === 'vi' ? 'Số lệnh' : 'Trades'}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-slate-900 dark:text-white">{longSide?.trades || 0}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-slate-900 dark:text-white">{shortSide?.trades || 0}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-500 dark:text-slate-400">{lang === 'vi' ? 'Tỷ lệ Thắng' : 'Win Rate'}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-500">{formatPercent(longSide?.winRate || 0, false)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-rose-500">{formatPercent(shortSide?.winRate || 0, false)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-500 dark:text-slate-400">{lang === 'vi' ? 'Tổng Lãi/Lỗ' : 'Total P&L'}</td>
                  <td className={`py-2.5 px-3 text-right font-bold ${(longSide?.totalPnL || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {formatMoneyVND(longSide?.totalPnL || 0, true)}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-bold ${(shortSide?.totalPnL || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {formatMoneyVND(shortSide?.totalPnL || 0, true)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-500 dark:text-slate-400">{lang === 'vi' ? 'Mức Thắng TB' : 'Avg Win'}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-emerald-500">{formatMoneyVND(longSide?.avgWin || 0, true)}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-emerald-500">{formatMoneyVND(shortSide?.avgWin || 0, true)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-500 dark:text-slate-400">{lang === 'vi' ? 'Mức Lỗ TB' : 'Avg Loss'}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-rose-500">{formatMoneyVND(-(longSide?.avgLoss || 0), true)}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-rose-500">{formatMoneyVND(-(shortSide?.avgLoss || 0), true)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. PERFORMANCE BY DAY & HOLDING TIME ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance by Trading Day */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>{lang === 'vi' ? 'Hiệu suất theo Ngày Giao dịch' : 'Performance by Trading Day'}</span>
            </h3>
            <span className="text-xs text-slate-400">{lang === 'vi' ? 'Kết quả từng ngày' : 'Daily results'}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-[#253047] pb-2">
                <tr>
                  <th className="py-2.5 px-3">{lang === 'vi' ? 'Ngày' : 'Date'}</th>
                  <th className="py-2.5 px-3 text-center">{lang === 'vi' ? 'Số lệnh' : 'Trades'}</th>
                  <th className="py-2.5 px-3 text-center">{lang === 'vi' ? 'Tỷ lệ Thắng' : 'Win Rate'}</th>
                  <th className="py-2.5 px-3 text-right">{lang === 'vi' ? 'Lãi/Lỗ' : 'P&L'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f283e]">
                {dayData.map((item) => (
                  <tr key={item.date} className="hover:bg-slate-50/50 dark:hover:bg-[#161f31]/50">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{item.date}</span>
                      {item.isBest && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          {lang === 'vi' ? 'NGÀY TỐT NHẤT' : 'BEST DAY'}
                        </span>
                      )}
                      {item.isWorst && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                          {lang === 'vi' ? 'NGÀY KÉM NHẤT' : 'WORST DAY'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400">
                      {item.trades}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        item.winRate >= 50
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        {formatPercent(item.winRate, false)}
                      </span>
                    </td>
                    <td className={`py-3 px-3 text-right font-bold ${
                      item.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {formatMoneyVND(item.pnl, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance by Holding Time */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>{lang === 'vi' ? 'Hiệu suất theo Thời gian Nắm giữ' : 'Performance by Holding Duration'}</span>
            </h3>
            <span className="text-xs text-slate-400">{lang === 'vi' ? 'Phân tích thời lượng giữ lệnh' : 'Holding time analysis'}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-[#253047] pb-2">
                <tr>
                  <th className="py-2.5 px-3">{lang === 'vi' ? 'Thời gian giữ' : 'Holding Time'}</th>
                  <th className="py-2.5 px-3 text-center">{lang === 'vi' ? 'Số lệnh' : 'Trades'}</th>
                  <th className="py-2.5 px-3 text-center">{lang === 'vi' ? 'Tỷ lệ Thắng' : 'Win Rate'}</th>
                  <th className="py-2.5 px-3 text-right">{lang === 'vi' ? 'Lãi/Lỗ TB' : 'Avg P&L'}</th>
                  <th className="py-2.5 px-3 text-right">{lang === 'vi' ? 'Tổng Lãi/Lỗ' : 'Total P&L'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f283e]">
                {holdingTimeData.map((item) => (
                  <tr key={item.range} className="hover:bg-slate-50/50 dark:hover:bg-[#161f31]/50">
                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {item.label || item.range}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400">
                      {item.trades}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        item.winRate >= 50
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        {item.trades > 0 ? formatPercent(item.winRate, false) : '-'}
                      </span>
                    </td>
                    <td className={`py-3 px-3 text-right font-medium text-xs ${
                      item.avgPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {item.trades > 0 ? formatMoneyVND(item.avgPnL, true) : '-'}
                    </td>
                    <td className={`py-3 px-3 text-right font-bold ${
                      item.totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {item.trades > 0 ? formatMoneyVND(item.totalPnL, true) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. PERFORMANCE BY STRATEGY (If data exists) */}
      {strategyData.length > 0 && (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-purple-500" />
              <span>{lang === 'vi' ? 'Hiệu suất theo Chiến lược / Setup' : 'Performance by Strategy / Setup'}</span>
            </h3>
            <span className="text-xs text-slate-400">{lang === 'vi' ? 'Phân loại theo chiến lược' : 'Categorized by setup tag'}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-[#253047] pb-2">
                <tr>
                  <th className="py-2.5 px-3">{lang === 'vi' ? 'Chiến lược' : 'Strategy'}</th>
                  <th className="py-2.5 px-3 text-center">{lang === 'vi' ? 'Số lệnh' : 'Trades'}</th>
                  <th className="py-2.5 px-3 text-center">{lang === 'vi' ? 'Tỷ lệ Thắng' : 'Win Rate'}</th>
                  <th className="py-2.5 px-3 text-right">{lang === 'vi' ? 'Lãi/Lỗ TB' : 'Avg P&L'}</th>
                  <th className="py-2.5 px-3 text-right">{lang === 'vi' ? 'Tổng Lãi/Lỗ' : 'Total P&L'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f283e]">
                {strategyData.map((item) => (
                  <tr key={item.strategy} className="hover:bg-slate-50/50 dark:hover:bg-[#161f31]/50">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-semibold">
                        {item.strategy}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400">
                      {item.trades}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        item.winRate >= 50
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        {formatPercent(item.winRate, false)}
                      </span>
                    </td>
                    <td className={`py-3 px-3 text-right font-medium text-xs ${
                      item.avgPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {formatMoneyVND(item.avgPnL, true)}
                    </td>
                    <td className={`py-3 px-3 text-right font-bold ${
                      item.totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {formatMoneyVND(item.totalPnL, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
