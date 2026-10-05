import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useI18n } from '../../../contexts/I18nContext';
import { LanguageModal } from '../../../components/LanguageModal';
import { Terminal, ShieldCheck, BarChart3, BookOpen, ArrowUpRight, User, Trophy, Sparkles, Globe } from 'lucide-react';

export const LandingNavbar: React.FC = () => {
  const { user } = useAuth();
  const { lang, setLang, t } = useI18n();
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#080C14]/95 backdrop-blur-sm border-b border-[#1E293B] text-slate-200">
        {/* Top Telemetry Ticker Strip */}
        <div className="hidden lg:flex items-center justify-between px-4 sm:px-6 h-7 bg-[#05080E] border-b border-[#161F30] text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-blue-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="font-semibold text-blue-400">{t('home.engine', 'STOCKSIM ENGINE v2.8')}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300">{t('home.latency', 'ĐỘ TRỄ:')} 18ms</span>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-slate-500">{t('home.data', 'DỮ LIỆU:')}</span>
              <span className="text-slate-200 font-medium">{t('home.dataLive', 'BINGX / BINANCE L2 TRỰC TIẾP')}</span>
              <span className="text-slate-600">•</span>
              <span className="text-blue-400 font-medium">{t('home.accuracy', '100% KHỚP LỆNH CHUẨN XÁC')}</span>
            </div>
          </div>

          {/* Global Asset Snapshots */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">BTC/USDT:</span>
              <span className="text-slate-200 font-medium">$83,090.00</span>
              <span className="text-rose-400">-1.66%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">NVDA:</span>
              <span className="text-slate-200 font-medium">$224.08</span>
              <span className="text-emerald-400">+2.38%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">XAU/USD:</span>
              <span className="text-slate-200 font-medium">$4,143.40</span>
              <span className="text-emerald-400">+0.27%</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <span>{t('home.time', 'GIỜ:')}</span>
              <span className="text-slate-300">UTC 14:48:20</span>
            </div>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Brand Logo - As in Figure 1 */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 select-none group">
              <span className="font-extrabold text-2xl text-white tracking-tight font-sans">
                Stock<span className="text-[#5975FF]">Sim</span>
              </span>
            </Link>
          </div>

          {/* Navigation Anchors */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 text-xs xl:text-sm font-medium">
            <Link
              to="/trade/btcusdt"
              className="flex items-center gap-1.5 px-2 xl:px-3 py-1.5 rounded text-slate-300 hover:text-white hover:bg-[#161F30] transition-colors whitespace-nowrap shrink-0"
            >
              <Terminal className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="whitespace-nowrap">{t('home.terminal', 'Sàn giao dịch')}</span>
            </Link>

            <a
              href="#challenge"
              className="flex items-center gap-1.5 px-2 xl:px-3 py-1.5 rounded text-slate-300 hover:text-white hover:bg-[#161F30] transition-colors whitespace-nowrap shrink-0"
            >
              <Trophy className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="whitespace-nowrap">{t('home.challenge', 'Mô phỏng thử thách')}</span>
            </a>

            <a
              href="#ai-tutor"
              className="flex items-center gap-1.5 px-2 xl:px-3 py-1.5 rounded text-slate-300 hover:text-white hover:bg-[#161F30] transition-colors whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="whitespace-nowrap">{t('home.aiTutor', 'Trợ lý AI')}</span>
            </a>

            <a
              href="#evidence"
              className="flex items-center gap-1.5 px-2 xl:px-3 py-1.5 rounded text-slate-300 hover:text-white hover:bg-[#161F30] transition-colors whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="whitespace-nowrap">{t('home.evidence', 'Bằng chứng xác thực')}</span>
            </a>

            <a
              href="#analytics"
              className="flex items-center gap-1.5 px-2 xl:px-3 py-1.5 rounded text-slate-300 hover:text-white hover:bg-[#161F30] transition-colors whitespace-nowrap shrink-0"
            >
              <BarChart3 className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="whitespace-nowrap">{t('home.analytics', 'Phân tích')}</span>
            </a>

            <a
              href="#journal"
              className="flex items-center gap-1.5 px-2 xl:px-3 py-1.5 rounded text-slate-300 hover:text-white hover:bg-[#161F30] transition-colors whitespace-nowrap shrink-0"
            >
              <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="whitespace-nowrap">{t('home.journal', 'Nhật ký giao dịch')}</span>
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Switcher Button (opens LanguageModal) */}
            <button
              onClick={() => setIsLanguageModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#2D3D58] bg-[#0E1524] text-xs font-mono font-medium text-slate-200 hover:bg-[#172238] hover:border-blue-500/50 hover:text-white transition-all shadow-sm cursor-pointer whitespace-nowrap shrink-0"
              title={lang === 'vi' ? 'Đổi ngôn ngữ' : 'Change language'}
            >
              <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{lang.toUpperCase()}</span>
            </button>

            <Link
              to="/trade/btcusdt"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#2D3D58] bg-[#0E1524] text-xs font-mono font-semibold text-slate-200 hover:bg-[#172238] hover:border-blue-500/50 hover:text-white transition-all shadow-sm whitespace-nowrap shrink-0"
            >
              <span>{t('home.openTerminal', 'MỞ SÀN GIAO DỊCH')}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </Link>

            {user && (
              <Link
                to={user.role === 'admin' ? '/admin' : user.role === 'lecturer' ? '/lecturer' : '/student'}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold tracking-wide transition-colors whitespace-nowrap shrink-0"
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">
                  {t('home.dashboard', 'BẢNG ĐIỀU KHIỂN')} (
                  {user.role === 'admin'
                    ? t('home.admin', 'QUẢN TRỊ')
                    : user.role === 'lecturer'
                    ? t('home.lecturer', 'GIẢNG VIÊN')
                    : t('home.student', 'HỌC VIÊN')}
                  )
                </span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <LanguageModal 
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        currentLanguage={lang.toUpperCase()}
        onSelectLanguage={(val: string) => setLang(val.toLowerCase() as any)}
      />
    </>
  );
};
