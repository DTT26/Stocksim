import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Line
} from 'recharts';
import { PERFORMANCE_METRICS, EQUITY_CURVE_DATA } from './mockData';
import { BarChart3, TrendingUp, ShieldAlert, PieChart, Activity, DollarSign } from 'lucide-react';

export const PerformanceAnalytics: React.FC = () => {
  const [activeCurve, setActiveCurve] = useState<'EQUITY' | 'DRAWDOWN'>('EQUITY');

  return (
    <section id="analytics" className="w-full py-14 bg-[#060911] border-b border-[#1E293B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 mb-2">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>QUANTITATIVE RISK & PERFORMANCE SUITE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Institutional Performance Analytics
            </h2>
            <p className="mt-1 text-sm text-slate-400 max-w-2xl">
              Real-time portfolio mark-to-market calculations. Track Sharpe ratios, underwater equity drawdowns,
              expectancy, and win-loss distributions calculated strictly in USD across all simulated trade executions.
            </p>
          </div>

          {/* Toggle between Equity and Drawdown Curve */}
          <div className="flex items-center bg-[#0A101C] border border-[#212D42] rounded p-0.5 text-xs font-mono">
            <button
              onClick={() => setActiveCurve('EQUITY')}
              className={`px-3 py-1.5 rounded text-[11px] font-semibold transition-colors ${
                activeCurve === 'EQUITY'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CUMULATIVE EQUITY ($ USD)
            </button>
            <button
              onClick={() => setActiveCurve('DRAWDOWN')}
              className={`px-3 py-1.5 rounded text-[11px] font-semibold transition-colors ${
                activeCurve === 'DRAWDOWN'
                  ? 'bg-rose-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              UNDERWATER DRAWDOWN (%)
            </button>
          </div>
        </div>

        {/* 6 Key Performance Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {PERFORMANCE_METRICS.map(metric => (
            <div
              key={metric.label}
              className="p-3.5 rounded-lg border border-[#212D42] bg-[#0A0F1A] shadow-md font-mono flex flex-col justify-between"
            >
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">{metric.label}</div>
                <div className="text-base sm:text-lg font-bold text-white mt-1">{metric.value}</div>
              </div>
              <div className="mt-2 pt-2 border-t border-[#182338] flex items-center justify-between">
                <span className="text-[10px] text-blue-400 font-semibold">{metric.delta}</span>
                <span className="text-[9px] text-slate-400 truncate max-w-[100px]">{metric.description}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Chart Container */}
        <div className="rounded-lg border border-[#212D42] bg-[#0A0F1A] p-5 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between pb-4 mb-4 border-b border-[#1E293B] text-xs font-mono">
            <div className="flex items-center gap-4">
              <span className="font-bold text-white text-sm">
                {activeCurve === 'EQUITY' ? 'PORTFOLIO NAV: $118,450.00 USD' : 'PEAK DRAWDOWN: -3.20%'}
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                StockSim Managed Portfolio
              </span>
              {activeCurve === 'EQUITY' && (
                <span className="text-slate-500 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  S&P 500 Index Benchmark (+4.2%)
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-400">
              TIMEFRAME: <strong className="text-slate-200">90-DAY AUDIT PERIOD</strong>
            </div>
          </div>

          {/* Interactive Recharts Canvas */}
          <div className="h-72 w-full font-mono">
            <ResponsiveContainer width="100%" height="100%">
              {activeCurve === 'EQUITY' ? (
                <AreaChart data={EQUITY_CURVE_DATA} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#182338" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 11 }} />
                  <YAxis
                    domain={[98000, 122000]}
                    stroke="#64748B"
                    tick={{ fontSize: 11 }}
                    tickFormatter={val => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0A0F1A',
                      borderColor: '#24344E',
                      borderRadius: '6px',
                      color: '#F8FAFC',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()} USD`, '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="equity"
                    name="Simulated Portfolio"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#equityGrad)"
                  />
                  <Line
                    type="monotone"
                    dataKey="benchmark"
                    name="S&P 500 Benchmark"
                    stroke="#3B82F6"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </AreaChart>
              ) : (
                <AreaChart data={EQUITY_CURVE_DATA} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.0} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#182338" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 11 }} />
                  <YAxis
                    domain={[-4, 0]}
                    stroke="#64748B"
                    tick={{ fontSize: 11 }}
                    tickFormatter={val => `${val}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0A0F1A',
                      borderColor: '#24344E',
                      borderRadius: '6px',
                      color: '#F8FAFC',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}
                    formatter={(val: any) => [`${val}%`, 'Drawdown']}
                  />
                  <Area
                    type="monotone"
                    dataKey="drawdown"
                    name="Drawdown %"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#ddGrad)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Bottom Trade Distribution Footer */}
          <div className="mt-4 pt-3 border-t border-[#1E293B] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-slate-300">
            <div className="flex items-center justify-between p-2 rounded bg-[#070B14] border border-[#162235]">
              <span className="text-slate-400">LONG TRADE WIN RATE:</span>
              <span className="text-blue-400 font-bold">68.4% (39/57)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#070B14] border border-[#162235]">
              <span className="text-slate-400">SHORT TRADE WIN RATE:</span>
              <span className="text-blue-400 font-bold">54.1% (13/24)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#070B14] border border-[#162235]">
              <span className="text-slate-400">AVERAGE HOLD DURATION:</span>
              <span className="text-white font-bold">3h 42m</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
