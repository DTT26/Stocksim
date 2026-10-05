import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Sparkles, Brain, Bot, ShieldAlert, Cpu, ArrowUpRight, 
  CheckCircle2, Eye, LineChart, FileText, Zap, Terminal, MessageSquare
} from 'lucide-react';

interface AiDemoTab {
  id: 'smc' | 'risk' | 'audit';
  label: string;
  badge: string;
  title: string;
  responsePreview: {
    heading: string;
    metrics: { label: string; value: string; color?: string }[];
    analysisText: string;
    advice: string;
  };
}

const AI_DEMO_TABS: AiDemoTab[] = [
  {
    id: 'smc',
    label: 'Cấu trúc SMC / ICT',
    badge: 'CẤU TRÚC THỊ TRƯỜNG',
    title: 'Phân tích cấu trúc đa khung thời gian',
    responsePreview: {
      heading: 'Khung 15m BTC/USDT: Kiểm định lại Vùng FVG thành công',
      metrics: [
        { label: 'Cấu trúc thị trường', value: 'CHoCH Tăng giá', color: 'text-emerald-400' },
        { label: 'Vùng phản ứng then chốt', value: 'Đáy FVG $82,400', color: 'text-blue-400' },
        { label: 'Mục tiêu thanh khoản', value: 'Thanh khoản Phe Mua $83,850', color: 'text-amber-400' },
        { label: 'Tỷ lệ R:R dự phóng', value: '1 : 2.45', color: 'text-emerald-400' },
      ],
      analysisText: 'AI phát hiện pha quét thanh khoản đáy phiên Á (Asian Low Liquidity Sweep) kèm dịch chuyển cấu trúc thị trường (MSS) rõ nét trên nến 15 phút. Vùng FVG chưa lấp tại $82,400 đóng vai trò hỗ trợ tổ chức đáng tin cậy.',
      advice: 'Đặt lệnh cắt lỗ (SL) nghiêm ngặt dưới râu nến quét thanh khoản ($81,820). Tránh can thiệp thủ công khi giá bước vào giai đoạn tích lũy.',
    },
  },
  {
    id: 'risk',
    label: 'Bảo vệ Quỹ',
    badge: 'CHỐNG VI PHẠM TÀI KHOẢN',
    title: 'Thuật toán tính khối lượng chuẩn tổ chức',
    responsePreview: {
      heading: 'Tính toán tham số rủi ro Thử thách Quỹ (Tài khoản $100,000)',
      metrics: [
        { label: 'Mức rủi ro tối đa', value: '$1,500 USD (1.5%)', color: 'text-blue-400' },
        { label: 'Khoảng cách Cắt lỗ', value: '580 USD (0.7%)', color: 'text-slate-300' },
        { label: 'Khối lượng khuyến nghị', value: '2.58 Hợp đồng BTC', color: 'text-emerald-400' },
        { label: 'Dư địa sụt giảm ngày', value: 'Còn lại 3.5% hôm nay', color: 'text-emerald-400' },
      ],
      analysisText: 'Kiểm toán rủi ro trước khi vào lệnh theo đúng quy chuẩn thử thách quỹ. Với mức rủi ro mục tiêu 1.5% và Cắt lỗ tại $81,820, khối lượng an toàn tối đa là 2.58 hợp đồng nhằm đảm bảo không bao giờ chạm giới hạn sụt giảm ngày 4%.',
      advice: 'Tham số lệnh đã được duyệt an toàn. Cơ chế bảo vệ chủ động: Mọi biến động giật giá ngược chiều sẽ tự động đóng vị thế trước khi chạm ngưỡng vi phạm quy tắc quỹ.',
    },
  },
  {
    id: 'audit',
    label: 'Kiểm toán lệnh',
    badge: 'KIỂM TOÁN SAU GIAO DỊCH',
    title: 'Bảng đánh giá kỷ luật vào lệnh',
    responsePreview: {
      heading: 'Báo cáo kiểm toán lệnh #4912 (Khớp lệnh AAPL Lợi nhuận +$235 USD)',
      metrics: [
        { label: 'Điểm kỷ luật AI', value: '96 / 100 (Hạng A+)', color: 'text-emerald-400' },
        { label: 'Tuân thủ Cắt lỗ', value: '100% (Thiết lập sau 14s)', color: 'text-blue-400' },
        { label: 'Tâm lý giao dịch', value: 'Bình tĩnh • Không FOMO', color: 'text-emerald-400' },
        { label: 'Hiệu quả chốt lời', value: 'Khớp tại mục tiêu +2.1R', color: 'text-amber-400' },
      ],
      analysisText: 'Lệnh MUA AAPL thể hiện sự tuân thủ bài bản mô hình Phá vỡ biên độ mở phiên (ORB). Điểm vào lệnh chuẩn xác khi nến 15m đóng cửa trên đỉnh trước giờ mở cửa và giữ vững tâm lý đến khi chạm TP.',
      advice: 'Gợi ý tối ưu: Cân nhắc dời Stop Loss về Điểm hòa vốn (Breakeven) ngay khi đạt lợi nhuận +1.5R để triệt tiêu hoàn toàn rủi ro đuôi.',
    },
  },
];

