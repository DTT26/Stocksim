import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Sparkles, Brain, Bot, ShieldAlert, Cpu, ArrowUpRight, 
  CheckCircle2, Eye, LineChart, FileText, Zap, Terminal, MessageSquare
} from 'lucide-react';
import { useI18n } from '../../../contexts/I18nContext';

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

const getAiDemoTabs = (lang: 'vi' | 'en'): AiDemoTab[] => [
  {
    id: 'smc',
    label: lang === 'vi' ? 'Cấu trúc SMC / ICT' : 'SMC / ICT Structure',
    badge: lang === 'vi' ? 'CẤU TRÚC THỊ TRƯỜNG' : 'MARKET STRUCTURE',
    title: lang === 'vi' ? 'Phân tích cấu trúc đa khung thời gian' : 'Multi-Timeframe Structure Analysis',
    responsePreview: {
      heading: lang === 'vi' 
        ? 'Khung 15m BTC/USDT: Kiểm định lại Vùng FVG thành công' 
        : 'BTC/USDT 15m: Successful FVG Retest & Confirmation',
      metrics: [
        { label: lang === 'vi' ? 'Cấu trúc thị trường' : 'Market Structure', value: lang === 'vi' ? 'CHoCH Tăng giá' : 'Bullish CHoCH', color: 'text-emerald-400' },
        { label: lang === 'vi' ? 'Vùng phản ứng then chốt' : 'Key Reaction Zone', value: lang === 'vi' ? 'Đáy FVG $82,400' : 'FVG Low $82,400', color: 'text-blue-400' },
        { label: lang === 'vi' ? 'Mục tiêu thanh khoản' : 'Liquidity Target', value: lang === 'vi' ? 'Thanh khoản Mua $83,850' : 'Buy-side Liq $83,850', color: 'text-amber-400' },
        { label: lang === 'vi' ? 'Tỷ lệ R:R dự phóng' : 'Projected R:R', value: '1 : 2.45', color: 'text-emerald-400' },
      ],
      analysisText: lang === 'vi'
        ? 'AI phát hiện pha quét thanh khoản đáy phiên Á (Asian Low Liquidity Sweep) kèm dịch chuyển cấu trúc thị trường (MSS) rõ nét trên nến 15 phút. Vùng FVG chưa lấp tại $82,400 đóng vai trò hỗ trợ tổ chức đáng tin cậy.'
        : 'AI detected an Asian Low Liquidity Sweep with distinct Market Structure Shift (MSS) on the 15m candle. The unfilled FVG at $82,400 acts as high-probability institutional support.',
      advice: lang === 'vi'
        ? 'Đặt lệnh cắt lỗ (SL) nghiêm ngặt dưới râu nến quét thanh khoản ($81,820). Tránh can thiệp thủ công khi giá bước vào giai đoạn tích lũy.'
        : 'Place strict Stop Loss below the sweep wick ($81,820). Refrain from premature manual intervention during consolidation.',
    },
  },
  {
    id: 'risk',
    label: lang === 'vi' ? 'Bảo vệ Quỹ' : 'Prop Protection',
    badge: lang === 'vi' ? 'CHỐNG VI PHẠM TÀI KHOẢN' : 'ACCOUNT BREACH DEFENSE',
    title: lang === 'vi' ? 'Thuật toán tính khối lượng chuẩn tổ chức' : 'Institutional Position Sizing Algorithm',
    responsePreview: {
      heading: lang === 'vi'
        ? 'Tính toán tham số rủi ro Thử thách Quỹ (Tài khoản $100,000)'
        : 'Prop Firm Risk Parameter Calculation ($100k Account)',
      metrics: [
        { label: lang === 'vi' ? 'Mức rủi ro tối đa' : 'Max Risk Limit', value: '$1,500 USD (1.5%)', color: 'text-blue-400' },
        { label: lang === 'vi' ? 'Khoảng cách Cắt lỗ' : 'Stop Loss Distance', value: '580 USD (0.7%)', color: 'text-slate-300' },
        { label: lang === 'vi' ? 'Khối lượng khuyến nghị' : 'Recommended Size', value: lang === 'vi' ? '2.58 Hợp đồng BTC' : '2.58 BTC Contracts', color: 'text-emerald-400' },
        { label: lang === 'vi' ? 'Dư địa sụt giảm ngày' : 'Daily Buffer', value: lang === 'vi' ? 'Còn lại 3.5% hôm nay' : '3.5% buffer today', color: 'text-emerald-400' },
      ],
      analysisText: lang === 'vi'
        ? 'Kiểm toán rủi ro trước khi vào lệnh theo đúng quy chuẩn thử thách quỹ. Với mức rủi ro mục tiêu 1.5% và Cắt lỗ tại $81,820, khối lượng an toàn tối đa là 2.58 hợp đồng nhằm đảm bảo không bao giờ chạm giới hạn sụt giảm ngày 4%.'
        : 'Pre-trade risk audit compliant with prop firm funded rules. At 1.5% target risk and Stop Loss at $81,820, maximum safe sizing is 2.58 contracts to preserve daily 4% limit.',
      advice: lang === 'vi'
        ? 'Tham số lệnh đã được duyệt an toàn. Cơ chế bảo vệ chủ động: Mọi biến động giật giá ngược chiều sẽ tự động đóng vị thế trước khi chạm ngưỡng vi phạm quy tắc quỹ.'
        : 'Trade parameters verified. Active guardrails enabled: Volatility spikes will trigger protective stops before any breach threshold.',
    },
  },
  {
    id: 'audit',
    label: lang === 'vi' ? 'Kiểm toán lệnh' : 'Trade Audit',
    badge: lang === 'vi' ? 'KIỂM TOÁN SAU GIAO DỊCH' : 'POST-TRADE AUDIT',
    title: lang === 'vi' ? 'Bảng đánh giá kỷ luật vào lệnh' : 'Execution Discipline Scorecard',
    responsePreview: {
      heading: lang === 'vi'
        ? 'Báo cáo kiểm toán lệnh #4912 (Khớp lệnh AAPL Lợi nhuận +$235 USD)'
        : 'Audit Report #4912 (AAPL Filled • Net Profit +$235 USD)',
      metrics: [
        { label: lang === 'vi' ? 'Điểm kỷ luật AI' : 'AI Discipline Score', value: lang === 'vi' ? '96 / 100 (Hạng A+)' : '96 / 100 (Grade A+)', color: 'text-emerald-400' },
        { label: lang === 'vi' ? 'Tuân thủ Cắt lỗ' : 'Stop Loss Compliance', value: lang === 'vi' ? '100% (Thiết lập sau 14s)' : '100% (Set in 14s)', color: 'text-blue-400' },
        { label: lang === 'vi' ? 'Tâm lý giao dịch' : 'Trader Psychology', value: lang === 'vi' ? 'Bình tĩnh • Không FOMO' : 'Calm • Zero FOMO', color: 'text-emerald-400' },
        { label: lang === 'vi' ? 'Hiệu quả chốt lời' : 'Take-Profit Metric', value: lang === 'vi' ? 'Khớp tại mục tiêu +2.1R' : 'Hit Target +2.1R', color: 'text-amber-400' },
      ],
      analysisText: lang === 'vi'
        ? 'Lệnh MUA AAPL thể hiện sự tuân thủ bài bản mô hình Phá vỡ biên độ mở phiên (ORB). Điểm vào lệnh chuẩn xác khi nến 15m đóng cửa trên đỉnh trước giờ mở cửa và giữ vững tâm lý đến khi chạm TP.'
        : 'AAPL BUY demonstrated structured adherence to Opening Range Breakout (ORB). Validated entry on 15m close above pre-market high with disciplined composure through TP.',
      advice: lang === 'vi'
        ? 'Gợi ý tối ưu: Cân nhắc dời Stop Loss về Điểm hòa vốn (Breakeven) ngay khi đạt lợi nhuận +1.5R để triệt tiêu hoàn toàn rủi ro đuôi.'
        : 'Optimization suggestion: Consider trailing Stop Loss to Breakeven once +1.5R is reached to fully eliminate tail risk.',
    },
  },
];

