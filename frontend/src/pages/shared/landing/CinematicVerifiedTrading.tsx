import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2, Clock, Hash, Lock, ArrowUpRight, Check, ArrowRight } from 'lucide-react';
import { CINEMATIC_TIMELINE } from './mockData';
import { useI18n } from '../../../contexts/I18nContext';

export const CinematicVerifiedTrading: React.FC = () => {
  const { lang } = useI18n();
  // Stepper state for animated timeline sequence
  const [activeStepIdx, setActiveStepIdx] = useState(3); // 0: SUBMITTED, 1: MATCHED, 2: FILLED, 3: VERIFIED

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStepIdx(prev => (prev >= 3 ? 0 : prev + 1));
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const statuses = lang === 'vi'
    ? ['ĐÃ GỬI LỆNH', 'ĐÃ KHỚP SỔ', 'ĐÃ KHỚP HẾT', 'ĐÃ XÁC THỰC']
    : ['SUBMITTED', 'MATCHED', 'FILLED', 'VERIFIED'];

  return (
    <section className="relative w-full py-24 bg-[#05080E] border-b border-[#1E293B] text-slate-100 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0D1627] border border-blue-500/30 text-blue-400 font-mono text-xs uppercase tracking-widest mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{lang === 'vi' ? 'XÁC THỰC HỌC THUẬT & NHÀ TUYỂN DỤNG' : 'ACADEMIC & RECRUITER VERIFICATION'}</span>
          </div>

          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase font-sans leading-none">
            {lang === 'vi' ? (
              <>
                MỖI LỆNH GIAO DỊCH <br />
                <span className="text-blue-500">LÀ MỘT BẰNG CHỨNG XÁC THỰC.</span>
              </>
            ) : (
              <>
                EVERY EXECUTED TRADE <br />
                <span className="text-blue-500">IS VERIFIABLE PROOF.</span>
              </>
            )}
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-400 font-sans max-w-xl">
            {lang === 'vi'
              ? 'StockSim giải quyết triệt để vấn đề làm giả kết quả trong giao dịch mô phỏng. Mọi bước giá, kích hoạt Stop-Loss và khớp lệnh đều được kiểm toán bất biến để chứng minh năng lực quản trị rủi ro thực tế.'
              : 'StockSim eliminates falsified trading records in paper trading. Every tick, Stop-Loss trigger, and fill is immutably audited to prove authentic risk management competence.'}
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* DUAL WORKSPACE: Execution Timeline vs Verification UI Evidence */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: ANIMATED EXECUTION TIMELINE (6 cols) */}
          <div className="lg:col-span-6 bg-[#080D17] border border-[#1A2538] rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#151E2E]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  {lang === 'vi' ? 'Luồng Vòng Đời Lệnh Trực Tiếp' : 'Live Order Lifecycle Stream'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {lang === 'vi' ? 'BỘ KIỂM TOÁN HỆ THỐNG: ONLINE' : 'SYSTEM AUDITOR: ONLINE'}
              </span>
            </div>

            {/* Vertical Timeline Items */}
            <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-blue-500 before:via-blue-600/40 before:to-[#1A2538]">
              {/* TRANSACTION 1: Active Animated Progression */}
              <div className="relative">
                <div className="absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full bg-blue-600 border-2 border-[#05080E] flex items-center justify-center text-white">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                </div>

                <div className="p-4 rounded-lg bg-[#0C1220] border border-blue-500/40 space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-400">10:24:03 UTC</span>
                    <span className="text-blue-400 font-bold px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/40">
                      {lang === 'vi' ? 'AAPL • LỆNH #4912' : 'AAPL • ORDER #4912'}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-extrabold text-emerald-400 text-sm px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        {lang === 'vi' ? 'MUA 20' : 'BUY 20'}
                      </span>
                      <span className="text-white font-bold text-base">@ $246.80</span>
                    </div>
                    <span className="font-mono text-xs text-slate-400">
                      {lang === 'vi' ? 'Tổng: $4,936.00' : 'Total: $4,936.00'}
                    </span>
                  </div>

                  {/* Animated Lifecycle Sequence Stepper */}
                  <div className="pt-2">
                    <div className="text-[10px] font-mono uppercase text-slate-500 mb-1.5">
                      {lang === 'vi' ? 'Tiến Trình Xử Lý Lệnh' : 'Order Lifecycle Progress'}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono text-[10px]">
                      {statuses.map((st, sIdx) => {
                        const isReached = activeStepIdx >= sIdx;
                        const isCurrent = activeStepIdx === sIdx;
                        return (
                          <div
                            key={st}
                            className={`p-1.5 rounded text-center font-bold transition-all ${
                              isCurrent
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/50'
                                : isReached
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-[#080D18] text-slate-600 border border-[#162030]'
                            }`}
                          >
                            {st}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* TRANSACTION 2: Fully Settled & Verified Transaction */}
              <div className="relative">
                <div className="absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#05080E] flex items-center justify-center text-white">
                  <Check className="w-3 h-3 text-[#05080E] stroke-[3]" />
                </div>

                <div className="p-4 rounded-lg bg-[#0C1220] border border-[#1C283E] space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-400">11:03:42 UTC</span>
                    <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{lang === 'vi' ? 'ĐÃ XÁC THỰC' : 'VERIFIED'}</span>
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-extrabold text-rose-400 text-sm px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                        {lang === 'vi' ? 'BÁN 20' : 'SELL 20'}
                      </span>
                      <span className="text-white font-bold text-base">@ $250.20</span>
                    </div>

                    <div className="font-mono text-sm font-extrabold text-emerald-400 flex items-center gap-0.5">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>+$68.00 USD</span>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 pt-1 flex items-center justify-between">
                    <span>{lang === 'vi' ? 'Thời gian giữ: 39p 39s' : 'Holding time: 39m 39s'}</span>
                    <span className="text-blue-400 font-semibold">
                      {lang === 'vi' ? 'Khớp: Bước giá NASDAQ #8102' : 'Fill: NASDAQ Tick #8102'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: VERIFIED EVIDENCE UI CARD (6 cols) */}
          <div className="lg:col-span-6 bg-[#080D17] border border-[#1A2538] rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#151E2E]">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  {lang === 'vi' ? 'Bằng Chứng Hiệu Suất Được Chứng Thực' : 'Attested Performance Evidence'}
                </span>
              </div>

              {/* Restrained Verification Animation (Clean, institutional) */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#0D1A16] border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'vi' ? 'HỆ THỐNG ĐÃ XÁC THỰC' : 'SYSTEM VERIFIED'}</span>
              </div>
            </div>

            {/* Evidence Metrics Table */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-[#0C1220] border border-[#1A2538]">
                <div className="text-[11px] font-mono text-slate-400 uppercase">
                  {lang === 'vi' ? 'Lệnh Đã Thực Hiện' : 'Executed Orders'}
                </div>
                <div className="text-3xl font-extrabold font-mono text-white mt-1">34</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {lang === 'vi' ? '100% Trong Sổ Lệnh Chuẩn' : '100% In Standard Orderbook'}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#0C1220] border border-[#1A2538]">
                <div className="text-[11px] font-mono text-slate-400 uppercase">
                  {lang === 'vi' ? 'Lợi Nhuận Thực Hiện' : 'Realized PnL'}
                </div>
                <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-1">+$412.80</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {lang === 'vi' ? 'Đã trừ phí giao dịch' : 'Net of trading fees'}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#0C1220] border border-[#1A2538]">
                <div className="text-[11px] font-mono text-slate-400 uppercase">
                  {lang === 'vi' ? 'Cắt Lỗ (Stop Loss)' : 'Stop Loss (SL)'}
                </div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{lang === 'vi' ? 'ĐÃ DÙNG (100%)' : 'ACTIVE (100%)'}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {lang === 'vi' ? 'Kích hoạt <60s sau khi khớp' : 'Triggered <60s post-fill'}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#0C1220] border border-[#1A2538]">
                <div className="text-[11px] font-mono text-slate-400 uppercase">
                  {lang === 'vi' ? 'Chốt Lời (Take Profit)' : 'Take Profit (TP)'}
                </div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{lang === 'vi' ? 'ĐÃ DÙNG (100%)' : 'ACTIVE (100%)'}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {lang === 'vi' ? 'Duy trì kỷ luật R:R' : 'Strict R:R discipline'}
                </div>
              </div>
            </div>

            {/* Cryptographic Audit Strip */}
            <div className="p-4 rounded-lg bg-[#060A12] border border-[#162235] space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-blue-400" />
                  <span>{lang === 'vi' ? 'MÃ BĂM CHỨNG THỰC' : 'VERIFICATION HASH'}</span>
                </span>
                <span className="text-slate-500">SHA-256</span>
              </div>
              <div className="p-2 rounded bg-[#09101C] border border-[#1A273D] text-[10px] text-blue-300 font-mono break-all select-all">
                0x7f8d4e92a10b98c39485721d604a37b42f618e90c88b72e19fa82110c7143c3d
              </div>
              <div className="text-[10px] text-slate-500 pt-1">
                {lang === 'vi'
                  ? 'Được chứng thực mật mã bởi StockSim Engine v2.4. Sẵn sàng nộp trực tiếp lên cổng chấm điểm đại học hoặc gửi đến hội đồng tuyển dụng quỹ Prop Firm.'
                  : 'Cryptographically attested by StockSim Engine v2.4. Ready for submission to university grading portals or Prop Firm recruiter review.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