export const CinematicAiMentor: React.FC = () => {
  const [activeTabId, setActiveTabId] = useState<'smc' | 'risk' | 'audit'>('smc');

  const activeTab = AI_DEMO_TABS.find(t => t.id === activeTabId) || AI_DEMO_TABS[0];

  return (
    <section id="ai-tutor" className="relative w-full py-24 bg-[#080D18] border-b border-[#1E293B] text-slate-100 overflow-hidden">
      {/* Background Glow & Circuit Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-25">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(59,130,246,0.12),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#16233B_1px,transparent_1px),linear-gradient(to_bottom,#16233B_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14 pb-6 border-b border-[#182338]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0F1B33] border border-blue-500/30 text-blue-400 font-mono text-xs uppercase tracking-widest mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>TRỢ LÝ AI & HUẤN LUYỆN VIÊN GIAO DỊCH</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase font-sans">
              TRỢ LÝ GIAO DỊCH AI. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                NÂNG TẦM MỌI LỆNH ĐẶT.
              </span>
            </h2>

            <p className="mt-3 text-sm sm:text-base text-slate-400 font-sans leading-relaxed">
              Vượt xa một chatbot thông thường. StockSim AI là huấn luyện viên giao dịch trực tiếp: lập bản đồ cấu trúc thị trường SMC/ICT đa khung thời gian, tự động tính khối lượng chuẩn thử thách quỹ và kiểm toán kỷ luật lệnh sau mỗi phiên.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="px-3.5 py-2 rounded-lg bg-[#0C1424] border border-blue-500/30 text-blue-300 flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-400" />
              <span>CƠ SỞ DỮ LIỆU TÀI CHÍNH RAG 24/7</span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 4 CORE CAPABILITY PILLARS                                     */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="p-5 rounded-xl bg-[#0B1120] border border-[#1A263D] hover:border-blue-500/40 transition-all space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <LineChart className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm font-sans">
              Cấu trúc thị trường SMC & ICT
            </h4>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Tự động phát hiện Fair Value Gap (FVG), Order Block, Quét thanh khoản, BOS và CHoCH trên đa khung thời gian.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0B1120] border border-[#1A263D] hover:border-blue-500/40 transition-all space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm font-sans">
              Chống vi phạm quỹ & Tính khối lượng
            </h4>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Tự động tính toán khối lượng lệnh gắn chặt với hạn mức rủi ro tài khoản, ngăn chặn nguy cơ chạm giới hạn lỗ ngày.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0B1120] border border-[#1A263D] hover:border-blue-500/40 transition-all space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm font-sans">
              Kiểm toán & Đánh giá sau phiên
            </h4>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Đánh giá kỷ luật điểm vào/ra, so sánh R:R kế hoạch với thực tế, cảnh báo tâm lý gỡ gạc hay nhồi lệnh quá mức.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0B1120] border border-[#1A263D] hover:border-blue-500/40 transition-all space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm font-sans">
              Trí tuệ tài chính RAG 24/7
            </h4>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Trợ lý tương tác trực tiếp ngay trên Sàn Giao Dịch, giải đáp Hành động giá, phương pháp Wyckoff và góc nhìn vĩ mô.
            </p>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* INTERACTIVE AI DIAGNOSTIC TERMINAL PREVIEW                    */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-[#0B1120] border border-[#1E2C44] rounded-2xl overflow-hidden shadow-2xl">
          {/* Diagnostic Console Bar */}
          <div className="bg-[#0E1526] border-b border-[#1C283F] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="font-mono text-xs font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span>NHÂN TÍNH TOÁN STOCKSIM AI v2.8</span>
              </span>
            </div>

            {/* 3 Interactive Prompt Switchers */}
            <div className="flex items-center gap-2 font-mono text-xs">
              {AI_DEMO_TABS.map(tab => {
                const isActive = activeTabId === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 border-blue-500 text-white font-bold shadow-md shadow-blue-900/40'
                        : 'bg-[#080D18] border-[#1A2538] text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Diagnostic Content Body */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-6 sm:p-8 space-y-6"
            >
              {/* Header Analysis Pill */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#162235]">
                <div>
                  <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest px-2 py-0.5 rounded bg-blue-950/40 border border-blue-800/40">
                    {activeTab.badge}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white font-sans mt-2">
                    {activeTab.responsePreview.heading}
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ĐỘNG CƠ DEEPSEEK-FINTECH ĐÃ KIỂM ĐỊNH</span>
                </div>
              </div>

              {/* Real-time Telemetry Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
                {activeTab.responsePreview.metrics.map((m, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#070B14] border border-[#162235]">
                    <div className="text-[10px] text-slate-500 uppercase">{m.label}</div>
                    <div className={`text-base font-bold mt-1 ${m.color || 'text-white'}`}>
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Detailed Reasoning Transcript */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-mono text-xs">
                <div className="lg:col-span-8 p-4 rounded-xl bg-[#070B14] border border-[#1A263D] space-y-2">
                  <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-blue-400" />
                    <span>Biên bản lập luận & Khớp lệnh của AI</span>
                  </div>
                  <p className="text-slate-300 font-sans text-xs sm:text-sm leading-relaxed">
                    {activeTab.responsePreview.analysisText}
                  </p>
                </div>

                <div className="lg:col-span-4 p-4 rounded-xl bg-[#0E172B] border border-blue-500/30 space-y-2">
                  <div className="text-[10px] text-blue-300 uppercase flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Khuyến nghị kỷ luật</span>
                  </div>
                  <p className="text-slate-200 font-sans text-xs leading-relaxed">
                    {activeTab.responsePreview.advice}
                  </p>
                </div>
              </div>

              {/* Terminal Direct Action Link */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                <Link
                  to="/trade/btcusdt"
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs sm:text-sm font-bold tracking-wide uppercase transition-all shadow-lg shadow-blue-950 flex items-center gap-2 group cursor-pointer"
                >
                  <Terminal className="w-4 h-4 text-blue-200" />
                  <span>TRẢI NGHIỆM AI TRÊN SÀN GIAO DỊCH</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>

                <div className="text-xs font-mono text-slate-400">
                  AI hỗ trợ trong quá trình luyện tập • Tự động khóa trong các kỳ thi đánh giá quỹ
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
