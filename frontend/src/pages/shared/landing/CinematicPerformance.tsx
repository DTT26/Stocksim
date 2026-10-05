import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { LineChart, TrendingUp, TrendingDown, ArrowUpRight, Crosshair, BarChart2, ShieldAlert, Award } from 'lucide-react';
import { useI18n } from '../../../contexts/I18nContext';

interface EquityDataPoint {
  date: string;
  equity: number;
  dailyPnl: number;
  returnPercent: number;
}

const PERFORMANCE_POINTS: EquityDataPoint[] = [
  { date: 'Jul 01', equity: 100000, dailyPnl: 0, returnPercent: 0.0 },
  { date: 'Jul 08', equity: 101850, dailyPnl: 380, returnPercent: 1.85 },
  { date: 'Jul 15', equity: 103200, dailyPnl: 520, returnPercent: 3.20 },
  { date: 'Jul 22', equity: 102400, dailyPnl: -230, returnPercent: 2.40 },
  { date: 'Jul 29', equity: 104500, dailyPnl: 650, returnPercent: 4.50 },
  { date: 'Aug 05', equity: 106800, dailyPnl: 710, returnPercent: 6.80 },
  { date: 'Aug 12', equity: 105100, dailyPnl: -420, returnPercent: 5.10 },
  { date: 'Aug 19', equity: 107900, dailyPnl: 890, returnPercent: 7.90 },
  { date: 'Aug 26', equity: 109200, dailyPnl: 450, returnPercent: 9.20 },
  { date: 'Sep 02', equity: 108400, dailyPnl: -280, returnPercent: 8.40 },
  { date: 'Sep 09', equity: 110500, dailyPnl: 620, returnPercent: 10.50 },
  { date: 'Sep 16', equity: 111900, dailyPnl: 540, returnPercent: 11.90 },
  { date: 'Sep 23', equity: 110900, dailyPnl: -310, returnPercent: 10.90 },
  { date: 'Oct 01', equity: 107578, dailyPnl: 430, returnPercent: 7.58 },
  { date: 'Oct 04', equity: 108420, dailyPnl: 842, returnPercent: 8.42 },
  { date: 'Oct 12', equity: 112840, dailyPnl: 960, returnPercent: 12.84 },
];

