import { useChallengeTranslation } from './useChallengeTranslation';
import React, { useState, useEffect } from 'react';
import { 
  Trophy, CheckCircle2, Lock, RefreshCw, 
  Award, X, AlertTriangle, TrendingUp, Sparkles, Check, LogIn,
  Pause, Play, Square
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { 
  UserChallengeState, 
  ChallengeLevelConfig, 
  PassedCertificate 
} from './types';
import { ChallengeCertificateModal } from './ChallengeCertificateModal';
import { challengeApi } from '../../services/challengeApi';
import { useModal } from '../../contexts/ModalContext';

const MAX_RESETS_PER_WEEK = 4;

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeState: UserChallengeState;
  onStateUpdate: (newState: UserChallengeState) => void;
  userName?: string;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  onClose,
  challengeState,
  onStateUpdate,
  userName = 'Trader',
}) => {
  const { tr, levelName, badge } = useChallengeTranslation();
  const { user, login } = useAuth();
  const { showConfirm, showAlert } = useModal();
  const [activeTab, setActiveTab] = useState<'levels' | 'dashboard' | 'certificates'>('levels');
  const [levels, setLevels] = useState<ChallengeLevelConfig[]>([]);
  const [selectedCert, setSelectedCert] = useState<PassedCertificate | null>(null);
  const [confirmStartLevel, setConfirmStartLevel] = useState<ChallengeLevelConfig | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Tải cấu hình 6 cấp độ thi từ Backend API
  useEffect(() => {
    challengeApi.getLevels().then(res => {
      if (res && res.success && res.levels) {
        setLevels(res.levels);
      }
    }).catch(err => {
      console.warn('Lỗi tải danh sách cấp độ từ backend:', err);
    });
  }, []);

  if (!isOpen) return null;

  const currentLevelConfig = levels.find(l => l.id === challengeState.currentLevel) || levels[0] || {
    id: 1,
    levelName: 'Tập Sự',
    badge: 'Cấp 1',
    capitalUSD: 10_000,
    profitTargetPercent: 8,
    dailyLossLimitPercent: 4,
    maxDrawdownPercent: 8,
    minTradingDays: 2,
    maxLeverage: 20,
  };
  const effectiveUserName = user?.name || userName;

  const handleStartClick = (level: ChallengeLevelConfig) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    setConfirmStartLevel(level);
  };

  const handleStartLevel = async (level: ChallengeLevelConfig) => {
    try {
      const res = await challengeApi.startChallenge(level.id);
      if (res.success && res.challenge) {
        onStateUpdate(res.challenge);
        setConfirmStartLevel(null);
        setActiveTab('dashboard');
        setActionMessage({
          text: `${tr("🎉 Đã kích hoạt bài thi:")} ${badge(level.id)} (${levelName(level.id, level.levelName)}) — ${effectiveUserName}. ${tr("Vốn:")} $${level.capitalUSD.toLocaleString('en-US')}.`,
          type: 'success',
        });
        setTimeout(() => setActionMessage(null), 5000);
      }
    } catch (err: any) {
      setActionMessage({
        text: `${tr("Lỗi:")} ${err.message ? tr(err.message) : tr("Không thể bắt đầu bài thi")}`,
        type: 'error',
      });
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const handleResetChallenge = async () => {
    try {
      const res = await challengeApi.resetChallenge();
      if (res.success && res.challenge) {
        onStateUpdate(res.challenge);
        setActionMessage({ text: tr("Đã reset bài thi thành công."), type: 'success' });
        setTimeout(() => setActionMessage(null), 5000);
      }
    } catch (err: any) {
      setActionMessage({ text: `${tr("Lỗi:")} ${err.message ? tr(err.message) : tr("Không thể reset bài thi")}`, type: 'error' });
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const handlePauseChallenge = async () => {
    try {
      const res = await challengeApi.pauseChallenge();
      if (res.success && res.challenge) {
        onStateUpdate(res.challenge);
        setActionMessage({ text: tr("⏸️ Đã tạm dừng bài thi cấp vốn."), type: 'success' });
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err: any) {
      setActionMessage({ text: `${tr("Lỗi:")} ${err.message ? tr(err.message) : tr("Không thể tạm dừng")}`, type: 'error' });
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleResumeChallenge = async () => {
    try {
      const res = await challengeApi.resumeChallenge();
      if (res.success && res.challenge) {
        onStateUpdate(res.challenge);
        setActionMessage({ text: tr("▶️ Đã tiếp tục bài thi cấp vốn!"), type: 'success' });
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err: any) {
      setActionMessage({ text: `${tr("Lỗi:")} ${err.message ? tr(err.message) : tr("Không thể tiếp tục")}`, type: 'error' });
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleEndChallenge = async () => {
    const confirmed = await showConfirm({
      title: tr("Xác nhận kết thúc bài thi"),
      message: tr("Bạn có chắc chắn muốn KẾT THÚC bài thi này để quay về trạng thái tài khoản thường không?"),
      type: 'danger',
      confirmText: tr("Kết thúc bài thi"),
      cancelText: tr("Hủy bỏ"),
    });
    if (!confirmed) {
      return;
    }
    try {
      const res = await challengeApi.endChallenge();
      if (res.success && res.challenge) {
        onStateUpdate(res.challenge);
        setActiveTab('levels');
        showAlert({
          title: tr("Đã kết thúc bài thi"),
          message: tr("⏹️ Đã kết thúc bài thi cấp vốn thành công. Số dư và danh mục tài khoản thường của bạn đã được khôi phục!"),
          type: 'success'
        });
      }
    } catch (err: any) {
      showAlert({
        title: tr("Lỗi kết thúc bài thi"),
        message: `${tr("Lỗi:")} ${err.message ? tr(err.message) : tr("Không thể kết thúc bài thi")}`,
        type: 'error'
      });
    }
  };

  const targetAmount = (currentLevelConfig.profitTargetPercent / 100) * challengeState.startingCapitalUSD;
  const targetProgress = Math.min(100, Math.max(0, (challengeState.totalProfitUSD / targetAmount) * 100));

  const dailyLossLimit = (currentLevelConfig.dailyLossLimitPercent / 100) * challengeState.startingCapitalUSD;
  const dailyLossPercent = Math.min(100, (challengeState.dailyLossUSD / dailyLossLimit) * 100);

  const maxLossLimit = (currentLevelConfig.maxDrawdownPercent / 100) * challengeState.startingCapitalUSD;
  const maxLossPercent = Math.min(100, (challengeState.maxLossUSD / maxLossLimit) * 100);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
        <div className="relative w-full max-w-6xl max-h-[94vh] bg-[#0c0f17] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-200 font-sans">
          
          {/* Top Bar: Minimal & Elegant */}
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#0c0f17]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-sm">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">
                  {tr("THỬ THÁCH CẤP VỐN TRADER")}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {tr("Giao dịch thị trường thật • Khóa vốn kỷ luật • Giới hạn 4 lần reset/tuần")}
                </p>
              </div>
            </div>

            {/* Top Right Navigation Tabs */}
            <div className="flex items-center gap-2">
              <div className="flex bg-[#141824] p-1 rounded-xl border border-white/5 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('levels')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'levels'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tr("Gói Cấp Vốn")}
                </button>

                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeTab === 'dashboard'
                      ? 'bg-blue-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{tr("Tiến Độ")}</span>
                  {challengeState.status === 'ACTIVE' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('certificates')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'certificates'
                      ? 'bg-purple-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tr("Chứng Chỉ")} ({challengeState.certificates.length})
                </button>
              </div>

              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action toast message */}
          {actionMessage && (
            <div className={`mx-6 mt-3 p-3 rounded-xl text-xs font-medium flex items-center justify-between border ${
              actionMessage.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
            }`}>
              <span>{actionMessage.text}</span>
              <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white ml-2">✕</button>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">

            {/* TAB 1: TẤT CẢ 6 CẤP ĐỘ TRÊN CÙNG 1 MÀN HÌNH (Chuẩn FTMO Comparison Table) */}
            {activeTab === 'levels' && (
              <div className="space-y-4">
                
                {/* Thông báo đăng nhập & Lượt reset */}
                {!user ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-blue-500/10 border border-blue-500/25 rounded-xl text-xs text-blue-300">
                    <div className="flex items-center gap-2">
                      <LogIn className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>{tr("Bạn cần đăng nhập tài khoản trước khi thi để hệ thống lưu lịch sử và cấp chứng chỉ.")}</span>
                    </div>
                    <button
                      onClick={() => login()}
                      className="px-3.5 py-1.5 bg-[#0088ff] hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-all shrink-0 shadow-md shadow-blue-500/20"
                    >
                      {tr("Đăng nhập ngay")}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-3.5 py-2 bg-[#121622] border border-white/5 rounded-xl text-xs">
                    <div className="flex items-center gap-2.5">
                      {user.picture ? (
                        <img src={user.picture} alt={user.name} className="w-5 h-5 rounded-full" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                          {user.name?.charAt(0) || 'T'}
                        </div>
                      )}
                      <span className="text-slate-300">Trader: <strong className="text-white">{user.name}</strong> <span className="text-slate-500">({user.email})</span></span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 shrink-0">
                      <span>{tr("Lượt reset tuần này:")}</span>
                      <span className="font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                        {MAX_RESETS_PER_WEEK - challengeState.resetsUsedThisWeek} / {MAX_RESETS_PER_WEEK}
                      </span>
                    </div>
                  </div>
                )}

                {/* BẢNG 6 CẤP ĐỘ TRÊN 1 MÀN HÌNH DUY NHẤT */}
                <div className="overflow-x-auto pt-2 pb-2 px-1">
                  <div className="grid grid-cols-6 gap-3 min-w-[860px] items-stretch">
                    {levels.map((lvl) => {
                      const isUnlocked = challengeState.unlockedLevels.includes(lvl.id);
                      const isCurrent = challengeState.currentLevel === lvl.id && challengeState.status === 'ACTIVE';
                      const isPassed = challengeState.certificates.some(c => c.levelId === lvl.id);

                      return (
                        <div
                          key={lvl.id}
                          className={`relative rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 ${
                            isCurrent
                              ? 'bg-[#111a2e] border-2 border-blue-500 shadow-xl shadow-blue-500/15'
                              : isPassed
                              ? 'bg-[#0e1724] border border-emerald-500/40 shadow-md shadow-emerald-500/5'
                              : isUnlocked
                              ? 'bg-[#121622] border border-white/15 hover:border-blue-400/40 hover:bg-[#141a29]'
                              : 'bg-[#0d1017] border border-white/5 opacity-55'
                          }`}
                        >
                          {/* Huy hiệu trạng thái nếu đang thi hoặc đã đỗ */}
                          {isCurrent ? (
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-500 text-white font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow whitespace-nowrap">
                              {tr("Đang Thi")}
                            </div>
                          ) : isPassed ? (
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-500/90 text-slate-950 font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow whitespace-nowrap">
                              {tr("✓ Đã Đỗ")}
                            </div>
                          ) : null}

                          {/* Đầu thẻ: Tên cấp & Vốn */}
                          <div className="text-center pt-1 pb-3 border-b border-white/5">
                            <span className="inline-block text-[11px] font-semibold text-slate-400 mb-1">
                              {badge(lvl.id)} • {levelName(lvl.id, lvl.levelName)}
                            </span>
                            <div className="text-2xl font-black text-white font-mono tracking-tight">
                              ${lvl.capitalUSD >= 1000 ? `${lvl.capitalUSD / 1000}K` : lvl.capitalUSD}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {lvl.capitalUSD.toLocaleString('en-US')} USD
                            </div>
                          </div>

                          {/* Chi tiết tiêu chuẩn bài thi */}
                          <div className="py-3 space-y-2.5 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-500 block">{tr("Mục tiêu lợi nhuận")}</span>
                              <span className="font-bold text-emerald-400 font-mono text-[13px]">
                                +{lvl.profitTargetPercent}%
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                (+${((lvl.capitalUSD * lvl.profitTargetPercent) / 100).toLocaleString('en-US')})
                              </span>
                            </div>

                            <div className="pt-1 border-t border-white/5">
                              <span className="text-[10px] text-slate-500 block">{tr("Lỗ tối đa ngày")}</span>
                              <span className="font-bold text-amber-400 font-mono text-[13px]">
                                -{lvl.dailyLossLimitPercent}%
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                (-${((lvl.capitalUSD * lvl.dailyLossLimitPercent) / 100).toLocaleString('en-US')})
                              </span>
                            </div>

                            <div className="pt-1 border-t border-white/5">
                              <span className="text-[10px] text-slate-500 block">{tr("Sụt giảm tối đa")}</span>
                              <span className="font-bold text-rose-400 font-mono text-[13px]">
                                -{lvl.maxDrawdownPercent}%
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                (-${((lvl.capitalUSD * lvl.maxDrawdownPercent) / 100).toLocaleString('en-US')})
                              </span>
                            </div>

                            <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[11px] gap-2">
                              <span className="text-slate-500 whitespace-nowrap shrink-0">{tr("Ngày tối thiểu:")}</span>
                              <span className="font-semibold text-slate-200 whitespace-nowrap">{lvl.minTradingDays} {tr("ngày")}</span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] gap-2">
                              <span className="text-slate-500 whitespace-nowrap shrink-0">{tr("Đòn bẩy:")}</span>
                              <span className="font-semibold text-cyan-400 font-mono whitespace-nowrap">
                                {lvl.id === 6 ? '1:500 (Max)' : `1:${lvl.maxLeverage}`}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] gap-2">
                              <span className="text-slate-500 whitespace-nowrap shrink-0">{tr("Thời hạn:")}</span>
                              <span className="font-medium text-slate-300 whitespace-nowrap">{tr("Vô hạn")}</span>
                            </div>
                          </div>

                          {/* Nút hành động ở chân cột */}
                          <div className="pt-2">
                            {!isUnlocked ? (
                              <button
                                disabled
                                className="w-full py-2 bg-white/5 text-slate-500 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 cursor-not-allowed border border-white/5"
                              >
                                <Lock className="w-3 h-3" />
                                <span>{tr("Cần đỗ Cấp")} {lvl.id - 1}</span>
                              </button>
                            ) : isCurrent ? (
                              <button
                                onClick={() => setActiveTab('dashboard')}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-bold transition-all shadow-md shadow-blue-600/20"
                              >
                                {tr("Đang thi")}
                              </button>
                            ) : isPassed ? (
                              <button
                                onClick={() => handleStartClick(lvl)}
                                className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{tr("Thi lại")}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartClick(lvl)}
                                className="w-full py-2 bg-[#0088ff] hover:bg-blue-500 text-white rounded-xl text-[11px] font-bold transition-all shadow-md shadow-blue-500/20 hover:scale-[1.02]"
                              >
                                {tr("Bắt đầu")}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chân trang: Cam kết quy chuẩn */}
                <div className="pt-2 text-center text-xs text-slate-400 flex flex-wrap items-center justify-center gap-3 sm:gap-6 border-t border-white/5">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Check className="w-3.5 h-3.5" /> {tr("Dữ liệu sàn Binance thời gian thực 100%")}
                  </span>
                  <span>•</span>
                  <span>{tr("Khóa sửa số dư trong thời gian thi để rèn kỷ luật")}</span>
                  <span>•</span>
                  <span>{tr("Tối đa 4 lượt reset mỗi tuần")}</span>
                </div>

              </div>
            )}

            {/* TAB 2: TIẾN ĐỘ BÀI THI (Dashboard mượt mà, dễ nhìn) */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                
                {/* Header Level đang thi */}
                <div className="bg-[#121622] border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-white">{levelName(currentLevelConfig.id, currentLevelConfig.levelName)}</h3>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        challengeState.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                          : challengeState.status === 'PAUSED'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : challengeState.status === 'PASSED'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : challengeState.status === 'FAILED'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {challengeState.status === 'ACTIVE' && tr("Đang làm bài thi")}
                        {challengeState.status === 'PAUSED' && tr("Đang tạm dừng")}
                        {challengeState.status === 'PASSED' && tr("Đã hoàn thành xuất sắc")}
                        {challengeState.status === 'FAILED' && tr("Đã vi phạm quy tắc")}
                        {challengeState.status === 'NOT_STARTED' && tr("Chưa bắt đầu")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {tr("Vốn cấp ban đầu:")} <strong className="text-white font-mono text-sm">${challengeState.startingCapitalUSD.toLocaleString('en-US')}</strong>
                    </p>
                  </div>

                  {/* Actions: Pause, Resume, End, Reset */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {challengeState.status === 'ACTIVE' && (
                      <button
                        onClick={handlePauseChallenge}
                        className="px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-amber-500/30"
                        title={tr("Tạm dừng đánh giá để nghỉ ngơi hoặc quan sát thị trường")}
                      >
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>{tr("Tạm dừng")}</span>
                      </button>
                    )}

                    {challengeState.status === 'PAUSED' && (
                      <button
                        onClick={handleResumeChallenge}
                        className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-500/20"
                        title={tr("Tiếp tục bài thi")}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{tr("Tiếp tục thi")}</span>
                      </button>
                    )}

                    {(challengeState.status === 'ACTIVE' || challengeState.status === 'PAUSED') && (
                      <button
                        onClick={handleEndChallenge}
                        className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-rose-500/20"
                        title={tr("Kết thúc và rời bài thi để quay lại tài khoản thường")}
                      >
                        <Square className="w-3.5 h-3.5" />
                        <span>{tr("Kết thúc")}</span>
                      </button>
                    )}

                    <div className="h-6 w-[1px] bg-white/10 mx-1 hidden sm:block" />

                    <div className="text-right text-xs text-slate-400 pr-1">
                      <span>{tr("Lượt reset:")} </span>
                      <strong className="text-cyan-400 font-mono">
                        {MAX_RESETS_PER_WEEK - challengeState.resetsUsedThisWeek}/{MAX_RESETS_PER_WEEK}
                      </strong>
                    </div>

                    <button
                      onClick={handleResetChallenge}
                      disabled={MAX_RESETS_PER_WEEK - challengeState.resetsUsedThisWeek <= 0}
                      className="px-3.5 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-white/10"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* Banner cảnh báo thất bại nếu có */}
                {challengeState.status === 'FAILED' && (
                  <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-rose-200 block text-sm font-bold mb-0.5">{tr("Tài khoản bài thi đã bị khóa do vi phạm!")}</strong>
                      <p>{tr(challengeState.breachReason || '')}</p>
                      <p className="mt-1 text-slate-400">{tr("Hãy nhấn \"Reset bài thi\" để bắt đầu lại thử thách.")}</p>
                    </div>
                  </div>
                )}

                {/* Banner chúc mừng nếu đỗ */}
                {challengeState.status === 'PASSED' && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/50 to-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Award className="w-7 h-7 text-amber-400 shrink-0" />
                      <div>
                        <strong className="text-amber-300 block text-base font-bold">{tr("Chúc mừng! Bạn đã thi đỗ thử thách!")}</strong>
                        <p className="text-slate-300">{tr("Level tiếp theo đã được mở khóa và chứng chỉ đã sẵn sàng.")}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const cert = challengeState.certificates.find(c => c.levelId === challengeState.currentLevel) || challengeState.certificates[0];
                        if (cert) setSelectedCert(cert);
                      }}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shrink-0 shadow-lg shadow-amber-500/20"
                    >
                      {tr("Xem Bằng Chứng Nhận")}
                    </button>
                  </div>
                )}

                {/* 4 Khối số liệu to rõ ràng */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="bg-[#12151f] border border-white/5 rounded-xl p-4">
                    <span className="text-slate-400 block mb-1">{tr("Tài sản (Equity):")}</span>
                    <span className="text-xl font-bold text-white font-mono">
                      ${challengeState.currentEquityUSD.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </span>
                  </div>

                  <div className="bg-[#12151f] border border-white/5 rounded-xl p-4">
                    <span className="text-slate-400 block mb-1">{tr("Lợi nhuận ròng:")}</span>
                    <span className={`text-xl font-bold font-mono ${challengeState.totalProfitUSD >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {challengeState.totalProfitUSD >= 0 ? '+' : ''}${challengeState.totalProfitUSD.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </span>
                  </div>

                  <div className="bg-[#12151f] border border-white/5 rounded-xl p-4">
                    <span className="text-slate-400 block mb-1">{tr("Lỗ trong ngày:")}</span>
                    <span className="text-xl font-bold text-amber-400 font-mono">
                      -${challengeState.dailyLossUSD.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </span>
                  </div>

                  <div className="bg-[#12151f] border border-white/5 rounded-xl p-4">
                    <span className="text-slate-400 block mb-1">{tr("Số ngày đã giao dịch:")}</span>
                    <span className="text-xl font-bold text-cyan-400 font-mono">
                      {challengeState.tradingDaysCount} / {currentLevelConfig.minTradingDays} {tr("ngày")}
                    </span>
                  </div>
                </div>

                {/* 3 Thanh tiến độ mượt mà */}
                <div className="bg-[#12151f] border border-white/5 rounded-2xl p-6 space-y-5">
                  <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                    {tr("Tiến Độ & Ngưỡng Rủi Ro")}
                  </h4>

                  {/* 1. Target */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-medium">{tr("Mục tiêu lợi nhuận")} (+{currentLevelConfig.profitTargetPercent}%)</span>
                      <span className="text-emerald-400 font-bold font-mono">
                        ${Math.max(0, challengeState.totalProfitUSD).toLocaleString('en-US', { maximumFractionDigits: 1 })} / ${targetAmount.toLocaleString('en-US')} ({targetProgress.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${targetProgress}%` }} />
                    </div>
                  </div>

                  {/* 2. Daily Loss */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-medium">{tr("Giới hạn lỗ ngày")} (-{currentLevelConfig.dailyLossLimitPercent}%)</span>
                      <span className="text-amber-400 font-bold font-mono">
                        -${challengeState.dailyLossUSD.toLocaleString('en-US', { maximumFractionDigits: 1 })} / -${dailyLossLimit.toLocaleString('en-US')} ({dailyLossPercent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${dailyLossPercent > 80 ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${dailyLossPercent}%` }} />
                    </div>
                  </div>

                  {/* 3. Max Drawdown */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-medium">{tr("Mức sụt giảm tối đa")} (-{currentLevelConfig.maxDrawdownPercent}%)</span>
                      <span className="text-rose-400 font-bold font-mono">
                        -${challengeState.maxLossUSD.toLocaleString('en-US', { maximumFractionDigits: 1 })} / -${maxLossLimit.toLocaleString('en-US')} ({maxLossPercent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${maxLossPercent > 80 ? 'bg-rose-500' : 'bg-rose-400'}`} style={{ width: `${maxLossPercent}%` }} />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: CHỨNG CHỈ */}
            {activeTab === 'certificates' && (
              <div className="space-y-4">
                {challengeState.certificates.length === 0 ? (
                  <div className="py-16 text-center text-slate-400">
                    <Award className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                    <h4 className="text-sm font-bold text-slate-300">{tr("Chưa có chứng chỉ")}</h4>
                    <p className="text-xs text-slate-500 mt-1">{tr("Hoàn thành mục tiêu của bài thi để nhận Bằng Chứng Nhận Trader Quỹ.")}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {challengeState.certificates.map(cert => (
                      <div key={cert.certCode} className="p-5 rounded-2xl bg-[#12151f] border border-amber-500/30 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-white text-sm">{levelName(cert.levelId, cert.levelName)}</h4>
                          <span className="text-xs text-slate-400 block mt-1">
                            {tr("Hạn mức cấp vốn:")} ${cert.capitalUSD.toLocaleString('en-US')}
                          </span>
                          <span className="text-[11px] text-slate-500 block font-mono mt-0.5">
                            {tr("Ngày cấp:")} {cert.date}
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedCert(cert)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow"
                        >
                          {tr("Xem Bằng")}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Modal Yêu cầu đăng nhập trước khi thi */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#121622] border border-blue-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-slate-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto mb-4">
              <LogIn className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {tr("Yêu Cầu Đăng Nhập Trước Khi Thi")}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              {tr("Để hệ thống ghi nhận lịch sử thi tuyển, quản lý kỷ luật giao dịch và cấp")} <strong className="text-white">{tr("Bằng Chứng Nhận Trader")}</strong> {tr("cho riêng bạn, bạn cần đăng nhập tài khoản trước khi bắt đầu bài thi.")}
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setShowLoginPrompt(false);
                  login();
                }}
                className="w-full py-3 bg-[#0088ff] hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                <LogIn className="w-4 h-4" />
                <span>{tr("Đăng nhập để bắt đầu thi")}</span>
              </button>

              <button
                onClick={() => setShowLoginPrompt(false)}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-medium transition-colors"
              >
                {tr("Để sau")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Xác nhận bắt đầu Level */}
      {confirmStartLevel && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-100">
          <div className="bg-[#12151f] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl text-slate-200">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              {tr("Bắt đầu bài thi")} {badge(confirmStartLevel.id)} ({levelName(confirmStartLevel.id, confirmStartLevel.levelName)})?
            </h3>

            {user && (
              <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5 text-xs text-slate-300">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                    {user.name?.charAt(0) || 'T'}
                  </div>
                )}
                <div className="truncate">
                  <span className="font-semibold text-white block truncate">{user.name}</span>
                  <span className="text-[10px] text-slate-400 truncate">{user.email}</span>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              {tr("Vốn tài khoản sẽ được cấp là")} <strong className="text-white font-mono">${confirmStartLevel.capitalUSD.toLocaleString('en-US')}</strong>{tr(". Hệ thống sẽ khóa tính năng nạp/sửa tiền tự do trong suốt quá trình làm bài thi để rèn luyện kỷ luật thực tế.")}
            </p>

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setConfirmStartLevel(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl font-medium"
              >
                {tr("Hủy")}
              </button>
              <button
                onClick={() => handleStartLevel(confirmStartLevel)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold shadow-lg shadow-amber-500/20"
              >
                {tr("Xác nhận bắt đầu")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Bằng Khen */}
      <ChallengeCertificateModal
        certificate={selectedCert}
        allCertificates={challengeState.certificates}
        onSelectCert={(c) => setSelectedCert(c)}
        onClose={() => setSelectedCert(null)}
        userName={userName}
      />
    </>
  );
};