export const CinematicAiMentor: React.FC = () => {
  const { lang } = useI18n();
  const [activeTabId, setActiveTabId] = useState<'smc' | 'risk' | 'audit'>('smc');

  const demoTabs = getAiDemoTabs(lang);
  const activeTab = demoTabs.find(t => t.id === activeTabId) || demoTabs[0];

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
              <span>{lang === 'vi' ? 'TRỢ LÝ AI & HUẤN LUYỆN VIÊN GIAO DỊCH' : 'AI ASSISTANT & PROP COACH'}</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase font-sans">
              {lang === 'vi' ? 'TRỢ LÝ GIAO DỊCH AI.' : 'AI TRADING ASSISTANT.'} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                {lang === 'vi' ? 'NÂNG TẦM MỌI LỆNH ĐẶT.' : 'ELEVATE EVERY EXECUTION.'}
              </span>
            </h2>

            <p className="mt-3 text-sm sm:text-base text-slate-400 font-sans leading-relaxed">
              {lang === 'vi'
                ? 'Vượt xa một chatbot thông thường. StockSim AI là huấn luyện viên giao dịch trực tiếp: lập bản đồ cấu trúc thị trường SMC/ICT đa khung thời gian, tự động tính khối lượng chuẩn thử thách quỹ và kiểm toán kỷ luật lệnh sau mỗi phiên.'
                : 'Far beyond a generic chatbot. StockSim AI is your live trading coach: mapping multi-timeframe SMC/ICT structures, automating prop-funded position sizing, and auditing trade discipline after each session.'}
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="px-3.5 py-2 rounded-lg bg-[#0C1424] border border-blue-500/30 text-blue-300 flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-400" />
              <span>{lang === 'vi' ? 'CƠ SỞ DỮ LIỆU TÀI CHÍNH RAG 24/7' : '24/7 RAG FINANCIAL INTELLIGENCE'}</span>
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
              {lang === 'vi' ? 'Cấu trúc thị trường SMC & ICT' : 'SMC & ICT Market Structure'}
            </h4>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              {lang === 'vi'
                ? 'Tự động phát hiện Fair Value Gap (FVG), Order Block, Quét thanh khoản, BOS và CHoCH trên đa khung thời gian.'
                : 'Automated detection of Fair Value Gaps (FVG), Order Blocks, Liquidity Sweeps, BOS, and CHoCH on multi-timeframe charts.'}
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0B1120] border border-[#1A263D] hover:border-blue-500/40 transition-all space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm font-sans">
              {lang === 'vi' ? 'Chống vi phạm quỹ & Tính khối lượng' : 'Prop Breach Defense & Sizing'}
            </h4>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              {lang === 'vi'
                ? 'Tự động tính toán khối lượng lệnh gắn chặt với hạn mức rủi ro tài khoản, ngăn chặn nguy cơ chạm giới hạn lỗ ngày.'
                : 'Automated position sizing strictly tied to account risk thresholds, preventing daily drawdown breaches.'}
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0B1120] border border-[#1A263D] hover:border-blue-500/40 transition-all space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm font-sans">
              {lang === 'vi' ? 'Kiểm toán & Đánh giá sau phiên' : 'Post-Session Trade Audit'}
            </h4>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              {lang === 'vi'
                ? 'Đánh giá kỷ luật điểm vào/ra, so sánh R:R kế hoạch với thực tế, cảnh báo tâm lý gỡ gạc hay nhồi lệnh quá mức.'
                : 'Evaluate entry/exit discipline, compare planned vs realized R:R, and flag revenge trading or over-leveraging.'}
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0B1120] border border-[#1A263D] hover:border-blue-500/40 transition-all space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm font-sans">
              {lang === 'vi' ? 'Trí tuệ tài chính RAG 24/7' : '24/7 RAG Financial Tutor'}
            </h4>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              {lang === 'vi'
                ? 'Trợ lý tương tác trực tiếp ngay trên Sàn Giao Dịch, giải đáp Hành động giá, phương pháp Wyckoff và góc nhìn vĩ mô.'
                : 'Direct interactive assistant in the Trading Terminal answering Price Action, Wyckoff methodology, and macro context.'}
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
                <span>{lang === 'vi' ? 'NHÂN TÍNH TOÁN STOCKSIM AI v2.8' : 'STOCKSIM AI ENGINE v2.8'}</span>
              </span>
            </div>

            {/* 3 Interactive Prompt Switchers */}
            <div className="flex items-center gap-2 font-mono text-xs">
              {demoTabs.map(tab => {
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
                  <span>{lang === 'vi' ? 'ĐỘNG CƠ DEEPSEEK-FINTECH ĐÃ KIỂM ĐỊNH' : 'DEEPSEEK-FINTECH ENGINE VERIFIED'}</span>
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
                    <span>{lang === 'vi' ? 'Biên bản lập luận & Khớp lệnh của AI' : 'AI Reasoning & Execution Transcript'}</span>
                  </div>
                  <p className="text-slate-300 font-sans text-xs sm:text-sm leading-relaxed">
                    {activeTab.responsePreview.analysisText}
                  </p>
                </div>

                <div className="lg:col-span-4 p-4 rounded-xl bg-[#0E172B] border border-blue-500/30 space-y-2">
                  <div className="text-[10px] text-blue-300 uppercase flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{lang === 'vi' ? 'Khuyến nghị kỷ luật' : 'Discipline Guidance'}</span>
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
                  <span>{lang === 'vi' ? 'TRẢI NGHIỆM AI TRÊN SÀN GIAO DỊCH' : 'EXPERIENCE AI IN TRADING TERMINAL'}</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>

                <div className="text-xs font-mono text-slate-400">
                  {lang === 'vi'
                    ? 'AI hỗ trợ trong quá trình luyện tập • Tự động khóa trong các kỳ thi đánh giá quỹ'
                    : 'AI active during practice • Automatically disabled during funded challenge exams'}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
