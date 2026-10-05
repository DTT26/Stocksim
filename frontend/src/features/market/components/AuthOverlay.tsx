import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useI18n } from '../../../contexts/I18nContext';

interface AuthOverlayProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  features: string[];
}

export const AuthOverlay = ({ icon, title, subtitle, features }: AuthOverlayProps) => {
  const { login } = useAuth();
  const { t } = useI18n();

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center px-6 py-10 text-center bg-white dark:bg-[#131722]">
      <div className="w-16 h-16 rounded-2xl bg-[#089981]/10 dark:bg-[#089981]/10 flex items-center justify-center mb-6 border border-[#089981]/20">
        <div className="text-[#089981]">
          {icon}
        </div>
      </div>
      
      <h2 className="text-[22px] font-bold text-[#1e2329] dark:text-white mb-2 leading-tight">
        {title}
      </h2>
      <p className="text-sm text-[#787b86] mb-8 max-w-[240px]">
        {subtitle}
      </p>

      <div className="w-full bg-[#f8f9fa] dark:bg-[#151924] border border-[#e6e8ea] dark:border-[#2a2e39] rounded-xl p-4 flex flex-col gap-4 mb-8">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-3 text-left">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-[#089981]/10 shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 text-[#089981] stroke-[3]" />
            </div>
            <span className="text-sm font-bold text-[#1e2329] dark:text-[#d1d4dc] leading-snug">
              {feature}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={() => login()}
        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] hover:bg-[#f8f9fa] dark:hover:bg-[#262b3d] text-[#1e2329] dark:text-white font-bold py-3.5 px-4 rounded-xl shadow-sm transition-all mb-4 cursor-pointer"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {t('auth.loginGoogle', 'Đăng nhập bằng Google')}
      </button>

      <div className="text-[10px] font-bold text-[#787b86] tracking-widest uppercase">
        {t('auth.freeNotice', 'Miễn phí - Không cần thẻ tín dụng')}
      </div>
    </div>
  );
};
