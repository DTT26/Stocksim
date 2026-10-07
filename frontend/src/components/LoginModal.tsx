import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ShieldCheck, 
  Loader2, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  Check, 
  ArrowRight, 
  KeyRound, 
  RefreshCw, 
  ChevronLeft,
  AlertCircle
} from 'lucide-react';
import { isInAppBrowser, isIOS, isSafari } from '../utils/browserUtils';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginGoogle: (captchaToken?: string) => void;
  onLoginGoogleCredential?: (credential: string) => void;
  isGoogleLoading?: boolean;
  googleError?: string;
  onClearGoogleError?: () => void;
}

type AuthTab = 'login' | 'register' | 'forgot_password';
type RegisterStep = 'form' | 'otp';
type ForgotStep = 'email' | 'otp' | 'new_password' | 'success';

export const LoginModal = ({ 
  isOpen, 
  onClose, 
  onLoginGoogle, 
  onLoginGoogleCredential,
  isGoogleLoading = false,
  googleError = '',
  onClearGoogleError
}: LoginModalProps) => {
  const { loginWithEmail, registerRequest, verifyOtp, resendOtp, forgotPassword, verifyForgotOtp, resetPassword } = useAuth();
  const { lang, t } = useI18n();

  const [tab, setTab] = useState<AuthTab>('login');
  const [registerStep, setRegisterStep] = useState<RegisterStep>('form');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (googleError) {
      setErrorMsg(googleError);
    }
  }, [googleError]);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regTermsAccepted, setRegTermsAccepted] = useState(false);

  // 6 ô vuông OTP states cho Đăng ký
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // States cho Quên mật khẩu
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtpDigits, setForgotOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const forgotOtpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotCountdown, setForgotCountdown] = useState(60);
  const [forgotCanResend, setForgotCanResend] = useState(false);

  // Reset state when opening/closing modal
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      setLoading(false);
      setOtpDigits(['', '', '', '', '', '']);
      setForgotOtpDigits(['', '', '', '', '', '']);
    }
  }, [isOpen]);

  // Focus ô OTP đầu tiên khi chuyển sang bước OTP
  useEffect(() => {
    if (registerStep === 'otp') {
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [registerStep]);

  // Timer for OTP resend countdown
  useEffect(() => {
    let timer: any;
    if (registerStep === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [registerStep, countdown]);

  // Focus ô OTP đầu tiên khi chuyển sang bước OTP Quên mật khẩu
  useEffect(() => {
    if (tab === 'forgot_password' && forgotStep === 'otp') {
      setForgotOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        forgotOtpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [tab, forgotStep]);

  // Timer for Forgot OTP resend countdown
  useEffect(() => {
    let timer: any;
    if (tab === 'forgot_password' && forgotStep === 'otp' && forgotCountdown > 0) {
      timer = setInterval(() => {
        setForgotCountdown(prev => {
          if (prev <= 1) {
            setForgotCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [tab, forgotStep, forgotCountdown]);

  if (!isOpen) return null;

  // Lấy reCAPTCHA v3 Token ngầm
  const getRecaptchaToken = async (action: string): Promise<string> => {
    try {
      const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LehIsstAAAAADEZTd4iD4LQ3MNfhJAAQjFVq1FH';
      if (typeof window !== 'undefined' && (window as any).grecaptcha) {
        return await new Promise<string>((resolve) => {
          (window as any).grecaptcha.ready(async () => {
            try {
              const res = await (window as any).grecaptcha.execute(siteKey, { action });
              resolve(res || '');
            } catch (err) {
              console.error('reCAPTCHA execute error:', err);
              resolve('');
            }
          });
        });
      }
      return '';
    } catch {
      return '';
    }
  };

  // 1. Xử lý Đăng nhập Google
  const handleGoogleClick = () => {
    setErrorMsg('');
    if (onClearGoogleError) onClearGoogleError();
    try {
      // BẮT BUỘC ĐỒNG BỘ: Không dùng await getRecaptchaToken tại đây
      // Vì trên Safari iOS, bất kỳ hàm await/Promise nào cũng sẽ làm mất cử chỉ người dùng (User Activation Context)
      // khiến trình duyệt Safari chặn Popup Google Login ngay lập tức!
      onLoginGoogle('');
    } catch (err: any) {
      setErrorMsg(lang === 'vi' ? 'Không thể khởi tạo đăng nhập Google. Vui lòng thử lại.' : 'Could not initialize Google sign in. Please try again.');
    }
  };

  // 2. Xử lý Đăng nhập Email & Mật khẩu
  const handleEmailLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg(lang === 'vi' ? 'Vui lòng điền đầy đủ Email và Mật khẩu.' : 'Please enter both Email and Password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const captchaToken = await getRecaptchaToken('login');
      const result = await loginWithEmail(loginEmail.trim(), loginPassword, captchaToken);
      if (result.success) {
        onClose();
      } else {
        setErrorMsg(result.message || (lang === 'vi' ? 'Email hoặc mật khẩu không chính xác.' : 'Incorrect email or password.'));
      }
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'vi' ? 'Đăng nhập không thành công.' : 'Sign in failed.'));
    } finally {
      setLoading(false);
    }
  };

  // 3. Xử lý Đăng ký Bước 1: Gửi thông tin & nhận OTP
  const handleRegisterFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regName.trim()) {
      setErrorMsg(lang === 'vi' ? 'Vui lòng nhập họ và tên của bạn.' : 'Please enter your full name.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMsg(lang === 'vi' ? 'Vui lòng nhập địa chỉ email (Gmail).' : 'Please enter your email address.');
      return;
    }
    if (!hasMinLength || !hasUpper || !hasLower || !hasNum) {
      setErrorMsg(lang === 'vi' ? 'Mật khẩu chưa đáp ứng đầy đủ yêu cầu bảo mật.' : 'Password does not meet security requirements.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg(lang === 'vi' ? 'Mật khẩu xác nhận không khớp.' : 'Confirm password does not match.');
      return;
    }
    if (!regTermsAccepted) {
      setErrorMsg(lang === 'vi' ? 'Vui lòng tick chọn đồng ý với Điều khoản dịch vụ & Chính sách của sàn.' : 'Please agree to our Terms of Service & Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      const captchaToken = await getRecaptchaToken('register');
      const result = await registerRequest(regName.trim(), regEmail.trim(), regPassword, regTermsAccepted, captchaToken);

      if (result.success) {
        setRegisterStep('otp');
        setCountdown(60);
        setCanResend(false);
        setOtpDigits(['', '', '', '', '', '']);
        setSuccessMsg(result.message || (lang === 'vi' ? 'Mã OTP đã được gửi về email của bạn.' : 'OTP code has been sent to your email.'));
      } else {
        setErrorMsg(result.message || (lang === 'vi' ? 'Không thể gửi yêu cầu đăng ký.' : 'Could not send registration request.'));
      }
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'vi' ? 'Đã có lỗi xảy ra.' : 'An error occurred.'));
    } finally {
      setLoading(false);
    }
  };

  // Xử lý từng ô nhập OTP (nhập số -> tự nhảy sang ô tiếp)
  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    if (!cleanVal) {
      const updated = [...otpDigits];
      updated[index] = '';
      setOtpDigits(updated);
      return;
    }

    const digit = cleanVal.slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);

    // Tự động nhảy sang ô tiếp theo
    if (index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Xử lý phím Backspace & mũi tên điều hướng giữa các ô OTP
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otpDigits[index]) {
        const updated = [...otpDigits];
        updated[index] = '';
        setOtpDigits(updated);
        e.preventDefault();
      } else if (index > 0) {
        const updated = [...otpDigits];
        updated[index - 1] = '';
        setOtpDigits(updated);
        otpInputsRef.current[index - 1]?.focus();
        e.preventDefault();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Xử lý dán mã OTP (Paste chuỗi 6 số)
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const updated = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = pastedData[i] || '';
    }
    setOtpDigits(updated);

    const nextIndex = Math.min(pastedData.length, 5);
    otpInputsRef.current[nextIndex]?.focus();
  };

  // 4. Xử lý Đăng ký Bước 2: Xác thực mã OTP
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpDigits.join('');
    if (!otpCode || otpCode.length < 6) {
      setErrorMsg(lang === 'vi' ? 'Vui lòng nhập đủ 6 chữ số mã OTP.' : 'Please enter all 6 digits of the OTP code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const result = await verifyOtp(regEmail.trim(), otpCode);
      if (result.success) {
        onClose();
      } else {
        setErrorMsg(result.message || (lang === 'vi' ? 'Mã OTP không hợp lệ hoặc đã hết hạn.' : 'Invalid or expired OTP code.'));
      }
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'vi' ? 'Xác thực OTP thất bại.' : 'OTP verification failed.'));
    } finally {
      setLoading(false);
    }
  };

  // 5. Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await resendOtp(regEmail.trim());
      if (result.success) {
        setCountdown(60);
        setCanResend(false);
        setOtpDigits(['', '', '', '', '', '']);
        setSuccessMsg(lang === 'vi' ? 'Đã gửi lại mã OTP mới vào email của bạn.' : 'A new OTP code has been resent to your email.');
        setTimeout(() => {
          otpInputsRef.current[0]?.focus();
        }, 100);
      } else {
        setErrorMsg(result.message || (lang === 'vi' ? 'Không thể gửi lại mã OTP.' : 'Could not resend OTP code.'));
      }
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'vi' ? 'Lỗi khi gửi lại OTP.' : 'Error resending OTP.'));
    } finally {
      setLoading(false);
    }
  };

  // 6. Xử lý Quên mật khẩu Bước 1: Gửi OTP
  const handleForgotEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMsg(lang === 'vi' ? 'Vui lòng nhập địa chỉ Email.' : 'Please enter your email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const captchaToken = await getRecaptchaToken('forgot_password');
      const result = await forgotPassword(forgotEmail.trim(), captchaToken);
      if (result.success) {
        setForgotStep('otp');
        setForgotCountdown(60);
        setForgotCanResend(false);
        setForgotOtpDigits(['', '', '', '', '', '']);
        setSuccessMsg(result.message || (lang === 'vi' ? 'Mã xác thực OTP đã được gửi đến email của bạn.' : 'OTP verification code has been sent to your email.'));
      } else {
        setErrorMsg(result.message || (lang === 'vi' ? 'Không tìm thấy tài khoản hoặc có lỗi xảy ra.' : 'Account not found or an error occurred.'));
      }
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'vi' ? 'Lỗi khi gửi yêu cầu khôi phục mật khẩu.' : 'Error sending password reset request.'));
    } finally {
      setLoading(false);
    }
  };

  // 7. Nhập từng ô OTP Quên mật khẩu
  const handleForgotOtpDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const updated = [...forgotOtpDigits];
    updated[index] = digit;
    setForgotOtpDigits(updated);

    if (digit && index < 5) {
      forgotOtpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleForgotOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !forgotOtpDigits[index] && index > 0) {
      forgotOtpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleForgotOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const updated = [...forgotOtpDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = pastedData[i] || '';
    }
    setForgotOtpDigits(updated);

    const nextIndex = Math.min(pastedData.length, 5);
    forgotOtpInputsRef.current[nextIndex]?.focus();
  };

  // 8. Gửi lại OTP Quên mật khẩu
  const handleResendForgotOtp = async () => {
    if (!forgotCanResend || loading) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const captchaToken = await getRecaptchaToken('forgot_password');
      const result = await forgotPassword(forgotEmail.trim(), captchaToken);
      if (result.success) {
        setForgotCountdown(60);
        setForgotCanResend(false);
        setForgotOtpDigits(['', '', '', '', '', '']);
        setSuccessMsg(lang === 'vi' ? 'Đã gửi lại mã OTP mới vào email của bạn.' : 'A new OTP code has been resent to your email.');
        setTimeout(() => {
          forgotOtpInputsRef.current[0]?.focus();
        }, 100);
      } else {
        setErrorMsg(result.message || (lang === 'vi' ? 'Không thể gửi lại mã OTP.' : 'Could not resend OTP code.'));
      }
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'vi' ? 'Lỗi khi gửi lại OTP.' : 'Error resending OTP.'));
    } finally {
      setLoading(false);
    }
  };

  // 9. Xử lý Quên mật khẩu Bước 2: Xác thực mã OTP
  const handleVerifyForgotOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = forgotOtpDigits.join('');
    if (!otpCode || otpCode.length < 6) {
      setErrorMsg(lang === 'vi' ? 'Vui lòng nhập đủ 6 chữ số mã OTP.' : 'Please enter all 6 digits of the OTP code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const result = await verifyForgotOtp(forgotEmail.trim(), otpCode);
      if (result.success) {
        setForgotStep('new_password');
        setSuccessMsg('');
      } else {
        setErrorMsg(result.message || (lang === 'vi' ? 'Mã xác thực OTP không chính xác hoặc đã hết hạn.' : 'Invalid or expired OTP verification code.'));
      }
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'vi' ? 'Lỗi khi kiểm tra mã OTP.' : 'Error verifying OTP code.'));
    } finally {
      setLoading(false);
    }
  };

  // 10. Xử lý Quên mật khẩu Bước 3: Đặt mật khẩu mới
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = forgotOtpDigits.join('');
    if (!otpCode || otpCode.length < 6) {
      setErrorMsg(lang === 'vi' ? 'Mã OTP không hợp lệ hoặc đã thiếu. Vui lòng quay lại nhập lại mã OTP.' : 'Invalid or missing OTP code. Please go back and enter OTP.');
      setForgotStep('otp');
      return;
    }

    if (forgotNewPassword.length < 8) {
      setErrorMsg(lang === 'vi' ? 'Mật khẩu mới phải có tối thiểu 8 ký tự.' : 'New password must be at least 8 characters.');
      return;
    }

    if (!hasForgotUpper || !hasForgotLower || !hasForgotNum) {
      setErrorMsg(lang === 'vi' ? 'Mật khẩu mới phải bao gồm cả chữ hoa, chữ thường và chữ số.' : 'New password must contain uppercase, lowercase and numbers.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMsg(lang === 'vi' ? 'Mật khẩu xác nhận không khớp với mật khẩu mới.' : 'Confirm password does not match new password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const captchaToken = await getRecaptchaToken('reset_password');
      const result = await resetPassword(forgotEmail.trim(), otpCode, forgotNewPassword, captchaToken);
      if (result.success) {
        setForgotStep('success');
        setSuccessMsg(result.message || (lang === 'vi' ? 'Đặt lại mật khẩu thành công!' : 'Password reset successfully!'));
      } else {
        setErrorMsg(result.message || (lang === 'vi' ? 'Lỗi khi đặt lại mật khẩu.' : 'Error resetting password.'));
      }
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'vi' ? 'Lỗi khi đặt lại mật khẩu.' : 'Error resetting password.'));
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra tiêu chuẩn mật khẩu
  const hasMinLength = regPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(regPassword);
  const hasLower = /[a-z]/.test(regPassword);
  const hasNum = /[0-9]/.test(regPassword);
  const isMatch = regConfirmPassword.length > 0 && regPassword === regConfirmPassword;

  // Kiểm tra tiêu chuẩn mật khẩu Quên mật khẩu
  const hasForgotMinLength = forgotNewPassword.length >= 8;
  const hasForgotUpper = /[A-Z]/.test(forgotNewPassword);
  const hasForgotLower = /[a-z]/.test(forgotNewPassword);
  const hasForgotNum = /[0-9]/.test(forgotNewPassword);
  const isForgotMatch = forgotConfirmPassword.length > 0 && forgotNewPassword === forgotConfirmPassword;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" 
      onClick={() => {
        if (!loading && !isGoogleLoading) onClose();
      }}
    >
      <div 
        className="bg-white dark:bg-[#111827] w-full max-w-[460px] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-[#253047] animate-in zoom-in-95 duration-200 max-h-[92vh] text-slate-800 dark:text-slate-100 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#253047] flex items-center justify-between bg-slate-50/80 dark:bg-[#172033]/60 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">StockSim Authentication</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{lang === 'vi' ? 'Nền tảng giao dịch mô phỏng chứng khoán' : 'Simulated Stock Trading Platform'}</p>
            </div>
          </div>
          <button 
            disabled={loading || isGoogleLoading}
            onClick={() => {
              if (!loading && !isGoogleLoading) onClose();
            }} 
            className="p-1.5 hover:bg-slate-200/60 dark:hover:bg-[#253047] rounded-lg transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (Đăng nhập / Đăng ký / Quên mật khẩu) */}
        {tab !== 'forgot_password' ? (
          <div className="flex border-b border-slate-100 dark:border-[#253047] bg-slate-50 dark:bg-[#0c1220] transition-colors">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 text-center cursor-pointer ${
                tab === 'login'
                  ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#172033]/40'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/30'
              }`}
            >
              {t('auth.login', 'Đăng nhập')}
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setRegisterStep('form');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 text-center cursor-pointer ${
                tab === 'register'
                  ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#172033]/40'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/30'
              }`}
            >
              {lang === 'vi' ? 'Đăng ký tài khoản' : 'Sign up'}
            </button>
          </div>
        ) : (
          <div className="px-6 py-3 border-b border-slate-100 dark:border-[#253047] bg-slate-50 dark:bg-[#0c1220] flex items-center justify-between transition-colors">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{lang === 'vi' ? 'Quay lại đăng nhập' : 'Back to login'}</span>
            </button>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {lang === 'vi' ? 'Khôi phục mật khẩu' : 'Reset password'}
            </span>
          </div>
        )}

        {/* Scrollable Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(92vh-130px)] space-y-4 bg-white dark:bg-[#111827] transition-colors">
          
          {/* Cảnh báo nếu mở trong App mạng xã hội (Zalo/Facebook) */}
          {isInAppBrowser() && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="space-y-0.5">
                <span className="font-bold">{lang === 'vi' ? 'Đang mở trong ứng dụng (Zalo/Facebook):' : 'In-App Browser detected:'}</span>
                <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
                  {lang === 'vi' ? 'Google hạn chế đăng nhập từ trình duyệt nội bộ của ứng dụng. Vui lòng bấm vào biểu tượng ⋯ hoặc ⋮ và chọn "Mở bằng trình duyệt Safari/Chrome" để đăng nhập.' : 'Google limits sign-in from in-app browsers. Please tap ⋯ or ⋮ and select "Open in Safari/Chrome" to continue.'}
                </p>
              </div>
            </div>
          )}

          {/* Thông báo Lỗi */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Thông báo Thành công */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
              <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ======================= TAB 1: ĐĂNG NHẬP ======================= */}
          {tab === 'login' && (
            <form onSubmit={handleEmailLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'vi' ? 'Tài khoản Email / Gmail' : 'Email / Gmail account'} <span className="text-rose-500 dark:text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#172033] border border-slate-200 dark:border-[#253047] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:ring-1 dark:focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'vi' ? 'Mật khẩu' : 'Password'} <span className="text-rose-500 dark:text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('forgot_password');
                      setForgotEmail(loginEmail);
                      setErrorMsg('');
                      setSuccessMsg('');
                      setForgotStep('email');
                    }}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    {lang === 'vi' ? 'Quên mật khẩu?' : 'Forgot password?'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#172033] border border-slate-200 dark:border-[#253047] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:ring-1 dark:focus:ring-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 active:scale-[0.99] text-white shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-60 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{t('auth.login', 'Đăng nhập')}</span>
              </button>

              {/* Đường phân cách */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-[#253047]"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-[#111827] px-3 text-slate-400 dark:text-slate-500 font-semibold tracking-wider transition-colors">
                    {lang === 'vi' ? 'Hoặc đăng nhập bằng' : 'Or continue with'}
                  </span>
                </div>
              </div>

              {/* Nút Đăng nhập Google */}
              <button
                type="button"
                disabled={loading || isGoogleLoading}
                onClick={handleGoogleClick}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 transition-all bg-white hover:bg-slate-50 dark:bg-[#172033] dark:hover:bg-[#1e2a42] border border-slate-200 dark:border-[#253047] text-slate-700 hover:text-slate-900 dark:text-white shadow-sm cursor-pointer active:scale-[0.99] disabled:opacity-75 disabled:cursor-wait"
              >
                {isGoogleLoading || (loading && !loginEmail) ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600 dark:text-indigo-400" />
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{lang === 'vi' ? 'Đang kết nối Google...' : 'Connecting to Google...'}</span>
                  </>
                ) : (
                  <>
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                    <span>{lang === 'vi' ? 'Tiếp tục bằng Google' : 'Continue with Google'}</span>
                  </>
                )}
              </button>

              {/* Hướng dẫn và nút dự phòng nếu gặp sự cố Safari chặn Pop-up */}
              {googleError && (googleError.includes('Pop-up') || googleError.includes('Safari')) && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>{lang === 'vi' ? 'Mẹo mở đăng nhập trên Safari:' : 'Safari login tip:'}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 pl-5">
                    1. Bấm lại nút <strong>"{lang === 'vi' ? 'Tiếp tục bằng Google' : 'Continue with Google'}"</strong> và chọn <strong>"{lang === 'vi' ? 'Cho phép' : 'Allow'}"</strong> nếu có hộp thoại hỏi.<br />
                    2. Hoặc vào <strong>Cài đặt iPhone &gt; Safari &gt; Tắt "Chặn cửa sổ bật lên"</strong>.<br />
                    3. Hoặc đăng nhập trực tiếp qua nút bên dưới:
                  </p>
                  {onLoginGoogleCredential && (
                    <div className="pt-1 flex justify-center">
                      <GoogleLogin
                        onSuccess={(cred) => {
                          if (cred.credential) onLoginGoogleCredential(cred.credential);
                        }}
                        onError={() => setErrorMsg(lang === 'vi' ? 'Đăng nhập Google thất bại hoặc bị hủy.' : 'Google sign-in failed or was cancelled.')}
                        theme="outline"
                        size="large"
                        shape="rectangular"
                        text="continue_with"
                        width="100%"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'vi' ? 'Chưa có tài khoản?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setTab('register');
                      setRegisterStep('form');
                    }}
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold cursor-pointer"
                  >
                    {lang === 'vi' ? 'Đăng ký ngay' : 'Sign up now'}
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ======================= TAB 2: ĐĂNG KÝ ======================= */}
          {tab === 'register' && registerStep === 'form' && (
            <form onSubmit={handleRegisterFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'vi' ? 'Họ và tên' : 'Full name'} <span className="text-rose-500 dark:text-rose-400">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder={lang === 'vi' ? 'Ví dụ: Nguyễn Văn A' : 'e.g. John Doe'}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#172033] border border-slate-200 dark:border-[#253047] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:ring-1 dark:focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'vi' ? 'Tên tài khoản (Email/Gmail)' : 'Email / Gmail account'} <span className="text-rose-500 dark:text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nguyenvana@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#172033] border border-slate-200 dark:border-[#253047] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:ring-1 dark:focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'vi' ? 'Mật khẩu' : 'Password'} <span className="text-rose-500 dark:text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder={lang === 'vi' ? 'Tối thiểu 8 ký tự (hoa, thường, số)' : 'At least 8 characters (upper, lower, number)'}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#172033] border border-slate-200 dark:border-[#253047] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:ring-1 dark:focus:ring-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'vi' ? 'Xác nhận lại mật khẩu' : 'Confirm password'} <span className="text-rose-500 dark:text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder={lang === 'vi' ? 'Nhập lại mật khẩu vừa đặt' : 'Re-enter your password'}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#172033] border border-slate-200 dark:border-[#253047] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:ring-1 dark:focus:ring-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Bảng kiểm tra tiêu chuẩn mật khẩu thời gian thực */}
              <div className="p-3 bg-slate-50 dark:bg-[#0d1424] border border-slate-200 dark:border-[#1e2a42] rounded-xl text-xs space-y-1.5 transition-colors">
                <p className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider mb-1">
                  {lang === 'vi' ? 'Yêu cầu mật khẩu an toàn:' : 'Password requirements:'}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                    <Check className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400' : 'opacity-30'}`} />
                    <span>{lang === 'vi' ? 'Tối thiểu 8 ký tự' : 'At least 8 characters'}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                    <Check className={`w-3.5 h-3.5 ${hasUpper ? 'text-emerald-600 dark:text-emerald-400' : 'opacity-30'}`} />
                    <span>{lang === 'vi' ? 'Có chữ in hoa (A-Z)' : 'Uppercase letter (A-Z)'}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                    <Check className={`w-3.5 h-3.5 ${hasLower ? 'text-emerald-600 dark:text-emerald-400' : 'opacity-30'}`} />
                    <span>{lang === 'vi' ? 'Có chữ thường (a-z)' : 'Lowercase letter (a-z)'}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNum ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                    <Check className={`w-3.5 h-3.5 ${hasNum ? 'text-emerald-600 dark:text-emerald-400' : 'opacity-30'}`} />
                    <span>{lang === 'vi' ? 'Có chữ số (0-9)' : 'Number (0-9)'}</span>
                  </div>
                </div>
                {regConfirmPassword && (
                  <div className={`flex items-center gap-1.5 pt-1 border-t border-slate-200 dark:border-[#1e2a42] ${isMatch ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-rose-500 dark:text-rose-400 font-medium'}`}>
                    <Check className={`w-3.5 h-3.5 ${isMatch ? 'text-emerald-600 dark:text-emerald-400' : 'opacity-30'}`} />
                    <span>{isMatch ? (lang === 'vi' ? 'Mật khẩu xác nhận trùng khớp' : 'Passwords match') : (lang === 'vi' ? 'Mật khẩu xác nhận chưa khớp' : 'Passwords do not match')}</span>
                  </div>
                )}
              </div>

              {/* Checkbox Đồng ý điều khoản */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="regTerms"
                  required
                  checked={regTermsAccepted}
                  onChange={(e) => setRegTermsAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-[#253047] text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-[#172033] cursor-pointer"
                />
                <label htmlFor="regTerms" className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed cursor-pointer">
                  {lang === 'vi' ? (
                    <>
                      Tôi đồng ý tham gia và chấp thuận{' '}
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold underline">Điều khoản dịch vụ</span> &amp;{' '}
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold underline">Chính sách bảo mật</span> của StockSim.
                    </>
                  ) : (
                    <>
                      I agree to join and accept the{' '}
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold underline">Terms of Service</span> &amp;{' '}
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold underline">Privacy Policy</span> of StockSim.
                    </>
                  )}
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !regTermsAccepted}
                className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-500 dark:hover:to-indigo-500 active:scale-[0.99] text-white shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>{lang === 'vi' ? 'Tiếp tục & Gửi mã OTP xác nhận' : 'Continue & Send OTP code'}</span>
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'vi' ? 'Đã có tài khoản?' : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={() => setTab('login')}
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold cursor-pointer"
                  >
                    {lang === 'vi' ? 'Đăng nhập' : 'Sign in'}
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ======================= TAB 2 - BƯỚC 2: NHẬP OTP ======================= */}
          {tab === 'register' && registerStep === 'otp' && (
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
                  <KeyRound className="w-6 h-6 animate-bounce text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {lang === 'vi' ? 'Xác thực mã OTP' : 'Verify OTP code'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  {lang === 'vi' ? (
                    <>
                      Mã xác thực gồm 6 chữ số đã được gửi đến email: <br />
                      <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">{regEmail}</strong>
                    </>
                  ) : (
                    <>
                      A 6-digit verification code was sent to: <br />
                      <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">{regEmail}</strong>
                    </>
                  )}
                </p>
              </div>

              {/* 6 ô vuông nhập mã OTP */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 text-center">
                  {lang === 'vi' ? 'Nhập mã 6 chữ số (Hiệu lực trong 10 phút)' : 'Enter 6-digit code (Valid for 10 minutes)'}
                </label>
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputsRef.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      onFocus={(e) => e.target.select()}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl transition-all outline-none border-2
                        ${
                          digit
                            ? 'border-indigo-600 text-indigo-600 bg-indigo-50/70 shadow-sm dark:border-cyan-400 dark:text-cyan-300 dark:bg-cyan-950/20 dark:shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                            : 'border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-400 dark:border-[#253047] dark:bg-[#172033] dark:text-white dark:hover:border-slate-500'
                        }
                        focus:border-indigo-600 focus:bg-white dark:focus:border-indigo-500 dark:focus:bg-[#1c273e] focus:ring-4 focus:ring-indigo-500/20`}
                    />
                  ))}
                </div>
              </div>

              {/* Nút Xác nhận OTP */}
              <button
                type="submit"
                disabled={loading || otpDigits.join('').length < 6}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{lang === 'vi' ? 'Xác nhận & Hoàn tất đăng ký' : 'Verify & Complete Registration'}</span>
              </button>

              {/* Nút gửi lại mã & Quay lại */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#253047] text-xs">
                <button
                  type="button"
                  onClick={() => setRegisterStep('form')}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{lang === 'vi' ? 'Sửa thông tin' : 'Edit info'}</span>
                </button>

                <div>
                  {canResend ? (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleResendOtp}
                      className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                      <span>{lang === 'vi' ? 'Gửi lại mã OTP' : 'Resend OTP'}</span>
                    </button>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">
                      {lang === 'vi' ? 'Gửi lại sau:' : 'Resend in:'} <strong className="font-mono text-slate-600 dark:text-slate-400">{countdown}s</strong>
                    </span>
                  )}
                </div>
              </div>
            </form>
          )}

          {/* ======================= TAB 3: QUÊN MẬT KHẨU ======================= */}
          {tab === 'forgot_password' && forgotStep === 'email' && (
            <form onSubmit={handleForgotEmailSubmit} className="space-y-4 animate-in fade-in duration-200">
              <div className="text-center space-y-1.5 py-1">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
                  <KeyRound className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {lang === 'vi' ? 'Quên mật khẩu đăng nhập?' : 'Forgot your password?'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                  {lang === 'vi' 
                    ? 'Nhập địa chỉ email tài khoản của bạn để nhận mã xác thực OTP 6 chữ số và tạo mật khẩu mới.'
                    : 'Enter your registered email address to receive a 6-digit OTP code and create a new password.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'vi' ? 'Địa chỉ Email đã đăng ký' : 'Registered email address'} <span className="text-rose-500 dark:text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#172033] border border-slate-200 dark:border-[#253047] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:ring-1 dark:focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !forgotEmail.trim()}
                className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 active:scale-[0.99] text-white shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>{lang === 'vi' ? 'Gửi mã xác thực OTP' : 'Send OTP verification code'}</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white inline-flex items-center gap-1 font-medium cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{lang === 'vi' ? 'Quay lại trang Đăng nhập' : 'Back to sign in'}</span>
                </button>
              </div>
            </form>
          )}

          {/* QUÊN MẬT KHẨU BƯỚC 2: NHẬP VÀ XÁC THỰC MÃ OTP */}
          {tab === 'forgot_password' && forgotStep === 'otp' && (
            <form onSubmit={handleVerifyForgotOtpSubmit} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
                  <KeyRound className="w-6 h-6 animate-bounce text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {lang === 'vi' ? 'Xác thực mã OTP' : 'Verify OTP code'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  {lang === 'vi' ? (
                    <>
                      Mã xác thực gồm 6 chữ số đã được gửi tới: <br />
                      <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">{forgotEmail}</strong>
                    </>
                  ) : (
                    <>
                      A 6-digit verification code was sent to: <br />
                      <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">{forgotEmail}</strong>
                    </>
                  )}
                </p>
              </div>

              {/* 6 ô vuông OTP */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 text-center">
                  {lang === 'vi' ? 'Nhập mã 6 chữ số (Hiệu lực trong 10 phút)' : 'Enter 6-digit code (Valid for 10 minutes)'}
                </label>
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {forgotOtpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        forgotOtpInputsRef.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleForgotOtpDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleForgotOtpKeyDown(index, e)}
                      onPaste={handleForgotOtpPaste}
                      onFocus={(e) => e.target.select()}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl transition-all outline-none border-2
                        ${
                          digit
                            ? 'border-indigo-600 text-indigo-600 bg-indigo-50/70 shadow-sm dark:border-cyan-400 dark:text-cyan-300 dark:bg-cyan-950/20 dark:shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                            : 'border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-400 dark:border-[#253047] dark:bg-[#172033] dark:text-white dark:hover:border-slate-500'
                        }
                        focus:border-indigo-600 focus:bg-white dark:focus:border-indigo-500 dark:focus:bg-[#1c273e] focus:ring-4 focus:ring-indigo-500/20`}
                    />
                  ))}
                </div>
              </div>

              {/* Nút Xác nhận OTP */}
              <button
                type="submit"
                disabled={loading || forgotOtpDigits.join('').length < 6}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-500 dark:hover:to-indigo-500 active:scale-[0.99] text-white shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>{lang === 'vi' ? 'Xác nhận mã OTP & Tiếp tục' : 'Verify OTP code & Continue'}</span>
              </button>

              {/* Gửi lại mã / Đổi email */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#253047] text-xs">
                <button
                  type="button"
                  onClick={() => setForgotStep('email')}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{lang === 'vi' ? 'Đổi Email khác' : 'Change email'}</span>
                </button>

                <div>
                  {forgotCanResend ? (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleResendForgotOtp}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                      <span>{lang === 'vi' ? 'Gửi lại mã OTP' : 'Resend OTP'}</span>
                    </button>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">
                      {lang === 'vi' ? 'Gửi lại sau:' : 'Resend in:'} <strong className="font-mono text-slate-600 dark:text-slate-400">{forgotCountdown}s</strong>
                    </span>
                  )}
                </div>
              </div>
            </form>
          )}

          {/* QUÊN MẬT KHẨU BƯỚC 3: THIẾT LẬP MẬT KHẨU MỚI */}
          {tab === 'forgot_password' && forgotStep === 'new_password' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center space-y-1.5 py-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                  <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {lang === 'vi' ? 'Thiết lập mật khẩu mới' : 'Set new password'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {lang === 'vi' ? (
                    <>
                      Nhập mật khẩu đăng nhập mới cho tài khoản: <br />
                      <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">{forgotEmail}</strong>
                    </>
                  ) : (
                    <>
                      Enter a new login password for account: <br />
                      <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">{forgotEmail}</strong>
                    </>
                  )}
                </p>
              </div>

              {/* Mật khẩu mới */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'vi' ? 'Mật khẩu mới' : 'New password'} <span className="text-rose-500 dark:text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type={showForgotNewPassword ? 'text' : 'password'}
                    required
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder={lang === 'vi' ? 'Tối thiểu 8 ký tự (hoa, thường, số)' : 'At least 8 characters (upper, lower, number)'}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#172033] border border-slate-200 dark:border-[#253047] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:ring-1 dark:focus:ring-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1 cursor-pointer"
                  >
                    {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'vi' ? 'Xác nhận lại mật khẩu mới' : 'Confirm new password'} <span className="text-rose-500 dark:text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type={showForgotConfirmPassword ? 'text' : 'password'}
                    required
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder={lang === 'vi' ? 'Nhập lại mật khẩu mới vừa đặt' : 'Re-enter your new password'}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#172033] border border-slate-200 dark:border-[#253047] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:ring-1 dark:focus:ring-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1 cursor-pointer"
                  >
                    {showForgotConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Bảng tiêu chuẩn mật khẩu */}
              <div className="p-3 bg-slate-50 dark:bg-[#0d1424] border border-slate-200 dark:border-[#1e2a42] rounded-xl text-xs space-y-1.5 transition-colors">
                <p className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider mb-1">
                  {lang === 'vi' ? 'Yêu cầu bảo mật mật khẩu:' : 'Password security requirements:'}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className={`flex items-center gap-1.5 ${hasForgotMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                    <Check className={`w-3.5 h-3.5 ${hasForgotMinLength ? 'text-emerald-600 dark:text-emerald-400' : 'opacity-30'}`} />
                    <span>{lang === 'vi' ? 'Tối thiểu 8 ký tự' : 'At least 8 characters'}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasForgotUpper ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                    <Check className={`w-3.5 h-3.5 ${hasForgotUpper ? 'text-emerald-600 dark:text-emerald-400' : 'opacity-30'}`} />
                    <span>{lang === 'vi' ? 'Có chữ in hoa (A-Z)' : 'Uppercase letter (A-Z)'}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasForgotLower ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                    <Check className={`w-3.5 h-3.5 ${hasForgotLower ? 'text-emerald-600 dark:text-emerald-400' : 'opacity-30'}`} />
                    <span>{lang === 'vi' ? 'Có chữ thường (a-z)' : 'Lowercase letter (a-z)'}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasForgotNum ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                    <Check className={`w-3.5 h-3.5 ${hasForgotNum ? 'text-emerald-600 dark:text-emerald-400' : 'opacity-30'}`} />
                    <span>{lang === 'vi' ? 'Có chữ số (0-9)' : 'Number (0-9)'}</span>
                  </div>
                </div>
                {forgotConfirmPassword && (
                  <div className={`flex items-center gap-1.5 pt-1.5 border-t border-slate-200 dark:border-[#1e2a42] ${isForgotMatch ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-rose-500 dark:text-rose-400 font-medium'}`}>
                    <Check className={`w-3.5 h-3.5 ${isForgotMatch ? 'text-emerald-600 dark:text-emerald-400' : 'opacity-30'}`} />
                    <span>{isForgotMatch ? (lang === 'vi' ? 'Mật khẩu xác nhận trùng khớp' : 'Passwords match') : (lang === 'vi' ? 'Mật khẩu xác nhận chưa khớp' : 'Passwords do not match')}</span>
                  </div>
                )}
              </div>

              {/* Nút Đặt lại mật khẩu */}
              <button
                type="submit"
                disabled={loading || !hasForgotMinLength || !hasForgotUpper || !hasForgotLower || !hasForgotNum || !isForgotMatch}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{lang === 'vi' ? 'Cập nhật mật khẩu mới' : 'Update new password'}</span>
              </button>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-[#253047] text-xs">
                <button
                  type="button"
                  onClick={() => setForgotStep('otp')}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{lang === 'vi' ? 'Quay lại nhập mã OTP' : 'Back to OTP entry'}</span>
                </button>
              </div>
            </form>
          )}

          {/* QUÊN MẬT KHẨU BƯỚC 3: THÀNH CÔNG */}
          {tab === 'forgot_password' && forgotStep === 'success' && (
            <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                <Check className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {lang === 'vi' ? 'Đặt lại mật khẩu thành công!' : 'Password reset successfully!'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  {lang === 'vi' ? (
                    <>
                      Mật khẩu của tài khoản <strong>{forgotEmail}</strong> đã được cập nhật thành công. Bạn có thể đăng nhập ngay bây giờ.
                    </>
                  ) : (
                    <>
                      The password for account <strong>{forgotEmail}</strong> has been updated successfully. You can sign in now.
                    </>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setForgotStep('email');
                  setLoginEmail(forgotEmail);
                  setLoginPassword('');
                  setErrorMsg('');
                  setSuccessMsg(lang === 'vi' ? 'Vui lòng đăng nhập bằng mật khẩu mới của bạn.' : 'Please sign in with your new password.');
                }}
                className="w-full py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              >
                {lang === 'vi' ? 'Đăng nhập ngay' : 'Sign in now'}
              </button>
            </div>
          )}

        </div>

        {/* Footer info badge */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-[#0d1424] border-t border-slate-100 dark:border-[#253047] text-[11px] text-slate-500 dark:text-slate-400 text-center flex items-center justify-center gap-1.5 transition-colors">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{lang === 'vi' ? 'Bảo mật tự động bởi ' : 'Protected by '}<strong className="text-slate-600 dark:text-slate-400 font-semibold">Google reCAPTCHA v3</strong></span>
        </div>
      </div>
    </div>
  );
};
