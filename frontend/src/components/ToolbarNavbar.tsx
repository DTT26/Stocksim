import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { User, Bell, Moon, Sun, Globe, Trophy, Sparkles, Lock } from 'lucide-react';
import { UserDropdown } from './UserDropdown';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useModal } from '../contexts/ModalContext';
import { LanguageModal } from './LanguageModal';
import { NotificationDropdown } from './NotificationDropdown';
import type { Stock } from '../features/market/data';

interface ToolbarNavbarProps {
  balance: number;
  simulationName?: string;
  onOpenSettings?: () => void;
  onOpenChallenge?: () => void;
  onOpenAiTutor?: () => void;
  onOpenGuide?: () => void;
  challengeLevelName?: string;
  challengeStatus?: string;
  accountRankBadge?: string;
  accountRankName?: string;
  certCount?: number;
  selectedStock?: Stock;
  activeTimeframe?: string;
}

export const ToolbarNavbar = ({ 
  balance, 
  simulationName,
  onOpenSettings,
  onOpenChallenge, 
  onOpenAiTutor,
  onOpenGuide,
  challengeLevelName, 
  challengeStatus,
  accountRankBadge,
  accountRankName,
  certCount,
  selectedStock,
  activeTimeframe
}: ToolbarNavbarProps) => {
  const { user, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showAlert } = useModal();
  const isDarkMode = theme === 'dark';
  const { lang: language, setLang: setLanguage, t } = useI18n();
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  return (
    <>
      <nav className="h-12 bg-white dark:bg-[#131722] border-b border-[#e6e8ea] dark:border-[#2a2e39] flex items-center px-4 justify-between text-[#1e2329] dark:text-[#d1d4dc] text-sm shrink-0 relative z-50">
        {/* Logo StockSim & Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/" className="flex items-center group mr-1">
            <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Stock<span className="text-indigo-600 dark:text-indigo-500">Sim</span>
            </span>
          </Link>
          
          {/* Nút Hướng Dẫn Thực Chiến */}
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition-all shadow-sm shadow-emerald-500/10 hover:scale-[1.02] cursor-pointer"
            title={language === 'vi' ? 'Mở hướng dẫn chi tiết từng bước cho người dùng mới' : 'Open step-by-step guide for new users'}
          >
            <span className="text-sm">🎓</span>
            <span className="hidden sm:inline">{language === 'vi' ? 'Hướng Dẫn Thực Chiến' : 'Trading Guide'}</span>
          </button>

          {/* Nút Thử Thách Quỹ (Prop Firm Challenge) */}
          <button
            onClick={onOpenChallenge}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold text-xs transition-all shadow-sm shadow-amber-500/10 hover:scale-[1.02]"
            title={`${t('nav.challengeTitle', 'Thử Thách Cấp Vốn Quỹ')} • ${t('nav.accountRank', 'Hạng tài khoản:')} ${accountRankName ? accountRankName.replace(/Cấp/g, t('nav.phaseBadge', 'Cấp')) : t('nav.level1', 'Cấp 1')}`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span className="hidden sm:inline">{t('nav.challenge', 'Thử Thách Quỹ')}</span>
            {challengeStatus === 'ACTIVE' ? (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{language === 'vi' ? 'Thi' : 'Exam'} {challengeLevelName}</span>
              </span>
            ) : challengeStatus === 'PAUSED' ? (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[10px] font-extrabold text-amber-600 dark:text-amber-300 border border-amber-500/30">
                {language === 'vi' ? 'Tạm dừng' : 'Paused'} {challengeLevelName}
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[10px] font-extrabold text-amber-700 dark:text-amber-300 border border-amber-500/30" title={language === 'vi' ? 'Cấp bậc cao nhất tài khoản đã đạt được' : 'Highest account rank achieved'}>
                {accountRankBadge ? accountRankBadge.replace(/Cấp/g, t('nav.phaseBadge', 'Cấp')) : t('nav.level1', 'Cấp 1')}
              </span>
            )}
          </button>
        </div>

        {/* Simulation Info (Centered) - Chỉ hiển thị khi có thông tin kỳ thi thực tế */}
        {simulationName && (
          <div className="hidden lg:flex flex-1 items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#1e2329] dark:text-white">{simulationName}</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> LIVE
              </span>
            </div>
          </div>
        )}
        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Nút AI Trading Tutor */}
          {challengeStatus === 'ACTIVE' ? (
            <button
              onClick={() => showAlert({
                title: language === 'vi' ? 'Tính năng AI bị khóa khi thi quỹ' : 'AI feature locked during challenge',
                message: language === 'vi' ? 'Trong quá trình thực hiện bài thi Thử Thách Cấp Vốn Quỹ (Prop Firm Challenge), mọi công cụ AI Trading Tutor và đánh giá lệnh đều bị vô hiệu hóa để bảo đảm tính minh bạch và đánh giá đúng năng lực giao dịch thực tế của thí sinh.' : 'During the Prop Firm Challenge exam, all AI Trading Tutor tools and order reviews are disabled to ensure transparency and accurate assessment of your actual trading skills.',
                type: 'warning'
              })}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#1e222d] border border-gray-300 dark:border-gray-700/60 text-gray-500 dark:text-gray-400 font-semibold text-xs transition-all cursor-pointer opacity-80 hover:opacity-100"
              title={language === 'vi' ? 'AI Tutor bị khóa trong thời gian làm bài thi Thử Thách Quỹ' : 'AI Tutor is locked during the Prop Firm Challenge exam'}
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">{language === 'vi' ? 'AI Tutor (Khóa)' : 'AI Tutor (Locked)'}</span>
            </button>
          ) : (
            <button
              onClick={onOpenAiTutor}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-500/15 via-purple-500/15 to-amber-500/15 hover:from-blue-500/25 hover:to-amber-500/25 border border-blue-500/30 text-blue-600 dark:text-blue-300 font-bold text-xs transition-all shadow-xs hover:scale-[1.02] cursor-pointer"
              title={language === 'vi' ? 'Mở Trợ lý & Gia sư AI Trading Tutor (Hỏi đáp, So sánh chiến lược, RAG)' : 'Open AI Trading Tutor Assistant (Q&A, Strategy Comparison, RAG)'}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">AI Tutor</span>
            </button>
          )}

          {/* Thông báo */}
          <NotificationDropdown />
          <button 
            onClick={toggleTheme}
            className="hidden md:flex hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] p-1.5 rounded transition-colors shrink-0 text-[#787b86] hover:text-[#1e2329] dark:hover:text-[#d1d4dc] cursor-pointer"
            title={language === 'vi' ? 'Đổi giao diện (Sáng/Tối)' : 'Toggle theme (Light/Dark)'}
          >
            {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setIsLanguageModalOpen(true)}
            className="hidden md:flex hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] p-1.5 rounded transition-colors shrink-0 items-center gap-1 text-[#787b86] hover:text-[#1e2329] dark:hover:text-[#d1d4dc] cursor-pointer"
            title={language === 'vi' ? 'Ngôn ngữ' : 'Language'}
          >
            <Globe className="w-5 h-5" />
            <span className="text-xs font-semibold">{language.toUpperCase()}</span>
          </button>

          <div className="w-px h-4 bg-[#e6e8ea] dark:bg-[#2a2e39] mx-1" />

          {user ? (
            <UserDropdown 
              user={{ ...user, balance }} 
              onLogout={logout} 
              isChallenge={challengeStatus === 'ACTIVE' || challengeStatus === 'PAUSED'}
              challengeLevelName={challengeLevelName}
              accountRankName={accountRankName}
              certCount={certCount}
            />
          ) : (
            <button 
              onClick={() => login()} 
              className="h-7 px-3 bg-blue-600 hover:bg-blue-500 rounded text-white font-medium transition-colors"
            >
              {t('auth.login', 'Đăng nhập')}
            </button>
          )}
        </div>
      </nav>

      <LanguageModal 
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        currentLanguage={language.toUpperCase()}
        onSelectLanguage={(val: string) => setLanguage(val.toLowerCase() as any)}
      />
    </>
  );
};
