import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, ArrowUpRight, ArrowDownRight, Layers, BarChart3, Clock, DollarSign } from 'lucide-react';
import { FEATURED_STOCKS, type FeaturedStockData } from './mockData';
import { useI18n } from '../../../contexts/I18nContext';

export const CinematicLiveMarket: React.FC = () => {
  const { lang, t } = useI18n();
  const [selectedStock, setSelectedStock] = useState<FeaturedStockData>(FEATURED_STOCKS[0]);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Compute SVG coordinates for the large featured chart
  const chartPoints = selectedStock.chartData;
  const minPrice = Math.min(...chartPoints.map(p => p.price));
  const maxPrice = Math.max(...chartPoints.map(p => p.price));
  const priceRange = Math.max(maxPrice - minPrice, 0.01);

  const svgWidth = 800;
  const svgHeight = 280;
  const paddingX = 40;
  const paddingTop = 20;
  const paddingBottom = 40;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const points = chartPoints.map((pt, idx) => {
    const x = paddingX + (idx / (chartPoints.length - 1)) * plotWidth;
    const y = paddingTop + plotHeight - ((pt.price - minPrice) / priceRange) * plotHeight;
    return { x, y, ...pt };
  });

  const linePath = points.reduce((acc, curr, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`, '');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingBottom} L ${points[0].x} ${svgHeight - paddingBottom} Z`;

  const isUp = selectedStock.changePercent >= 0;
  const strokeColor = isUp ? '#10B981' : '#F43F5E';
  const fillColor = isUp ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)';

  const activePoint = hoveredPointIndex !== null ? points[hoveredPointIndex] : points[points.length - 1];

  return (
    <section className="relative w-full py-20 bg-[#080C14] border-b border-[#1E293B] text-slate-100">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-[#182338]">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 mb-2">
              <Activity className="w-3.5 h-3.5" />
              <span>RADAR DỮ LIỆU ĐA TÀI SẢN TRỰC TIẾP</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-sans">
              TỔNG QUAN THỊ TRƯỜNG TRỰC TIẾP
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-sans mt-1">
              Chọn hoặc rê chuột vào bất kỳ cổ phiếu hàng đầu nào để phân tích sổ lệnh, biên độ trong ngày và hành động giá.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#0D1525] border border-blue-500/20 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>DỮ LIỆU THỊ TRƯỜNG: ĐÃ KẾT NỐI</span>
            </div>
            <div className="text-slate-500 hidden sm:block">
              ĐỘ TRỄ: 12ms
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* MAIN VISUALIZATION GRID: Large Chart (65%) + Watchlist (35%)   */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: FEATURED STOCK HIGH-DEFINITION VIEWPORT */}
          <div className="lg:col-span-8 bg-[#0A0F1A] border border-[#1E293B] rounded-lg p-6 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedStock.symbol}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Header with Asset Badge, Price & Delta */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#162235]">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-white font-mono tracking-tight">
                        {selectedStock.symbol}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#131D30] text-slate-300 border border-[#21304A]">
                        {selectedStock.name}
                      </span>
                      <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest px-2 py-0.5 rounded bg-blue-950/40 border border-blue-800/40">
                        NASDAQ • {lang === 'vi' ? 'CỔ PHIẾU MỸ' : 'US STOCKS'}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-4 mt-3">
                      <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono tracking-tight">
                        ${selectedStock.price.toFixed(2)}
                      </span>
                      <div
                        className={`flex items-center gap-1 font-mono text-base font-bold px-2.5 py-1 rounded ${
                          isUp
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        <span>{isUp ? '+' : ''}{selectedStock.change.toFixed(2)} ({isUp ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry quick glance */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-right font-mono text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">{t('home.volume24h', 'KHỐI LƯỢNG 24H')}</div>
                      <div className="font-semibold text-slate-200">{selectedStock.volume}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">{t('home.marketCap', 'VỐN HÓA TT')}</div>
                      <div className="font-semibold text-slate-200">{selectedStock.marketCap}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">{t('home.peRatio', 'CHỈ SỐ P/E')}</div>
                      <div className="font-semibold text-slate-200">{selectedStock.peRatio}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">{t('home.dayHigh', 'ĐỈNH TRONG NGÀY')}</div>
                      <div className="font-semibold text-slate-200">${maxPrice.toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                {/* Interactive Chart Canvas */}
                <div className="relative w-full overflow-hidden bg-[#070B14] rounded border border-[#162030] p-2">
                  {/* Hovered readout pill */}
                  {hoveredPointIndex !== null && (
                    <div className="absolute top-4 left-6 z-20 font-mono text-xs bg-[#0F172A]/90 border border-blue-500/40 rounded px-3 py-1.5 flex items-center gap-4 text-slate-200 shadow-lg">
                      <div>
                        <span className="text-slate-400 text-[10px]">{t('home.time', 'GIỜ:')} </span>
                        <span className="font-bold text-white">{activePoint.time}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">{lang === 'vi' ? 'GIÁ:' : 'PRICE:'} </span>
                        <span className={`font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ${activePoint.price.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">{lang === 'vi' ? 'KL:' : 'VOL:'} </span>
                        <span className="text-blue-400 font-bold">{activePoint.volume}K</span>
                      </div>
                    </div>
                  )}

                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-auto cursor-crosshair"
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  >
                    {/* Background Grid */}
                    <line x1={paddingX} y1={paddingTop} x2={svgWidth - paddingX} y2={paddingTop} stroke="#1A2538" strokeDasharray="3 3" />
                    <line x1={paddingX} y1={paddingTop + plotHeight / 2} x2={svgWidth - paddingX} y2={paddingTop + plotHeight / 2} stroke="#1A2538" strokeDasharray="3 3" />
                    <line x1={paddingX} y1={svgHeight - paddingBottom} x2={svgWidth - paddingX} y2={svgHeight - paddingBottom} stroke="#1A2538" />

                    {/* Gradient Definition */}
                    <defs>
                      <linearGradient id={`grad-${selectedStock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Shaded Area */}
                    <motion.path
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                      d={areaPath}
                      fill={`url(#grad-${selectedStock.symbol})`}
                    />

                    {/* Price Line */}
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      d={linePath}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Interactive points & hover hotspots */}
                    {points.map((pt, idx) => (
                      <g key={idx}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={hoveredPointIndex === idx ? 4.5 : 2}
                          fill={hoveredPointIndex === idx ? '#FFFFFF' : strokeColor}
                          stroke="#080C14"
                          strokeWidth="1.5"
                        />
                        {/* Hover bar detector */}
                        <rect
                          x={pt.x - plotWidth / (points.length * 2)}
                          y={0}
                          width={plotWidth / points.length}
                          height={svgHeight}
                          fill="transparent"
                          onMouseEnter={() => setHoveredPointIndex(idx)}
                        />
                      </g>
                    ))}

                    {/* X-axis labels */}
                    {points.filter((_, i) => i % 3 === 0 || i === points.length - 1).map((pt, i) => (
                      <text
                        key={i}
                        x={pt.x}
                        y={svgHeight - 15}
                        fill="#64748B"
                        fontSize="10"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {pt.time}
                      </text>
                    ))}
                  </svg>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT: COMPACT INTERACTIVE STOCK WATCHLIST ROWS */}
          <div className="lg:col-span-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-2 pb-1">
              <span>{t('home.topStocks', 'DANH MỤC CỔ PHIẾU HÀNG ĐẦU')}</span>
              <span className="text-[10px] text-blue-400">{t('home.hoverDetail', 'RÊ CHUỘT ĐỂ XEM CHI TIẾT')}</span>
            </div>

            <div className="space-y-2">
              {FEATURED_STOCKS.map(st => {
                const isSelected = selectedStock.symbol === st.symbol;
                const isItemUp = st.changePercent >= 0;

                // Simple mini sparkline path
                const min = Math.min(...st.chartData.map(c => c.price));
                const max = Math.max(...st.chartData.map(c => c.price));
                const range = Math.max(max - min, 0.01);
                const sparkPoints = st.chartData
                  .map((c, i) => {
                    const x = (i / (st.chartData.length - 1)) * 60;
                    const y = 20 - ((c.price - min) / range) * 16;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ');

                return (
                  <motion.div
                    key={st.symbol}
                    onMouseEnter={() => setSelectedStock(st)}
                    onClick={() => setSelectedStock(st)}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.15 }}
                    className={`cursor-pointer rounded-lg p-3.5 border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#111A2E] border-blue-500 shadow-md shadow-blue-950/40'
                        : 'bg-[#0A0F1A] border-[#1A2538] hover:border-slate-600 hover:bg-[#0D1424]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-1.5 h-7 rounded-full ${
                          isSelected ? 'bg-blue-500' : 'bg-slate-700'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">
                            {st.symbol}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate max-w-[90px]">
                            {st.name}
                          </span>
                        </div>
                        <div className="font-mono text-xs text-slate-200 mt-0.5">
                          ${st.price.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Mini Sparkline + Change % */}
                    <div className="flex items-center gap-3">
                      <svg width="60" height="24" className="overflow-visible hidden sm:block">
                        <path
                          d={sparkPoints}
                          fill="none"
                          stroke={isItemUp ? '#10B981' : '#F43F5E'}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>

                      <div
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded text-right min-w-[62px] ${
                          isItemUp
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-rose-400 bg-rose-500/10'
                        }`}
                      >
                        {isItemUp ? '+' : ''}{st.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
