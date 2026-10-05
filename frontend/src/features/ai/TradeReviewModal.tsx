import React, { Component, type ErrorInfo, type ReactNode, useState, useEffect } from 'react';

// Safe formatting helpers to prevent any runtime exceptions (e.g. undefined.toLocaleString)
const safeMoney = (val?: number | string | null, decimals: number = 2): string => {
  if (val === undefined || val === null || val === '') return '0.00';
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const safeFormat = (val?: number | string | null): string => {
  if (val === undefined || val === null || val === '') return '0.00';
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US');
};

const safePts = (val?: number | string | null, digits: number = 2): string => {
  if (val === undefined || val === null || val === '') return '0.00';
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(num)) return '0.00';
  return num.toFixed(digits);
};

interface ErrorBoundaryProps {
  children: ReactNode;
  onClose: () => void;
  isEn?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
}

class TradeReviewErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || 'Unknown render error' };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('TradeReviewErrorBoundary caught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#10141d] border border-rose-500/30 text-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                {this.props.isEn ? 'AI Review Interface Error' : 'Lỗi Giao Diện Đánh Giá AI'}
              </h3>
              <p className="text-xs text-slate-400">
                {this.props.isEn 
                  ? 'An unexpected error occurred while rendering the review. The window has been prevented from crashing.' 
                  : 'Đã có lỗi ngoại lệ trong khi kết xuất đánh giá. Hệ thống đã bảo vệ không làm đen màn hình.'}
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={this.props.onClose}
                className="px-5 py-2 bg-[#202533] hover:bg-[#2c3345] text-white font-semibold rounded-lg text-xs transition-colors"
              >
                {this.props.isEn ? 'Close Window' : 'Đóng cửa sổ'}
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import { 
  X, Sparkles, CheckCircle2, AlertTriangle, 
  BookOpen, Target, Compass, Zap,
  TrendingUp, TrendingDown, ShieldAlert, ShieldCheck,
  ArrowRight, Activity, Scale, Clock,
  AlertCircle, Layers, ExternalLink, PlayCircle, Award, Check, ChevronRight
} from 'lucide-react';
import { aiService, type TradeReviewData } from '../../services/aiService';
import { useI18n } from '../../contexts/I18nContext';

interface TradeReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeData: {
    orderId?: string;
    symbol: string;
    side: 'BUY' | 'SELL' | 'LONG' | 'SHORT';
    entryPrice: number;
    currentPrice?: number;
    exitPrice?: number;
    stopLoss?: number;
    takeProfit?: number;
    quantity: number;
    accountBalance?: number;
    realPnL?: number;
    isOpen?: boolean;
    timeframe?: string;
    strategy?: string;
    setupName?: string;
    reason?: string;
    entryTime?: string;
    exitTime?: string;
    duration?: string;
    lang?: string;
  };
}

export const TradeReviewModal = (props: TradeReviewModalProps) => {
  const { lang } = useI18n();
  if (!props.isOpen) return null;
  return (
    <TradeReviewErrorBoundary onClose={props.onClose} isEn={lang === 'en'}>
      <TradeReviewModalInner {...props} />
    </TradeReviewErrorBoundary>
  );
};

