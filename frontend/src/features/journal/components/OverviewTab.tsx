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
import { useI18n } from '../../../contexts/I18nContext';

interface OverviewTabProps {
  session: JournalSession;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ session }) => {
  const { lang } = useI18n();
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
          <span>{lang === 'vi' ? 'Thông tin Phiên giao dịch' : 'Session Information'}</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <MetricCard
            label={lang === 'vi' ? 'Vốn Ban đầu' : 'Initial Capital'}
            value={formatMoneyVND(initialBalance)}
            subValue={lang === 'vi' ? 'Số dư ban đầu' : 'Starting balance'}
          />
          <MetricCard
            label={lang === 'vi' ? 'Số dư Hiện tại' : 'Current Balance'}
            value={formatMoneyVND(endingBalance)}
            subValue={lang === 'vi' ? 'Tổng tài sản ròng' : 'Total net equity'}
          />
          <MetricCard
            label={lang === 'vi' ? 'Lợi nhuận Ròng' : 'Net P&L'}
            value={formatMoneyVND(netPnL, true)}
            trend={netPnL >= 0 ? 'up' : 'down'}
            subValue={lang === 'vi' ? 'Kết quả thực tế' : 'Realized result'}
          />
          <MetricCard
            label={lang === 'vi' ? 'Tỷ suất Sinh lời' : 'Return Rate'}
            value={formatPercent(returnRate, true)}
            trend={returnRate >= 0 ? 'up' : 'down'}
            subValue={lang === 'vi' ? 'Tỷ suất trên vốn' : 'Return on capital'}
          />
          <MetricCard
            label={lang === 'vi' ? 'Tổng Lệnh' : 'Total Trades'}
            value={trades.length || session.tradesCount}
            subValue={lang === 'vi' ? 'Lệnh đã thực thi' : 'Executed trades'}
          />
          <MetricCard
            label={lang === 'vi' ? 'Tỷ lệ Thắng' : 'Win Rate'}
            value={formatPercent(winRate, false)}
            trend={winRate >= 50 ? 'up' : 'down'}
            subValue={`${winningTrades.length} ${lang === 'vi' ? 'thắng' : 'won'} / ${trades.length} ${lang === 'vi' ? 'lệnh' : 'trades'}`}
          />
        </div>
      </div>

      {/* 2. PERFORMANCE RESULTS */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-5 sm:p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          <span>{lang === 'vi' ? 'Kết quả Hiệu suất' : 'Performance Results'}</span>
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161f31] border border-slate-200/60 dark:border-[#253047]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              {lang === 'vi' ? 'Lợi nhuận Ròng' : 'Net P&L'}
            </span>
            <div className={`text-xl sm:text-2xl font-bold mt-1 ${netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {formatMoneyVND(netPnL, true)}
            </div>
            <p className="text-xs text-slate-400 mt-1">{lang === 'vi' ? 'Tổng lãi/lỗ ròng thực tế' : 'Total net realized P&L'}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161f31] border border-slate-200/60 dark:border-[#253047]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              {lang === 'vi' ? 'Tổng kết Lệnh' : 'Trade Summary'}
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {trades.length} {lang === 'vi' ? 'Lệnh' : 'Trades'}
            </div>
            <p className="text-xs text-emerald-500 dark:text-emerald-400 font-semibold mt-1">
              {winningTrades.length} {lang === 'vi' ? 'Thắng' : 'Won'} <span className="text-slate-400 font-normal">•</span> <span className="text-rose-500 dark:text-rose-400">{losingTrades.length} {lang === 'vi' ? 'Thua' : 'Lost'}</span>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161f31] border border-slate-200/60 dark:border-[#253047]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              {lang === 'vi' ? 'Tỷ lệ Thắng' : 'Win Rate'}
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
              {lang === 'vi' ? 'Lợi nhuận TB / Lệnh' : 'Avg P&L / Trade'}
            </span>
            <div className={`text-xl sm:text-2xl font-bold mt-1 ${avgPnLPerTrade >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {formatMoneyVND(avgPnLPerTrade, true)}
            </div>
            <p className="text-xs text-slate-400 mt-1">{lang === 'vi' ? 'Lợi nhuận kỳ vọng mỗi lệnh' : 'Expected return per trade'}</p>
          </div>
        </div>
      </div>

      {/* 3. P&L BREAKDOWN & TRADING QUALITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P&L Breakdown */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-5 sm:p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
            <span>{lang === 'vi' ? 'Chi tiết Lãi / Lỗ' : 'P&L Breakdown'}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              {lang === 'vi' ? 'Thực tế' : 'Actual'}
            </span>
          </h2>

          <div className="space-y-3.5 text-sm">
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#1f283e]">
              <span className="text-slate-500 dark:text-slate-400">{lang === 'vi' ? 'Tổng Lãi Gộp' : 'Gross Profit'}</span>
              <span className="font-bold text-emerald-500">{formatMoneyVND(grossProfit, true)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#1f283e]">
              <span className="text-slate-500 dark:text-slate-400">{lang === 'vi' ? 'Tổng Lỗ Gộp' : 'Gross Loss'}</span>
              <span className="font-bold text-rose-500">{formatMoneyVND(-grossLoss, true)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#1f283e]">
              <span className="text-slate-500 dark:text-slate-400">{lang === 'vi' ? 'Mức Thắng TB' : 'Average Win'}</span>
              <span className="font-bold text-emerald-500">{formatMoneyVND(avgWin, true)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#1f283e]">
              <span className="text-slate-500 dark:text-slate-400">{lang === 'vi' ? 'Mức Lỗ TB' : 'Average Loss'}</span>
              <span className="font-bold text-rose-500">{formatMoneyVND(-avgLoss, true)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#1f283e]">
              <span className="text-slate-500 dark:text-slate-400">{lang === 'vi' ? 'Lệnh Lãi Lớn Nhất' : 'Largest Win'}</span>
              <span className="font-bold text-emerald-500">{formatMoneyVND(largestWin, true)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#1f283e]">
              <span className="text-slate-500 dark:text-slate-400">{lang === 'vi' ? 'Lệnh Lỗ Lớn Nhất' : 'Largest Loss'}</span>
              <span className="font-bold text-rose-500">{formatMoneyVND(largestLoss, true)}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-900 dark:text-white font-bold">{lang === 'vi' ? 'Hệ số Lợi nhuận (Profit Factor)' : 'Profit Factor'}</span>
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
              <span>{lang === 'vi' ? 'Chất lượng Giao dịch' : 'Trading Quality'}</span>
            </span>
            <span className="text-xs text-slate-400">{lang === 'vi' ? 'Rê chuột [?] xem công thức' : 'Hover [?] for formula'}</span>
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <MetricCard
              label={lang === 'vi' ? 'Hệ số Lợi nhuận (PF)' : 'Profit Factor (PF)'}
              value={profitFactor !== null && profitFactor !== Infinity ? `${profitFactor}x` : 'N/A'}
              tooltip={lang === 'vi' ? 'Tổng lãi gộp chia cho tổng lỗ gộp. Giá trị trên 1.0 nghĩa là tài khoản sinh lời.' : 'Gross profit divided by gross loss. Values above 1.0 indicate profitability.'}
              trend={profitFactor && profitFactor > 1.2 ? 'up' : 'neutral'}
            />
            <MetricCard
              label={lang === 'vi' ? 'Tỷ lệ Lời / Lỗ (Payoff)' : 'Payoff Ratio'}
              value={payoffRatio !== null ? `${payoffRatio}` : 'N/A'}
              tooltip={lang === 'vi' ? 'Mức thắng trung bình chia cho mức lỗ trung bình. Cho biết tỷ lệ giữa khoản lãi so với rủi ro mất đi khi thua.' : 'Average win divided by average loss. Indicates reward relative to risk per trade.'}
              trend={payoffRatio && payoffRatio > 1.5 ? 'up' : 'neutral'}
            />
            <MetricCard
              label={lang === 'vi' ? 'Kỳ vọng Toán học' : 'Expectancy'}
              value={formatMoneyVND(expectancy, true)}
              tooltip={lang === 'vi' ? '(Tỷ lệ thắng × Lãi TB) - (Tỷ lệ thua × Lỗ TB). Lợi nhuận trung bình kỳ vọng mang về trên mỗi lệnh giao dịch.' : '(Win Rate × Avg Win) - (Loss Rate × Avg Loss). Expected net return per trade.'}
              trend={expectancy >= 0 ? 'up' : 'down'}
            />
            <MetricCard
              label={lang === 'vi' ? 'Hệ số Phục hồi' : 'Recovery Factor'}
              value={recoveryFactor !== null ? `${recoveryFactor}` : 'N/A'}
              tooltip={lang === 'vi' ? 'Lợi nhuận ròng chia cho Sụt giảm tối đa (Max Drawdown). Đánh giá tốc độ vượt qua đợt sụt giảm tài sản lớn nhất.' : 'Net profit divided by maximum drawdown. Evaluates how quickly the account recovers from peak drawdowns.'}
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
            <span>{lang === 'vi' ? 'Quản trị Rủi ro' : 'Risk Management'}</span>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <MetricCard
              label={lang === 'vi' ? 'Sụt giảm Tối đa (Drawdown)' : 'Max Drawdown'}
              value={maxDDPercent > 0 ? `-${maxDDPercent}%` : '0.00%'}
              subValue={maxDDAmount > 0 ? formatMoneyVND(-maxDDAmount, false) : undefined}
              tooltip={lang === 'vi' ? 'Khoảng sụt giảm lớn nhất từ đỉnh tài sản trước đó đến đáy sâu nhất.' : 'Largest decline from prior peak equity to trough.'}
              trend={maxDDPercent > 10 ? 'down' : 'neutral'}
            />
            <MetricCard
              label={lang === 'vi' ? 'Chỉ số Sharpe' : 'Sharpe Ratio'}
              value={sharpe !== null ? sharpe : 'N/A'}
              tooltip={
                sharpe !== null
                  ? (lang === 'vi' ? 'Đo lường tỷ suất sinh lời vượt trội so với mức biến động rủi ro. Chỉ số càng cao càng tốt.' : 'Measures risk-adjusted excess return. Higher is better.')
                  : (lang === 'vi' ? 'Chưa đủ dữ liệu lệnh để tính chỉ số Sharpe (yêu cầu tối thiểu 5 lệnh).' : 'Not enough trade data to compute Sharpe ratio (min 5 trades).')
              }
              trend={sharpe && sharpe > 1.0 ? 'up' : 'neutral'}
            />
            <MetricCard
              label={lang === 'vi' ? 'Tỷ lệ Đặt Cắt lỗ (SL)' : 'Stop Loss Usage'}
              value={slUsagePercent !== null ? `${slUsagePercent}%` : 'N/A'}
              tooltip={
                slUsagePercent !== null
                  ? (lang === 'vi' ? 'Tỷ lệ phần trăm các lệnh có thiết lập mức giá Cắt lỗ (Stop Loss) trước.' : 'Percentage of trades opened with a defined Stop Loss.')
                  : (lang === 'vi' ? 'Chưa có dữ liệu Stop Loss được ghi nhận trong phiên này.' : 'No stop loss data recorded for this session.')
              }
              trend={slUsagePercent && slUsagePercent >= 80 ? 'up' : 'neutral'}
            />
            <MetricCard
              label={lang === 'vi' ? 'Tỷ lệ Risk / Reward' : 'Risk / Reward Ratio'}
              value={payoffRatio ? `1 : ${payoffRatio}` : 'N/A'}
              tooltip={lang === 'vi' ? 'Tỷ lệ Lời/Lỗ thực tế dựa trên mức lãi và lỗ trung bình của các lệnh đã đóng.' : 'Realized risk/reward ratio based on average win vs average loss.'}
            />
          </div>
        </div>

        {/* Trading Rhythm */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-5 sm:p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span>{lang === 'vi' ? 'Nhịp độ Giao dịch' : 'Trading Rhythm'}</span>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <MetricCard
              label={lang === 'vi' ? 'Thời gian Giữ lệnh TB' : 'Avg Holding Time'}
              value={formatHoldingTime(avgHoldingMins)}
              subValue={lang === 'vi' ? 'Thời lượng mở lệnh trung bình' : 'Average position duration'}
            />
            <MetricCard
              label={lang === 'vi' ? 'Số Ngày Giao dịch' : 'Trading Days'}
              value={`${tradingDaysCount} ${lang === 'vi' ? 'ngày' : 'days'}`}
              subValue={`${(trades.length / Math.max(1, tradingDaysCount)).toFixed(1)} ${lang === 'vi' ? 'lệnh / ngày' : 'trades / day'}`}
            />
            <MetricCard
              label={lang === 'vi' ? 'Ngày Tốt Nhất' : 'Best Day'}
              value={bestDay ? formatMoneyVND(bestDay.pnl, true) : 'N/A'}
              subValue={bestDay ? bestDay.date : (lang === 'vi' ? 'Chưa có lệnh' : 'No trades')}
              trend={bestDay && bestDay.pnl > 0 ? 'up' : 'neutral'}
            />
            <MetricCard
              label={lang === 'vi' ? 'Ngày Kém Nhất' : 'Worst Day'}
              value={worstDay ? formatMoneyVND(worstDay.pnl, true) : 'N/A'}
              subValue={worstDay ? worstDay.date : (lang === 'vi' ? 'Chưa có lệnh' : 'No trades')}
              trend={worstDay && worstDay.pnl < 0 ? 'down' : 'neutral'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
