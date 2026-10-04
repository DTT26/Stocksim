import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Trophy, ShieldCheck, Lock, Award, ArrowUpRight, 
  CheckCircle2, AlertTriangle, RefreshCw, Zap, TrendingUp, Sparkles, Scale
} from 'lucide-react';

interface PropFirmLevel {
  id: number;
  levelName: string;
  badge: string;
  capitalUSD: number;
  profitTargetPercent: number;
  dailyLossLimitPercent: number;
  maxDrawdownPercent: number;
  minTradingDays: number;
  maxLeverage: number;
  description: string;
  highlightTag?: string;
}

const PROP_FIRM_LEVELS: PropFirmLevel[] = [
  {
    id: 1,
    levelName: 'Apprentice',
    badge: 'Cấp 1',
    capitalUSD: 10_000,
    profitTargetPercent: 8,
    dailyLossLimitPercent: 4,
    maxDrawdownPercent: 8,
    minTradingDays: 2,
    maxLeverage: 20,
    description: 'Đợt đánh giá nhập môn lý tưởng để rèn luyện thói quen quản trị drawdown nghiêm ngặt và phân bổ khối lượng vị thế chuẩn xác.',
  },
  {
    id: 2,
    levelName: 'Emerging',
    badge: 'Cấp 2',
    capitalUSD: 25_000,
    profitTargetPercent: 8,
    dailyLossLimitPercent: 4.5,
    maxDrawdownPercent: 8,
    minTradingDays: 3,
    maxLeverage: 30,
    description: 'Cấp vốn quy mô $25.000 USD. Yêu cầu duy trì tỷ lệ Lợi nhuận/Rủi ro (R:R) dương ổn định qua nhiều phiên giao dịch.',
  },
  {
    id: 3,
    levelName: 'Professional',
    badge: 'Cấp 3',
    capitalUSD: 50_000,
    profitTargetPercent: 10,
    dailyLossLimitPercent: 5,
    maxDrawdownPercent: 10,
    minTradingDays: 3,
    maxLeverage: 50,
    description: 'Chuẩn đánh giá tổ chức dành cho trader có phương pháp kỹ thuật rõ ràng và kỷ luật tâm lý vững vàng.',
    highlightTag: 'PHỔ BIẾN NHẤT',
  },
  {
    id: 4,
    levelName: 'Elite',
    badge: 'Cấp 4',
    capitalUSD: 100_000,
    profitTargetPercent: 10,
    dailyLossLimitPercent: 5,
    maxDrawdownPercent: 10,
    minTradingDays: 4,
    maxLeverage: 50,
    description: 'Quy mô vốn 6 con số ($100.000 USD). Đòi hỏi sức bền kỷ luật và quản trị rủi ro vững vàng dưới áp lực biến động cao.',
  },
  {
    id: 5,
    levelName: 'Master',
    badge: 'Cấp 5',
    capitalUSD: 200_000,
    profitTargetPercent: 10,
    dailyLossLimitPercent: 5,
    maxDrawdownPercent: 10,
    minTradingDays: 5,
    maxLeverage: 100,
    description: 'Cấp vốn cao cấp dành cho nhà phân tích định lượng hệ thống và swing trader có độ tin cậy lệnh cao.',
  },
  {
    id: 6,
    levelName: 'Legend',
    badge: 'Cấp 6',
    capitalUSD: 500_000,
    profitTargetPercent: 12,
    dailyLossLimitPercent: 4,
    maxDrawdownPercent: 8,
    minTradingDays: 5,
    maxLeverage: 500,
    description: 'Đỉnh cao phân bổ vốn tổ chức $500.000 USD với các điều kiện rủi ro khắt khe nhất. Vinh danh các trader xuất sắc nhất.',
    highlightTag: 'CẤP VỐN CAO CẤP',
  },
];