const TradeReviewModalInner = ({
  isOpen,
  onClose,
  tradeData
}: TradeReviewModalProps) => {
  const { t, lang } = useI18n();
  const isEn = lang === 'en';
  const [review, setReview] = useState<TradeReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ICT_RUBRIC' | 'CONTEXT' | 'RISK' | 'IMPROVEMENTS'>('ALL');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);

    // Auto-extract chart overlays/drawings if not present in tradeData
    let drawings = (tradeData as any).drawings || [];
    if (drawings.length === 0 && typeof window !== 'undefined') {
      try {
        const chart = (window as any).__STOCKSIM_CHART__ || (window as any).__currentKlineChart;
        if (chart && typeof chart.getOverlays === 'function') {
          const allOverlays = chart.getOverlays() || [];
          drawings = allOverlays.filter((o: any) => {
            if (!o) return false;
            const id = String(o.id || '');
            const name = String(o.name || '');
            return (
              !id.startsWith('__sys_') && 
              !id.startsWith('pending_') && 
              !id.startsWith('preview_') &&
              !id.startsWith('active_') &&
              !id.startsWith('tpsl_') &&
              !id.startsWith('pos_') &&
              !id.startsWith('order_') &&
              !id.startsWith('drag_') &&
              name !== 'shift_measure' &&
              name !== 'tpslZone' &&
              name !== 'orderTpslLine' &&
              name !== 'aiCorrectionZone' &&
              name !== 'aiCorrectionBox' &&
              name !== 'zoomInBox'
            );
          });
        }
      } catch (e) {
        drawings = [];
      }
    }

    aiService.analyzeTrade({ ...tradeData, drawings, lang })
      .then(res => {
        if (!res) throw new Error(isEn ? 'Empty response from AI service' : 'Hệ thống AI không phản hồi');
        setReview(res);
      })
      .catch(err => {
        console.error('Failed to load trade review', err);
        setError(err.message || (isEn ? 'Failed to analyze trade' : 'Không thể kết nối dịch vụ AI'));
      })
      .finally(() => setLoading(false));
  }, [isOpen, tradeData, lang]);

  if (!isOpen) return null;

  const isBuy = (tradeData?.side || 'BUY').toUpperCase() === 'BUY' || (tradeData?.side || 'BUY').toUpperCase() === 'LONG';
  const isOpenTrade = tradeData?.isOpen ?? (tradeData?.exitPrice === undefined || tradeData?.exitPrice === null);

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'OPEN_GOOD_SETUP':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
          badgeText: isEn ? 'Disciplined Plan' : 'Kế hoạch chuẩn chỉnh',
          title: isEn ? 'ACTIVE POSITION (Open - Valid Setup)' : 'ACTIVE POSITION (Đang mở - Setup chuẩn)',
          desc: isEn 
            ? 'Position is open and strictly complying with risk discipline. Patiently follow your TP/SL plan!'
            : 'Vị thế đang mở và tuân thủ kỷ luật bài bản. Hãy kiên nhẫn bám sát kế hoạch TP/SL!'
        };
      case 'OPEN_WARNING_SETUP':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]',
          badgeText: isEn ? 'Risk Warning' : 'Cảnh báo rủi ro',
          title: isEn ? 'ACTIVE POSITION (Open - High Risk Warning)' : 'ACTIVE POSITION (Đang mở - Cảnh báo rủi ro)',
          desc: isEn 
            ? 'Open position carries rule violations (e.g., missing Stop Loss or oversized risk). Immediate action required!'
            : 'Vị thế đang mở nhưng có yếu tố vi phạm nguyên tắc (như thiếu Stop Loss hoặc rủi ro quá lớn). Cần xử lý ngay!'
        };
      case 'WINNING_GOOD_TRADE':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
          badgeText: isEn ? 'Textbook Execution' : 'Lệnh mẫu mực',
          title: 'GOOD TRADE + WINNING TRADE',
          desc: isEn 
            ? 'Textbook process compliance rewarded by positive market probabilities.'
            : 'Chuẩn quy trình kỷ luật & Thị trường trả lời bằng kết quả xứng đáng.'
        };
      case 'LOSING_GOOD_TRADE':
        return {
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          dot: 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]',
          badgeText: isEn ? 'Disciplined Loss' : 'Kỷ luật chuẩn',
          title: 'GOOD TRADE WITH LOSS',
          desc: isEn 
            ? 'Disciplined stop loss execution. Losses are simply normal probabilistic business costs.'
            : 'Kỷ luật cắt lỗ chuẩn xác. Thua lỗ chỉ là chi phí xác suất tự nhiên của thị trường.'
        };
      case 'WINNING_BAD_TRADE':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]',
          badgeText: isEn ? 'Dangerous Win' : 'Cảnh báo ảo tưởng',
          title: 'BAD TRADE STILL PROFITABLE',
          desc: isEn 
            ? 'Profitable outcome despite severe process violations. Avoid reinforcing risky habits!'
            : 'Có lãi nhưng vi phạm nguyên tắc quản trị rủi ro. Tránh lặp lại thói quen xấu này!'
        };
      default:
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          dot: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
          badgeText: isEn ? 'Needs Improvement' : 'Cần cải thiện',
          title: 'BAD TRADE WITH LOSS',
          desc: isEn 
            ? 'Lack of trade discipline led to losses. Carefully review the improvement points below.'
            : 'Lệnh thiếu kỷ luật dẫn đến kết quả thua lỗ. Cần nghiêm túc xem xét các điểm cải thiện bên dưới.'
        };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 65) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const entryPrice = Number(review?.summary?.entryPrice ?? tradeData?.entryPrice ?? 0);
  const exitPrice = review?.summary?.exitPrice ?? tradeData?.exitPrice;
  const currentPrice = Number(review?.summary?.currentPrice ?? tradeData?.currentPrice ?? entryPrice);
  const pnl = Number(review?.summary?.pnl ?? tradeData?.realPnL ?? 0);
  const quantity = Number(tradeData?.quantity || 1);
  const accountBalance = Number(review?.summary?.accountBalance ?? tradeData?.accountBalance ?? 0);
  const returnPct = review?.summary?.returnPct !== undefined 
    ? Number(review.summary.returnPct) 
    : (entryPrice > 0 && quantity > 0 ? Number(((pnl / (entryPrice * quantity)) * 100).toFixed(2)) : 0);
  const isProfit = pnl >= 0;
  const effectiveExitPrice = isOpenTrade ? currentPrice : Number(exitPrice ?? entryPrice);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#10141d] border border-[#232838] text-slate-200 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden">
        
        {/* ================================================================ */}
        {/* 1. Header: AI Trade Review & Trading Coach                       */}
        {/* ================================================================ */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#232838] bg-[#161a25]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  AI Trade Review &amp; Trading Coach
                </h2>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#202533] text-slate-200 border border-[#2e3448]">
                    {tradeData.symbol}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 ${
                    isBuy ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {isBuy ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {tradeData.side.toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 ${
                    isOpenTrade 
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' 
                      : 'bg-slate-700/40 text-slate-300 border border-slate-600/40'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOpenTrade ? 'bg-cyan-400 animate-ping' : 'bg-slate-400'}`}></span>
                    {isOpenTrade ? (isEn ? 'OPEN POSITION' : 'VỊ THẾ ĐANG MỞ') : (isEn ? 'CLOSED TRADE' : 'LỆNH ĐÃ ĐÓNG')}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                <span>{isEn ? 'Process-oriented Review & Trading Coach (Process > Outcome)' : 'Hệ thống Huấn luyện & Đánh giá Quy trình (Process > Outcome)'}</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400/90 font-medium">Winning Trade ≠ Good Trade</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real PnL badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold shadow-sm ${
              isProfit 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-rose-500/15 text-rose-400 border-rose-500/40'
            }`}>
              <span>{isProfit ? '+' : '-'}${safeMoney(Math.abs(pnl))}</span>
              <span className="text-[10px] opacity-85">({isProfit ? '+' : ''}{safePts(returnPct)}%)</span>
            </div>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#202533] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* Trade Execution Data Strip (Dữ liệu vào/kết thúc thực tế của lệnh) */}
        {/* ================================================================ */}
        <div className="px-5 py-2.5 bg-[#0c1017] border-b border-[#212738] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3.5 flex-wrap">
            {accountBalance > 0 && (
              <>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#161c28] border border-[#2b354c] shadow-sm">
                  <span className="text-[11px] text-slate-400 font-medium">{isEn ? 'Account Balance:' : 'Số dư:'}</span>
                  <span className="font-mono font-bold text-amber-300">
                    ${safeMoney(accountBalance)}
                  </span>
                </div>
                <div className="h-3.5 w-px bg-slate-700 hidden sm:block"></div>
              </>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Entry:</span>
              <span className="font-mono font-bold text-white">
                ${safeMoney(entryPrice)}
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">{isOpenTrade ? 'Current:' : 'Exit:'}</span>
              <span className="font-mono font-bold text-white">
                ${safeMoney(effectiveExitPrice)}
              </span>
            </div>
            <div className="h-3.5 w-px bg-slate-700 hidden sm:block"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">{isEn ? 'Quantity:' : 'Khối lượng:'}</span>
              <span className="font-mono font-semibold text-slate-200">
                {typeof tradeData.quantity === 'number' ? (tradeData.quantity >= 1000 ? tradeData.quantity.toLocaleString('en-US', { maximumFractionDigits: 4 }) : safeMoney(tradeData.quantity, 4)) : tradeData.quantity} {tradeData.symbol.replace(/USDT$/, '')}
              </span>
            </div>
            <div className="h-3.5 w-px bg-slate-700 hidden sm:block"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Stop Loss:</span>
              <span className={`font-mono font-semibold ${tradeData.stopLoss ? 'text-rose-400' : 'text-slate-500 italic'}`}>
                {tradeData?.stopLoss ? `$${safeFormat(tradeData.stopLoss)}` : (isEn ? 'Not Set' : 'Chưa đặt')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Take Profit:</span>
              <span className={`font-mono font-semibold ${tradeData.takeProfit ? 'text-emerald-400' : 'text-slate-500 italic'}`}>
                {tradeData?.takeProfit ? `$${safeFormat(tradeData.takeProfit)}` : (isEn ? 'Not Set' : 'Chưa đặt')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="px-2 py-0.5 rounded bg-[#181d29] text-cyan-300 border border-cyan-500/20 font-medium">
              {review?.summary.strategy || tradeData.strategy || 'ICT — Liquidity + FVG'}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#181d29] text-slate-300 font-mono">
              {review?.summary.timeframe || tradeData.timeframe || '15m'}
            </span>
            <span className="flex items-center gap-1 text-slate-400 font-mono">
              <Clock className="w-3 h-3 text-slate-500" />
              {review?.summary.duration || tradeData.duration || (isEn ? '15-45 mins' : '15-45 phút')}
            </span>
          </div>
        </div>

        {/* ================================================================ */}
        {/* Navigation Tabs (Cho phép xem tất cả hoặc lọc gọn gàng)         */}
        {/* ================================================================ */}
        <div className="px-5 py-2 bg-[#121622] border-b border-[#232838] flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          {[
            { id: 'ALL', label: isEn ? 'All (Comprehensive)' : 'Tất Cả (Toàn Diện)' },
            { id: 'ICT_RUBRIC', label: isEn ? 'ICT 100-Pt Rubric' : 'Thang Điểm 100 ICT (5 Phần)' },
            { id: 'CONTEXT', label: isEn ? 'Setup Checklist' : 'Checklist Kỹ Thuật' },
            { id: 'RISK', label: isEn ? 'Risk & MFE/MAE' : 'Quản Trị Rủi Ro & MFE/MAE' },
            { id: 'IMPROVEMENTS', label: isEn ? 'Takeaways & Coach' : 'Đánh Giá & Bài Học' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1c2130]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ================================================================ */}
        {/* Main Content Area                                                */}
        {/* ================================================================ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs custom-scrollbar">
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <div className="relative w-12 h-12 mx-auto">
                <Sparkles className="w-12 h-12 text-amber-400 animate-spin" />
              </div>
              <p className="text-slate-200 font-semibold text-sm">
                {isEn ? 'Auditing execution process & trade context...' : 'Đang kiểm toán quy trình & bối cảnh lệnh...'}
              </p>
              <p className="text-xs text-slate-500">
                {isEn ? 'Evaluating compliance rubric, computing MFE/MAE and market context' : 'Đối chiếu Rubric tuân thủ, tính toán MFE/MAE và bối cảnh Market Context'}
              </p>
            </div>
          ) : error || !review ? (
            <div className="py-20 text-center space-y-4 px-6">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-white font-bold text-sm">
                  {isEn ? 'Unable to load AI Trade Review' : 'Không thể tải Đánh Giá Lệnh AI'}
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {error || (isEn ? 'No review data available for this trade.' : 'Hệ thống chưa có dữ liệu đánh giá cho lệnh này.')}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setLoading(true);
                    setError(null);
                    aiService.analyzeTrade({ ...tradeData, lang })
                      .then(res => setReview(res))
                      .catch(err => setError(err.message || 'Lỗi kết nối'))
                      .finally(() => setLoading(false));
                  }}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isEn ? 'Retry Review' : 'Thử lại'}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-[#202533] hover:bg-[#2c3345] text-slate-300 font-semibold text-xs transition-colors"
                >
                  {isEn ? 'Close' : 'Đóng'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ============================================================ */}
              {/* TOP: Process Compliance Score Banner (Rubric 5 tiêu chí)    */}
              {/* ============================================================ */}
              {(() => {
                const badge = getVerdictBadge(review.summary.tradeVerdict);
                const scoreStyle = getScoreColor(review.summary.processScore);
                const rubric = review.rubricScore;

                return (
                  <div className={`p-4 rounded-xl border flex flex-col gap-3 ${badge.bg}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${badge.dot}`}></span>
                          <span className="font-bold text-sm tracking-wide text-white">{badge.title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-white/10 text-white border border-white/20">
                            Process &gt; Outcome
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                          {review.summary.verdictDescription}
                        </p>
                      </div>

                      <div className="flex items-center sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10 shrink-0">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          PROCESS COMPLIANCE SCORE
                        </div>
                        <div className={`mt-1 px-3 py-1 rounded-xl border flex items-baseline gap-1 ${scoreStyle}`}>
                          <span className="text-2xl font-black font-mono tracking-tight">{review.summary.processScore}</span>
                          <span className="text-xs text-slate-400 font-bold">/100</span>
                        </div>
                      </div>
                    </div>

                    {/* ICT Tier Recommendation Action Callout */}
                    {(() => {
                      const tier = review.summary.tier || rubric?.tier || (review.summary.processScore >= 90 ? 'A+' : review.summary.processScore >= 75 ? 'B' : review.summary.processScore >= 60 ? 'C' : 'F');
                      const tierLabel = review.summary.tierLabel || rubric?.tierLabel || (tier === 'A+' ? '🌟 Hạng A+ (Unicorn Setup)' : tier === 'B' ? '🟢 Hạng B (Standard Setup)' : tier === 'C' ? '🟡 Hạng C (Marginal Setup)' : '🔴 Hạng F (Invalid / Retail Trap)');
                      const tierAction = review.summary.tierAction || rubric?.tierAction || (
                        tier === 'A+' ? 'Bấm lệnh ngay (Execution). Lệnh đạt độ hợp lưu hoàn hảo, cho phép đi tối đa 100% Risk tiêu chuẩn (ví dụ: 1% tài khoản).' :
                        tier === 'B' ? 'Thực thi bình thường. Lệnh đạt chuẩn ICT, đi Risk tiêu chuẩn (0.5%–1%).' :
                        tier === 'C' ? 'Lệnh xác suất thấp. Thiếu Killzone hoặc R:R chưa tối ưu. Chỉ nên đi 50% Risk hoặc đứng ngoài quan sát.' :
                        'CẤM VÀO LỆNH (PASS). Lệnh vi phạm các yếu tố cốt lõi (không có DOL, bấm lệnh lơ lửng giữa range, không có Sweep).'
                      );

                      const tierTheme = tier === 'A+'
                        ? { border: 'border-amber-400/50', bg: 'bg-gradient-to-r from-amber-500/20 via-emerald-500/10 to-transparent', badge: 'bg-amber-400/20 text-amber-300 border-amber-400/40', tag: 'EXECUTION READY' }
                        : tier === 'B'
                        ? { border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', tag: 'STANDARD SETUP' }
                        : tier === 'C'
                        ? { border: 'border-amber-500/40', bg: 'bg-amber-500/10', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', tag: 'MARGINAL SETUP' }
                        : { border: 'border-rose-500/50', bg: 'bg-rose-500/15', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40', tag: 'PASS - CẤM VÀO LỆNH' };

                      return (
                        <div className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${tierTheme.bg} ${tierTheme.border}`}>
                          <div className="flex items-center gap-2.5">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border tracking-wide shadow-sm flex items-center gap-1.5 ${tierTheme.badge}`}>
                              <Award className="w-3.5 h-3.5" />
                              {tierLabel}
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/40 text-slate-300 border border-white/10 hidden sm:inline-block">
                              {tierTheme.tag}
                            </span>
                          </div>
                          <div className="text-xs text-slate-200 font-medium sm:text-right max-w-xl">
                            <span className="text-amber-300 font-bold mr-1">Khuyến nghị AI:</span>
                            {tierAction}
                          </div>
                        </div>
                      );
                    })()}

                    {/* ICT 100-Point 5-Part Rubric Cards Grid */}
                    {rubric && (
                      <div className="pt-2 border-t border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                          <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                            <Layers className="w-3.5 h-3.5 text-cyan-400" />
                            {isEn ? 'ICT 100-Point Rubric Evaluation (5 Core Parts):' : 'Bảng Điểm ICT 100 Điểm Trọn Vẹn (5 Phần Cốt Lõi):'}
                          </span>
                          <span className="text-[10px] text-slate-400 italic">
                            Level → Profile → Draw → SMT → Execute
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px]">
                          {/* Part 1 */}
                          <div className="p-2.5 rounded-lg bg-[#0f131d]/90 border border-emerald-500/20 flex flex-col justify-between gap-1.5 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium truncate">1. HTF Context & Bias</span>
                              <span className="font-mono font-bold text-emerald-400">
                                {rubric.htfContext?.score ?? rubric.setupValidation.score}/25
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-400 h-1.5 rounded-full transition-all"
                                style={{ width: `${((rubric.htfContext?.score ?? rubric.setupValidation.score) / 25) * 100}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center justify-between">
                              <span>D1 / H4 Range</span>
                              <span className="text-slate-300 font-medium">P/D 50% & DOL</span>
                            </div>
                          </div>

                          {/* Part 2 */}
                          <div className="p-2.5 rounded-lg bg-[#0f131d]/90 border border-amber-500/20 flex flex-col justify-between gap-1.5 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium truncate">2. Time & SMT</span>
                              <span className="font-mono font-bold text-amber-400">
                                {rubric.timeAndSmt?.score ?? rubric.exitPlanning.score}/20
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-amber-400 h-1.5 rounded-full transition-all"
                                style={{ width: `${((rubric.timeAndSmt?.score ?? rubric.exitPlanning.score) / 20) * 100}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center justify-between">
                              <span>H1 / Intermarket</span>
                              <span className="text-slate-300 font-medium">Kill Zone & SMT</span>
                            </div>
                          </div>

                          {/* Part 3 */}
                          <div className="p-2.5 rounded-lg bg-[#0f131d]/90 border border-cyan-500/20 flex flex-col justify-between gap-1.5 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium truncate">3. Sweep & Disp</span>
                              <span className="font-mono font-bold text-cyan-400">
                                {rubric.sweepAndDisplacement?.score ?? rubric.entryDiscipline.score}/25
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-cyan-400 h-1.5 rounded-full transition-all"
                                style={{ width: `${((rubric.sweepAndDisplacement?.score ?? rubric.entryDiscipline.score) / 25) * 100}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center justify-between">
                              <span>H1 / M15</span>
                              <span className="text-slate-300 font-medium">MSS & PD Array</span>
                            </div>
                          </div>

                          {/* Part 4 */}
                          <div className="p-2.5 rounded-lg bg-[#0f131d]/90 border border-indigo-500/20 flex flex-col justify-between gap-1.5 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium truncate">4. Entry & Risk</span>
                              <span className={`font-mono font-bold ${(rubric.entryAndRisk?.score ?? rubric.riskManagement.score) < 15 ? 'text-rose-400' : 'text-indigo-400'}`}>
                                {rubric.entryAndRisk?.score ?? Math.min(20, Math.round(rubric.riskManagement.score * 0.8))}/20
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-indigo-400 h-1.5 rounded-full transition-all"
                                style={{ width: `${((rubric.entryAndRisk?.score ?? Math.min(20, Math.round(rubric.riskManagement.score * 0.8))) / 20) * 100}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center justify-between">
                              <span>M15 / M5</span>
                              <span className="text-slate-300 font-medium">R:R ≥ 1:2 & SL</span>
                            </div>
                          </div>

                          {/* Part 5 */}
                          <div className="p-2.5 rounded-lg bg-[#0f131d]/90 border border-purple-500/20 flex flex-col justify-between gap-1.5 shadow-sm col-span-1">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium truncate">5. Plan & Rules</span>
                              <span className="font-mono font-bold text-purple-400">
                                {rubric.planAndDiscipline?.score ?? rubric.tradeReasoning.score}/10
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-purple-400 h-1.5 rounded-full transition-all"
                                style={{ width: `${((rubric.planAndDiscipline?.score ?? rubric.tradeReasoning.score) / 10) * 100}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center justify-between">
                              <span>Checklist</span>
                              <span className="text-slate-300 font-medium">Unicorn Confluence</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ============================================================ */}
              {/* Senior Prop Firm Risk Manager & Execution Audit Card         */}
              {/* ============================================================ */}
              <div className="relative overflow-hidden rounded-xl border border-slate-700/60 bg-[#121622]/90 backdrop-blur p-4 shadow-lg space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-slate-700/40 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white tracking-wide uppercase">
                        {isEn ? 'EXECUTIVE TRADE AUDIT & RISK REVIEW' : 'NHẬN ĐỊNH CHUYÊN MÔN & KIỂM TOÁN QUY TRÌNH'}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {isEn ? 'Prop Firm Risk Desk Evaluation • Objective Process Audit' : 'Bàn Quản Trị Rủi Ro Quỹ • Đánh giá kỷ luật & bảo vệ vốn'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {isEn ? 'Independent Audit' : 'Đánh giá độc lập'}
                  </span>
                </div>

                <div className="text-slate-200 text-xs sm:text-[13px] leading-relaxed space-y-1 bg-[#0b0e15] p-3 rounded-lg border border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    {isEn ? 'Process Assessment:' : 'Đánh giá chi tiết:'}
                  </div>
                  <p>{review.aiCoach?.explanation || review.summary.coachingAdvice || review.summary.verdictDescription}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                  {review.aiCoach?.actionItem && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-200">
                      <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-300 block text-[11px] uppercase tracking-wider mb-0.5">
                          {isEn ? 'Priority Action:' : 'Hành động ưu tiên:'}
                        </span>
                        {review.aiCoach?.actionItem}
                      </div>
                    </div>
                  )}
                  {review.aiCoach?.reflectionQuestion && (
                    <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-start gap-2.5 text-xs text-cyan-200">
                      <Scale className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-cyan-300 block text-[11px] uppercase tracking-wider mb-0.5">
                          {isEn ? 'Mental & Risk Check:' : 'Kiểm soát rủi ro & tâm lý:'}
                        </span>
                        {review.aiCoach?.reflectionQuestion}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ============================================================ */}
              {/* ============================================================ */}
              {/* TAB ICT_RUBRIC: BẢNG PHÂN CHIA THANG ĐIỂM 100 TRỌN VẸN       */}
              {/* ============================================================ */}
              {(activeTab === 'ALL' || activeTab === 'ICT_RUBRIC') && (
                <div className="rounded-xl border border-cyan-500/25 bg-[#121622] p-4 shadow-lg space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                          {isEn ? 'ICT 100-Point Evaluation Rubric' : 'Bảng Phân Chia Thang Điểm 100 Trọn Vẹn Chuẩn ICT'}
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {review.summary.processScore}/100 PTS
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {isEn
                            ? '5 Core Pillars: Level → Profile → Draw → SMT → Execute'
                            : 'Thứ tự gối đầu bắt buộc: Level (Ngưỡng) → Profile (Bối cảnh) → Draw (Thanh khoản) → SMT → Execute (Thực thi)'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-[#181d29] text-amber-300 border border-amber-500/20 font-semibold self-start sm:self-auto">
                      {review.summary.tierLabel || '🌟 Phân Hạng Lệnh'}
                    </span>
                  </div>

                  {/* 5 Core Parts Detailed Breakdown */}
                  {(() => {
                    const getSubItem = (items: any[] | undefined, id: string, defaultMax: number) => {
                      const item = items?.find((it: any) => it.id === id);
                      return {
                        score: item?.score ?? 0,
                        max: item?.max ?? defaultMax,
                        status: item?.status ?? (item?.score && item.score > 0 ? 'PASS' : 'FAIL'),
                        detail: item?.detail || '',
                      };
                    };

                    const renderRubricCard = (
                      itemNo: string,
                      title: string,
                      sub: { score: number; max: number; status: string; detail: string },
                      ruleDesc: string
                    ) => {
                      const isFull = sub.score >= sub.max && sub.max > 0;
                      const isPartial = sub.score > 0 && sub.score < sub.max;
                      const cleanDetail = (sub.detail || '')
                        .replace(/^Sai ở [^:]+:\s*/i, '')
                        .replace(/\(\+?\d+\/?\d*đ?\)/g, '')
                        .trim();

                      return (
                        <div
                          className={`p-3 rounded-xl transition-all flex flex-col justify-between ${
                            isFull
                              ? 'bg-[#101724]/90 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                              : isPartial
                              ? 'bg-[#171622]/90 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
                              : 'bg-[#11141d]/90 border border-[#232838] hover:border-[#2f364a]'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-semibold text-slate-200 text-xs">
                                <span className="font-mono text-slate-400 mr-1.5">{itemNo}</span>
                                {title}
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold shrink-0 border ${
                                  isFull
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                    : isPartial
                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                    : 'bg-slate-800 text-slate-400 border-slate-700/60'
                                }`}
                              >
                                {sub.score}/{sub.max}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400/90 mt-1 leading-relaxed">
                              {ruleDesc}
                            </p>
                          </div>

                          {cleanDetail && (
                            <div
                              className={`mt-2.5 pt-2 border-t flex items-start gap-1.5 text-[11px] leading-relaxed ${
                                isFull
                                  ? 'border-emerald-500/20 text-emerald-300 font-medium'
                                  : isPartial
                                  ? 'border-amber-500/20 text-amber-300'
                                  : 'border-white/5 text-slate-300'
                              }`}
                            >
                              {isFull ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-rose-400/80 shrink-0 mt-0.5" />
                              )}
                              <span>{cleanDetail}</span>
                            </div>
                          )}
                        </div>
                      );
                    };

                    const p1_1 = getSubItem(review.rubricScore?.htfContext?.items, '1.1', 10);
                    const p1_2 = getSubItem(review.rubricScore?.htfContext?.items, '1.2', 10);
                    const p1_3 = getSubItem(review.rubricScore?.htfContext?.items, '1.3', 5);

                    const p2_1 = getSubItem(review.rubricScore?.timeAndSmt?.items, '2.1', 10);
                    const p2_2 = getSubItem(review.rubricScore?.timeAndSmt?.items, '2.2', 10);

                    const p3_1 = getSubItem(review.rubricScore?.sweepAndDisplacement?.items, '3.1', 10);
                    const p3_2 = getSubItem(review.rubricScore?.sweepAndDisplacement?.items, '3.2', 10);
                    const p3_3 = getSubItem(review.rubricScore?.sweepAndDisplacement?.items, '3.3', 5);

                    const p4_1 = getSubItem(review.rubricScore?.entryAndRisk?.items, '4.1', 10);
                    const p4_2 = getSubItem(review.rubricScore?.entryAndRisk?.items, '4.2', 5);
                    const p4_3 = getSubItem(review.rubricScore?.entryAndRisk?.items, '4.3', 5);

                    const p5_1 = getSubItem(review.rubricScore?.planAndDiscipline?.items, '5.1', 5);
                    const p5_2 = getSubItem(review.rubricScore?.planAndDiscipline?.items, '5.2', 5);

                    return (
                      <div className="space-y-3.5">
                        {/* Phần 1 */}
                        <div className="rounded-xl border border-emerald-500/25 bg-[#0d121c]/80 p-3.5 space-y-3">
                          <div className="flex items-center justify-between pb-1 border-b border-emerald-500/10">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                              <span className="font-bold text-slate-100 text-xs tracking-wide">
                                PHẦN 1: BỐI CẢNH KHUNG CAO & ĐỊNH HƯỚNG — [D1 / H4]
                              </span>
                            </div>
                            <span className="font-mono font-bold text-emerald-400 text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {review.rubricScore?.htfContext?.score ?? review.rubricScore?.setupValidation.score}/25
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            {renderRubricCard('1.1', 'Daily Bias & Premium/Discount', p1_1, 'MUA ở Discount (<50%), BÁN ở Premium (>50%) Dealing Range.')}
                            {renderRubricCard('1.2', 'Draw on Liquidity (DOL)', p1_2, 'TP hướng thẳng về bể thanh khoản mở (Old High/Low, EQH/EQL).')}
                            {renderRubricCard('1.3', 'Phản ứng tại HTF POI', p1_3, 'Giá xuất phát & bật nảy tại trạm đón HTF POI (OB, FVG D1/H4).')}
                          </div>
                        </div>

                        {/* Phần 2 */}
                        <div className="rounded-xl border border-amber-500/25 bg-[#0d121c]/80 p-3.5 space-y-3">
                          <div className="flex items-center justify-between pb-1 border-b border-amber-500/10">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                              <span className="font-bold text-slate-100 text-xs tracking-wide">
                                PHẦN 2: THỜI GIAN & PHÂN KỲ SMT — [H1 / Intermarket]
                              </span>
                            </div>
                            <span className="font-mono font-bold text-amber-400 text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {review.rubricScore?.timeAndSmt?.score ?? review.rubricScore?.exitPlanning.score}/20
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {renderRubricCard('2.1', 'Cửa sổ Khung giờ Vàng (Kill Zone & Macro)', p2_1, 'Lệnh kích hoạt trong Killzone (London/NY AM) hoặc Silver Bullet.')}
                            {renderRubricCard('2.2', 'Phân kỳ SMT Divergence', p2_2, 'Phân kỳ tương quan (NQ vs ES, BTC vs ETH) xác nhận đỉnh/đáy.')}
                          </div>
                        </div>

                        {/* Phần 3 */}
                        <div className="rounded-xl border border-cyan-500/25 bg-[#0d121c]/80 p-3.5 space-y-3">
                          <div className="flex items-center justify-between pb-1 border-b border-cyan-500/10">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                              <span className="font-bold text-slate-100 text-xs tracking-wide">
                                PHẦN 3: SWEEP, DISPLACEMENT & PD ARRAY — [H1 / M15]
                              </span>
                            </div>
                            <span className="font-mono font-bold text-cyan-400 text-xs bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                              {review.rubricScore?.sweepAndDisplacement?.score ?? review.rubricScore?.entryDiscipline.score}/25
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            {renderRubricCard('3.1', 'Nhịp Quét Liquidity Sweep', p3_1, 'Đâm râu quét sạch bể thanh khoản SSL/BSL rồi rút chân dứt khoát.')}
                            {renderRubricCard('3.2', 'Lực đẩy Displacement & MSS', p3_2, 'Nến thân lớn dứt khoát xác nhận xung lực & phá vỡ cấu trúc MSS.')}
                            {renderRubricCard('3.3', 'Trạm đón PD Array Chất Lượng', p3_3, 'Vào lệnh tại FVG, Order Block, Breaker Block hoặc iFVG.')}
                          </div>
                        </div>

                        {/* Phần 4 */}
                        <div className="rounded-xl border border-indigo-500/25 bg-[#0d121c]/80 p-3.5 space-y-3">
                          <div className="flex items-center justify-between pb-1 border-b border-indigo-500/10">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                              <span className="font-bold text-slate-100 text-xs tracking-wide">
                                PHẦN 4: VÀO LỆNH & QUẢN TRỊ RỦI RO — [M15 / M5]
                              </span>
                            </div>
                            <span className="font-mono font-bold text-indigo-400 text-xs bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                              {review.rubricScore?.entryAndRisk?.score ?? (review.rubricScore?.riskManagement?.score ? Math.min(20, Math.round(review.rubricScore.riskManagement.score * 0.8)) : 0)}/20
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            {renderRubricCard('4.1', 'Tỷ lệ Payoff R:R (≥ 1:2)', p4_1, 'Mức R:R thực tế đo về mốc DOL đạt tối thiểu ≥ 1:2.')}
                            {renderRubricCard('4.2', 'Stop-Loss Invalidation Logic', p4_2, 'SL đặt an toàn phía sau râu nến cú Sweep (Protected High/Low).')}
                            {renderRubricCard('4.3', 'Quản lý Khối lượng (0.5%–1%)', p4_3, 'Khối lượng cố định rủi ro 0.5%–1% tài khoản theo SL thực tế.')}
                          </div>
                        </div>

                        {/* Phần 5 */}
                        <div className="rounded-xl border border-purple-500/25 bg-[#0d121c]/80 p-3.5 space-y-3">
                          <div className="flex items-center justify-between pb-1 border-b border-purple-500/10">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                              <span className="font-bold text-slate-100 text-xs tracking-wide">
                                PHẦN 5: KỶ LUẬT & TÍNH HỢP LƯU — [Plan Rules]
                              </span>
                            </div>
                            <span className="font-mono font-bold text-purple-400 text-xs bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                              {review.rubricScore?.planAndDiscipline?.score ?? review.rubricScore?.tradeReasoning.score}/10
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {renderRubricCard('5.1', 'Tuân thủ Guardrails', p5_1, 'Tuân thủ Daily Loss Limit, không vào lệnh trả thù hay FOMO.')}
                            {renderRubricCard('5.2', 'Hợp lưu Nâng cao (Unicorn Setup)', p5_2, 'Hợp lưu Breaker Block + FVG + SMT trong Killzone.')}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 1: BỐI CẢNH & SETUP (Market Context & Setup Validation)   */}
              {/* ============================================================ */}
              {(activeTab === 'ALL' || activeTab === 'CONTEXT') && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider pb-1 border-b border-[#232838]">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    {isEn 
                      ? '1. Market Context & Setup Validation' 
                      : '1. Bối Cảnh Thị Trường & Thẩm Định Setup (Market Context & Setup Validation)'}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Card 1: Market Context */}
                    <div className="p-4 rounded-xl bg-[#141822] border border-[#232838] space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-[#232838]">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Compass className="w-4 h-4 text-cyan-400" /> {isEn ? 'Market Context' : 'Bối Cảnh Thị Trường (Market Context)'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{isEn ? 'At Entry Timestamp' : 'Tại thời điểm Entry'}</span>
                      </div>

                      {/* General timeframe & session metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-[#191e2b] border border-[#232838]">
                          <span className="text-[10px] text-slate-400 block">Higher Timeframe (1H/4H):</span>
                          <span className="font-semibold text-slate-200">{review.marketContext?.higherTimeframeTrend || 'Bullish'}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-[#191e2b] border border-[#232838]">
                          <span className="text-[10px] text-slate-400 block">Current Timeframe ({review.marketContext?.timeframe || '15m'}):</span>
                          <span className="font-semibold text-slate-200">{review.marketContext?.currentTimeframeTrend || 'Bullish'}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-[#191e2b] border border-[#232838]">
                          <span className="text-[10px] text-slate-400 block">Trading Session:</span>
                          <span className="font-semibold text-cyan-300">{review.marketContext?.tradingSession || 'London Session'}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-[#191e2b] border border-[#232838]">
                          <span className="text-[10px] text-slate-400 block">{isEn ? 'Volatility & Volume:' : 'Biến động & Khối lượng:'}</span>
                          <span className="font-semibold text-slate-200">{review.marketContext?.volatility || 'Normal'} • {review.marketContext?.volumeContext || 'Average'}</span>
                        </div>
                      </div>

                      {/* Prominent Market Structure & Liquidity deep-dive cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {/* Market Structure Card */}
                        <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#192233] to-[#131926] border border-cyan-500/35 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                              <TrendingUp className="w-4 h-4 text-cyan-400" />
                              {isEn ? 'Market Structure' : 'Cấu Trúc Thị Trường (Market Structure)'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              {review.marketContext?.marketStructureTitle || 'MSS Shift to Bullish'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-200 leading-relaxed">
                            {review.marketContext?.marketStructure || 'Giá bứt phá vượt qua đỉnh/đáy dẫn dắt bằng nến Displacement, xác nhận Market Structure Shift (MSS) đảo chiều cấu trúc thị trường.'}
                          </p>
                          <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                            <span>Ngưỡng bảo vệ: <strong className="text-slate-300">{review.marketContext?.supportResistance || 'S/R Level'}</strong></span>
                          </div>
                        </div>

                        {/* Liquidity Context Card */}
                        <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#192233] to-[#131926] border border-amber-500/35 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                              <Target className="w-4 h-4 text-amber-400" />
                              {isEn ? 'Liquidity Context' : 'Thanh Khoản Thị Trường (Liquidity)'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {review.marketContext?.liquidityTitle || 'Liquidity Swept'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-200 leading-relaxed">
                            {review.marketContext?.liquidity || 'Dòng tiền thông minh đâm râu quét sạch bể thanh khoản gần nhất (SSL/BSL) rồi rút chân dứt khoát.'}
                          </p>
                          <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                            {review.marketContext?.dolTarget && (
                              <span>Mục tiêu DOL: <strong className="text-amber-300">{review.marketContext.dolTarget}</strong></span>
                            )}
                            {review.marketContext?.sweptPool && (
                              <span>Bể đã quét: <strong className="text-cyan-300">{review.marketContext.sweptPool}</strong></span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 pt-1.5 border-t border-[#232838] flex items-center justify-between">
                        <span>{isEn ? 'Key Levels:' : 'Cản then chốt:'} <strong className="text-slate-300">{review.marketContext?.supportResistance || 'S/R Key Level'}</strong></span>
                      </div>
                    </div>

                    {/* Card 2: Setup Validation Checklist */}
                    <div className="p-4 rounded-xl bg-[#141822] border border-[#232838] space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-[#232838]">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {isEn ? 'Setup Conditions Validation' : 'Thẩm Định Điều Kiện Setup (Setup Validation)'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                          {review.setupValidation?.completeness || '6 / 8 conditions'}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs max-h-56 overflow-y-auto custom-scrollbar pr-1">
                        {review.setupValidation?.checklist?.map((item, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-[#191e2b] border border-[#232838] flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="font-semibold text-slate-200">{item.condition}</div>
                              <div className="text-[10px] text-slate-400">{item.rule}</div>
                            </div>
                            <div className="shrink-0 pt-0.5">
                              {item.met === true ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                                  {isEn ? '✓ Met' : '✓ Đạt'}
                                </span>
                              ) : item.met === false ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 text-[10px] font-bold border border-rose-500/30">
                                  {isEn ? '✗ Violated' : '✗ Vi phạm'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700/30 text-slate-400 text-[10px] font-semibold border border-slate-600/30">
                                  {isEn ? 'Not evaluated' : 'Chưa đánh giá'}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="text-[10px] text-slate-500 italic pt-1 border-t border-[#232838]">
                        {isEn 
                          ? `* Conditions validated strictly against ${review.summary.strategy} rules without external bias.`
                          : `* Điều kiện được thẩm định theo quy tắc chiến lược ${review.summary.strategy}, không tự áp đặt điều kiện ngoài chiến lược.`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 2: QUẢN TRỊ RỦI RO & MFE/MAE (Risk & Excursion Pathway)   */}
              {/* ============================================================ */}
              {(activeTab === 'ALL' || activeTab === 'RISK') && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider pb-1 border-b border-[#232838]">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    {isEn ? '2. Risk Analysis & Price Excursion (MFE / MAE)' : '2. Phân Tích Rủi Ro & Đường Giá Thực Tế (Risk Analysis & MFE / MAE)'}
                  </div>

                  {/* Warning banner if Stop Loss is missing */}
                  {!review.riskAnalysis?.hasStopLoss && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/35 flex items-start gap-3 text-rose-200">
                      <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <strong className="text-rose-300 text-xs block">
                          {isEn ? 'CORE RISK WARNING:' : 'CẢNH BÁO RỦI RO CỐT LÕI:'}
                        </strong>
                        <p className="text-xs text-rose-200 leading-relaxed font-semibold">
                          {isEn 
                            ? 'Risk cannot be determined because Stop Loss is not defined.' 
                            : 'Risk cannot be determined because Stop Loss is not defined. (Mức rủi ro không thể xác định vì chưa đặt Stop Loss).'}
                        </p>
                        <p className="text-[11px] text-rose-300/80">
                          {isEn 
                            ? 'Leaving an open position without a strict invalidation point exposes your account to unbounded loss during sharp market volatility.'
                            : 'Thả nổi vị thế mà không có điểm Invalidation Point cứng sẽ khiến tài khoản đối mặt với nguy cơ thua lỗ không giới hạn khi thị trường xuất hiện nến giật mạnh.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 4 Risk Metrics Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-[#141822] border border-[#232838] flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {isEn ? 'Risk : Reward Ratio' : 'Tỷ lệ Risk : Reward'}
                      </span>
                      <div className="my-1 font-mono font-bold text-white text-base">
                        {review.summary.plannedRR === 'Chưa thiết lập' ? (
                          <span className="text-amber-400 text-xs flex items-center gap-1 font-sans">
                            <AlertTriangle className="w-3 h-3" /> {isEn ? 'Not Set' : 'Chưa đặt'}
                          </span>
                        ) : (
                          review.summary.plannedRR
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 truncate">
                        {review.summary.isOpen 
                          ? (isEn ? 'Active' : 'Đang chạy') 
                          : `${isEn ? 'Actual: ' : 'Thực tế: '}${review.summary.actualRR}`}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#141822] border border-[#232838] flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {isEn ? 'Capital at Risk (Max Potential Loss)' : 'Capital at Risk (Mức Lỗ Tối Đa)'}
                      </span>
                      <div className="my-1 font-mono font-bold text-base">
                        {review.riskAnalysis?.hasStopLoss ? (
                          <span className="text-emerald-400">${safeMoney(review.riskAnalysis?.maxPotentialLoss)}</span>
                        ) : (
                          <span className="text-rose-400 text-xs font-sans">{isEn ? 'Undefined' : 'Chưa xác định'}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {review.riskAnalysis?.hasStopLoss 
                          ? `${isEn ? 'Risk: ' : 'Rủi ro: '}${review.summary.riskPctOfAccount}` 
                          : (isEn ? 'Missing SL protection' : 'Thiếu SL bảo vệ vốn')}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#141822] border border-[#232838] flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {isEn ? 'Stop Loss Distance' : 'Khoảng cách Stop Loss'}
                      </span>
                      <div className="my-1 font-mono font-bold text-rose-400 text-base">
                        {review.riskAnalysis?.hasStopLoss ? (
                          <span>${safeMoney(review.riskAnalysis?.stopLossDistanceUsd)} ({safePts(review.riskAnalysis?.stopLossDistancePct)}%)</span>
                        ) : (
                          <span className="text-slate-500 text-xs font-sans italic">{isEn ? 'Not Defined' : 'Chưa xác định'}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">{isEn ? 'Distance from Entry' : 'Khoảng cách từ Entry'}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#141822] border border-[#232838] flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {isEn ? 'Position Size' : 'Quy mô vị thế (Position Size)'}
                      </span>
                      <div className="my-1 font-mono font-bold text-cyan-300 text-base">
                        ${safeMoney(review.riskAnalysis?.positionSizeValue)}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {isEn 
                          ? `${review.riskAnalysis?.positionSizeRiskPct}% of account equity` 
                          : `Chiếm ${review.riskAnalysis?.positionSizeRiskPct}% vốn tài khoản`}
                      </span>
                    </div>
                  </div>

                  {/* Sơ Đồ Quỹ Đạo Biên Độ Giá & Drawdown (MFE / MAE Price Excursion) */}
                  {review.excursionFlow && (() => {
                    const isShort = tradeData?.side?.toLowerCase() === 'sell' || tradeData?.side?.toLowerCase() === 'short';
                    const flowEntry = Number(review.excursionFlow.entry ?? entryPrice ?? 0);
                    const maePrice = Number(review.excursionFlow.maePrice ?? flowEntry);
                    const maePts = Number(review.excursionFlow.maePts ?? 0);
                    const mfePrice = Number(review.excursionFlow.mfePrice ?? flowEntry);
                    const mfePts = Number(review.excursionFlow.mfePts ?? 0);
                    const currentOrExitPrice = Number(review.excursionFlow.currentOrExit ?? review.excursionFlow.exitPrice ?? effectiveExitPrice ?? flowEntry);
                    const isLive = Boolean(review.excursionFlow.isLive ?? isOpenTrade);

                    // Point movement in trader's direction (positive = profit, negative = loss)
                    const actualPts = isShort ? (entryPrice - currentOrExitPrice) : (currentOrExitPrice - entryPrice);
                    const capturePct = mfePts > 0 
                      ? Math.max(0, Math.min(100, Math.round((actualPts / mfePts) * 100))) 
                      : 0;

                    // Calculate bar proportions (0 to 100)
                    const maxScale = Math.max(maePts, mfePts, Math.abs(actualPts), 1);
                    const maeWidthPct = maePts > 0 ? Math.min(100, Math.max(15, (maePts / maxScale) * 100)) : 0;
                    const mfeWidthPct = mfePts > 0 ? Math.min(100, Math.max(20, (mfePts / maxScale) * 100)) : 0;

                    // Pin position on the right (favorable) or left (adverse)
                    const pinOnFavorable = actualPts >= 0;
                    const pinPct = pinOnFavorable 
                      ? (mfePts > 0 ? Math.min(100, Math.max(5, (actualPts / mfePts) * 100)) : 5)
                      : (maePts > 0 ? Math.min(100, Math.max(5, (Math.abs(actualPts) / maePts) * 100)) : 5);

                    // Normalized display strings
                    const cleanMfeStr = review.summary.mfe?.startsWith('+') ? review.summary.mfe : `+${review.summary.mfe || '$0.00'}`;
                    const cleanMaeStr = review.summary.mae || '$0.00';

                    return (
                      <div className="p-4 rounded-xl bg-[#141822] border border-[#232838] space-y-4">
                        {/* Title & Badges */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#232838] gap-2">
                          <div>
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Activity className="w-4 h-4 text-cyan-400" /> 
                              {isEn ? 'Price Excursion & Drawdown Gauge (MFE / MAE)' : 'Thước Đo Biên Độ Giá & Drawdown (MFE / MAE Excursion)'}
                            </span>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {isEn 
                                ? 'Measures maximum favorable potential profit (MFE) vs maximum adverse drawdown (MAE) throughout the trade.' 
                                : 'Đo lường mức lãi tiềm năng cao nhất (MFE) vs mức sụt giảm sâu nhất (MAE) trong suốt vòng đời lệnh.'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                              isShort 
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/25' 
                                : 'bg-blue-500/10 text-blue-300 border-blue-500/25'
                            }`}>
                              {isShort 
                                ? (isEn ? 'SHORT — PROFIT ON DROP' : 'LỆNH BÁN (SHORT) — GIÁ GIẢM LÀ CÓ LÃI') 
                                : (isEn ? 'LONG — PROFIT ON RALLY' : 'LỆNH MUA (LONG) — GIÁ TĂNG LÀ CÓ LÃI')}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 shrink-0">
                              {isLive ? (isEn ? 'LIVE POSITION' : 'VỊ THẾ LIVE') : (isEn ? 'CLOSED TRADE' : 'LỆNH ĐÃ ĐÓNG')}
                            </span>
                          </div>
                        </div>

                        {/* TRỰC QUAN HÓA 1: THƯỚC ĐO BIÊN ĐỘ ĐỐI XỨNG (MFE / MAE DUAL GAUGE) */}
                        <div className="rounded-xl bg-[#0d111a] border border-[#202738] p-4 space-y-3">
                          <div className="flex items-center justify-between text-[11px] font-semibold">
                            <span className="text-amber-400 flex items-center gap-1">
                              {isEn ? '◀ ADVERSE DRAWDOWN (MAE)' : '◀ VÙNG SỤT GIẢM (MAE DRAWDOWN)'}
                            </span>
                            <span className="text-slate-300 font-mono text-[10px] bg-[#161c28] px-2 py-0.5 rounded border border-slate-700/60">
                              {isEn ? 'ENTRY BENCHMARK' : 'MỐC VÀO LỆNH'} (ENTRY: ${safeFormat(flowEntry)})
                            </span>
                            <span className="text-cyan-400 flex items-center gap-1">
                              {isEn ? 'PEAK PROFIT ZONE (MFE) ▶' : 'VÙNG LÃI TỐI ĐA (MFE PROFIT) ▶'}
                            </span>
                          </div>

                          {/* Dual-side Progress Bar */}
                          <div className="grid grid-cols-2 gap-1 items-center relative py-2">
                            {/* Left Half: Adverse (MAE) */}
                            <div className="flex justify-end items-center h-7 rounded-l-lg bg-[#181d28] border-y border-l border-slate-700/40 px-1 relative overflow-hidden">
                              {maePts > 0 ? (
                                <div 
                                  className="h-5 rounded bg-gradient-to-l from-amber-500/40 to-rose-500/60 border border-amber-500/50 flex items-center justify-start px-2 text-[10px] font-mono text-amber-200 font-bold transition-all"
                                  style={{ width: `${maeWidthPct}%` }}
                                >
                                  -{safePts(maePts)} pts
                                </div>
                              ) : (
                                <div className="text-[10px] text-emerald-400 font-semibold px-2 flex items-center gap-1">
                                  <span>{isEn ? '✓ 0 pts Drawdown (No adverse drift)' : '✓ 0 pts Drawdown (Không bị lỗ)'}</span>
                                </div>
                              )}
                            </div>

                            {/* Center Line Indicator */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-cyan-400 -translate-x-1/2 z-10 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>

                            {/* Right Half: Favorable (MFE) */}
                            <div className="flex justify-start items-center h-7 rounded-r-lg bg-[#181d28] border-y border-r border-slate-700/40 px-1 relative overflow-hidden">
                              {mfePts > 0 ? (
                                <div 
                                  className="h-5 rounded bg-gradient-to-r from-cyan-500/40 via-teal-500/50 to-emerald-500/60 border border-cyan-500/50 flex items-center justify-end px-2 text-[10px] font-mono text-cyan-200 font-bold transition-all relative"
                                  style={{ width: `${mfeWidthPct}%` }}
                                >
                                  +{safePts(mfePts)} pts ({cleanMfeStr})

                                  {/* Pin marker for Current / Exit Price */}
                                  {pinOnFavorable && (
                                    <div 
                                      className="absolute -top-3.5 -translate-x-1/2 flex flex-col items-center z-20"
                                      style={{ left: `${pinPct}%` }}
                                    >
                                      <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-500 text-black shadow-md">
                                        {isLive ? 'LIVE' : 'EXIT'}
                                      </span>
                                      <div className="w-1.5 h-1.5 rotate-45 bg-emerald-500 -mt-0.5"></div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-500 italic px-2">
                                  {isEn ? 'No favorable run yet' : 'Chưa bứt phá thuận lợi'}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Gauge Footnotes */}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                            <span className="font-mono text-amber-300">
                              {isEn ? 'Adverse low: ' : 'Đáy giá bất lợi: '}<strong>${safeFormat(maePrice)}</strong> ({cleanMaeStr})
                            </span>
                            <span className="text-slate-400">
                              {isEn ? 'Profit retained: ' : 'Mức giữ lãi hiện tại: '}<strong className={capturePct >= 70 ? 'text-emerald-400' : 'text-amber-300'}>{capturePct}% {isEn ? 'of peak MFE' : 'của đỉnh sóng'}</strong>
                            </span>
                            <span className="font-mono text-cyan-300">
                              {isEn ? 'Favorable high: ' : 'Đỉnh giá có lợi: '}<strong>${safeFormat(mfePrice)}</strong> ({cleanMfeStr})
                            </span>
                          </div>
                        </div>

                        {/* TRỰC QUAN HÓA 2: LỘ TRÌNH 4 BƯỚC DIỄN BIẾN LỆNH (4-STEP MILESTONES) */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {isEn ? 'Chronological Trade Progression:' : 'Diễn Biến Lệnh Theo Trình Tự Thực Tế:'}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                            {/* Step 1: Entry */}
                            <div className="p-3 rounded-lg bg-[#161b26] border border-slate-700/60 relative flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-extrabold text-slate-400">
                                    {isEn ? '1. ENTRY POINT' : '1. ĐIỂM VÀO (ENTRY)'}
                                  </span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold">
                                    {isEn ? 'ORIGIN' : 'GỐC'}
                                  </span>
                                </div>
                                <div className="font-mono text-sm font-bold text-white mt-1.5">
                                  ${safeFormat(flowEntry)}
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
                                {isEn 
                                  ? `Opened ${isShort ? 'SELL' : 'BUY'} position. Benchmark 0.00 PnL.` 
                                  : `Mở vị thế ${isShort ? 'BÁN (Sell)' : 'MUA (Buy)'}. Mốc quy chiếu 0.00 PnL.`}
                              </p>
                            </div>

                            {/* Step 2: MAE Drawdown */}
                            <div className={`p-3 rounded-lg border relative flex flex-col justify-between ${
                              maePts === 0 
                                ? 'bg-[#0f1d18] border-emerald-500/30' 
                                : 'bg-[#211612] border-amber-500/40'
                            }`}>
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className={`text-[10px] font-extrabold ${maePts === 0 ? 'text-emerald-300' : 'text-amber-400'}`}>
                                    {isEn ? '2. DRAWDOWN (MAE)' : '2. SỤT GIẢM (MAE)'}
                                  </span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                    maePts === 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                                  }`}>
                                    {maePts === 0 ? (isEn ? 'SAFE' : 'AN TOÀN') : (isEn ? 'RISK' : 'RỦI RO')}
                                  </span>
                                </div>
                                <div className="font-mono text-sm font-bold text-white mt-1.5">
                                  ${safeFormat(maePrice)}
                                </div>
                                <div className="text-[11px] font-mono font-semibold text-amber-400 mt-0.5">
                                  {maePts > 0 ? `-${safePts(maePts)} pts (${cleanMaeStr})` : '$0.00 Drawdown'}
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
                                {maePts === 0 
                                  ? (isEn ? 'Flawless entry timing, zero negative drift.' : 'Vào lệnh cực chuẩn, giá không hề kéo âm.') 
                                  : (isEn ? 'Deepest adverse drawdown endured during trade.' : 'Mức giật ngược sâu nhất mà bạn phải gồng chịu.')}
                              </p>
                            </div>

                            {/* Step 3: MFE Peak Profit */}
                            <div className="p-3 rounded-lg bg-[#0e1f29] border border-cyan-500/40 relative flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-extrabold text-cyan-300">
                                    {isEn ? '3. PEAK PROFIT (MFE)' : '3. ĐỈNH LÃI (MFE)'}
                                  </span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                                    {isEn ? 'POTENTIAL' : 'TIỀM NĂNG'}
                                  </span>
                                </div>
                                <div className="font-mono text-sm font-bold text-white mt-1.5">
                                  ${safeFormat(mfePrice)}
                                </div>
                                <div className="text-[11px] font-mono font-semibold text-cyan-300 mt-0.5">
                                  +{safePts(mfePts)} pts ({cleanMfeStr})
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
                                {mfePts > 0 
                                  ? (isEn ? 'Maximum unrealized profit market offered to this position.' : 'Mức lợi nhuận tối đa thị trường từng đem lại cho bạn.') 
                                  : (isEn ? 'No substantial favorable expansion occurred.' : 'Chưa có nhịp sóng thuận lợi rõ ràng.')}
                              </p>
                            </div>

                            {/* Step 4: Current / Exit */}
                            <div className={`p-3 rounded-lg border relative flex flex-col justify-between ${
                              isProfit 
                                ? 'bg-[#0f241a] border-emerald-500/50' 
                                : 'bg-[#291118] border-rose-500/50'
                            }`}>
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className={`text-[10px] font-extrabold ${isProfit ? 'text-emerald-300' : 'text-rose-300'}`}>
                                    4. {isLive ? (isEn ? 'CURRENT (LIVE)' : 'HIỆN TẠI (LIVE)') : (isEn ? 'EXIT REALIZED' : 'THOÁT LỆNH')}
                                  </span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                    isProfit ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                                  }`}>
                                    {isEn ? 'ACTUAL' : 'THỰC TẾ'}
                                  </span>
                                </div>
                                <div className="font-mono text-sm font-bold text-white mt-1.5">
                                  ${safeFormat(currentOrExitPrice)}
                                </div>
                                <div className={`text-[11px] font-mono font-bold mt-0.5 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {isProfit ? '+' : '-'}${safeMoney(Math.abs(pnl))} ({isProfit ? '+' : ''}${safePts(returnPct)}%)
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
                                {isProfit 
                                  ? (isEn ? `Retained ${capturePct}% of peak favorable MFE move.` : `Đang giữ lại được ${capturePct}% từ đỉnh MFE cao nhất.`) 
                                  : (isEn ? 'Position drifted out of profitability.' : 'Lệnh đã trượt khỏi vùng có lãi.')}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Phân Tích Ý Nghĩa Thực Chiến (Actionable Insights) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                          <div className="p-3 rounded-lg bg-[#181d2a] border border-[#262f44] space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                                {isEn ? 'Profit Capture Assessment (MFE):' : 'Đánh Giá Tận Dụng Lợi Nhuận (MFE):'}
                              </span>
                              <span className="font-mono font-bold text-cyan-300 text-[11px]">{cleanMfeStr}</span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              {review.excursionFlow.mfePts > 0 ? (
                                isProfit ? (
                                  isEn ? (
                                    <>Position achieved peak profit of <strong className="text-cyan-300">{cleanMfeStr}</strong> and retained <strong className="text-emerald-400">{capturePct}%</strong> of expansion potential. {capturePct >= 70 ? 'Outstanding profit locking execution.' : 'Consider dynamic trailing stops to preserve open gains.'}</>
                                  ) : (
                                    <>Vị thế từng đạt đỉnh lãi tối đa <strong className="text-cyan-300">{cleanMfeStr}</strong> và bạn đã giữ lại được <strong className="text-emerald-400">{capturePct}%</strong> tiềm năng sóng. {capturePct >= 70 ? 'Đây là hiệu suất chốt/giữ lệnh rất xuất sắc.' : 'Cân nhắc dời Trailing Stop để khóa bớt lợi nhuận khi giá gần đỉnh.'}</>
                                  )
                                ) : (
                                  isEn ? (
                                    <>Position ran in profit up to <strong className="text-cyan-300">{cleanMfeStr}</strong> but gave it all back to end in loss. Takeaway: move Stop Loss to breakeven once price moves favorably.</>
                                  ) : (
                                    <>Giá từng chạy đúng hướng cho mức lãi <strong className="text-cyan-300">{cleanMfeStr}</strong> nhưng bạn để mất toàn bộ lợi nhuận và quay về thua lỗ. Bài học: Luôn kéo SL về Breakeven (hòa vốn) khi lệnh đã đi đúng kỳ vọng.</>
                                  )
                                )
                              ) : (
                                <>{isEn ? 'No significant favorable expansion occurred after trade entry.' : 'Chưa xuất hiện nhịp bứt phá thuận lợi rõ rệt sau khi mở vị thế.'}</>
                              )}
                            </p>
                          </div>

                          <div className="p-3 rounded-lg bg-[#181d2a] border border-[#262f44] space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                                {isEn ? 'Adverse Pressure Assessment (MAE):' : 'Đánh Giá Áp Lực Sụt Giảm (MAE):'}
                              </span>
                              <span className="font-mono font-bold text-amber-300 text-[11px]">{cleanMaeStr}</span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              {review.excursionFlow.maePts === 0 ? (
                                isEn ? (
                                  <>Entry execution was <strong className="text-emerald-400">razor-sharp</strong> — zero adverse excursion (Drawdown = 0). No psychological heat was endured.</>
                                ) : (
                                  <>Điểm vào lệnh (Entry) <strong className="text-emerald-400">cực kỳ chuẩn xác</strong> — giá không hề bị giật ngược vào vùng âm (Drawdown = 0). Bạn không phải chịu bất kỳ áp lực tâm lý nào khi gồng lệnh.</>
                                )
                              ) : (
                                isEn ? (
                                  <>Position absorbed maximum adverse drift of <strong className="text-amber-300">{cleanMaeStr}</strong>. Review whether entry suffered from FOMO to optimize tighter fills.</>
                                ) : (
                                  <>Lệnh từng bị giật ngược âm tối đa <strong className="text-amber-300">{cleanMaeStr}</strong>. Kiểm tra xem điểm vào có bị sớm (fomo) hay không để tối ưu điểm mở lệnh an toàn hơn.</>
                                )
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Plan vs Execution Table */}
                  {review.planVsExecution && (() => {
                    const pveAny = review.planVsExecution as any;
                    const planObj = pveAny?.plan || pveAny?.auditSummary || { entry: `$${safeFormat(entryPrice)}`, stopLoss: 'Not Set', takeProfit: 'Not Set', risk: 'Undefined' };
                    const actualObj = pveAny?.actual || pveAny?.auditSummary || { entry: `$${safeFormat(effectiveExitPrice)}`, stopLoss: 'Not Set', takeProfit: 'Not Set', risk: 'Undefined' };
                    const pveStatus = pveAny?.status || 'RULE_FOLLOWED';
                    const pveDesc = pveAny?.description || pveAny?.disciplineRating || (isEn ? 'Disciplined Execution' : 'Tuân thủ quy trình');

                    return (
                      <div className="p-4 rounded-xl bg-[#141822] border border-[#232838] space-y-3">
                        <div className="flex items-center justify-between pb-1 border-b border-[#232838]">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-cyan-400" /> {isEn ? 'Plan vs Execution Audit' : 'Kế Hoạch vs Thực Thi (Plan vs Execution)'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pveStatus === 'RULE_FOLLOWED' 
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : pveStatus === 'PARTIALLY_FOLLOWED'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}>
                            {pveDesc}
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-[#232838] text-slate-400 text-[11px]">
                                <th className="py-2 px-3">{isEn ? 'Parameter' : 'Tham số'}</th>
                                <th className="py-2 px-3 text-cyan-300">{isEn ? 'Planned (Plan)' : 'Kế Hoạch (Plan)'}</th>
                                <th className="py-2 px-3 text-amber-300">{isEn ? 'Actual' : 'Thực Tế (Actual)'}</th>
                                <th className="py-2 px-3 text-right">{isEn ? 'Audit Verdict' : 'Đánh Giá Tuân Thủ'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#232838]/60 font-mono">
                              <tr>
                                <td className="py-2 px-3 text-slate-400 font-sans">Entry Price</td>
                                <td className="py-2 px-3 text-white">{planObj.entry || `$${safeFormat(entryPrice)}`}</td>
                                <td className="py-2 px-3 text-white">{actualObj.entry || `$${safeFormat(entryPrice)}`}</td>
                                <td className="py-2 px-3 text-right font-sans text-emerald-400 font-semibold">{isEn ? '✓ Matched' : '✓ Khớp chuẩn'}</td>
                              </tr>
                              <tr>
                                <td className="py-2 px-3 text-slate-400 font-sans">Stop Loss</td>
                                <td className="py-2 px-3 text-slate-300">{planObj.stopLoss || 'Not Set'}</td>
                                <td className="py-2 px-3 text-slate-300">{actualObj.stopLoss || 'Not Set'}</td>
                                <td className="py-2 px-3 text-right font-sans">
                                  {actualObj.stopLoss && actualObj.stopLoss !== 'Not Set' && actualObj.stopLoss !== 'Chưa đặt' ? (
                                    <span className="text-emerald-400 font-semibold">{isEn ? '✓ Set' : '✓ Đã cài đặt'}</span>
                                  ) : (
                                    <span className="text-rose-400 font-semibold">{isEn ? '✗ Missing SL (Violation)' : '✗ Vi phạm (Thiếu SL)'}</span>
                                  )}
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2 px-3 text-slate-400 font-sans">Take Profit</td>
                                <td className="py-2 px-3 text-slate-300">{planObj.takeProfit || 'Not Set'}</td>
                                <td className="py-2 px-3 text-slate-300">{actualObj.takeProfit || 'Not Set'}</td>
                                <td className="py-2 px-3 text-right font-sans">
                                  {actualObj.takeProfit && actualObj.takeProfit !== 'Not Set' && actualObj.takeProfit !== 'Chưa đặt' ? (
                                    <span className="text-emerald-400 font-semibold">{isEn ? '✓ Set' : '✓ Đã cài đặt'}</span>
                                  ) : (
                                    <span className="text-amber-400 font-semibold">{isEn ? '⚠ Floating TP (Discretionary)' : '⚠ Chưa đặt TP cố định'}</span>
                                  )}
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2 px-3 text-slate-400 font-sans">{isEn ? 'Risk Management' : 'Risk Quản Trị'}</td>
                                <td className="py-2 px-3 text-slate-300">{planObj.risk || 'Undefined'}</td>
                                <td className="py-2 px-3 text-slate-300">{actualObj.risk || 'Undefined'}</td>
                                <td className="py-2 px-3 text-right font-sans">
                                  {actualObj.risk && actualObj.risk !== 'Undefined' && !String(actualObj.risk).includes('Chưa') ? (
                                    <span className="text-emerald-400 font-semibold">{isEn ? '✓ Controlled' : '✓ Kiểm soát tốt'}</span>
                                  ) : (
                                    <span className="text-rose-400 font-semibold">{isEn ? '✗ Undefined' : '✗ Không thể xác định'}</span>
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {review.planVsExecution.auditNote && (
                          <div className="text-[10px] text-slate-500 italic pt-1 border-t border-[#232838]">
                            * {review.planVsExecution.auditNote}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 3: ĐÁNH GIÁ & BÀI HỌC (Done Well, Categorized Issues)    */}
              {/* ============================================================ */}
              {(activeTab === 'ALL' || activeTab === 'IMPROVEMENTS') && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider pb-1 border-b border-[#232838]">
                    <Zap className="w-4 h-4 text-amber-400" />
                    {isEn ? '3. Execution Evaluation & Learning Takeaways' : '3. Đánh Giá Thực Thi & Bài Học Rút Ra (What Was Done Well & Needs Improvement)'}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Điểm Làm Tốt */}
                    <div className="p-4 rounded-xl bg-[#141822] border border-[#232838] space-y-3">
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 pb-1 border-b border-[#232838]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        {isEn ? 'Evidence-Based Strengths' : 'Điểm Đã Làm Tốt (Evidence-Based Strengths)'}
                      </div>
                      <div className="space-y-2 pl-1">
                        {review.strengths && review.strengths.length > 0 ? (
                          review.strengths.map((s, idx) => (
                            <div key={idx} className="text-slate-200 text-xs flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                              <span className="leading-relaxed">{s}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-400 italic">
                            {isEn ? 'Execution aligned with market session volume' : 'Vào lệnh đúng nhịp phiên thị trường'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Điểm Cần Cải Thiện (Phân theo 4 nhóm) */}
                    <div className="p-4 rounded-xl bg-[#141822] border border-[#232838] space-y-3">
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 pb-1 border-b border-[#232838]">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        {isEn ? 'Categorized Improvement Issues' : 'Hành Động Cải Thiện & Chẩn Đoán Lỗi Sai (Categorized Improvement Issues)'}
                      </div>

                      {/* Cảnh báo chưa vẽ kỹ thuật trên biểu đồ */}
                      {(!review.marketContext?.drawingsFound || review.marketContext?.drawingsFound === 0) && (
                        <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/35 text-rose-200 text-xs flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <div className="font-bold text-rose-300">Biểu đồ chưa có nét vẽ phân tích SMC/ICT:</div>
                            <div className="text-[11px] text-rose-200/90 leading-relaxed">
                              Bạn chưa vẽ bất kỳ công cụ kỹ thuật nào (chưa vẽ Sweep, MSS/CISD, PD Array hay trạm cản POI). Theo quy định chấm điểm, các phần liên quan đến hình vẽ đã bị tính 0 điểm. Hãy dùng thanh công cụ bên trái biểu đồ để vẽ phân tích trước khi bấm lệnh.
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2.5 text-xs">
                        {/* A. Rule Violations */}
                        {review.categorizedImprovements?.ruleViolations && review.categorizedImprovements.ruleViolations.length > 0 && (
                          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 space-y-1">
                            <span className="font-bold text-rose-300 flex items-center gap-1 text-[11px]">
                              <ShieldAlert className="w-3 h-3" /> {isEn ? 'A. Rule Violations:' : 'A. Rule Violations (Vi phạm nguyên tắc):'}
                            </span>
                            {review.categorizedImprovements?.ruleViolations?.map((v, i) => (
                              <div key={i} className="text-rose-200 text-[11px] pl-3 flex items-start gap-1">
                                <span>•</span>
                                <span>{v}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* B. Risk Issues */}
                        {review.categorizedImprovements?.riskIssues && review.categorizedImprovements.riskIssues.length > 0 && (
                          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 space-y-1">
                            <span className="font-bold text-amber-300 flex items-center gap-1 text-[11px]">
                              <AlertCircle className="w-3 h-3" /> {isEn ? 'B. Risk Management Issues:' : 'B. Risk Issues (Vấn đề quản trị rủi ro):'}
                            </span>
                            {review.categorizedImprovements?.riskIssues?.map((v, i) => (
                              <div key={i} className="text-amber-200 text-[11px] pl-3 flex items-start gap-1">
                                <span>•</span>
                                <span>{v}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* C. Execution Issues */}
                        {review.categorizedImprovements?.executionIssues && review.categorizedImprovements.executionIssues.length > 0 && (
                          <div className="p-2.5 rounded-lg bg-[#1a202e] border border-[#2d3448] space-y-1">
                            <span className="font-bold text-slate-300 flex items-center gap-1 text-[11px]">
                              <Activity className="w-3 h-3 text-cyan-400" /> {isEn ? 'C. Execution Issues:' : 'C. Execution Issues (Vấn đề thực thi):'}
                            </span>
                            {review.categorizedImprovements?.executionIssues?.map((v, i) => (
                              <div key={i} className="text-slate-300 text-[11px] pl-3 flex items-start gap-1">
                                <span>•</span>
                                <span>{v}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* D. Strategy Issues */}
                        {review.categorizedImprovements?.strategyIssues && review.categorizedImprovements.strategyIssues.length > 0 && (
                          <div className="p-2.5 rounded-lg bg-[#1a202e] border border-[#2d3448] space-y-1">
                            <span className="font-bold text-slate-300 flex items-center gap-1 text-[11px]">
                              <Compass className="w-3 h-3 text-indigo-400" /> {isEn ? 'D. Strategy Fit Issues:' : 'D. Strategy Issues (Vấn đề chiến lược):'}
                            </span>
                            {review.categorizedImprovements?.strategyIssues?.map((v, i) => (
                              <div key={i} className="text-slate-300 text-[11px] pl-3 flex items-start gap-1">
                                <span>•</span>
                                <span>{v}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3-5 Actionable Learning Takeaways */}
                  {review.learningTakeaways && review.learningTakeaways.length > 0 && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-[#141a27] via-[#161a25] to-[#141a27] border border-cyan-500/30 space-y-2.5">
                      <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 pb-1 border-b border-[#232838]">
                        <BookOpen className="w-4 h-4 text-cyan-400" />
                        {isEn ? 'Student Learning Takeaways' : 'Bài Học Đúc Kết Cho Sinh Viên (Learning Takeaways)'}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {review.learningTakeaways?.map((takeaway, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-[#191f2d] border border-[#262e42] flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="text-slate-200 leading-relaxed">{takeaway}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}



              {/* ============================================================ */}
              {/* SOURCES / EVIDENCE (Tài liệu kiểm chứng đối chiếu)           */}
              {/* ============================================================ */}
              {review.sources && review.sources.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#131620] border border-[#232838] space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] pb-1 border-b border-[#232838]/60">
                    <div className="flex items-center gap-1.5 font-bold text-slate-300">
                      <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                      <span>{isEn ? 'Academic & Citational Verification Sources:' : 'Tài liệu kiểm chứng đối chiếu (Evidence & Academic Sources):'}</span>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      {isEn ? 'Primary / Secondary Academic Verified • Click to inspect source' : 'Primary / Secondary Academic Verified • Nhấp vào để xem nguồn gốc'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {review.sources?.map((s, idx) => {
                      const hasLink = s.sourceUrl && s.sourceUrl !== '#' && s.sourceUrl.startsWith('http');
                      const isYouTube = hasLink && (s.sourceUrl.includes('youtube.com') || s.sourceUrl.includes('youtu.be'));
                      return (
                        <a
                          key={idx}
                          href={hasLink ? s.sourceUrl : undefined}
                          target={hasLink ? '_blank' : undefined}
                          rel={hasLink ? 'noopener noreferrer' : undefined}
                          className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg border text-xs transition-all group ${
                            hasLink 
                              ? isYouTube
                                ? 'bg-[#191418] hover:bg-rose-500/15 border-rose-500/25 hover:border-rose-500/50 text-slate-300 hover:text-rose-200 cursor-pointer shadow-sm'
                                : 'bg-[#181d29] hover:bg-cyan-500/15 border-[#282f42] hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 cursor-pointer shadow-sm'
                              : 'bg-[#181d29] border-[#282f42] text-slate-400 cursor-default'
                          }`}
                          title={isYouTube 
                            ? (isEn ? `Click to watch lecture video directly on YouTube: ${s.source}` : `Nhấp để xem video bài giảng trực tiếp trên YouTube: ${s.source}`)
                            : (isEn ? `Primary Source: ${s.source} (${s.author})` : `Tài liệu gốc: ${s.source} (${s.author})`)}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isYouTube ? (
                              <PlayCircle className="w-4 h-4 text-rose-400 group-hover:text-rose-300 shrink-0" />
                            ) : (
                              <BookOpen className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-300 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <span className="font-semibold text-white group-hover:text-cyan-100 truncate text-[11px] sm:text-xs block">
                                {s.title}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate block">
                                {s.source}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase border ${
                              isYouTube 
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' 
                                : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                            }`}>
                              {isYouTube ? (isEn ? '▶ LECTURE VIDEO' : '▶ VIDEO BÀI GIẢNG') : (s.sourceType || (isEn ? 'PRIMARY SOURCE' : 'TÀI LIỆU GỐC'))}
                            </span>
                            {hasLink && (
                              <ExternalLink className={`w-3.5 h-3.5 shrink-0 ${isYouTube ? 'text-rose-400 group-hover:text-rose-300' : 'text-slate-500 group-hover:text-cyan-300'}`} />
                            )}
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
