import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Terminal,
  Activity,
  ArrowUpRight,
  TrendingUp,
  SlidersHorizontal,
  Layers,
  Cpu,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { HERO_CHART_DATA, generateOrderBook, INITIAL_TRADES_TAPE } from './mockData';

export const HeroTerminal: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<'BTCUSDT' | 'NVDA' | 'XAUUSD' | 'EURUSD'>('BTCUSDT');
  const [timeframe, setTimeframe] = useState<'15m' | '1H' | '4H' | '1D'>('15m');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET' | 'STOP'>('LIMIT');
  const [leverage, setLeverage] = useState<number>(50);
  const [orderSize, setOrderSize] = useState<string>('1.5');
  const [simulatedPnl, setSimulatedPnl] = useState<number>(1725.00);
  const [orderFeedback, setOrderFeedback] = useState<string | null>(null);

  // Symbol info mapping
  const symbolConfigs = {
    BTCUSDT: {
      name: 'Bitcoin Perpetual Futures',
      price: 83090.00,
      changePercent: -1.66,
      high24h: 85210.00,
      low24h: 82740.00,
      volume24h: '$42.50B USD',
      funding: '+0.0100% / 03:11:42',
      leverageMax: 125,
      unit: 'BTC',
      step: 10,
    },
    NVDA: {
      name: 'NVIDIA Corporation (US Equity)',
      price: 224.08,
      changePercent: 2.38,
      high24h: 226.40,
      low24h: 219.80,
      volume24h: '$15.20B USD',
      funding: 'CASH SPOT / NYSE',
      leverageMax: 20,
      unit: 'SHARES',
      step: 0.1,
    },
    XAUUSD: {
      name: 'Gold Spot / USD',
      price: 4143.40,
      changePercent: 0.27,
      high24h: 4160.00,
      low24h: 4128.50,
      volume24h: '$35.00B USD',
      funding: 'SWAP: -$1.20 / DAY',
      leverageMax: 200,
      unit: 'OZ',
      step: 0.5,
    },
    EURUSD: {
      name: 'Euro / US Dollar Spot',
      price: 1.1378,
      changePercent: 0.11,
      high24h: 1.1395,
      low24h: 1.1350,
      volume24h: '$85.00B USD',
      funding: 'SWAP: +0.15 PIPS',
      leverageMax: 500,
      unit: 'LOTS',
      step: 0.0001,
    },
  };

  const currentSym = symbolConfigs[selectedSymbol];

  // Dynamic orderbook & tape
  const [orderBook, setOrderBook] = useState(() => generateOrderBook(currentSym.price));
  const [tradesTape, setTradesTape] = useState(INITIAL_TRADES_TAPE);

  useEffect(() => {
    setOrderBook(generateOrderBook(currentSym.price));
  }, [selectedSymbol, currentSym.price]);

  // Subtle real-time book fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setOrderBook(generateOrderBook(currentSym.price));
      setSimulatedPnl(prev => +(prev + (Math.random() * 20 - 9.8)).toFixed(2));
    }, 2500);
    return () => clearInterval(interval);
  }, [currentSym.price]);

  const handleSimulateOrder = (side: 'BUY' | 'SELL') => {
    setOrderFeedback(`Simulated ${side} order placed at $${currentSym.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD (${leverage}x Leverage)`);
    const newTapeItem = {
      id: 't-' + Date.now(),
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      price: currentSym.price,
      size: parseFloat(orderSize) || 1.0,
      side: side as 'BUY' | 'SELL',
    };
    setTradesTape(prev => [newTapeItem, ...prev.slice(0, 6)]);
    setTimeout(() => setOrderFeedback(null), 3500);
  };

  return (
    <section className="relative w-full pt-8 pb-14 bg-[#080C14] border-b border-[#1E293B]">
      {/* Structural subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#161F30_1px,transparent_1px),linear-gradient(to_bottom,#161F30_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        {/* Terminal Header Narrative */}
        <div className="max-w-4xl mb-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#0F1728] border border-[#23324D] text-slate-300 text-xs font-mono mb-4">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">ENGINE PROTOCOL:</span>
            <span className="text-blue-400 font-semibold">SUB-SECOND DETERMINISTIC L2 EXECUTION</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight font-sans">
            Institutional-Grade Simulated Trading & Execution Verification
          </h1>

          <p className="mt-3 text-base sm:text-lg text-slate-400 leading-relaxed max-w-3xl">
            StockSim delivers real-world order books, deterministic trade matching, and cryptographic evidence audit
            trails. Built specifically for universities, finance faculties, and disciplined traders mastering risk in realistic market conditions.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/trade/btcusdt"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-sm font-semibold tracking-wide transition-all shadow-md shadow-blue-950"
            >
              <Terminal className="w-4 h-4" />
              <span>LAUNCH SIMULATOR TERMINAL</span>
              <ArrowUpRight className="w-4 h-4 ml-0.5" />
            </Link>

            <a
              href="#simulations"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-[#10192A] hover:bg-[#16233B] text-slate-200 border border-[#24334E] font-mono text-sm font-medium transition-colors"
            >
              <Layers className="w-4 h-4 text-slate-400" />
              <span>EXPLORE ACTIVE SIMULATIONS</span>
            </a>

            <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-slate-500 pl-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Zero Financial Risk</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>100% US Dollar Balances</span>
              </span>
            </div>
          </div>
        </div>

        {/* FEEDBACK TOAST */}
        {orderFeedback && (
          <div className="mb-3 px-3 py-2 rounded bg-blue-950/80 border border-blue-500/50 text-blue-300 text-xs font-mono flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <span>{orderFeedback}</span>
            </div>
            <span className="text-[10px] text-blue-400">SIMULATED EXECUTION COMPLETE</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* REALISTIC STOCKSIM TRADING TERMINAL SHOWCASE CONTAINER        */}
        {/* ============================================================== */}
        <div className="rounded-lg border border-[#212D42] bg-[#0A0F1A] shadow-2xl overflow-hidden font-mono">
          {/* Top Terminal Strip: Instrument Switcher & Live Stats */}
          <div className="bg-[#0D1524] border-b border-[#212D42] px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Symbol Switchers */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider mr-1">TICKER:</span>
              {(['BTCUSDT', 'NVDA', 'XAUUSD', 'EURUSD'] as const).map(sym => (
                <button
                  key={sym}
                  onClick={() => setSelectedSymbol(sym)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold tracking-wide transition-colors ${
                    selectedSymbol === sym
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                      : 'bg-[#080C14] text-slate-400 hover:text-slate-200 border border-[#1E293B]'
                  }`}
                >
                  {sym === 'BTCUSDT' ? 'BTC/USDT' : sym}
                </button>
              ))}
            </div>

            {/* Instrument Telemetry Strip */}
            <div className="flex items-center gap-4 text-[11px] overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">LAST:</span>
                <span className="text-white font-bold text-sm">
                  ${currentSym.price.toLocaleString('en-US', { minimumFractionDigits: selectedSymbol === 'EURUSD' ? 4 : 2 })}
                </span>
                <span
                  className={`px-1 rounded text-[10px] font-semibold ${
                    currentSym.changePercent >= 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                  }`}
                >
                  {currentSym.changePercent >= 0 ? '+' : ''}
                  {currentSym.changePercent}%
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
                <span>24h HIGH:</span>
                <span className="text-slate-200 font-medium">${currentSym.high24h.toLocaleString()}</span>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
                <span>24h LOW:</span>
                <span className="text-slate-200 font-medium">${currentSym.low24h.toLocaleString()}</span>
              </div>

              <div className="hidden md:flex items-center gap-1.5 text-slate-400">
                <span>24h VOL:</span>
                <span className="text-slate-200 font-medium">{currentSym.volume24h}</span>
              </div>

              <div className="hidden lg:flex items-center gap-1.5 text-slate-400">
                <span>RATE:</span>
                <span className="text-emerald-400">{currentSym.funding}</span>
              </div>
            </div>
          </div>

          {/* Terminal Body: 3-Column Workstation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#212D42]">
            {/* -------------------------------------------------------- */}
            {/* COLUMN 1 & 2: CHART WORKSTATION (7 Cols)                  */}
            {/* -------------------------------------------------------- */}
            <div className="lg:col-span-7 flex flex-col bg-[#080D18]">
              {/* Chart Toolbar */}
              <div className="px-3 py-1.5 border-b border-[#1E293B] bg-[#0A101E] flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-[#070B14] border border-[#1E293B] rounded p-0.5">
                    {(['15m', '1H', '4H', '1D'] as const).map(tf => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          timeframe === tf ? 'bg-[#182338] text-blue-400' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>

                  <span className="text-slate-600">|</span>

                  {/* Technical Indicators active badges */}
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-blue-950/70 border border-blue-800/40 text-blue-400">
                      EMA 20: 83,280
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-800/40 text-amber-400">
                      EMA 50: 82,930
                    </span>
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-purple-950/70 border border-purple-800/40 text-purple-300">
                      ICT FVG (15m)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  <span>CANDLE CLOSE: 07:18</span>
                </div>
              </div>

              {/* Realistic SVG Candlestick & Volume Chart Canvas */}
              <div className="relative p-3 h-72 sm:h-80 flex flex-col justify-between overflow-hidden">
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
                  <span className="text-8xl font-bold font-mono tracking-widest text-slate-100">STOCKSIM</span>
                </div>

                {/* Price Axis Overlay (Right Side) */}
                <div className="absolute right-2 top-2 bottom-8 w-16 flex flex-col justify-between text-[9px] text-slate-400 pointer-events-none text-right font-mono">
                  <div>$84,200</div>
                  <div>$83,800</div>
                  <div className="text-emerald-400 font-bold bg-emerald-950/80 px-1 py-0.5 rounded border border-emerald-500/40">
                    $83,090
                  </div>
                  <div>$82,800</div>
                  <div>$82,400</div>
                </div>

                {/* SVG Visual Candlesticks Canvas */}
                <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="fvgGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9333EA" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#9333EA" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  <line x1="0" y1="40" x2="540" y2="40" stroke="#162235" strokeDasharray="3 3" />
                  <line x1="0" y1="90" x2="540" y2="90" stroke="#162235" strokeDasharray="3 3" />
                  <line x1="0" y1="140" x2="540" y2="140" stroke="#162235" strokeDasharray="3 3" />
                  <line x1="0" y1="190" x2="540" y2="190" stroke="#162235" strokeDasharray="3 3" />

                  {/* ICT Fair Value Gap (FVG) Zone Box */}
                  <rect x="75" y="80" width="465" height="45" fill="url(#fvgGradient)" stroke="#A855F7" strokeWidth="0.8" strokeDasharray="2 2" />
                  <text x="80" y="93" fill="#D8B4FE" fontSize="8" fontFamily="monospace">
                    [15m BULLISH FAIR VALUE GAP - INTACT]
                  </text>

                  {/* EMA 50 line */}
                  <path
                    d="M 20 170 Q 150 160, 300 135 T 530 115"
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="1.2"
                    strokeOpacity="0.8"
                  />

                  {/* EMA 20 line */}
                  <path
                    d="M 20 155 Q 150 130, 300 100 T 530 95"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="1.4"
                    strokeOpacity="0.9"
                  />

                  {/* Candlesticks & Volume Bars */}
                  {HERO_CHART_DATA.map((candle, idx) => {
                    const x = 20 + idx * 33;
                    const isBull = candle.close >= candle.open;
                    const candleColor = isBull ? '#10B981' : '#F43F5E';

                    // Normalized scale mapping (82,000 to 84,400)
                    const minP = 82200;
                    const maxP = 84300;
                    const toY = (p: number) => 200 - ((p - minP) / (maxP - minP)) * 160;

                    const highY = toY(candle.high);
                    const lowY = toY(candle.low);
                    const openY = toY(candle.open);
                    const closeY = toY(candle.close);
                    const bodyTop = Math.min(openY, closeY);
                    const bodyHeight = Math.max(Math.abs(closeY - openY), 2);
                    const volHeight = (candle.volume / 3500) * 35;

                    return (
                      <g key={candle.time}>
                        {/* Upper & Lower Wick */}
                        <line x1={x} y1={highY} x2={x} y2={lowY} stroke={candleColor} strokeWidth="1.2" />
                        {/* Candle Body */}
                        <rect
                          x={x - 5.5}
                          y={bodyTop}
                          width={11}
                          height={bodyHeight}
                          fill={isBull ? '#059669' : '#DC2626'}
                          stroke={candleColor}
                          strokeWidth="0.8"
                        />
                        {/* Volume Histogram bar at bottom */}
                        <rect
                          x={x - 4}
                          y={235 - volHeight}
                          width={8}
                          height={volHeight}
                          fill={isBull ? '#10B981' : '#F43F5E'}
                          opacity="0.35"
                        />
                      </g>
                    );
                  })}

                  {/* Current Price Dashed Marker */}
                  <line x1="0" y1="125" x2="540" y2="125" stroke="#10B981" strokeWidth="1" strokeDasharray="3 3" />
                </svg>

                {/* Time Axis Bar */}
                <div className="pt-1 border-t border-[#162235] flex items-center justify-between text-[9px] text-slate-500 font-mono">
                  <span>09:00</span>
                  <span>10:00</span>
                  <span>11:00</span>
                  <span>12:00</span>
                  <span className="text-emerald-400 font-semibold">12:45 (LIVE)</span>
                </div>
              </div>
            </div>

            {/* -------------------------------------------------------- */}
            {/* COLUMN 3: ORDER BOOK & MATCHING TAPE (3 Cols)             */}
            {/* -------------------------------------------------------- */}
            <div className="lg:col-span-3 flex flex-col bg-[#070C16] text-xs">
              {/* Header */}
              <div className="px-3 py-1.5 border-b border-[#1E293B] bg-[#0A101E] flex items-center justify-between text-slate-400 text-[11px]">
                <span className="font-semibold text-slate-300">ORDER BOOK (L2)</span>
                <span className="text-[10px] text-slate-500">PRECISION: 0.1</span>
              </div>

              {/* Order Book Table */}
              <div className="p-2 space-y-0.5 text-[11px] font-mono">
                <div className="grid grid-cols-3 text-slate-400 text-[9px] pb-1 border-b border-[#162235]">
                  <span>PRICE</span>
                  <span className="text-right">SIZE</span>
                  <span className="text-right">TOTAL</span>
                </div>

                {/* Asks (Sell Orders - Crimson) */}
                {orderBook.asks.map((ask, idx) => (
                  <div key={'ask-' + idx} className="relative grid grid-cols-3 py-0.5 px-1 hover:bg-[#1A1620]">
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-rose-500/10 pointer-events-none"
                      style={{ width: `${ask.depthPercent}%` }}
                    />
                    <span className="text-rose-400 font-medium relative z-10">{ask.price.toFixed(2)}</span>
                    <span className="text-right text-slate-300 relative z-10">{ask.size.toFixed(3)}</span>
                    <span className="text-right text-slate-400 relative z-10">{ask.total.toFixed(2)}</span>
                  </div>
                ))}

                {/* Spread Line */}
                <div className="my-1.5 py-1 px-1.5 rounded bg-[#0D1525] border border-[#1C283F] flex items-center justify-between text-[10px]">
                  <span className="text-emerald-400 font-bold">
                    ${currentSym.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-slate-400">SPREAD: $0.50 (0.0006%)</span>
                </div>

                {/* Bids (Buy Orders - Emerald) */}
                {orderBook.bids.map((bid, idx) => (
                  <div key={'bid-' + idx} className="relative grid grid-cols-3 py-0.5 px-1 hover:bg-[#112019]">
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 pointer-events-none"
                      style={{ width: `${bid.depthPercent}%` }}
                    />
                    <span className="text-emerald-400 font-medium relative z-10">{bid.price.toFixed(2)}</span>
                    <span className="text-right text-slate-300 relative z-10">{bid.size.toFixed(3)}</span>
                    <span className="text-right text-slate-400 relative z-10">{bid.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Tape Mini Preview */}
              <div className="mt-auto border-t border-[#1E293B] p-2 bg-[#05080F]">
                <div className="text-[10px] text-slate-500 mb-1 flex items-center justify-between">
                  <span>RECENT MATCHED TRADES</span>
                  <span className="text-emerald-400 text-[9px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <div className="space-y-0.5 text-[10px]">
                  {tradesTape.slice(0, 4).map(t => (
                    <div key={t.id} className="flex items-center justify-between">
                      <span className="text-slate-500">{t.time}</span>
                      <span className={t.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>
                        ${t.price.toFixed(2)}
                      </span>
                      <span className="text-slate-400">{t.size.toFixed(3)} {currentSym.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* -------------------------------------------------------- */}
            {/* COLUMN 4: EXECUTION SLIP / ORDER TICKET (2 Cols)          */}
            {/* -------------------------------------------------------- */}
            <div className="lg:col-span-2 flex flex-col bg-[#080D19] p-2.5 text-xs">
              <div className="text-slate-300 font-semibold mb-2 flex items-center justify-between">
                <span>ORDER TICKET</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  DEMO TRADING
                </span>
              </div>

              {/* Order Types */}
              <div className="grid grid-cols-3 gap-1 mb-2 bg-[#050912] p-0.5 rounded border border-[#1E293B] text-[10px] font-semibold text-center">
                {(['LIMIT', 'MARKET', 'STOP'] as const).map(ot => (
                  <button
                    key={ot}
                    onClick={() => setOrderType(ot)}
                    className={`py-1 rounded ${
                      orderType === ot ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ot}
                  </button>
                ))}
              </div>

              {/* Leverage Selector */}
              <div className="mb-2.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>LEVERAGE:</span>
                  <span className="text-blue-400 font-bold font-mono">{leverage}x ISOLATED</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[1, 10, 50, 100].map(lev => (
                    <button
                      key={lev}
                      onClick={() => setLeverage(lev)}
                      className={`py-0.5 text-[10px] rounded border font-mono ${
                        leverage === lev
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                          : 'bg-[#0A101C] text-slate-400 border-[#1E293B] hover:border-slate-500'
                      }`}
                    >
                      {lev}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Inputs */}
              <div className="space-y-2 mb-3">
                <div>
                  <div className="text-[10px] text-slate-400 mb-0.5">ORDER PRICE ($ USD)</div>
                  <input
                    type="text"
                    readOnly
                    value={`$${currentSym.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    className="w-full bg-[#05080E] border border-[#212D42] rounded px-2 py-1 text-slate-200 text-xs font-mono"
                  />
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 mb-0.5">POSITION SIZE ({currentSym.unit})</div>
                  <input
                    type="number"
                    value={orderSize}
                    onChange={e => setOrderSize(e.target.value)}
                    className="w-full bg-[#05080E] border border-[#212D42] rounded px-2 py-1 text-white text-xs font-mono focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="bg-[#050912] p-1.5 rounded border border-[#162235] text-[10px] space-y-0.5 text-slate-400">
                  <div className="flex justify-between">
                    <span>Order Value:</span>
                    <span className="text-slate-200">
                      ${((parseFloat(orderSize) || 0) * currentSym.price).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. Margin:</span>
                    <span className="text-blue-400">
                      ${(((parseFloat(orderSize) || 0) * currentSym.price) / leverage).toLocaleString('en-US', { maximumFractionDigits: 2 })} USD
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-1.5 mt-auto">
                <button
                  onClick={() => handleSimulateOrder('BUY')}
                  className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wider transition-colors shadow-sm"
                >
                  BUY / LONG
                </button>
                <button
                  onClick={() => handleSimulateOrder('SELL')}
                  className="w-full py-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs tracking-wider transition-colors shadow-sm"
                >
                  SELL / SHORT
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Panel: Simulated Active Positions Bar */}
          <div className="border-t border-[#212D42] bg-[#060A12] px-3 py-2 text-xs">
            <div className="flex items-center justify-between mb-1.5 text-slate-400 text-[10px]">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  ACTIVE SIMULATED POSITION (1)
                </span>
                <span className="text-slate-600">|</span>
                <span>ACCOUNT BALANCE: <strong className="text-slate-100">$100,000.00 USD</strong></span>
                <span className="text-slate-600">|</span>
                <span>EQUITY: <strong className="text-emerald-400">${(100000 + simulatedPnl).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</strong></span>
              </div>
              <span className="text-slate-500 hidden sm:inline-block">DETERMINISTIC SIMULATOR ENGINE</span>
            </div>

            {/* Position Row Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] font-mono">
                <thead>
                  <tr className="text-slate-400 text-[9px] border-b border-[#1A2538]">
                    <th className="py-1">INSTRUMENT</th>
                    <th className="py-1">SIDE</th>
                    <th className="py-1">SIZE</th>
                    <th className="py-1">ENTRY PRICE</th>
                    <th className="py-1">MARK PRICE</th>
                    <th className="py-1">LIQ. PRICE</th>
                    <th className="py-1">MARGIN</th>
                    <th className="py-1 text-right">UNREALIZED PnL (USD)</th>
                    <th className="py-1 text-right">ROE %</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-slate-200 hover:bg-[#0E1626]">
                    <td className="py-1.5 font-semibold text-emerald-400">BTCUSDT.P</td>
                    <td className="py-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                        LONG 50x
                      </span>
                    </td>
                    <td className="py-1.5">2.500 BTC</td>
                    <td className="py-1.5">$82,400.00</td>
                    <td className="py-1.5">${currentSym.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="py-1.5 text-rose-400">$68,450.00</td>
                    <td className="py-1.5">$4,120.00 USD</td>
                    <td className="py-1.5 text-right font-bold text-emerald-400">
                      +${simulatedPnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-1.5 text-right font-bold text-emerald-400">
                      +{((simulatedPnl / 4120) * 100).toFixed(2)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
