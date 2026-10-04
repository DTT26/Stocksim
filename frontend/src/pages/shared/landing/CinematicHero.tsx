import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Terminal, ArrowUpRight, Cpu, ShieldCheck, Activity, Layers, CheckCircle2 } from 'lucide-react';
import { HERO_CHART_DATA, generateOrderBook, INITIAL_TRADES_TAPE } from './mockData';

export const CinematicHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [isDesktop, setIsDesktop] = useState(false);

  // Live fluctuating ticker in Hero
  const [aaplPrice, setAaplPrice] = useState(248.42);
  const [aaplFlash, setAaplFlash] = useState<'UP' | 'DOWN' | null>(null);

  const [btcPrice, setBtcPrice] = useState(83090.00);
  const [btcFlash, setBtcFlash] = useState<'UP' | 'DOWN' | null>(null);

  // Terminal state
  const [activeSymbol, setActiveSymbol] = useState<'BTCUSDT' | 'AAPL' | 'NVDA'>('BTCUSDT');
  const [orderBook, setOrderBook] = useState(() => generateOrderBook(83090));
  const [simulatedPnl, setSimulatedPnl] = useState(1725.00);

  // Scroll animations for continuous transition into next section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const textY = useTransform(scrollYProgress, [0, 0.6], [0, -120]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  const terminalScale = useTransform(scrollYProgress, [0, 0.8], [1, 1.08]);
  const terminalY = useTransform(scrollYProgress, [0, 0.8], [0, 60]);

  useEffect(() => {
    setIsDesktop(window.innerWidth >= 1024);
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cursor spotlight
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktop) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // Occasional realistic price updates with 400ms flash
  useEffect(() => {
    const timer = setInterval(() => {
      // Toggle AAPL or BTC
      if (Math.random() > 0.5) {
        const delta = +(Math.random() * 0.28 - 0.12).toFixed(2);
        setAaplPrice(prev => {
          const next = +(prev + delta).toFixed(2);
          setAaplFlash(delta >= 0 ? 'UP' : 'DOWN');
          setTimeout(() => setAaplFlash(null), 450);
          return next;
        });
      } else {
        const delta = +(Math.random() * 32 - 15).toFixed(2);
        setBtcPrice(prev => {
          const next = +(prev + delta).toFixed(2);
          setBtcFlash(delta >= 0 ? 'UP' : 'DOWN');
          setTimeout(() => setBtcFlash(null), 450);
          setOrderBook(generateOrderBook(next));
          return next;
        });
      }
    }, 3800);

    return () => clearInterval(timer);
  }, []);

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full min-h-[90vh] bg-[#080C14] text-slate-100 overflow-hidden border-b border-[#1E293B] flex flex-col justify-between pt-6 pb-16 selection:bg-blue-500/30"
    >
      {/* ------------------------------------------------------------- */}
      {/* HERO MARKET BACKGROUND: Slow SVG & CSS telemetry               */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-30">
        {/* Subtle coordinate grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#162235_1px,transparent_1px),linear-gradient(to_bottom,#162235_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_30%,#000_70%,transparent_100%)]" />

        {/* Slow moving market lines (SVG) */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <motion.path
            d="M 0 320 Q 300 280, 650 360 T 1400 290 T 2000 340"
            fill="none"
            stroke="#1E3A5F"
            strokeWidth="1.2"
            strokeDasharray="6 6"
            animate={{ x: [0, -70, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          />
          <motion.path
            d="M 0 460 Q 400 490, 850 420 T 1500 470 T 2200 430"
            fill="none"
            stroke="#172A45"
            strokeWidth="1"
            animate={{ x: [0, 60, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          />

          {/* Faint candlestick silhouettes in the background */}
          {[120, 280, 440, 620, 780, 950, 1120, 1280].map((xPos, idx) => (
            <g key={idx} opacity="0.25">
              <line x1={xPos} y1={240 + (idx % 3) * 20} x2={xPos} y2={360 - (idx % 2) * 20} stroke="#2D4668" strokeWidth="1" />
              <rect
                x={xPos - 6}
                y={260 + (idx % 2) * 15}
                width={12}
                height={50}
                fill="#162A45"
                stroke="#2B466B"
                strokeWidth="0.8"
              />
            </g>
          ))}
        </svg>

        {/* Subtle market coordinates telemetry */}
        <div className="absolute top-12 left-10 text-[10px] font-mono text-slate-400 space-y-1">
          <div>LOC // NYC-EQUINIX-NY4: 40.7128° N, 74.0060° W</div>
          <div>FEED // BINGX-L2: DETERMINISTIC DIRECT FEED</div>
          <div>STATUS // SUB-MILLISECOND LATENCY ACTIVE</div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DESKTOP CURSOR SPOTLIGHT                                      */}
      {/* ------------------------------------------------------------- */}
      {isDesktop && mousePos.x > 0 && (
        <div
          className="absolute pointer-events-none rounded-full transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${mousePos.x - 350}px, ${mousePos.y - 350}px)`,
            width: '700px',
            height: '700px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.07) 0%, rgba(59, 130, 246, 0.02) 40%, transparent 70%)',
          }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MAIN HERO CONTENT (Max Width: 1400px)                         */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-4 lg:pt-8">
          {/* LEFT COLUMN: Large Asymmetric Editorial Headline */}
          <motion.div
            style={{ y: textY, opacity: textOpacity }}
            className="lg:col-span-5 flex flex-col justify-center"
          >
            {/* Engine Telemetry Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0A101C] border border-[#1E2E48] text-slate-300 text-xs font-mono mb-6 self-start">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>HỆ THỐNG STOCKSIM v2.8</span>
              <span className="text-slate-600">|</span>
              <span className="text-blue-400 font-semibold">100% KHỚP LỆNH CHUẨN XÁC</span>
            </div>

            {/* Editorial Large Typography */}
            <h1 className="text-5xl sm:text-6xl lg:text-[76px] xl:text-[84px] font-extrabold tracking-tight text-white uppercase leading-[0.95] font-sans">
              <span className="block text-slate-100">Luyện tập</span>
              <span className="block text-slate-100">Giao dịch.</span>
            </h1>

            {/* Animated Second Message */}
            <div className="mt-4 sm:mt-6 overflow-hidden">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight uppercase leading-[0.98] font-sans text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-slate-200"
              >
                <span>Không rủi ro</span>
                <span className="block text-blue-400">Vốn thật.</span>
              </motion.div>
            </div>

            {/* Editorial Subhead */}
            <p className="mt-6 text-base sm:text-lg text-slate-400 font-sans leading-relaxed max-w-lg">
              Nền tảng mô phỏng giao dịch chuẩn tổ chức. Làm chủ dòng tiền, tỷ lệ lợi nhuận/rủi ro và kỷ luật vào lệnh trên dữ liệu thực tế 100% không sợ thua lỗ tài chính.
            </p>

            {/* Live Hero Price Ticker Card */}
            <div className="mt-6 p-3 rounded-lg bg-[#0A101C] border border-[#1E293B] flex items-center justify-between font-mono text-xs max-w-md">
              <div className="flex items-center gap-3">
                <span className="font-bold text-white">AAPL (NASDAQ)</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-bold transition-colors duration-300 ${
                    aaplFlash === 'UP'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/50'
                      : aaplFlash === 'DOWN'
                      ? 'bg-rose-950 text-rose-400 border border-rose-500/50'
                      : 'text-slate-300'
                  }`}
                >
                  ${aaplPrice.toFixed(2)}
                </span>
                <span className="text-emerald-400 font-medium">+2.84%</span>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span>DỮ LIỆU TRỰC TIẾP</span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/trade/btcusdt"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-sm font-bold tracking-wide transition-all shadow-lg shadow-blue-950 group"
              >
                <Terminal className="w-4 h-4 text-blue-200" />
                <span>MỞ SÀN GIAO DỊCH MÔ PHỎNG</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>

              <a
                href="#enter-terminal"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded bg-[#0E1524] hover:bg-[#16233B] text-slate-200 border border-[#23324D] hover:border-slate-500 font-mono text-sm font-medium transition-colors"
              >
                <Layers className="w-4 h-4 text-slate-400" />
                <span>KHÁM PHÁ TÍNH NĂNG</span>
              </a>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: Large StockSim Trading Terminal (Occupies 55–65% Viewport Width) */}
          <motion.div
            style={{
              scale: terminalScale,
              y: terminalY,
            }}
            initial={{ opacity: 0, scale: 0.94, rotateX: 6 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 w-full"
          >
            <div className="rounded-xl border border-[#212D42] bg-[#0A0F1A] shadow-2xl shadow-black/80 overflow-hidden font-mono text-xs">
              {/* Terminal Titlebar with Ticker Switcher */}
              <div className="bg-[#0D1525] border-b border-[#212D42] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mr-1">
                    TÀI SẢN:
                  </span>
                  {(['BTCUSDT', 'AAPL', 'NVDA'] as const).map(sym => (
                    <button
                      key={sym}
                      onClick={() => setActiveSymbol(sym)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold tracking-wide transition-colors ${
                        activeSymbol === sym
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-[#080C14] text-slate-400 hover:text-slate-200 border border-[#1E293B]'
                      }`}
                    >
                      {sym === 'BTCUSDT' ? 'BTC/USDT' : sym}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-slate-400">GIÁ:</span>
                  <span
                    className={`font-bold text-white transition-colors duration-300 ${
                      btcFlash === 'UP' ? 'text-emerald-400' : btcFlash === 'DOWN' ? 'text-rose-400' : ''
                    }`}
                  >
                    ${activeSymbol === 'BTCUSDT' ? btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2 }) : activeSymbol === 'AAPL' ? aaplPrice.toFixed(2) : '189.27'} USD
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-800/40">
                    DỮ LIỆU L2
                  </span>
                </div>
              </div>

              {/* Terminal Workspace: Chart + Orderbook + Execution */}
              <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#212D42]">
                {/* Candlestick & Indicator Area (8 Cols) */}
                <div className="md:col-span-8 p-3 bg-[#080D18] flex flex-col justify-between h-72 sm:h-80">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1.5 border-b border-[#1A263A]">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{activeSymbol} 15m</span>
                      <span className="text-blue-400">EMA 20: 83,280</span>
                      <span className="text-amber-400 hidden sm:inline">EMA 50: 82,930</span>
                    </div>
                    <span className="text-purple-300 font-semibold">[VÙNG FVG TĂNG TRƯỞNG]</span>
                  </div>

                  {/* SVG Chart Render */}
                  <svg className="w-full h-full py-1" viewBox="0 0 540 200" preserveAspectRatio="none">
                    <line x1="0" y1="40" x2="540" y2="40" stroke="#162235" strokeDasharray="3 3" />
                    <line x1="0" y1="90" x2="540" y2="90" stroke="#162235" strokeDasharray="3 3" />
                    <line x1="0" y1="140" x2="540" y2="140" stroke="#162235" strokeDasharray="3 3" />

                    {/* FVG highlight zone */}
                    <rect x="60" y="65" width="440" height="40" fill="#9333EA" fillOpacity="0.15" stroke="#A855F7" strokeWidth="0.8" strokeDasharray="2 2" />

                    {/* EMA Lines */}
                    <path d="M 10 145 Q 150 120, 300 85 T 530 80" fill="none" stroke="#3B82F6" strokeWidth="1.3" />
                    <path d="M 10 160 Q 150 145, 300 110 T 530 100" fill="none" stroke="#D97706" strokeWidth="1.1" strokeOpacity="0.8" />

                    {/* Candlesticks */}
                    {HERO_CHART_DATA.slice(4).map((c, i) => {
                      const x = 20 + i * 42;
                      const isBull = c.close >= c.open;
                      const color = isBull ? '#10B981' : '#F43F5E';
                      const minP = 82600;
                      const maxP = 84200;
                      const toY = (p: number) => 170 - ((p - minP) / (maxP - minP)) * 140;

                      return (
                        <g key={c.time}>
                          <line x1={x} y1={toY(c.high)} x2={x} y2={toY(c.low)} stroke={color} strokeWidth="1.2" />
                          <rect
                            x={x - 6}
                            y={Math.min(toY(c.open), toY(c.close))}
                            width={12}
                            height={Math.max(Math.abs(toY(c.close) - toY(c.open)), 2)}
                            fill={isBull ? '#059669' : '#DC2626'}
                            stroke={color}
                            strokeWidth="0.8"
                          />
                        </g>
                      );
                    })}
                  </svg>

                  <div className="pt-1 border-t border-[#162235] flex items-center justify-between text-[9px] text-slate-400">
                    <span>10:00</span>
                    <span>11:00</span>
                    <span>12:00</span>
                    <span className="text-blue-400 font-semibold">12:45 TRỰC TIẾP</span>
                  </div>
                </div>

                {/* Order Book & Quick Slip (4 Cols) */}
                <div className="md:col-span-4 p-3 bg-[#070C16] flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 pb-1 mb-1 border-b border-[#1A263A] flex justify-between">
                      <span>SỔ LỆNH L2</span>
                      <span>SPREAD $0.50</span>
                    </div>

                    <div className="space-y-0.5 text-[10px]">
                      {orderBook.asks.slice(0, 3).map((a, i) => (
                        <div key={i} className="flex justify-between text-rose-400">
                          <span>{a.price.toFixed(2)}</span>
                          <span className="text-slate-400">{a.size.toFixed(3)}</span>
                        </div>
                      ))}
                      <div className="py-1 my-1 px-1 bg-[#0E1626] rounded text-center text-blue-400 font-bold text-xs">
                        ${btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      {orderBook.bids.slice(0, 3).map((b, i) => (
                        <div key={i} className="flex justify-between text-emerald-400">
                          <span>{b.price.toFixed(2)}</span>
                          <span className="text-slate-400">{b.size.toFixed(3)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Simulated Position Indicator */}
                  <div className="pt-2 border-t border-[#1A263A] text-[10px]">
                    <div className="flex justify-between text-slate-400">
                      <span>LÃI / LỖ VỊ THẾ:</span>
                      <span className="text-emerald-400 font-bold">+${simulatedPnl.toFixed(2)} USD</span>
                    </div>
                    <div className="flex justify-between text-slate-500 mt-0.5">
                      <span>TỶ SUẤT ROE:</span>
                      <span className="text-emerald-400 font-semibold">+41.87%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
