import { useChallengeTranslation } from './useChallengeTranslation';
import React from 'react';
import { Award, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';
import type { PassedCertificate } from './types';

interface ChallengeCertificateModalProps {
  certificate: PassedCertificate | null;
  allCertificates?: PassedCertificate[];
  onSelectCert?: (cert: PassedCertificate) => void;
  onClose: () => void;
  userName?: string;
}

export const ChallengeCertificateModal: React.FC<ChallengeCertificateModalProps> = ({
  certificate,
  allCertificates = [],
  onSelectCert,
  onClose,
  userName = 'Trader',
}) => {
  const { tr, levelName, badge } = useChallengeTranslation();
  if (!certificate) return null;

  const currentTraderName = certificate.userName || userName;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-300">
      {/* Container Box */}
      <div className="relative w-full max-w-4xl my-auto flex flex-col items-center">
        
        {/* Certificate Level Switcher Bar (If multiple certificates exist) */}
        {/* Certificate Level Switcher Bar: Minimalist 6-Level Grid */}
        {allCertificates.length > 1 && (
          <div className="w-full max-w-[880px] mb-3 bg-[#0d121d]/90 border border-amber-500/30 rounded-xl p-1.5 backdrop-blur-xl shadow-lg">
            <div className="grid grid-cols-6 gap-1.5 w-full">
              {allCertificates.map((cert) => {
                const isActive = cert.levelId === certificate.levelId;
                const formattedCapital = cert.capitalUSD >= 1000 ? `$${cert.capitalUSD / 1000}K` : `$${cert.capitalUSD}`;
                return (
                  <button
                    key={cert.levelId}
                    onClick={() => onSelectCert?.(cert)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/30 font-black'
                        : 'bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60 hover:text-white'
                    }`}
                  >
                    <span>{tr("Cấp")} {cert.levelId}</span>
                    <span className="text-[10px] opacity-75 font-mono hidden sm:inline font-normal">({formattedCapital})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* --- MAIN CERTIFICATE CANVAS --- */}
        <div
          className="relative w-full aspect-[1.414/1] min-h-[540px] max-w-[880px] bg-[#0c0f17] text-white rounded-2xl p-7 md:p-10 shadow-[0_0_60px_rgba(245,158,11,0.22)] border-2 border-amber-500/60 overflow-hidden font-sans"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 25%, rgba(245, 158, 11, 0.1) 0%, transparent 60%),
              radial-gradient(circle at 15% 85%, rgba(59, 130, 246, 0.05) 0%, transparent 40%),
              radial-gradient(circle at 85% 85%, rgba(245, 158, 11, 0.06) 0%, transparent 40%)
            `
          }}
        >
          {/* Guilloche / Watermark Security Background */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.035] mix-blend-screen"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, #d97706 0, #d97706 1px, transparent 0, transparent 24px)`
            }}
          />

          {/* Double Ornate Golden Security Border */}
          <div className="relative w-full h-full border-2 border-amber-500/50 rounded-xl p-6 md:p-8 flex flex-col justify-between backdrop-blur-sm">
            
            {/* Inner Hairline Border with Margin */}
            <div className="absolute inset-2 border border-amber-400/25 rounded-lg pointer-events-none" />

            {/* Corner Filigree Ornaments */}
            {/* Top-Left */}
            <svg className="absolute top-1 left-1 w-10 h-10 text-amber-400/80 pointer-events-none" viewBox="0 0 100 100" fill="currentColor">
              <path d="M0,0 L40,0 C30,10 10,30 0,40 Z M0,0 L0,100 L4,100 L4,4 L100,4 L100,0 Z M12,12 L30,12 C24,18 18,24 12,30 Z" />
            </svg>
            {/* Top-Right */}
            <svg className="absolute top-1 right-1 w-10 h-10 text-amber-400/80 pointer-events-none rotate-90" viewBox="0 0 100 100" fill="currentColor">
              <path d="M0,0 L40,0 C30,10 10,30 0,40 Z M0,0 L0,100 L4,100 L4,4 L100,4 L100,0 Z M12,12 L30,12 C24,18 18,24 12,30 Z" />
            </svg>
            {/* Bottom-Left */}
            <svg className="absolute bottom-1 left-1 w-10 h-10 text-amber-400/80 pointer-events-none -rotate-90" viewBox="0 0 100 100" fill="currentColor">
              <path d="M0,0 L40,0 C30,10 10,30 0,40 Z M0,0 L0,100 L4,100 L4,4 L100,4 L100,0 Z M12,12 L30,12 C24,18 18,24 12,30 Z" />
            </svg>
            {/* Bottom-Right */}
            <svg className="absolute bottom-1 right-1 w-10 h-10 text-amber-400/80 pointer-events-none rotate-180" viewBox="0 0 100 100" fill="currentColor">
              <path d="M0,0 L40,0 C30,10 10,30 0,40 Z M0,0 L0,100 L4,100 L4,4 L100,4 L100,0 Z M12,12 L30,12 C24,18 18,24 12,30 Z" />
            </svg>

            {/* --- CERTIFICATE HEADER --- */}
            <div className="text-center pt-1">
              {/* Official Emblems & Crest */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="h-[1px] w-12 md:w-20 bg-gradient-to-r from-transparent to-amber-400/60" />
                <div className="flex items-center gap-1.5 text-amber-400 tracking-[0.35em] text-[10px] md:text-xs font-bold uppercase font-sans">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>AITRADEX CAPITAL MANAGEMENT • PROP TRADING FIRM</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <div className="h-[1px] w-12 md:w-20 bg-gradient-to-l from-transparent to-amber-400/60" />
              </div>

              {/* Main Title - Pure clean font without broken Vietnamese diacritics */}
              <h1 className="text-2xl md:text-4xl lg:text-[40px] font-sans font-black tracking-wide uppercase leading-tight bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(245,158,11,0.25)]">
                {tr("CHỨNG NHẬN TRADER QUỸ")}
              </h1>
              
              <div className="flex items-center justify-center gap-2 mt-1.5">
                <span className="text-[11px] md:text-xs font-sans font-bold tracking-widest text-amber-200/90 uppercase">
                  {tr("Chứng nhận thành tích giao dịch quỹ")} • {levelName(certificate.levelId, certificate.levelName)} ({badge(certificate.levelId)})
                </span>
              </div>
            </div>

            {/* --- RECIPIENT BODY --- */}
            <div className="text-center my-3 md:my-5">
              <p className="text-xs md:text-sm text-slate-400 tracking-wider font-sans mb-1.5">
                {tr("Vinh danh và chứng nhận nhà giao dịch tài chính:")}
              </p>
              
              {/* Recipient Name with Luxury Gold Gradient */}
              <div className="inline-block relative my-1">
                <h2 className="text-2xl md:text-4xl font-sans font-black tracking-wider text-white px-8 py-1 drop-shadow-[0_2px_15px_rgba(255,255,255,0.2)]">
                  {currentTraderName}
                </h2>
                {/* Elegant Underline Flourish */}
                <div className="w-full flex items-center justify-center gap-2 -mt-1">
                  <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-amber-400 to-amber-300" />
                  <div className="w-2 h-2 rotate-45 bg-amber-300 shadow-sm" />
                  <div className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent via-amber-400 to-amber-300" />
                </div>
              </div>

              <p className="text-xs md:text-[13px] text-slate-300/90 max-w-xl mx-auto mt-2 leading-relaxed font-sans">
                {tr("Đã chứng minh kỷ luật thép, kỹ năng kiểm soát rủi ro chuẩn quốc tế và hoàn thành xuất sắc bài kiểm tra đánh giá cấp vốn để chính thức trở thành")} <strong className="text-amber-300 font-bold">{tr("Trader Quỹ Chuyên Nghiệp")}</strong>.
              </p>
            </div>

            {/* --- ACHIEVEMENT STATS PLAQUES --- */}
            <div className="grid grid-cols-3 gap-3 md:gap-5 max-w-2xl mx-auto w-full my-1">
              
              {/* Plaque 1: Cấp độ */}
              <div className="bg-gradient-to-b from-amber-950/30 to-slate-900/60 border border-amber-500/40 rounded-xl p-2.5 md:p-3 text-center shadow-inner">
                <span className="text-[10px] md:text-[11px] text-amber-300/80 uppercase tracking-wider block font-bold">
                  {tr("Cấp Bậc Đạt Được")}
                </span>
                <span className="text-base md:text-xl font-black text-amber-400 font-sans tracking-tight">
                  {levelName(certificate.levelId, certificate.levelName)}
                </span>
                <span className="text-[10px] text-slate-400 block font-sans">{tr("Cấp")} {certificate.levelId}/6</span>
              </div>

              {/* Plaque 2: Hạn mức vốn */}
              <div className="bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-slate-900/60 border-2 border-amber-400/60 rounded-xl p-2.5 md:p-3 text-center shadow-lg shadow-amber-500/10 scale-105">
                <span className="text-[10px] md:text-[11px] text-yellow-300 uppercase tracking-wider block font-bold">
                  {tr("Hạn Mức Cấp Vốn")}
                </span>
                <span className="text-base md:text-2xl font-black text-white font-mono tracking-tight">
                  ${certificate.capitalUSD.toLocaleString('en-US')}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold block font-sans">{tr("✓ Quản Lý Tài Khoản Live")}</span>
              </div>

              {/* Plaque 3: Chia sẻ lợi nhuận */}
              <div className="bg-gradient-to-b from-amber-950/30 to-slate-900/60 border border-amber-500/40 rounded-xl p-2.5 md:p-3 text-center shadow-inner">
                <span className="text-[10px] md:text-[11px] text-amber-300/80 uppercase tracking-wider block font-bold">
                  {tr("Chia Sẻ Lợi Nhuận")}
                </span>
                <span className="text-base md:text-xl font-black text-amber-300 font-sans">
                  80% - 90%
                </span>
                <span className="text-[10px] text-slate-400 block font-sans">{tr("Rút Tiền Định Kỳ")}</span>
              </div>
            </div>

            {/* --- FOOTER: SEAL & VERIFICATION DETAILS --- */}
            <div className="flex items-center justify-between pt-4 border-t border-amber-500/20 mt-2 px-2">
              
              {/* Left: 3D Metallic Gold Seal */}
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  {/* Wax Seal Medallion */}
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-[#996515] via-[#FFD700] to-[#FFE066] p-0.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-[#111622] border border-amber-400/60 flex flex-col items-center justify-center text-center p-1">
                      <Award className="w-5 h-5 md:w-6 md:h-6 text-amber-300 mb-0.5" />
                      <span className="text-[7px] md:text-[8px] font-black tracking-widest text-amber-300 uppercase">VERIFIED</span>
                    </div>
                  </div>
                  {/* Red/Gold Hanging Ribbons under seal */}
                  <div className="absolute -bottom-2 -left-1 w-3 h-5 bg-gradient-to-b from-amber-600 to-amber-700 transform -rotate-12 rounded-b shadow" />
                  <div className="absolute -bottom-2 -right-1 w-3 h-5 bg-gradient-to-b from-yellow-500 to-amber-600 transform rotate-12 rounded-b shadow" />
                </div>

                <div className="text-left font-sans">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>AITRADEX VERIFIED EVALUATION</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">{tr("Hệ thống cấp vốn tự động AI")}</span>
                </div>
              </div>

              {/* Right: Issue Date */}
              <div className="text-right font-sans">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-0.5">
                  {tr("Ngày Cấp Chứng Nhận")}
                </span>
                <span className="text-xs md:text-sm font-bold text-amber-300 font-mono">
                  {certificate.date || '21/09/2026'}
                </span>
              </div>

            </div>

          </div>
        </div>

        {/* Action Buttons bar */}
        <div className="w-full max-w-4xl flex items-center justify-between mt-4 px-2">
          <div className="text-xs text-slate-400 flex items-center gap-1.5 font-sans">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{tr("Chứng chỉ chính thức được ghi nhận vĩnh viễn trên hệ thống AITRADEX.")}</span>
          </div>
          <div>
            <button
              onClick={onClose}
              className="px-7 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-amber-500/25 active:scale-95"
            >
              {tr("Đóng")}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
