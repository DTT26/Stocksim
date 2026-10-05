import React, { useState } from 'react';
import type { JournalSession } from '../types/journalTypes';
import {
  calculateEquityCurve,
  calculateDrawdownCurve,
  calculatePnLDistribution,
  calculateRiskDistribution,
  calculateTradingHeatmap,
  formatMoneyVND,
  formatPercent
} from '../../../utils/tradingAnalytics';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import { LineChart as LineChartIcon, Activity, Flame, TrendingUp, AlertCircle } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

interface AnalysisTabProps {
  session: JournalSession;
}

export const AnalysisTab: React.FC<AnalysisTabProps> = ({ session }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const trades = session.trades || [];
  const initialBalance = session.initialBalance || 100000000;

  // Visual toggle states
  const [heatmapMetric, setHeatmapMetric] = useState<'pnl' | 'trades'>('pnl');

  // Curve data
  const equityPoints = calculateEquityCurve(initialBalance, trades);
  const drawdownData = calculateDrawdownCurve(equityPoints);
  const pnlDistribution = calculatePnLDistribution(trades);
  const heatmapData = calculateTradingHeatmap(trades);

  // Risk data & distribution
  const riskAnalysis = calculateRiskDistribution(trades, initialBalance);

  // Rolling trend data
  let runningWins = 0;
  const trendData = trades.map((t, idx) => {
    if (t.pnl > 0) runningWins++;
    const rollingWinRate = parseFloat(((runningWins / (idx + 1)) * 100).toFixed(1));
    return {
      tradeIndex: idx + 1,
      tradeLabel: `T#${idx + 1}`,
      rollingWinRate,
      pnl: t.pnl
    };
  });

  const gridStroke = isDark ? '#253047' : '#e2e8f0';
  const textFill = isDark ? '#94a3b8' : '#64748b';

  if (!trades.length) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-12 text-center shadow-sm">
        <Activity className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Chưa đủ dữ liệu giao dịch</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Hãy thực hiện thêm các lệnh trong phiên mô phỏng này để mở khóa các biểu đồ hiệu suất và quản trị rủi ro.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300 min-w-0">
      {/* ROW 1: EQUITY CURVE & DRAWDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equity Curve */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <LineChartIcon className="w-4 h-4 text-blue-500" />
                <span>Đường cong Vốn (Equity Curve)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mức tăng trưởng tài sản khởi đầu từ số vốn ban đầu
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-semibold block">Tài sản Cuối kỳ</span>
              <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                {formatMoneyVND(equityPoints[equityPoints.length - 1]?.equity)}
              </span>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityPoints} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="tradeNumber"
                  stroke={textFill}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => (val === 0 ? 'Bắt đầu' : `T#${val}`)}
                />
                <YAxis
                  stroke={textFill}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 dark:bg-[#1c2230] border border-slate-700 dark:border-[#32394d] text-xs p-3 rounded-lg shadow-xl text-white">
                          <div className="font-bold text-slate-300">Lệnh #{data.tradeNumber} • {data.time}</div>
                          <div className="mt-1 flex items-center justify-between gap-4">
                            <span className="text-slate-400">Tài sản:</span>
                            <span className="font-bold text-blue-400">{formatMoneyVND(data.equity)}</span>
                          </div>
                          {data.tradeNumber > 0 && (
                            <div className="flex items-center justify-between gap-4 mt-0.5">
                              <span className="text-slate-400">Lãi/Lỗ:</span>
                              <span className={`font-bold ${data.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {formatMoneyVND(data.pnl, true)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#equityGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Drawdown Curve */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-500" />
                <span>Biểu đồ Sụt giảm Vốn (Drawdown)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mức sụt giảm (%) tính từ đỉnh cao nhất
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-semibold block">Sụt giảm Tối đa</span>
              <span className="text-sm font-extrabold text-rose-500">
                -{drawdownData.maxDrawdownPercent}%
              </span>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={drawdownData.points} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="tradeNumber"
                  stroke={textFill}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => (val === 0 ? 'Start' : `T#${val}`)}
                />
                <YAxis
                  stroke={textFill}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}%`}
                  domain={[-Math.max(10, Math.ceil(drawdownData.maxDrawdownPercent * 1.2)), 0]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 dark:bg-[#1c2230] border border-slate-700 dark:border-[#32394d] text-xs p-3 rounded-lg shadow-xl text-white">
                          <div className="font-bold text-slate-300">Trade #{data.tradeNumber}</div>
                          <div className="mt-1 flex items-center justify-between gap-4">
                            <span className="text-slate-400">Drawdown:</span>
                            <span className="font-bold text-rose-400">{data.drawdownPercent}%</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 mt-0.5">
                            <span className="text-slate-400">Equity:</span>
                            <span className="font-bold text-slate-200">{formatMoneyVND(data.equity)}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="drawdownPercent"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#ddGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 2: P&L DISTRIBUTION & RISK DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P&L Distribution */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Phân bổ Lợi nhuận</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Số lượng lệnh phân theo biên độ lãi/lỗ
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Biểu đồ tần suất
            </span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pnlDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="label" stroke={textFill} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={textFill} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 dark:bg-[#1c2230] border border-slate-700 dark:border-[#32394d] text-xs p-3 rounded-lg shadow-xl text-white">
                          <div className="font-bold text-slate-300">{data.label}</div>
                          <div className="mt-1 flex items-center justify-between gap-4">
                            <span className="text-slate-400">Số lệnh:</span>
                            <span className="font-bold text-white">{data.count}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 mt-0.5">
                            <span className="text-slate-400">Tổng Lãi/Lỗ:</span>
                            <span className="font-bold">{formatMoneyVND(data.pnlSum, true)}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {pnlDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Phân bổ Rủi ro</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {riskAnalysis.hasPlannedSL
                    ? 'Số vốn rủi ro tính theo khoảng cách Stop Loss từng lệnh'
                    : 'Số vốn rủi ro thực tế theo mức sụt vốn (% tài sản)'}
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Phân tích Rủi ro
              </span>
            </div>

            {/* Risk Histogram Chart */}
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskAnalysis.buckets} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="label" stroke={textFill} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke={textFill} fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 dark:bg-[#1c2230] border border-slate-700 dark:border-[#32394d] text-xs p-3 rounded-lg shadow-xl text-white">
                            <div className="font-bold text-slate-300">Mức rủi ro: {data.label}</div>
                            <div className="mt-1 flex items-center justify-between gap-4">
                              <span className="text-slate-400">Số lệnh:</span>
                              <span className="font-bold text-white">{data.count}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 mt-0.5">
                              <span className="text-slate-400">Vốn rủi ro ước tính:</span>
                              <span className="font-bold text-amber-400">{formatMoneyVND(data.pnlRiskSum)}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {riskAnalysis.buckets.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Metrics Cards */}
            <div className="grid grid-cols-2 gap-2.5 mt-3 text-center">
              <div className="p-2.5 bg-slate-50 dark:bg-[#161f31] rounded-lg border border-slate-200/60 dark:border-[#253047]/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Lệnh có đặt SL
                </span>
                <span className={`text-base font-bold ${
                  riskAnalysis.tradesWithSLPercent >= 50
                    ? 'text-emerald-500'
                    : riskAnalysis.tradesWithSLPercent > 0
                    ? 'text-amber-500'
                    : 'text-rose-500 dark:text-rose-400'
                }`}>
                  {riskAnalysis.tradesWithSLCount} / {trades.length} ({riskAnalysis.tradesWithSLPercent}%)
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-[#161f31] rounded-lg border border-slate-200/60 dark:border-[#253047]/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Kỷ luật Quản trị
                </span>
                <span className={`text-base font-bold ${
                  riskAnalysis.disciplineRating === 'Excellent'
                    ? 'text-emerald-500'
                    : riskAnalysis.disciplineRating === 'Good'
                    ? 'text-blue-500'
                    : riskAnalysis.disciplineRating === 'Moderate'
                    ? 'text-amber-500'
                    : 'text-amber-500'
                }`}>
                  {riskAnalysis.disciplineRating === 'Excellent' && 'Xuất sắc'}
                  {riskAnalysis.disciplineRating === 'Good' && 'Tốt'}
                  {riskAnalysis.disciplineRating === 'Moderate' && 'Trung bình'}
                  {riskAnalysis.disciplineRating === 'Unprotected' && 'Chưa đặt SL'}
                </span>
              </div>
            </div>

            {/* Risk Stats Summary Row */}
            <div className="mt-2.5 p-2.5 bg-slate-50/50 dark:bg-[#161f31]/50 rounded-lg text-xs space-y-1.5 border border-slate-100 dark:border-[#253047]/50">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Rủi ro Trung bình:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  ~{formatMoneyVND(riskAnalysis.avgRiskAmount)} ({riskAnalysis.avgRiskPercent}%)
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Rủi ro lớn nhất 1 lệnh:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  ~{formatMoneyVND(riskAnalysis.maxRiskAmount)} ({riskAnalysis.maxRiskPercent}%)
                </span>
              </div>
            </div>

            {/* Notice if no SL attached */}
            {!riskAnalysis.hasPlannedSL && (
              <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span>
                  Các lệnh chưa đặt Stop Loss. Phân bổ rủi ro đang tính theo mức sụt vốn thực tế (Realized Risk).
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ROW 3: TRADING HEATMAP & PERFORMANCE TREND */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trading Heatmap */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Bản đồ Nhiệt Hoạt động</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mật độ giao dịch theo ngày trong tuần và khung giờ
              </p>
            </div>

            {/* Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setHeatmapMetric('pnl')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  heatmapMetric === 'pnl'
                    ? 'bg-white dark:bg-[#20283e] text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                P&L
              </button>
              <button
                type="button"
                onClick={() => setHeatmapMetric('trades')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  heatmapMetric === 'trades'
                    ? 'bg-white dark:bg-[#20283e] text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Số lệnh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[320px]">
              {/* Heatmap Column Headers */}
              <div className="grid grid-cols-7 gap-1 text-[11px] font-semibold text-slate-400 mb-1 text-center">
                <div className="text-left pl-1">Thứ</div>
                <div>09h</div>
                <div>10h</div>
                <div>11h</div>
                <div>13h</div>
                <div>14h</div>
                <div>15h</div>
              </div>

              {/* Rows: Mon - Fri */}
              {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'].map((dayName) => (
                <div key={dayName} className="grid grid-cols-7 gap-1.5 my-1.5 items-center text-xs">
                  <div className="font-semibold text-slate-600 dark:text-slate-400 pl-1 text-[11px]">
                    {dayName}
                  </div>
                  {[9, 10, 11, 13, 14, 15].map((hour) => {
                    const cell = heatmapData.find(c => c.day === dayName && c.hour === hour);
                    const val = cell ? (heatmapMetric === 'pnl' ? cell.pnl : cell.trades) : 0;

                    let bgClass = 'bg-slate-100 dark:bg-[#1a2233] text-slate-400 dark:text-slate-500';
                    if (heatmapMetric === 'pnl') {
                      if (val > 2000000) bgClass = 'bg-emerald-600 text-white font-bold';
                      else if (val > 0) bgClass = 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold';
                      else if (val < -2000000) bgClass = 'bg-rose-600 text-white font-bold';
                      else if (val < 0) bgClass = 'bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold';
                    } else {
                      if (val >= 4) bgClass = 'bg-blue-600 text-white font-bold';
                      else if (val >= 2) bgClass = 'bg-blue-500/40 text-blue-800 dark:text-blue-200 font-semibold';
                      else if (val === 1) bgClass = 'bg-blue-500/15 text-blue-600 dark:text-blue-400';
                    }

                    return (
                      <div
                        key={hour}
                        title={`${dayName} @ ${hour}:00 — P&L: ${formatMoneyVND(cell?.pnl || 0, true)} (${cell?.trades || 0} lệnh)`}
                        className={`h-8 rounded flex items-center justify-center text-[10px] cursor-pointer transition-transform hover:scale-105 ${bgClass}`}
                      >
                        {val !== 0 ? (heatmapMetric === 'pnl' ? (val > 0 ? '+W' : '-L') : val) : '-'}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Trend */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Xu hướng Hiệu suất</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tỷ lệ thắng biến thiên qua các lệnh liên tiếp
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              Độ ổn định
            </span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="tradeLabel" stroke={textFill} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke={textFill}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 dark:bg-[#1c2230] border border-slate-700 dark:border-[#32394d] text-xs p-3 rounded-lg shadow-xl text-white">
                          <div className="font-bold text-slate-300">Lệnh #{data.tradeIndex}</div>
                          <div className="mt-1 flex items-center justify-between gap-4">
                            <span className="text-slate-400">Tỷ lệ thắng tích lũy:</span>
                            <span className="font-bold text-emerald-400">{data.rollingWinRate}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rollingWinRate"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10b981' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