export const CinematicPerformance: React.FC = () => {
  const { lang } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });
  const [hoverIndex, setHoverIndex] = useState<number | null>(14); // Default to Oct 04 as requested

  // Canvas dimensions
  const svgWidth = 900;
  const svgHeight = 280;
  const padX = 50;
  const padTop = 30;
  const padBottom = 40;
  const chartW = svgWidth - padX * 2;
  const chartH = svgHeight - padTop - padBottom;

  const minEq = Math.min(...PERFORMANCE_POINTS.map(p => p.equity));
  const maxEq = Math.max(...PERFORMANCE_POINTS.map(p => p.equity));
  const eqRange = Math.max(maxEq - minEq, 1);

  const coords = PERFORMANCE_POINTS.map((pt, i) => {
    const x = padX + (i / (PERFORMANCE_POINTS.length - 1)) * chartW;
    const y = padTop + chartH - ((pt.equity - minEq) / eqRange) * chartH;
    return { x, y, ...pt };
  });

  const pathD = coords.reduce((acc, curr, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`, '');
  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${svgHeight - padBottom} L ${coords[0].x} ${svgHeight - padBottom} Z`;

  const activeCoord = hoverIndex !== null ? coords[hoverIndex] : coords[coords.length - 1];

  return (
    <section
      ref={containerRef}
      className="relative w-full py-24 bg-[#080C14] border-b border-[#1E293B] text-slate-100 overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0D1525] border border-blue-500/30 text-blue-400 font-mono text-xs uppercase tracking-widest mb-3">
              <LineChart className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? 'PHÂN TÍCH HIỆU SUẤT TÍCH LŨY' : 'CUMULATIVE PERFORMANCE ANALYTICS'}</span>
            </div>

            <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase font-sans">
              {lang === 'vi' ? (
                <>
                  MỖI GIAO DỊCH <br />
                  <span className="text-blue-500">MANG MỘT CÂU CHUYỆN.</span>
                </>
              ) : (
                <>
                  EVERY EXECUTED TRADE <br />
                  <span className="text-blue-500">TELLS A STORY.</span>
                </>
              )}
            </h2>

            <p className="mt-3 text-sm text-slate-400 font-sans max-w-xl">
              {lang === 'vi'
                ? 'Từ từng bước giá khớp lệnh đơn lẻ đến lợi thế quản trị rủi ro dài hạn. Quan sát các điểm lệnh hội tụ thành đường cong vốn (Equity Curve) được kiểm toán minh bạch.'
                : 'From single tick executions to long-term mathematical edge. Observe your trade points coalesce into a transparently audited equity curve.'}
            </p>
          </div>

          {/* Primary Top KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
            <div className="p-3.5 rounded-lg bg-[#0C1220] border border-[#182338]">
              <div className="text-[10px] text-slate-500 uppercase">{lang === 'vi' ? 'Giá Trị Danh Mục' : 'Portfolio Value'}</div>
              <div className="text-2xl font-bold text-white mt-0.5">$112,840</div>
              <div className="text-[10px] text-blue-400 mt-0.5">{lang === 'vi' ? 'Giá trị ròng kiểm toán' : 'Audited Net Worth'}</div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#0C1220] border border-[#182338]">
              <div className="text-[10px] text-slate-500 uppercase">{lang === 'vi' ? 'Tỷ Suất Sinh Lời' : 'Net Return'}</div>
              <div className="text-2xl font-bold text-emerald-400 mt-0.5">+12.84%</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{lang === 'vi' ? 'Vượt thị trường: +8.1%' : 'Alpha vs Market: +8.1%'}</div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#0C1220] border border-[#182338]">
              <div className="text-[10px] text-slate-500 uppercase">{lang === 'vi' ? 'Tỷ Lệ Thắng' : 'Win Rate'}</div>
              <div className="text-2xl font-bold text-white mt-0.5">61.4%</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{lang === 'vi' ? '29 Thắng / 19 Thua' : '29 Wins / 19 Losses'}</div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#0C1220] border border-[#182338]">
              <div className="text-[10px] text-slate-500 uppercase">{lang === 'vi' ? 'Số Lệnh' : 'Total Trades'}</div>
              <div className="text-2xl font-bold text-white mt-0.5">48</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{lang === 'vi' ? 'Tổng lượt khớp lệnh' : 'Total executions'}</div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* INTERACTIVE EQUITY CURVE CANVAS                               */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-[#0A0F1A] border border-[#1E293B] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs pb-3 border-b border-[#162235]">
            <div className="flex items-center gap-4">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-blue-500" />
                {lang === 'vi' ? 'ĐƯỜNG CONG VỐN ĐÃ ĐƯỢC XÁC THỰC' : 'VERIFIED EQUITY CURVE'}
              </span>
              <span className="text-slate-500 hidden sm:inline">|</span>
              <span className="text-slate-400 hidden sm:inline">
                {lang === 'vi' ? 'THAM CHIẾU: S&P 500 (+4.2%)' : 'BENCHMARK: S&P 500 (+4.2%)'}
              </span>
            </div>

            <div className="text-slate-400 flex items-center gap-2">
              <Crosshair className="w-3.5 h-3.5 text-blue-400" />
              <span>{lang === 'vi' ? 'RÊ CHUỘT ĐỂ XEM CHI TIẾT ĐIỂM KIỂM TOÁN' : 'HOVER TO INSPECT AUDIT TICKS'}</span>
            </div>
          </div>

          {/* SVG Chart with Crosshair & Interactive Tooltip */}
          <div className="relative w-full overflow-hidden bg-[#070B14] rounded-lg border border-[#152030] p-2">
            {/* Interactive Tooltip Card */}
            {hoverIndex !== null && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 right-6 z-20 font-mono text-xs bg-[#0F172A]/95 border border-blue-500/50 rounded-lg p-3 text-slate-200 shadow-xl backdrop-blur-sm"
              >
                <div className="text-[11px] text-slate-400 border-b border-[#21304A] pb-1 mb-1.5 flex items-center justify-between gap-4">
                  <span>{lang === 'vi' ? 'ĐIỂM KIỂM TOÁN' : 'AUDIT POINT'}</span>
                  <span className="font-bold text-white">{activeCoord.date}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-left">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">{lang === 'vi' ? 'Danh Mục' : 'Equity'}</div>
                    <div className="font-bold text-white text-sm">${activeCoord.equity.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">{lang === 'vi' ? 'Lãi/Lỗ Ngày' : 'Daily PnL'}</div>
                    <div className={`font-bold text-sm ${activeCoord.dailyPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {activeCoord.dailyPnl >= 0 ? '+' : ''}${activeCoord.dailyPnl}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">{lang === 'vi' ? 'Tỷ Suất' : 'Return'}</div>
                    <div className="font-bold text-emerald-400 text-sm">+{activeCoord.returnPercent.toFixed(2)}%</div>
                  </div>
                </div>
              </motion.div>
            )}

            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto cursor-crosshair"
              onMouseLeave={() => setHoverIndex(14)}
            >
              {/* Background Reference Lines */}
              <line x1={padX} y1={padTop} x2={svgWidth - padX} y2={padTop} stroke="#172233" strokeDasharray="3 3" />
              <line x1={padX} y1={padTop + chartH / 2} x2={svgWidth - padX} y2={padTop + chartH / 2} stroke="#172233" strokeDasharray="3 3" />
              <line x1={padX} y1={svgHeight - padBottom} x2={svgWidth - padX} y2={svgHeight - padBottom} stroke="#172233" />

              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Shaded Area */}
              <motion.path
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.8 }}
                d={areaD}
                fill="url(#equityGrad)"
              />

              {/* Equity Line Drawing Left-to-Right */}
              <motion.path
                initial={{ pathLength: 0 }}
                animate={isInView ? { pathLength: 1 } : {}}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                d={pathD}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Crosshair when hovering */}
              {hoverIndex !== null && (
                <g>
                  {/* Vertical dashed crosshair */}
                  <line
                    x1={activeCoord.x}
                    y1={padTop}
                    x2={activeCoord.x}
                    y2={svgHeight - padBottom}
                    stroke="#60A5FA"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  {/* Horizontal dashed crosshair */}
                  <line
                    x1={padX}
                    y1={activeCoord.y}
                    x2={svgWidth - padX}
                    y2={activeCoord.y}
                    stroke="#60A5FA"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  {/* Active highlight circle */}
                  <circle
                    cx={activeCoord.x}
                    cy={activeCoord.y}
                    r={6}
                    fill="#3B82F6"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                </g>
              )}

              {/* Individual trade dots that visually merge into curve */}
              {coords.map((pt, i) => (
                <g key={i}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoverIndex === i ? 5 : 2.5}
                    fill={hoverIndex === i ? '#FFFFFF' : '#3B82F6'}
                  />
                  {/* Hover detector strip */}
                  <rect
                    x={pt.x - chartW / (coords.length * 2)}
                    y={0}
                    width={chartW / coords.length}
                    height={svgHeight}
                    fill="transparent"
                    onMouseEnter={() => setHoverIndex(i)}
                  />
                </g>
              ))}

              {/* Date labels */}
              {coords.filter((_, i) => i % 3 === 0 || i === coords.length - 1).map((pt, i) => (
                <text
                  key={i}
                  x={pt.x}
                  y={svgHeight - 15}
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {pt.date}
                </text>
              ))}
            </svg>
          </div>

          {/* Progressively Revealed Secondary Risk & Edge KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="p-4 rounded-lg bg-[#0C1220] border border-[#182338]"
            >
              <div className="text-[11px] font-mono text-slate-400 uppercase">
                {lang === 'vi' ? 'Lãi Trung Bình' : 'Average Win'}
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">+$482</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {lang === 'vi' ? 'Tỷ lệ kỷ luật: 2.08x' : 'Payoff ratio: 2.08x'}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="p-4 rounded-lg bg-[#0C1220] border border-[#182338]"
            >
              <div className="text-[11px] font-mono text-slate-400 uppercase">
                {lang === 'vi' ? 'Lỗ Trung Bình' : 'Average Loss'}
              </div>
              <div className="text-xl font-bold font-mono text-rose-400 mt-1">-$231</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {lang === 'vi' ? 'Cắt lỗ nghiêm ngặt khi sai điểm' : 'Strict SL upon invalidation'}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="p-4 rounded-lg bg-[#0C1220] border border-[#182338]"
            >
              <div className="text-[11px] font-mono text-slate-400 uppercase">
                {lang === 'vi' ? 'Hệ Số Lợi Nhuận' : 'Profit Factor'}
              </div>
              <div className="text-xl font-bold font-mono text-white mt-1">1.82</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                {lang === 'vi' ? 'Tổng Lãi / Tổng Lỗ' : 'Gross Profit / Gross Loss'}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="p-4 rounded-lg bg-[#0C1220] border border-[#182338]"
            >
              <div className="text-[11px] font-mono text-slate-400 uppercase">
                {lang === 'vi' ? 'Mức Sụt Giảm Tối Đa' : 'Max Drawdown'}
              </div>
              <div className="text-xl font-bold font-mono text-rose-400 mt-1">-4.7%</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {lang === 'vi' ? 'Trong hạn mức rủi ro 5.0%' : 'Within 5.0% risk limit'}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
