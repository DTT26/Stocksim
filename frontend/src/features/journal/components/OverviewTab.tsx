import React from 'react';
import type { JournalSession } from '../types/journalTypes';
import { MetricCard } from './MetricCard';
import {
  formatMoneyVND,
  formatPercent,
  formatHoldingTime,
  calculateNetPnL,
  calculateWinRate,
  calculateGrossProfit,
  calculateGrossLoss,
  calculateAverageWin,
  calculateAverageLoss,
  calculateProfitFactor,
  calculatePayoffRatio,
  calculateExpectancy,
  calculateLargestWin,
  calculateLargestLoss,
  calculateEquityCurve,
  calculateDrawdownCurve,
  calculateSharpeRatio,
  groupTradesByDay
} from '../../../utils/tradingAnalytics';
import { DollarSign, Percent, BarChart3, ShieldAlert, Clock, Award } from 'lucide-react';

interface OverviewTabProps {
  session: JournalSession;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ session }) => {
  const trades = session.trades || [];
  const initialBalance = session.initialBalance || 100000000;
  const netPnL = trades.length > 0 ? calculateNetPnL(trades) : session.netPnL;
  const endingBalance = initialBalance + netPnL;
  const returnRate = initialBalance > 0 ? (netPnL / initialBalance) * 100 : 0;
  const winRate = trades.length > 0 ? calculateWinRate(trades) : session.winRate;

  // Breakdown calculations
  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl < 0);
  const grossProfit = calculateGrossProfit(trades);
  const grossLoss = calculateGrossLoss(trades);
  const avgWin = calculateAverageWin(trades);
  const avgLoss = calculateAverageLoss(trades);
  const profitFactor = calculateProfitFactor(trades);
  const payoffRatio = calculatePayoffRatio(trades);
  const expectancy = calculateExpectancy(trades);
  const largestWin = calculateLargestWin(trades);
  const largestLoss = calculateLargestLoss(trades);
  const avgPnLPerTrade = trades.length > 0 ? Math.round(netPnL / trades.length) : 0;

  // Drawdown
  const equityCurve = calculateEquityCurve(initialBalance, trades);
  const drawdownData = calculateDrawdownCurve(equityCurve);
  const maxDDPercent = drawdownData.maxDrawdownPercent;
  const maxDDAmount = drawdownData.maxDrawdownAmount;
  const sharpe = calculateSharpeRatio(trades);
  const recoveryFactor = maxDDAmount > 0 ? parseFloat((netPnL / maxDDAmount).toFixed(2)) : null;

  // Rhythm
  const dayGroups = groupTradesByDay(trades);
  const tradingDaysCount = dayGroups.length || (trades.length > 0 ? 1 : 0);
  const bestDay = dayGroups.find(d => d.isBest) || (dayGroups.length > 0 ? dayGroups[0] : null);
  const worstDay = dayGroups.find(d => d.isWorst) || (dayGroups.length > 1 ? dayGroups[dayGroups.length - 1] : null);

  const holdingTimes = trades
    .map(t => {
      if (t.holdingTimeMinutes !== undefined) return t.holdingTimeMinutes;
      if (t.entryTime && t.exitTime) {
        return Math.max(0, (new Date(t.exitTime).getTime() - new Date(t.entryTime).getTime()) / (1000 * 60));
      }
      return null;
    })
    .filter((m): m is number => m !== null);

  const avgHoldingMins = holdingTimes.length > 0
    ? Math.round(holdingTimes.reduce((a, b) => a + b, 0) / holdingTimes.length)
    : null;

  // Stop loss compliance check
  const tradesWithSL = trades.filter(t => t.sl !== undefined && t.sl > 0);
  const slUsagePercent = trades.length > 0 ? Math.round((tradesWithSL.length / trades.length) * 100) : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. SESSION INFORMATION */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-blue-500" />
          <span>Thông tin Phiên giao dịch</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <MetricCard
            label="Vốn Ban đầu"
            value={formatMoneyVND(initialBalance)}
            subValue="Số dư ban đầu"
          />
          <MetricCard
            label="Số dư Hiện tại"
            value={formatMoneyVND(endingBalance)}
            subValue="Tổng tài sản ròng"
          />
          <MetricCard
            label="Lợi nhuận Ròng"
            value={formatMoneyVND(netPnL, true)}
            trend={netPnL >= 0 ? 'up' : 'down'}
            subValue="Kết quả thực tế"
          />
          <MetricCard
            label="Tỷ suất Sinh lời"
            value={formatPercent(returnRate, true)}
            trend={returnRate >= 0 ? 'up' : 'down'}
            subValue="Tỷ suất trên vốn"
          />
          <MetricCard
            label="Tổng Lệnh"
            value={trades.length || session.tradesCount}
            subValue="Lệnh đã thực thi"
          />
          <MetricCard
            label="Tỷ lệ Thắng"
            value={formatPercent(winRate, false)}
            trend={winRate >= 50 ? 'up' : 'down'}
            subValue={`${winningTrades.length} thắng / ${trades.length} lệnh`}
          />
        </div>
      </div>

      {/* 2. PERFORMANCE RESULTS */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-5 sm:p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          <span>Kết quả Hiệu suất</span>
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161f31] border border-slate-200/60 dark:border-[#253047]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              Lợi nhuận Ròng
            </span>
            <div className={`text-xl sm:text-2xl font-bold mt-1 ${netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {formatMoneyVND(netPnL, true)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Tổng lãi/lỗ ròng thực tế</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161f31] border border-slate-200/60 dark:border-[#253047]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              Tổng kết Lệnh
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {trades.length} Lệnh
            </div>
            <p className="text-xs text-emerald-500 dark:text-emerald-400 font-semibold mt-1">
              {winningTrades.length} Thắng <span className="text-slate-400 font-normal">•</span> <span className="text-rose-500 dark:text-rose-400">{losingTrades.length} Thua</span>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161f31] border border-slate-200/60 dark:border-[#253047]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              Tỷ lệ Thắng
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {formatPercent(winRate, false)}
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, winRate))}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161f31] border border-slate-200/60 dark:border-[#253047]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              Lợi nhuận TB / Lệnh
            </span>
            <div className={`text-xl sm:text-2xl font-bold mt-1 ${avgPnLPerTrade >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {formatMoneyVND(avgPnLPerTrade, true)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Lợi nhuận kỳ vọng mỗi lệnh</p>
          </div>
        </div>
      </div>

      {/* 3. P&L BREAKDOWN & TRADING QUALITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P&L Breakdown */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-5 sm:p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
            <span>Chi tiết Lãi / Lỗ</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              Thực tế
            </span>
          </h2>

          <div className="space-y-3.5 text-sm">
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#1f283e]">
              <span className="text-slate-500 dark:text-slate-400">Tổng Lãi Gộp</span>
              <span className="font-bold text-emerald-500">{formatMoneyVND(grossProfit, true)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#1f283e]">
              <span className="text-slate-500 dark:text-slate-400">Tổng Lỗ Gộp</span>
              <span className="font-bold text-rose-500">{formatMoneyVND(-grossLoss, true)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#1f283e]">
              <span className="text-slate-500 dark:text-slate-400">Mức Thắng TB</span>
              <span className="font-bold text-emerald-500">{formatMoneyVND(avgWin, true)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#1f283e]">
              <span className="text-slate-500 dark:text-slate-400">Mức Lỗ TB</span>
              <span className="font-bold text-rose-500">{formatMoneyVND(-avgLoss, true)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#1f283e]">
              <span className="text-slate-500 dark:text-slate-400">Lệnh Lãi Lớn Nhất</span>
              <span className="font-bold text-emerald-500">{formatMoneyVND(largestWin, true)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#1f283e]">
              <span className="text-slate-500 dark:text-slate-400">Lệnh Lỗ Lớn Nhất</span>
              <span className="font-bold text-rose-500">{formatMoneyVND(largestLoss, true)}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-900 dark:text-white font-bold">Hệ số Lợi nhuận (Profit Factor)</span>
              <span className="font-extrabold text-blue-600 dark:text-blue-400 text-base">
                {profitFactor !== null && profitFactor !== Infinity ? `${profitFactor}x` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Trading Quality */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-5 sm:p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Chất lượng Giao dịch</span>
            </span>
            <span className="text-xs text-slate-400">Rê chuột [?] xem công thức</span>
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <MetricCard
              label="Hệ số Lợi nhuận (PF)"
              value={profitFactor !== null && profitFactor !== Infinity ? `${profitFactor}x` : 'N/A'}
              tooltip="Tổng lãi gộp chia cho tổng lỗ gộp. Giá trị trên 1.0 nghĩa là tài khoản sinh lời."
              trend={profitFactor && profitFactor > 1.2 ? 'up' : 'neutral'}
            />
            <MetricCard
              label="Tỷ lệ Lời / Lỗ (Payoff)"
              value={payoffRatio !== null ? `${payoffRatio}` : 'N/A'}
              tooltip="Mức thắng trung bình chia cho mức lỗ trung bình. Cho biết tỷ lệ giữa khoản lãi so với rủi ro mất đi khi thua."
              trend={payoffRatio && payoffRatio > 1.5 ? 'up' : 'neutral'}
            />
            <MetricCard
              label="Kỳ vọng Toán học"
              value={formatMoneyVND(expectancy, true)}
              tooltip="(Tỷ lệ thắng × Lãi TB) - (Tỷ lệ thua × Lỗ TB). Lợi nhuận trung bình kỳ vọng mang về trên mỗi lệnh giao dịch."
              trend={expectancy >= 0 ? 'up' : 'down'}
            />
            <MetricCard
              label="Hệ số Phục hồi"
              value={recoveryFactor !== null ? `${recoveryFactor}` : 'N/A'}
              tooltip="Lợi nhuận ròng chia cho Sụt giảm tối đa (Max Drawdown). Đánh giá tốc độ vượt qua đợt sụt giảm tài sản lớn nhất."
              trend={recoveryFactor && recoveryFactor > 2 ? 'up' : 'neutral'}
            />
          </div>
        </div>
      </div>

      {/* 4. RISK & TRADING RHYTHM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Metrics */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-5 sm:p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <span>Quản trị Rủi ro</span>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <MetricCard
              label="Sụt giảm Tối đa (Drawdown)"
              value={maxDDPercent > 0 ? `-${maxDDPercent}%` : '0.00%'}
              subValue={maxDDAmount > 0 ? formatMoneyVND(-maxDDAmount, false) : undefined}
              tooltip="Khoảng sụt giảm lớn nhất từ đỉnh tài sản trước đó đến đáy sâu nhất."
              trend={maxDDPercent > 10 ? 'down' : 'neutral'}
            />
            <MetricCard
              label="Chỉ số Sharpe"
              value={sharpe !== null ? sharpe : 'N/A'}
              tooltip={
                sharpe !== null
                  ? 'Đo lường tỷ suất sinh lời vượt trội so với mức biến động rủi ro. Chỉ số càng cao càng tốt.'
                  : 'Chưa đủ dữ liệu lệnh để tính chỉ số Sharpe (yêu cầu tối thiểu 5 lệnh).'
              }
              trend={sharpe && sharpe > 1.0 ? 'up' : 'neutral'}
            />
            <MetricCard
              label="Tỷ lệ Đặt Cắt lỗ (SL)"
              value={slUsagePercent !== null ? `${slUsagePercent}%` : 'N/A'}
              tooltip={
                slUsagePercent !== null
                  ? 'Tỷ lệ phần trăm các lệnh có thiết lập mức giá Cắt lỗ (Stop Loss) trước.'
                  : 'Chưa có dữ liệu Stop Loss được ghi nhận trong phiên này.'
              }
              trend={slUsagePercent && slUsagePercent >= 80 ? 'up' : 'neutral'}
            />
            <MetricCard
              label="Tỷ lệ Risk / Reward"
              value={payoffRatio ? `1 : ${payoffRatio}` : 'N/A'}
              tooltip="Tỷ lệ Lời/Lỗ thực tế dựa trên mức lãi và lỗ trung bình của các lệnh đã đóng."
            />
          </div>
        </div>

        {/* Trading Rhythm */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-5 sm:p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span>Nhịp độ Giao dịch</span>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <MetricCard
              label="Thời gian Giữ lệnh TB"
              value={formatHoldingTime(avgHoldingMins)}
              subValue="Thời lượng mở lệnh trung bình"
            />
            <MetricCard
              label="Số Ngày Giao dịch"
              value={`${tradingDaysCount} ngày`}
              subValue={`${(trades.length / Math.max(1, tradingDaysCount)).toFixed(1)} lệnh / ngày`}
            />
            <MetricCard
              label="Ngày Tốt Nhất"
              value={bestDay ? formatMoneyVND(bestDay.pnl, true) : 'N/A'}
              subValue={bestDay ? bestDay.date : 'Chưa có lệnh'}
              trend={bestDay && bestDay.pnl > 0 ? 'up' : 'neutral'}
            />
            <MetricCard
              label="Ngày Kém Nhất"
              value={worstDay ? formatMoneyVND(worstDay.pnl, true) : 'N/A'}
              subValue={worstDay ? worstDay.date : 'Chưa có lệnh'}
              trend={worstDay && worstDay.pnl < 0 ? 'down' : 'neutral'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
