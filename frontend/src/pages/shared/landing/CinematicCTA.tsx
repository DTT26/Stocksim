import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Terminal, Trophy, ShieldCheck, Activity } from 'lucide-react';
import { useI18n } from '../../../contexts/I18nContext';

export const CinematicCTA: React.FC = () => {
  const { lang } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end end'],
  });

  const text1Opacity = useTransform(scrollYProgress, [0.1, 0.45, 0.65], [0.3, 1, 0.4]);
  const text2Opacity = useTransform(scrollYProgress, [0.35, 0.7], [0.2, 1]);
  const text2Y = useTransform(scrollYProgress, [0.35, 0.7], [20, 0]);

  return (
    <section
      ref={containerRef}
      className="relative w-full min-h-[92vh] bg-[#05080E] border-t border-[#1E293B] text-slate-100 flex flex-col justify-center items-center overflow-hidden py-24 select-none"
    >
      {/* ------------------------------------------------------------- */}
      {/* BACKGROUND: ANIMATED CHART GRID & SLOW MOVING MARKET LINE     */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#141E30_1px,transparent_1px),linear-gradient(to_bottom,#141E30_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_60%,transparent_100%)]" />

        {/* Slow moving market line tracing across viewport */}
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            d="M -200 480 Q 200 420, 500 500 T 1100 430 T 1700 470 T 2300 410"
            fill="none"
            stroke="#2563EB"
            strokeWidth="2"
            strokeDasharray="6 3"
            animate={{
              x: [0, 400, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 24,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </svg>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FULL VIEWPORT EDITORIAL HEADLINE & ACTIONS                    */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-10 max-w-[1400px] w-full px-6 lg:px-12 text-center flex flex-col items-center">
        {/* Top Minimal Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0A1220] border border-blue-500/30 text-blue-400 font-mono text-xs uppercase tracking-widest mb-8">
          <Terminal className="w-3.5 h-3.5" />
          <span>
            {lang === 'vi'
              ? 'KHÔNG RỦI RO TÀI CHÍNH THỰC • TỐI ĐA HÓA UY TÍN NĂNG LỰC'
              : 'ZERO FINANCIAL RISK • MAXIMUM CREDENTIAL PROOF'}
          </span>
        </div>

        {/* Main Headline */}
        <motion.div style={{ opacity: text1Opacity }} className="space-y-1">
          <h2 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-slate-400 tracking-tight uppercase font-sans">
            {lang === 'vi' ? 'BẠN KHÔNG THỂ HỌC' : 'YOU CANNOT LEARN'}
          </h2>
          <h2 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-slate-300 tracking-tight uppercase font-sans">
            {lang === 'vi' ? 'TRADING CHỈ BẰNG CÁCH NHÌN.' : 'TRADING JUST BY WATCHING.'}
          </h2>
        </motion.div>

        {/* Dynamic Conclusion Message */}
        <motion.div
          style={{ opacity: text2Opacity, y: text2Y }}
          className="mt-4 sm:mt-6"
        >
          <h2 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black text-white tracking-tight uppercase font-sans leading-none">
            {lang === 'vi' ? (
              <>
                BẠN CHỈ THÀNH THẠO <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-400">
                  KHI THỰC CHIẾN.
                </span>
              </>
            ) : (
              <>
                YOU ONLY MASTER IT <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-400">
                  BY EXECUTING.
                </span>
              </>
            )}
          </h2>

          <p className="mt-8 text-base sm:text-xl text-slate-300 font-sans max-w-2xl mx-auto leading-relaxed">
            {lang === 'vi'
              ? 'Rèn luyện kỹ năng với nguồn vốn mô phỏng. Xây dựng hồ sơ năng lực trading được kiểm toán minh bạch mà không gặp rủi ro tài chính cá nhân.'
              : 'Hone institutional-grade discipline with simulated capital. Build a transparent, verifiable track record without risking your own funds.'}
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto">
            <Link
              to="/trade/btcusdt"
              className="w-full sm:w-auto px-8 py-4 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-sm font-bold tracking-wider uppercase transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 group"
            >
              <span>{lang === 'vi' ? 'BẮT ĐẦU GIAO DỊCH' : 'START TRADING NOW'}</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>

            <a
              href="#simulations"
              className="w-full sm:w-auto px-8 py-4 rounded bg-[#0A101C] hover:bg-[#121B2D] text-slate-300 hover:text-white border border-[#1E293B] hover:border-slate-600 font-mono text-sm font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-2"
            >
              <Trophy className="w-4 h-4 text-blue-400" />
              <span>{lang === 'vi' ? 'Khám Phá Đấu Trường' : 'Explore Arenas'}</span>
            </a>
          </div>

          {/* Institutional Trust Elements */}
          <div className="mt-14 pt-8 border-t border-[#162235] flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-mono text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'vi' ? 'Sổ Cái Khớp Lệnh Mã Hóa' : 'Cryptographic Trade Ledger'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span>{lang === 'vi' ? 'Độ Sâu Sổ Lệnh Chuẩn Từng Tick' : 'Tick-by-Tick Orderbook Depth'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>{lang === 'vi' ? 'Hệ Thống Đánh Giá Chuẩn Tổ Chức' : 'Institutional Evaluation Rules'}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
