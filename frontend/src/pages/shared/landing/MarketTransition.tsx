import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { TrendingUp, Activity, BarChart2, Shield } from 'lucide-react';

export const MarketTransition: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Zoom into the chart as scroll progresses
  const chartScale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.45, 1.85]);
  const chartOpacity = useTransform(scrollYProgress, [0, 0.15, 0.7, 1], [0.6, 1, 0.9, 0.4]);
  const chartY = useTransform(scrollYProgress, [0, 1], [0, -80]);

  // Typography transitions
  const text1Y = useTransform(scrollYProgress, [0.1, 0.45], [40, 0]);
  const text1Opacity = useTransform(scrollYProgress, [0.08, 0.35, 0.7, 0.9], [0, 1, 1, 0]);
  
  const text2Y = useTransform(scrollYProgress, [0.25, 0.55], [30, 0]);
  const text2Opacity = useTransform(scrollYProgress, [0.2, 0.45, 0.75, 0.9], [0, 1, 1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[180vh] bg-[#05080E] border-b border-[#1E293B] overflow-hidden"
    >
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        {/* ------------------------------------------------------------- */}
        {/* ZOOMING CANDLESTICK ENVIRONMENT                               */}
        {/* ------------------------------------------------------------- */}
        <motion.div
          style={{
            scale: chartScale,
            opacity: chartOpacity,
            y: chartY,
          }}
          className="absolute inset-0 w-full h-full pointer-events-none select-none flex items-center justify-center origin-center"
        >
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#141E30_1px,transparent_1px),linear-gradient(to_bottom,#141E30_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-35" />

          {/* SVG Candlestick & Price Action Canvas */}
          <svg
            className="w-full h-full max-w-[1920px] max-h-[1080px]"
            viewBox="0 0 1600 900"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Horizontal price reference lines */}
            <line x1="0" y1="260" x2="1600" y2="260" stroke="#1E2C42" strokeDasharray="4 4" strokeWidth="1" />
            <text x="1540" y="255" fill="#4B607E" fontSize="11" fontFamily="monospace">252.00</text>
            <line x1="0" y1="420" x2="1600" y2="420" stroke="#1E2C42" strokeDasharray="4 4" strokeWidth="1" />
            <text x="1540" y="415" fill="#4B607E" fontSize="11" fontFamily="monospace">248.50</text>
            <line x1="0" y1="580" x2="1600" y2="580" stroke="#1E2C42" strokeDasharray="4 4" strokeWidth="1" />
            <text x="1540" y="575" fill="#4B607E" fontSize="11" fontFamily="monospace">244.00</text>

            {/* Candlesticks sequence */}
            {[
              { x: 120, open: 530, close: 500, high: 480, low: 550, isUp: true },
              { x: 180, open: 500, close: 520, high: 490, low: 540, isUp: false },
              { x: 240, open: 520, close: 460, high: 440, low: 530, isUp: true },
              { x: 300, open: 460, close: 440, high: 420, low: 480, isUp: true },
              { x: 360, open: 440, close: 470, high: 430, low: 490, isUp: false },
              { x: 420, open: 470, close: 430, high: 410, low: 485, isUp: true },
              { x: 480, open: 430, close: 390, high: 380, low: 445, isUp: true },
              { x: 540, open: 390, close: 410, high: 375, low: 425, isUp: false },
              { x: 600, open: 410, close: 360, high: 350, low: 420, isUp: true },
              { x: 660, open: 360, close: 340, high: 320, low: 380, isUp: true },
              { x: 720, open: 340, close: 370, high: 330, low: 390, isUp: false },
              { x: 780, open: 370, close: 310, high: 295, low: 380, isUp: true },
              { x: 840, open: 310, close: 330, high: 300, low: 350, isUp: false },
              { x: 900, open: 330, close: 280, high: 270, low: 345, isUp: true },
              { x: 960, open: 280, close: 260, high: 250, low: 295, isUp: true },
              { x: 1020, open: 260, close: 290, high: 245, low: 305, isUp: false },
              { x: 1080, open: 290, close: 240, high: 230, low: 300, isUp: true },
              { x: 1140, open: 240, close: 220, high: 210, low: 255, isUp: true },
              { x: 1200, open: 220, close: 250, high: 205, low: 265, isUp: false },
              { x: 1260, open: 250, close: 195, high: 185, low: 260, isUp: true },
              { x: 1320, open: 195, close: 180, high: 170, low: 215, isUp: true },
              { x: 1380, open: 180, close: 200, high: 165, low: 210, isUp: false },
              { x: 1440, open: 200, close: 160, high: 150, low: 210, isUp: true },
            ].map((c, i) => {
              const bodyTop = Math.min(c.open, c.close);
              const bodyHeight = Math.max(Math.abs(c.open - c.close), 6);
              const color = c.isUp ? '#10B981' : '#F43F5E';

              return (
                <g key={i}>
                  {/* High/Low wick */}
                  <line
                    x1={c.x}
                    y1={c.high}
                    x2={c.x}
                    y2={c.low}
                    stroke={color}
                    strokeWidth="1.5"
                    opacity="0.85"
                  />
                  {/* Real body */}
                  <rect
                    x={c.x - 12}
                    y={bodyTop}
                    width={24}
                    height={bodyHeight}
                    fill={color}
                    fillOpacity={c.isUp ? '0.75' : '0.85'}
                    stroke={color}
                    strokeWidth="1.2"
                    rx="1.5"
                  />
                  {/* Volume histogram bar at bottom */}
                  <rect
                    x={c.x - 10}
                    y={750 - (c.isUp ? bodyHeight * 2.8 : bodyHeight * 1.8)}
                    width={20}
                    height={c.isUp ? bodyHeight * 2.8 : bodyHeight * 1.8}
                    fill={color}
                    fillOpacity="0.3"
                  />
                </g>
              );
            })}

            {/* Glowing moving price average line */}
            <path
              d="M 120 515 C 300 480, 500 420, 720 355 C 900 310, 1150 240, 1440 175"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2.5"
              strokeDasharray="6 2"
              opacity="0.9"
            />
          </svg>
        </motion.div>

        {/* ------------------------------------------------------------- */}
        {/* EDITORIAL OVERLAY TYPOGRAPHY                                   */}
        {/* ------------------------------------------------------------- */}
        <div className="relative z-10 max-w-[1400px] w-full px-6 lg:px-12 text-center pointer-events-none">
          <motion.div
            style={{ y: text1Y, opacity: text1Opacity }}
            className="flex flex-col items-center justify-center space-y-2"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0B1424]/90 border border-blue-500/30 text-blue-400 font-mono text-xs uppercase tracking-widest mb-4">
              <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>DÒNG CHẢY GIAO DỊCH LIÊN TỤC</span>
            </div>

            <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tighter uppercase font-sans leading-[0.95]">
              THỊ TRƯỜNG <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-400">
                KHÔNG BAO GIỜ DỪNG.
              </span>
            </h2>
          </motion.div>

          <motion.div
            style={{ y: text2Y, opacity: text2Opacity }}
            className="mt-6"
          >
            <p className="text-xl sm:text-3xl text-slate-300 font-mono font-medium tracking-tight">
              Và việc tích lũy kinh nghiệm của bạn cũng vậy.
            </p>
            <p className="text-xs sm:text-sm text-slate-500 font-mono mt-3 max-w-xl mx-auto">
              Dòng tiền thực vận hành 24/7 trên toàn thế giới. Chuyển đổi trực tiếp từ cơ chế sàn giao dịch sang radar dữ liệu thị trường trực tiếp.
            </p>
          </motion.div>
        </div>

        {/* Top & Bottom Vignette Shadow for Seamless Transition */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#070B14] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#080C14] to-transparent pointer-events-none" />
      </div>
    </section>
  );
};
