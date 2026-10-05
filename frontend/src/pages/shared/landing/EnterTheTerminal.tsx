import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { Terminal, Shield, ArrowUpRight, CheckCircle2, Crosshair, TrendingUp, Sliders, DollarSign, Activity } from 'lucide-react';
import { HERO_CHART_DATA } from './mockData';

export const EnterTheTerminal: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStage, setActiveStage] = useState<1 | 2 | 3 | 4>(1);

  // Scroll through ~300vh to drive sticky sequence
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', latest => {
    if (latest < 0.28) {
      setActiveStage(1);
    } else if (latest < 0.55) {
      setActiveStage(2);
    } else if (latest < 0.8) {
      setActiveStage(3);
    } else {
      setActiveStage(4);
    }
  });

  return (
    <section
      id="enter-terminal"
      ref={containerRef}
      className="relative w-full h-[320vh] bg-[#070B14] border-b border-[#1E293B]"
    >
      {/* ------------------------------------------------------------- */}
      {/* STICKY WORKSTATION VIEWPORT (100vh)                           */}
      {/* ------------------------------------------------------------- */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-between pt-8 pb-10 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto overflow-hidden">
        {/* Section Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#182338]">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 mb-1">
              <Terminal className="w-3.5 h-3.5" />
              <span>QUY TRÌNH TƯƠNG TÁC SÀN GIAO DỊCH</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase font-sans">
              Trải nghiệm Sàn Giao dịch
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-sans mt-0.5">
              Từ phân tích thị trường đến khớp lệnh thực tế. Cuộn chuột để trải nghiệm từng bước.
            </p>
          </div>

          {/* 4 Stage Pills */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            {[
              { id: 1, label: '01 ĐỌC LỆNH' },
              { id: 2, label: '02 TẠO LỆNH' },
              { id: 3, label: '03 RỦI RO' },
              { id: 4, label: '04 KHỚP LỆNH' },
            ].map(st => (
              <div
                key={st.id}
                className={`px-3 py-1 rounded text-[11px] font-bold transition-all ${
                  activeStage === st.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                    : activeStage > st.id
                    ? 'bg-[#121B2D] text-blue-400 border border-blue-900/40'
                    : 'bg-[#0A0F1A] text-slate-500 border border-[#1A2538]'
                }`}
              >
                {st.label}
              </div>
            ))}
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* INTERACTIVE SPLIT: Left Narrative vs Right Live Terminal    */}
        {/* ----------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto items-center">
          {/* LEFT COLUMN: Stage-Specific Narrative */}
          <div className="lg:col-span-4 space-y-4">
            {activeStage === 1 && (
              <motion.div
                key="stage-1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="space-y-3 font-mono"
              >
                <div className="text-xs font-bold text-blue-400 tracking-wider">GIAI ĐOẠN 01 // PHÂN TÍCH</div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-sans uppercase">
                  Đọc hiểu thị trường
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                  Hành động giá trực tiếp với sổ lệnh cập nhật từng mili-giây. Biểu đồ nến, khối lượng giao dịch và nhận diện tự động vùng mất cân bằng FVG định hướng chuẩn xác vị thế.
                </p>

                {/* Real-time Technical Telemetry */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                  <div className="p-2 rounded bg-[#0A101C] border border-[#1E293B]">
                    <div className="text-slate-500 text-[10px]">XU HƯỚNG</div>
                    <div className="font-bold text-emerald-400 mt-0.5">ĐÀ TĂNG MẠNH</div>
                  </div>
                  <div className="p-2 rounded bg-[#0A101C] border border-[#1E293B]">
                    <div className="text-slate-500 text-[10px]">KHỐI LƯỢNG</div>
                    <div className="font-bold text-slate-200 mt-0.5">TỔ CHỨC MUA MẠNH</div>
                  </div>
                  <div className="p-2 rounded bg-[#0A101C] border border-[#1E293B]">
                    <div className="text-slate-500 text-[10px]">ĐỘNG LƯỢNG</div>
                    <div className="font-bold text-blue-400 mt-0.5">+2.4σ TĂNG TỐC</div>
                  </div>
                  <div className="p-2 rounded bg-[#0A101C] border border-[#1E293B]">
                    <div className="text-slate-500 text-[10px]">BIÊN ĐỘ</div>
                    <div className="font-bold text-slate-200 mt-0.5">ATR: $4.20</div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeStage === 2 && (
              <motion.div
                key="stage-2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="space-y-3 font-mono"
              >
                <div className="text-xs font-bold text-blue-400 tracking-wider">GIAI ĐOẠN 02 // THIẾT LẬP VỊ THẾ</div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-sans uppercase">
                  Thiết lập lệnh
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                  Cấu hình phiếu lệnh giao dịch. Chọn lệnh Thị trường (Market), Giới hạn (Limit) hoặc Dừng (Stop-Limit) với tính toán ký quỹ tức thì.
                </p>

                <div className="p-3 rounded bg-[#0A101C] border border-[#1E293B] space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hành động:</span>
                    <span className="font-bold text-emerald-400">MUA / LONG</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Khối lượng:</span>
                    <span className="font-bold text-white">10 CỔ PHIẾU</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Loại lệnh:</span>
                    <span className="font-bold text-blue-400">LỆNH THỊ TRƯỜNG</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#182338]">
                    <span className="text-slate-400">Tổng giá trị ước tính:</span>
                    <span className="font-bold text-white">$2,484.20 USD</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 italic">
                  *Bản xem trước mô phỏng — cuộn xuống để xem thông số quản trị rủi ro.
                </div>
              </motion.div>
            )}

            {activeStage === 3 && (
              <motion.div
                key="stage-3"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="space-y-3 font-mono"
              >
                <div className="text-xs font-bold text-blue-400 tracking-wider">GIAI ĐOẠN 03 // BẢO VỆ RỦI RO</div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-sans uppercase">
                  Quản trị rủi ro
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                  Không bao giờ vào lệnh nếu không có điểm cắt lỗ. Mức Cắt lỗ (Stop Loss) và Chốt lời (Take Profit) được chiếu trực quan trên biểu đồ trước khi đặt lệnh.
                </p>

                <div className="space-y-2 pt-1 text-xs">
                  <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/40 flex justify-between items-center">
                    <span className="text-emerald-300 font-bold">CHỐT LỜI (TP)</span>
                    <span className="text-emerald-400 font-mono font-bold">$256.00 (+$75.80 / +3.05%)</span>
                  </div>
                  <div className="p-2.5 rounded bg-rose-950/40 border border-rose-500/40 flex justify-between items-center">
                    <span className="text-rose-300 font-bold">CẮT LỖ (SL)</span>
                    <span className="text-rose-400 font-mono font-bold">$244.50 (-$39.20 / -1.58%)</span>
                  </div>
                  <div className="p-2 rounded bg-[#0A101C] border border-[#1E293B] flex justify-between text-slate-300">
                    <span>TỶ LỆ LỢI NHUẬN/RỦI RO (R:R):</span>
                    <span className="font-bold text-blue-400">1 : 1.93 (ĐẠT CHUẨN)</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeStage === 4 && (
              <motion.div
                key="stage-4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="space-y-3 font-mono"
              >
                <div className="text-xs font-bold text-blue-400 tracking-wider">GIAI ĐOẠN 04 // KHỚP LỆNH & ĐỐI SOÁT</div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-sans uppercase">
                  Khớp lệnh & Bằng chứng
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                  Khớp lệnh dưới 1 giây trực tiếp trên sổ lệnh. Vị thế được mở và ghi nhận ngay lập tức vào nhật ký rủi ro của học viên.
                </p>

                {/* Animated Order Lifecycle Progress */}
                <div className="p-3 rounded bg-[#0A101C] border border-[#1E293B] space-y-2 text-xs">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">VÒNG ĐỜI KHỚP LỆNH:</div>
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-400">GỬI LỆNH</span>
                    <span className="text-slate-600">→</span>
                    <span className="text-blue-400">ĐANG KHỚP</span>
                    <span className="text-slate-600">→</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      ĐÃ KHỚP
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#182338] space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Giá trị danh mục:</span>
                      <span className="text-white font-bold">$100,000 → $102,450.00</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Lợi nhuận ròng (P&L):</span>
                      <span className="text-emerald-400 font-bold">+$2,450.00 (+2.45%)</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* RIGHT COLUMN: The Interactive StockSim Terminal Workstation */}
          <div className="lg:col-span-8 rounded-xl border border-[#212D42] bg-[#0A0F1A] shadow-2xl overflow-hidden font-mono text-xs">
            {/* Top Terminal Strip */}
            <div className="bg-[#0D1525] border-b border-[#212D42] px-3.5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">AAPL (NASDAQ)</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-800/40">
                  CỔ PHIẾU GIAO NGAY
                </span>
                <span className="text-slate-400 hidden sm:inline">• $248.42 USD</span>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-500">CHẾ ĐỘ SÀN:</span>
                <span className="text-blue-400 font-bold">
                  {activeStage === 1
                    ? 'BƯỚC 1: BIỂU ĐỒ THỊ TRƯỜNG'
                    : activeStage === 2
                    ? 'BƯỚC 2: PHIẾU ĐẶT LỆNH'
                    : activeStage === 3
                    ? 'BƯỚC 3: LỚP BẢO VỆ RỦI RO'
                    : 'BƯỚC 4: KHỚP LỆNH HOÀN TẤT'}
                </span>
              </div>
            </div>

            {/* Terminal Inner Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#212D42]">
              {/* Candlestick Chart Area (8 Cols) */}
              <div
                className={`md:col-span-8 p-3 bg-[#080D18] flex flex-col justify-between h-72 sm:h-80 transition-opacity duration-300 relative ${
                  activeStage === 2 ? 'opacity-40' : 'opacity-100'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-[#182338]">
                  <span className="font-bold text-slate-200">AAPL // NẾN 15 PHÚT</span>
                  <span className="text-blue-400 font-mono">CAO 249.80 / THẤP 242.10</span>
                </div>

                {/* SVG Candlestick Graphic with Reactive Horizontal SL/TP lines */}
                <div className="relative w-full h-full py-1">
                  <svg className="w-full h-full" viewBox="0 0 540 200" preserveAspectRatio="none">
                    <line x1="0" y1="40" x2="540" y2="40" stroke="#162235" strokeDasharray="3 3" />
                    <line x1="0" y1="90" x2="540" y2="90" stroke="#162235" strokeDasharray="3 3" />
                    <line x1="0" y1="140" x2="540" y2="140" stroke="#162235" strokeDasharray="3 3" />

                    {/* STAGE 3 & 4: Horizontal SL and TP Lines Extending Across Chart */}
                    {(activeStage === 3 || activeStage === 4) && (
                      <g>
                        {/* Take Profit (Green Line) */}
                        <motion.line
                          x1="0"
                          y1="45"
                          x2="540"
                          y2="45"
                          stroke="#10B981"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.6 }}
                        />
                        <rect x="420" y="35" width="115" height="18" fill="#064E3B" rx="3" />
                        <text x="425" y="48" fill="#34D399" fontSize="9" fontWeight="bold">
                          TP: $256.00 (+3.05%)
                        </text>

                        {/* Stop Loss (Red Line) */}
                        <motion.line
                          x1="0"
                          y1="160"
                          x2="540"
                          y2="160"
                          stroke="#EF4444"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.6 }}
                        />
                        <rect x="420" y="152" width="115" height="18" fill="#7F1D1D" rx="3" />
                        <text x="425" y="165" fill="#F87171" fontSize="9" fontWeight="bold">
                          SL: $244.50 (-1.58%)
                        </text>
                      </g>
                    )}

                    {/* Candlesticks Sequence */}
                    {HERO_CHART_DATA.slice(2, 14).map((c, i) => {
                      const x = 25 + i * 42;
                      const isBull = c.close >= c.open;
                      const color = isBull ? '#10B981' : '#F43F5E';
                      const minP = 82400;
                      const maxP = 84000;
                      const toY = (p: number) => 170 - ((p - minP) / (maxP - minP)) * 140;

                      return (
                        <g key={i}>
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
                </div>

                <div className="pt-1 border-t border-[#182338] flex items-center justify-between text-[9px] text-slate-500">
                  <span>09:30 MỞ CỬA</span>
                  <span>12:00</span>
                  <span className="text-blue-400 font-semibold">15:00 ĐÓNG CỬA</span>
                </div>
              </div>

              {/* Order Ticket & Execution Slip (4 Cols) */}
              <div
                className={`md:col-span-4 p-3 bg-[#070C16] flex flex-col justify-between transition-all duration-300 ${
                  activeStage === 2
                    ? 'ring-2 ring-blue-500 bg-[#0A101C]'
                    : activeStage === 3
                    ? 'ring-1 ring-amber-500/50'
                    : ''
                }`}
              >
                <div>
                  <div className="text-[10px] text-slate-400 pb-1 mb-2 border-b border-[#1A263A] flex justify-between font-bold">
                    <span>PHIẾU ĐẶT LỆNH</span>
                    <span className="text-blue-400">AAPL</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500">CHIỀU LỆNH</span>
                      <div className="p-1 rounded bg-emerald-950/70 border border-emerald-500/50 text-emerald-400 font-bold text-center mt-0.5">
                        MUA / LONG
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500">KHỐI LƯỢNG</span>
                      <div className="p-1.5 rounded bg-[#05080E] border border-[#212D42] text-white font-bold mt-0.5">
                        10 CỔ PHIẾU
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500">LOẠI LỆNH</span>
                      <div className="p-1.5 rounded bg-[#05080E] border border-[#212D42] text-blue-400 font-bold mt-0.5">
                        LỆNH THỊ TRƯỜNG
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Slip State */}
                <div className="pt-2 border-t border-[#1A263A]">
                  {activeStage === 4 ? (
                    <div className="p-2 rounded bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 text-center font-bold text-xs animate-pulse">
                      LỆNH ĐÃ KHỚP: 10 @ $248.42
                    </div>
                  ) : (
                    <div className="p-2 rounded bg-blue-600/30 border border-blue-500/50 text-blue-300 text-center font-bold text-xs">
                      SẴN SÀNG GỬI LỆNH
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Progress Bar at Bottom of Section */}
        <div className="pt-2 border-t border-[#182338] flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>TIẾN TRÌNH: BƯỚC {activeStage} / 4</span>
          <span>CUỘN XUỐNG ĐỂ TIẾP TỤC // TIẾP THEO: DỮ LIỆU THỊ TRƯỜNG</span>
        </div>
      </div>
    </section>
  );
};
