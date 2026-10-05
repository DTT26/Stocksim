import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Trophy, ShieldCheck, Users, Calendar, Award, ArrowUpRight, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CINEMATIC_LEADERBOARD } from './mockData';

export const CinematicSimulations: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  const headlineWords = ['GIAO DỊCH', 'KỶ LUẬT.', 'KHÔNG', 'CLICK LỆNH', 'NGẪU NHIÊN.'];

  return (
    <section
      ref={containerRef}
      className="relative w-full py-24 bg-[#0B101A] border-b border-[#1E293B] text-slate-100 overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Word-by-Word Scroll Reveal */}
        <div className="mb-14 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#10192A] border border-blue-500/30 text-blue-400 font-mono text-xs uppercase tracking-widest mb-4">
            <Trophy className="w-3.5 h-3.5" />
            <span>ĐẤU TRƯỜNG MÔ PHỎNG TỔ CHỨC</span>
          </div>

          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase font-sans flex flex-wrap justify-center gap-x-4 gap-y-2 leading-tight">
            {headlineWords.map((word, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, y: 25 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.5,
                  delay: idx * 0.1,
                  ease: [0.215, 0.61, 0.355, 1],
                }}
                className={word.includes('KỶ LUẬT') ? 'text-blue-400' : ''}
              >
                {word}
              </motion.span>
            ))}
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-400 font-sans max-w-2xl mx-auto">
            Tham gia các giải đấu giao dịch có cấu trúc theo mô hình đánh giá của quỹ Prop Firm và các khóa học tài chính đại học danh tiếng.
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* CHALLENGE WORKBENCH + LEADERBOARD DUAL VIEW                   */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: SIMULATION COCKPIT CARD (7 cols) */}
          <div className="lg:col-span-7 bg-[#0E1524] border border-[#1F2C45] rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#1A2538]">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400">
                  ĐẤU TRƯỜNG PHÁI SINH • KỲ MÙA THU 2026
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  THỬ THÁCH CỔ PHIẾU CÔNG NGHỆ MỸ
                </h3>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>ĐANG DIỄN RA</span>
              </div>
            </div>

            {/* Core simulation stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-[#0A0F1A] border border-[#182338]">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Vốn Khởi Điểm</div>
                <div className="text-xl font-bold font-mono text-slate-200 mt-1">$100,000</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Vốn Mô Phỏng USD</div>
              </div>

              <div className="p-4 rounded-lg bg-[#0A0F1A] border border-[#182338]">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Giá Trị Danh Mục</div>
                <div className="text-xl font-bold font-mono text-white mt-1">$108,420</div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">+$8,420 Lãi Ròng</div>
              </div>

              <div className="p-4 rounded-lg bg-[#0A0F1A] border border-[#182338]">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Tỷ Suất Lợi Nhuận</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>+8.42%</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Tham chiếu: +2.10%</div>
              </div>

              <div className="p-4 rounded-lg bg-[#0A0F1A] border border-[#182338]">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Thứ Hạng Hiện Tại</div>
                <div className="text-xl font-bold font-mono text-blue-400 mt-1">#4</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Top 10% Dẫn Đầu</div>
              </div>

              <div className="p-4 rounded-lg bg-[#0A0F1A] border border-[#182338]">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Số Lượng Đăng Ký</div>
                <div className="text-xl font-bold font-mono text-slate-200 mt-1">42</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Trader & Sinh Viên</div>
              </div>

              <div className="p-4 rounded-lg bg-[#0A0F1A] border border-[#182338]">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Hạn Chót</div>
                <div className="text-xl font-bold font-mono text-slate-200 mt-1">22 Th10</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Còn Lại 18 Ngày</div>
              </div>
            </div>

            {/* Enforced Rules Banner */}
            <div className="p-4 rounded-lg bg-[#070B14] border border-[#1A2538] space-y-2">
              <div className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Quy Định Quản Trị Tổ Chức</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400 font-sans">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Rủi ro tối đa 2% vốn trên mỗi lệnh</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Bắt buộc cài Stop-Loss trong 60 giây</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Mức sụt giảm danh mục tối đa 5.0%</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Khớp lệnh 100% theo giá thị trường thật</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: LEADERBOARD MOTION (5 cols) */}
          <div className="lg:col-span-5 bg-[#0E1524] border border-[#1F2C45] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A2538]">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  Bảng Xếp Hạng Trực Tiếp
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">KIỂM TOÁN TỪNG TICK</span>
            </div>

            {/* Animated Leaderboard List */}
            <div className="space-y-2.5">
              {CINEMATIC_LEADERBOARD.map((item, idx) => (
                <motion.div
                  key={item.rank}
                  initial={{ opacity: 0, y: 25 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    duration: 0.5,
                    delay: 0.2 + idx * 0.12,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={`p-3.5 rounded-lg border transition-all flex items-center justify-between ${
                    item.isUser
                      ? 'bg-[#13203C] border-blue-500 shadow-md shadow-blue-900/30'
                      : 'bg-[#0A0F1A] border-[#182338] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold ${
                        item.rank === 1
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : item.rank === 2
                          ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40'
                          : item.rank === 3
                          ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40'
                          : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      #{item.rank}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${item.isUser ? 'text-white font-bold' : 'text-slate-200'}`}>
                          {item.name}
                        </span>
                        {item.isUser && (
                          <span className="px-1.5 py-0.2 rounded bg-blue-500 text-white font-mono text-[9px] font-black uppercase">
                            BẠN
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {item.trades} lệnh đã thực hiện
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-emerald-400 flex items-center justify-end gap-0.5">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>+{item.returnPercent.toFixed(2)}%</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">
                      {item.portfolio}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="pt-2 text-center">
              <span className="text-[11px] font-mono text-slate-500">
                Lợi nhuận (P&L) được kiểm toán đối chiếu trực tiếp theo độ sâu sổ lệnh sàn thật.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