export const CinematicPropFirmChallenge: React.FC = () => {
  const [selectedLevelId, setSelectedLevelId] = useState<number>(3); // Default to $50k Professional

  const currentLevel = PROP_FIRM_LEVELS.find(l => l.id === selectedLevelId) || PROP_FIRM_LEVELS[2];
  const targetProfitUSD = (currentLevel.profitTargetPercent / 100) * currentLevel.capitalUSD;
  const dailyLossUSD = (currentLevel.dailyLossLimitPercent / 100) * currentLevel.capitalUSD;
  const maxDrawdownUSD = (currentLevel.maxDrawdownPercent / 100) * currentLevel.capitalUSD;

  return (
    <section id="challenge" className="relative w-full py-24 bg-[#070B14] border-b border-[#1E293B] text-slate-100 overflow-hidden">
      {/* Background Subtle Coordinate Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#16233B_1px,transparent_1px),linear-gradient(to_bottom,#16233B_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-6 border-b border-[#182338]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#101A2D] border border-amber-500/30 text-amber-400 font-mono text-xs uppercase tracking-widest mb-3">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>THỬ THÁCH CẤP VỐN QUỸ PROP FIRM • ĐÁNH GIÁ ĐA CẤP ĐỘ</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase font-sans">
              GIAO DỊCH VỐN TỔ CHỨC. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400">
                KHẲNG ĐỊNH NĂNG LỰC.
              </span>
            </h2>

            <p className="mt-3 text-sm sm:text-base text-slate-400 font-sans leading-relaxed">
              Trải nghiệm quy trình đánh giá chuẩn quỹ Prop Firm chuyên nghiệp. Vượt qua 6 cấp độ thử thách khắt khe từ <strong>$10.000</strong> đến <strong>$500.000 USD</strong> với dữ liệu sổ lệnh thật từ sàn, hệ thống giám sát drawdown tự động và chứng chỉ trader được mã hóa minh bạch.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 font-mono text-xs">
            <div className="px-3 py-2 rounded-lg bg-[#0C1322] border border-amber-500/30 text-amber-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>AI TUTOR TỰ ĐỘNG KHÓA TRONG THỬ THÁCH ĐỂ ĐẢM BẢO TÍNH MINH BẠCH</span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 6-LEVEL SELECTOR PILLS                                        */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {PROP_FIRM_LEVELS.map(level => {
            const isSelected = selectedLevelId === level.id;
            return (
              <button
                key={level.id}
                onClick={() => setSelectedLevelId(level.id)}
                className={`relative p-3.5 rounded-xl border text-left font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#151F33] border-amber-500 shadow-lg shadow-amber-950/40 translate-y-[-2px]'
                    : 'bg-[#0A0F1C] border-[#1A2538] hover:border-slate-500 hover:bg-[#0E1526]'
                }`}
              >
                {level.highlightTag && (
                  <span className="absolute -top-2.5 right-2 px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-black uppercase">
                    {level.highlightTag}
                  </span>
                )}
                <div className="text-[11px] text-slate-400 font-bold uppercase">{level.badge} • {level.levelName}</div>
                <div className={`text-lg font-black mt-1 ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                  ${(level.capitalUSD / 1000)}K USD
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Mục tiêu: +{level.profitTargetPercent}%</div>
              </button>
            );
          })}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ACTIVE LEVEL WORKBENCH & RULE AUDIT MATRIX                    */}
        {/* ------------------------------------------------------------- */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLevel.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* LEFT: LEVEL COCKPIT & PERFORMANCE BENCHMARK (7 cols) */}
            <div className="lg:col-span-7 bg-[#0B1120] border border-[#1E2C44] rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#162235]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-mono font-bold">
                      {currentLevel.badge}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                      Quy mô phân bổ vốn: {currentLevel.levelName}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 font-sans">
                    {currentLevel.description}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-mono text-slate-500 uppercase">Hạn Mức Vốn Cấp</div>
                  <div className="text-3xl sm:text-4xl font-black font-mono text-amber-400">
                    ${currentLevel.capitalUSD.toLocaleString('en-US')} <span className="text-xs text-slate-400">USD</span>
                  </div>
                </div>
              </div>

              {/* Strict Risk & Profit Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-[#070B14] border border-[#1A263D]">
                  <div className="text-[11px] text-slate-400 uppercase flex items-center justify-between">
                    <span>Mục Tiêu Lợi Nhuận</span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    +{currentLevel.profitTargetPercent}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Lợi nhuận cần đạt: +${targetProfitUSD.toLocaleString('en-US')}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#070B14] border border-[#1A263D]">
                  <div className="text-[11px] text-slate-400 uppercase flex items-center justify-between">
                    <span>Giới Hạn Lỗ Ngày</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <div className="text-2xl font-black text-rose-400 mt-1">
                    -{currentLevel.dailyLossLimitPercent}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Chạm ngưỡng vi phạm: -${dailyLossUSD.toLocaleString('en-US')}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#070B14] border border-[#1A263D]">
                  <div className="text-[11px] text-slate-400 uppercase flex items-center justify-between">
                    <span>Mức Sụt Giảm Tối Đa (DD)</span>
                    <Scale className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <div className="text-2xl font-black text-rose-400 mt-1">
                    -{currentLevel.maxDrawdownPercent}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Ngưỡng cắt lỗ tối đa: -${maxDrawdownUSD.toLocaleString('en-US')}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#070B14] border border-[#1A263D]">
                  <div className="text-[11px] text-slate-400 uppercase">Đòn Bẩy Tối Đa</div>
                  <div className="text-2xl font-black text-blue-400 mt-1">
                    {currentLevel.maxLeverage}X
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Áp dụng theo quy định thử thách
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#070B14] border border-[#1A263D]">
                  <div className="text-[11px] text-slate-400 uppercase">Số Ngày GD Tối Thiểu</div>
                  <div className="text-2xl font-black text-white mt-1">
                    {currentLevel.minTradingDays} Ngày
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Ngăn chặn yếu tố may rủi 1 lệnh
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#070B14] border border-[#1A263D]">
                  <div className="text-[11px] text-slate-400 uppercase">Làm Mới Hàng Tuần</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    4 Lần / Tuần
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Tái lập định kỳ mỗi thứ Hai
                  </div>
                </div>
              </div>

              {/* Action Link: Directly enters Terminal to launch the challenge */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                <Link
                  to="/trade/btcusdt"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-mono text-sm font-bold tracking-wider uppercase transition-all shadow-xl shadow-amber-950/50 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-slate-950" />
                  <span>VÀO TERMINAL THỬ THÁCH QUỸ</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>

                <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Khớp lệnh sổ lệnh thật L2 từ Binance & BingX</span>
                </div>
              </div>
            </div>

            {/* RIGHT: RULES ENFORCEMENT & CERTIFICATE PREVIEW (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Card 1: Objective Evaluation Rules */}
              <div className="bg-[#0B1120] border border-[#1E2C44] rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#162235]">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                    Quy Tắc Đánh Giá Minh Bạch
                  </h4>
                </div>

                <div className="space-y-3 font-sans text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white font-mono">100% Thanh Khoản Thực Tế:</strong> Khớp trực tiếp theo độ sâu sổ lệnh L2 của Binance & BingX, không can thiệp nến ảo hay trượt giá nhân tạo.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-300 font-mono">Khóa AI Tự Động:</strong> Khi tham gia thử thách, AI gợi ý sẽ tự động khóa để đánh giá chính xác năng lực ra quyết định độc lập của bạn.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white font-mono">Cắt Lỗ Tự Động Khi Vi Phạm:</strong> Hệ thống tự động hủy toàn bộ lệnh và khóa tài khoản tức thì nếu chạm ngưỡng lỗ ngày hoặc mức sụt giảm tối đa.
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Cryptographic NFT Certificate */}
              <div className="bg-[#0B1120] border border-[#1E2C44] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#162235]">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                      Chứng Nhận Trader Cấp Vốn
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40">
                    ĐÃ ĐƯỢC CHỨNG THỰC SỐ
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#060912] border border-[#1C283F] font-mono text-xs space-y-2">
                  <div className="text-[10px] text-slate-500 uppercase">Chứng Chỉ Đạt Chuẩn Đánh Giá</div>
                  <div className="text-sm font-bold text-amber-300">
                    CHỨNG NHẬN TRADER CẤP VỐN XUẤT SẮC
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span>Cấp độ: {currentLevel.levelName} ({currentLevel.badge})</span>
                    <span className="text-white font-bold">${currentLevel.capitalUSD.toLocaleString('en-US')} USD</span>
                  </div>
                  <div className="text-[9px] text-slate-500 pt-1 border-t border-[#141E30] break-all">
                    Mã băm chứng thực: 0x9c41...b72e (Được công nhận bởi đối tác quỹ prop desk & đơn vị tuyển dụng)
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
