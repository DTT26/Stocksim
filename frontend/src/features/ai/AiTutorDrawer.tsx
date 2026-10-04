import { useState, useRef, useEffect } from 'react';
import { 
  X, Sparkles, BookOpen, Layers, GitCompare, 
  Send, ExternalLink, HelpCircle, CheckCircle2, AlertTriangle, ShieldCheck, User,
  MessageSquare, Scale, Copy, Check, ChevronRight, Bot, Trash2, RefreshCw,
  PlayCircle, Target, TrendingUp, Lightbulb, Crown, ArrowRight, Lock,
  PenTool, Eye, CheckCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { aiService, type AskResponse, type StrategyComparisonData } from '../../services/aiService';
import { subscriptionService, type SubscriptionInfo } from '../../services/subscriptionService';
import { UpgradeProModal } from './UpgradeProModal';
import { STOCKS } from '../market/data';
import { 
  getChartInstance, 
  getChartDrawingsData, 
  drawAiCorrectionOverlay, 
  clearAiCorrectionOverlay,
  type UserChartDrawing 
} from '../market/components/ChartArea';

interface AiTutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentSymbol?: string;
  currentPrice?: number;
  timeframe?: string;
  marketContext?: any;
  topOffset?: number;
  sharedImage?: string | null;
  onClearSharedImage?: () => void;
  isChallengeActive?: boolean;
  onStartBacktestReplay?: (symbol: string, timeframe: string, rules?: {
    strategy: string;
    entryRule: string;
    stopLossRule: string;
    takeProfitRule: string;
    invalidationRule?: string;
  }) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  data?: AskResponse;
  imageUrl?: string;
}

const getWelcomeMessage = (isEn: boolean): ChatMessage => ({
  id: 'welcome',
  sender: 'tutor',
  text: isEn
    ? `👋 **Hello! I am StockSim's AI Trading Tutor.**\n\nI am ready to help you with:\n- 📖 Concept deep dives (**ICT/SMC, Price Action, 1%-2% Capital Preservation**)\n- 🔍 Reading real-time market structure & liquidity sweeps\n- ⚖️ Analyzing and reviewing winning/losing trades.\n\nType your question below or click any quick topic above to begin!`
    : `👋 **Chào bạn! Tôi là AI Trading Tutor của StockSim.**\n\nTôi sẵn sàng hỗ trợ bạn:\n- 📖 Giải thích kiến thức (**ICT/SMC, Price Action, Quản trị vốn 1%-2%**)\n- 🔍 Đọc cấu trúc thị trường theo giá sàn real-time\n- ⚖️ Phân tích, review lệnh thắng/thua.\n\nHãy nhập câu hỏi hoặc chọn các thẻ chủ đề phía trên nhé!`
});

const WELCOME_MESSAGE = getWelcomeMessage(false);

const renderInlineStyles = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*[^*\n]+?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={i} className="font-semibold text-amber-600 dark:text-amber-300">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#202738] border border-slate-300 dark:border-[#343e57] text-emerald-600 dark:text-emerald-400 font-mono text-[11px] mx-0.5">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2 && !part.startsWith('**')) {
      return (
        <span key={i} className="text-amber-600 dark:text-amber-300 font-medium">
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
};

const renderFormattedText = (text: string) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 text-[13px] leading-relaxed text-slate-800 dark:text-slate-100">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Horizontal rule (--- or ***)
        if (/^[-*_]{3,}$/.test(trimmed)) {
          return <hr key={idx} className="border-slate-200 dark:border-[#252c3f] my-2" />;
        }

        // Section Title
        if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
          const title = trimmed.replace(/^#+\s*/, '');
          return (
            <div key={idx} className="pt-2 pb-0.5 text-[13.5px] font-bold text-amber-600 dark:text-amber-300 flex items-center gap-1.5 border-b border-slate-200 dark:border-[#252c3f]/70">
              <span className="w-1 h-3.5 rounded-full bg-gradient-to-b from-amber-500 to-amber-600 inline-block shrink-0" />
              <span>{renderInlineStyles(title)}</span>
            </div>
          );
        }

        // Blockquote / Tip / Alert
        if (trimmed.startsWith('> ')) {
          const quote = trimmed.replace(/^>\s*/, '');
          return (
            <div key={idx} className="my-1.5 p-2.5 rounded-lg bg-amber-500/10 border-l-2 border-amber-500 text-amber-800 dark:text-amber-200 text-xs font-medium leading-relaxed">
              {renderInlineStyles(quote)}
            </div>
          );
        }

        // Bullet point (*, -, •)
        if (/^[\*\-•]\s+/.test(trimmed)) {
          const content = trimmed.replace(/^[\*\-•]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-0.5 text-[13px] text-slate-800 dark:text-slate-100">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0 shadow-xs" />
              <span className="flex-1 text-slate-800 dark:text-slate-100">{renderInlineStyles(content)}</span>
            </div>
          );
        }

        // Numbered list (1., 2., etc.)
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-0.5 text-[13px] text-slate-800 dark:text-slate-100">
              <span className="min-w-[17px] h-4.5 rounded bg-slate-100 dark:bg-[#232a3b] border border-slate-300 dark:border-[#374158] text-amber-600 dark:text-amber-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {numMatch[1]}
              </span>
              <span className="flex-1 text-slate-800 dark:text-slate-100">{renderInlineStyles(numMatch[2])}</span>
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={idx} className="text-slate-800 dark:text-slate-100 text-[13px] leading-relaxed">
            {renderInlineStyles(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

export const AiTutorDrawer = ({
  isOpen,
  onClose,
  currentSymbol = 'BTCUSDT',
  currentPrice = 64200,
  timeframe = '15m',
  marketContext,
  topOffset = 48,
  sharedImage,
  onClearSharedImage,
  isChallengeActive = false,
  onStartBacktestReplay
}: AiTutorDrawerProps) => {
  const [activeTab, setActiveTab] = useState<'tutor' | 'inspect' | 'compare'>('tutor');
  
  // Chat Q&A State
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dynamic Loading Status UX (1-3s, 4-7s, 8s+)
  useEffect(() => {
    let timer: any = null;
    if (loading) {
      setLoadingSeconds(1);
      timer = setInterval(() => {
        setLoadingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setLoadingSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loading]);

  const { user, login } = useAuth();
  const { t, lang } = useI18n();
  const isEn = lang === 'en';

  const getDynamicLoadingStatus = (sec: number) => {
    if (sec <= 3) {
      return {
        icon: '🔍',
        text: isEn ? 'Reviewing market data & account balance...' : 'Đang rà soát dữ liệu thị trường & tài khoản...',
        subtext: isEn ? 'Fetching live prices, wallet balance, and OHLCV klines...' : 'Thu thập giá sàn real-time, số dư ví và dữ liệu nến OHLCV...'
      };
    }
    if (sec <= 7) {
      return {
        icon: '⚡',
        text: isEn ? 'Analyzing SMC / Liquidity structure...' : 'Đang đối chiếu cấu trúc SMC / Liquidity...',
        subtext: isEn ? 'Detecting Displacement, FVG, Order Blocks, and liquidity sweeps...' : 'Nhận diện nhịp Displacement, vùng FVG, Order Block và quét thanh khoản...'
      };
    }
    return {
      icon: '✍️',
      text: isEn ? 'Finalizing your mentor feedback...' : 'Đang hoàn thiện lời khuyên cho bạn...',
      subtext: isEn ? 'Synthesizing technical edge and risk management plan...' : 'Tổng hợp luận điểm phân tích kỹ thuật và phương án quản trị rủi ro...'
    };
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  const [messages, setMessages] = useState<ChatMessage[]>([getWelcomeMessage(isEn)]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Sync welcome message when switching language
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [getWelcomeMessage(isEn)];
      }
      return prev.map(m => m.id === 'welcome' ? getWelcomeMessage(isEn) : m);
    });
  }, [isEn]);

  const fetchSubscription = async () => {
    if (!user?._id) return;
    try {
      const sub = await subscriptionService.getMySubscription();
      setSubscription(sub);
    } catch (err) {
      console.warn('Could not fetch subscription:', err);
    }
  };

  useEffect(() => {
    if (isOpen && user?._id) {
      fetchSubscription();
    } else if (!user) {
      setSubscription(null);
    }
  }, [isOpen, user?._id]);

  // Load chat history from Database on open
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    const loadHistory = async () => {
      try {
        const history = await aiService.getChatHistory();
        if (!isCancelled && history && history.length > 0) {
          setMessages([
            getWelcomeMessage(isEn),
            ...history.map(item => ({
              id: item.id,
              sender: item.sender,
              text: item.text,
              data: item.data
            }))
          ]);
        }
      } catch (err) {
        console.warn('Could not load chat history from DB:', err);
      }
    };

    loadHistory();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, isEn]);

  // Handle shared chart snapshot from Camera toolbar
  useEffect(() => {
    if (sharedImage && isOpen) {
      setActiveTab('tutor');
      const newMsgId = 'chart-snapshot-' + Date.now();
      const newMsg: ChatMessage = {
        id: newMsgId,
        sender: 'user',
        text: isEn
          ? `📊 **Chart Snapshot: ${currentSymbol} (${timeframe})**\nAttached chart screenshot with active drawings. AI Tutor please analyze price structure, key Fibonacci levels, and support/resistance on this chart!`
          : `📊 **Ảnh chụp biểu đồ: ${currentSymbol} (${timeframe})**\nĐã đính kèm ảnh chụp biểu đồ kỹ thuật cùng các công cụ vẽ. Nhờ AI Tutor phân tích cấu trúc giá và các mức Fibonacci/hỗ trợ kháng cự trên biểu đồ này!`,
        imageUrl: sharedImage
      };
      setMessages(prev => [...prev, newMsg]);

      (async () => {
        try {
          setLoading(true);
          const qText = isEn
            ? `Analyze market structure, key price zones, and Fibonacci levels of ${currentSymbol} on ${timeframe} timeframe. Suggest trade scenarios with proper risk management.`
            : `Phân tích cấu trúc thị trường, các vùng giá quan trọng và các mức Fibonacci của mã ${currentSymbol} trên khung thời gian ${timeframe}. Đưa ra các gợi ý kịch bản giao dịch theo quản trị rủi ro.`;
          // Attach real chart structure to shared snapshot
          let snapChartContext = { ...marketContext };
          try {
            const chartData = getChartDrawingsData();
            if (chartData.klines && chartData.klines.length > 0) {
              const highs = chartData.klines.map((k: any) => k.high).filter((v: any) => typeof v === 'number');
              const lows = chartData.klines.map((k: any) => k.low).filter((v: any) => typeof v === 'number');
              snapChartContext = {
                ...snapChartContext,
                chartHigh: highs.length > 0 ? Math.max(...highs) : undefined,
                chartLow: lows.length > 0 ? Math.min(...lows) : undefined,
                klines: chartData.klines
              };
            }
          } catch (_) {}

          const res = await aiService.askQuestion(
            qText,
            undefined,
            currentSymbol,
            currentPrice,
            timeframe,
            snapChartContext,
            undefined,
            undefined,
            lang
          );
          const tutorMsg: ChatMessage = {
            id: 'tutor-' + Date.now(),
            sender: 'tutor',
            text: res.answer,
            data: res
          };
          setMessages(prev => [...prev, tutorMsg]);
        } catch (err: any) {
          console.error('Error asking tutor on shared image:', err);
        } finally {
          setLoading(false);
          onClearSharedImage?.();
        }
      })();
    }
  }, [sharedImage, isOpen, currentSymbol, timeframe, currentPrice, marketContext, onClearSharedImage, isEn, lang]);

  const handleClearChat = async () => {
    const confirmMsg = isEn 
      ? 'Are you sure you want to clear your entire chat history in the Database?' 
      : 'Bạn có chắc muốn xóa toàn bộ lịch sử đoạn chat này trong Database không?';
    if (!confirm(confirmMsg)) return;
    try {
      await aiService.clearChatHistory();
      setMessages([getWelcomeMessage(isEn)]);
    } catch (err) {
      console.error('Failed to clear chat history:', err);
    }
  };

  // Auto-scroll anchor to keep the latest question and answer comfortably in view
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastUserMsgRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (activeTab === 'tutor' && chatContainerRef.current && lastUserMsgRef.current && messages.length > 1) {
      const container = chatContainerRef.current;
      const target = lastUserMsgRef.current;
      const targetTop = target.offsetTop - container.offsetTop - 16;
      container.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth'
      });
    }
  }, [messages.length, activeTab]);

  // Active Asset & Exchange Selector inside Drawer
  const [activeSymbol, setActiveSymbol] = useState(currentSymbol || 'BTCUSDT');
  const [activePrice, setActivePrice] = useState(currentPrice || 0);
  const prevCurrentSymbolRef = useRef(currentSymbol);

  // Only update activeSymbol when currentSymbol from parent chart actually changes
  useEffect(() => {
    if (currentSymbol && currentSymbol !== prevCurrentSymbolRef.current) {
      prevCurrentSymbolRef.current = currentSymbol;
      setActiveSymbol(currentSymbol);
      if (currentPrice) setActivePrice(currentPrice);
      // Reset AI Drawing Inspection states and remove AI correction overlay on symbol change
      setInspectResult(null);
      setInspectError(null);
      setHasDrawnCorrection(false);
      clearAiCorrectionOverlay();
      handleScanDrawings();
    }
  }, [currentSymbol, currentPrice]);

  // If currentPrice of chart ticks, only update activePrice if activeSymbol matches chart
  useEffect(() => {
    if (currentSymbol && activeSymbol === currentSymbol && currentPrice) {
      setActivePrice(currentPrice);
    }
  }, [currentPrice, activeSymbol, currentSymbol]);

  // Strategy Compare State
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [compareData, setCompareData] = useState<StrategyComparisonData | null>(null);

  // Chart Structured Drawing Inspection State (Pure Data - No Screenshot)
  const [detectedDrawings, setDetectedDrawings] = useState<UserChartDrawing[]>([]);
  const [detectedKlines, setDetectedKlines] = useState<any[]>([]);
  const [inspectNotes, setInspectNotes] = useState('');
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [inspectResult, setInspectResult] = useState<any | null>(null);
  const [hasDrawnCorrection, setHasDrawnCorrection] = useState(false);

  // Scan drawings directly from chart instance
  const handleScanDrawings = () => {
    const data = getChartDrawingsData();
    setDetectedDrawings(data.drawings);
    setDetectedKlines(data.klines);
    return data;
  };

  const handleTagDrawing = (index: number, tagType: string) => {
    setDetectedDrawings(prev => {
      const updated = [...prev];
      if (updated[index]) {
        const item = updated[index];
        const tagMap: Record<string, { label: string; concept: string }> = {
          OB: { label: isEn ? 'Order Block (OB)' : 'Khối Lệnh (Order Block - OB)', concept: 'Order Block (OB)' },
          FVG: { label: isEn ? 'Fair Value Gap (FVG)' : 'Khoảng Trống Giá (Fair Value Gap - FVG)', concept: 'Fair Value Gap (FVG)' },
          BOS: { label: isEn ? 'Break of Structure (BOS)' : 'Phá Vỡ Cấu Trúc (BOS)', concept: 'Break of Structure (BOS)' },
          CHOCH: { label: isEn ? 'Change of Character (CHoCH)' : 'Đổi Tính Chất (CHoCH)', concept: 'Change of Character (CHoCH)' },
          LIQUIDITY: { label: isEn ? 'Liquidity Pool' : 'Thanh Khoản (Liquidity Pool)', concept: 'Liquidity Pool' },
        };
        const info = tagMap[tagType] || { label: tagType, concept: tagType };
        updated[index] = {
          ...item,
          tag: tagType,
          userLabel: tagType,
          label: info.label,
          detectedConcept: info.concept
        };
      }
      return updated;
    });
  };

  const handleEditDrawingLabel = (index: number, newLabel: string) => {
    setDetectedDrawings(prev => {
      const updated = [...prev];
      if (updated[index]) {
        const item = updated[index];
        updated[index] = {
          ...item,
          userLabel: newLabel,
          label: newLabel || item.name
        };
      }
      return updated;
    });
  };

  // Auto scan when switching to inspect tab
  useEffect(() => {
    if (activeTab === 'inspect') {
      handleScanDrawings();
    }
  }, [activeTab]);

  const handleInspectDrawings = async () => {
    if (!user) {
      login();
      return;
    }
    let currentDrawings = detectedDrawings;
    let currentKlines = detectedKlines;
    if (!currentDrawings || currentDrawings.length === 0) {
      const currentData = handleScanDrawings();
      currentDrawings = currentData.drawings;
      currentKlines = currentData.klines;
    }
    if (!currentDrawings || currentDrawings.length === 0) {
      setInspectError(
        isEn
          ? 'No drawings found on chart. Please use the left toolbar (Rectangle, Trend Line) to mark Order Block / FVG first!'
          : 'Chưa tìm thấy vùng vẽ nào trên biểu đồ. Hãy dùng thanh công cụ bên trái biểu đồ (Hộp chữ nhật, Đường kẻ) để vẽ vùng Order Block / FVG trước nhé!'
      );
      return;
    }
    setInspectLoading(true);
    setInspectError(null);
    setHasDrawnCorrection(false);
    try {
      const res = await aiService.inspectChartDrawings({
        drawings: currentDrawings,
        klines: currentKlines,
        symbol: activeSymbol,
        timeframe: timeframe || '15m',
        userNotes: inspectNotes,
        lang: isEn ? 'en' : 'vi'
      });
      if (res.quotaExceeded) {
        setInspectError(res.message || (isEn ? 'You have reached your daily AI quota.' : 'Bạn đã sử dụng hết hạn mức AI hôm nay.'));
      } else {
        setInspectResult(res);
        fetchSubscription();
      }
    } catch (err: any) {
      setInspectError(err.message || (isEn ? 'Failed to submit drawings for AI evaluation.' : 'Lỗi khi gửi dữ liệu hình vẽ cho AI chấm'));
    } finally {
      setInspectLoading(false);
    }
  };

  const handleApplyAiCorrection = () => {
    if (!inspectResult?.suggestedZone) return;
    const overlayId = drawAiCorrectionOverlay(inspectResult.suggestedZone);
    if (overlayId) {
      setHasDrawnCorrection(true);
    }
  };

  const handleAsk = async (questionText?: string) => {
    if (!user) {
      login();
      return;
    }
    const q = (questionText || query).trim();
    if (!q) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: q
    };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    const streamingId = 'tutor-stream-' + (Date.now() + 1);
    let hasStartedStreaming = false;

    try {
      // Pass recent conversation context (last 6 messages) for multi-turn conversational memory
      const chatHistory = messages
        .filter(m => m.id !== 'welcome')
        .slice(-6)
        .map(m => ({
          sender: m.sender,
          text: m.text
        }));

      const allStocks = STOCKS.map(s => ({
        symbol: s.symbol,
        name: s.name,
        price: s.price,
        percent: s.percent,
        change: s.change,
        market: s.market,
        exchange: s.exchange
      }));

      // Compute live chart swings & extrema (Đỉnh & Đáy chuẩn xác từ biểu đồ)
      let dynamicChartContext = { ...marketContext };
      try {
        const liveChartData = getChartDrawingsData();
        const liveKlines = liveChartData.klines || [];
        if (liveKlines.length > 0) {
          const highs = liveKlines.map((k: any) => k.high).filter((v: any) => typeof v === 'number');
          const lows = liveKlines.map((k: any) => k.low).filter((v: any) => typeof v === 'number');
          const chartHigh = highs.length > 0 ? Math.max(...highs) : undefined;
          const chartLow = lows.length > 0 ? Math.min(...lows) : undefined;

          const swingHighs: Array<{ price: number; timestamp?: number; candlesAgo: number }> = [];
          const swingLows: Array<{ price: number; timestamp?: number; candlesAgo: number }> = [];
          const n = liveKlines.length;
          for (let i = 1; i < n - 1; i++) {
            const h = liveKlines[i].high;
            const l = liveKlines[i].low;
            if (h >= liveKlines[i - 1].high && h >= liveKlines[i + 1].high) {
              swingHighs.push({ price: h, timestamp: liveKlines[i].timestamp, candlesAgo: n - 1 - i });
            }
            if (l <= liveKlines[i - 1].low && l <= liveKlines[i + 1].low) {
              swingLows.push({ price: l, timestamp: liveKlines[i].timestamp, candlesAgo: n - 1 - i });
            }
          }

          dynamicChartContext = {
            ...dynamicChartContext,
            chartHigh,
            chartLow,
            klines: liveKlines,
            recentSwingHighs: swingHighs.slice(-4),
            recentSwingLows: swingLows.slice(-4),
            userDrawingsSummary: (liveChartData.drawings || []).map((d: any) => ({
              name: d.name,
              label: d.label,
              tag: d.tag,
              priceHigh: d.priceHigh,
              priceLow: d.priceLow
            }))
          };
        }
      } catch (chartErr) {
        console.warn('Could not extract live chart swings:', chartErr);
      }

      // 1. Try Server-Sent Events (SSE Streaming) first for real-time word-by-word delivery
      let streamSucceeded = false;
      try {
        setIsStreaming(true);
        const res = await aiService.askQuestionStream(
          {
            question: q,
            symbol: currentSymbol,
            currentPrice,
            timeframe,
            marketContext: dynamicChartContext,
            chatHistory,
            allStocks,
            lang
          },
          (_token, fullText) => {
            if (!hasStartedStreaming) {
              hasStartedStreaming = true;
              setLoading(false); // Token arrived, hide waiting box!
              setMessages(prev => [
                ...prev,
                {
                  id: streamingId,
                  sender: 'tutor',
                  text: fullText
                }
              ]);
            } else {
              setMessages(prev => prev.map(m => m.id === streamingId ? { ...m, text: fullText } : m));
            }
          }
        );

        // Finalize message with complete metadata & citations if valid answer was received
        if (res.answer && !res.answer.includes('Không nhận được câu trả lời từ AI.')) {
          setMessages(prev => {
            const exists = prev.some(m => m.id === streamingId);
            if (exists) {
              return prev.map(m => m.id === streamingId ? { ...m, text: res.answer, data: res } : m);
            }
            return [...prev, { id: streamingId, sender: 'tutor', text: res.answer, data: res }];
          });
          streamSucceeded = true;
          fetchSubscription();
        } else {
          console.warn('Streaming produced empty answer, falling back to standard askQuestion');
          setMessages(prev => prev.filter(m => m.id !== streamingId));
        }
      } catch (streamErr) {
        console.warn('Streaming error, checking fallback:', streamErr);
        setMessages(prev => prev.filter(m => m.id !== streamingId));
      }

      // 2. Fallback to standard request if streaming failed or produced empty answer
      if (!streamSucceeded) {
        const res = await aiService.askQuestion(
          q, 
          undefined, 
          currentSymbol, 
          currentPrice, 
          timeframe, 
          dynamicChartContext,
          chatHistory,
          allStocks,
          lang
        );
        const tutorMsg: ChatMessage = {
          id: String(Date.now() + 1),
          sender: 'tutor',
          text: res.answer,
          data: res
        };
        setMessages(prev => [...prev, tutorMsg]);
        fetchSubscription();
      }
    } catch (err: any) {
      console.error(err);
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      let errMessage = err?.message || '';
      
      // Sanitize raw HTML error pages (e.g. Render/Cloudflare 502/503/504)
      if (errMessage.includes('<!DOCTYPE html') || errMessage.includes('<html') || errMessage.length > 200) {
        if (errMessage.includes('502')) {
          errMessage = isEn 
            ? 'AI server is restarting (cold-start) or not responding. Please wait 30-60 seconds and retry.'
            : 'Máy chủ AI trên Render đang khởi động lại (Cold-start sau 15p nghỉ) hoặc chưa phản hồi. Vui lòng đợi 30-60 giây và gửi lại câu hỏi.';
        } else if (errMessage.includes('504')) {
          errMessage = isEn 
            ? 'Gateway Timeout from AI server. Please try again.'
            : 'Hết thời gian chờ phản hồi từ máy chủ AI (Gateway Timeout). Vui lòng thử lại.';
        } else {
          errMessage = isEn 
            ? 'AI server is temporarily unavailable (HTTP Error).'
            : 'Máy chủ AI tạm thời không thể truy cập (HTTP Error).';
        }
      }

      const noticeText = isLocal
        ? (isEn ? '⚠️ Unable to connect to AI Service. Please make sure `python-service` is running on port 8000.' : '⚠️ Không thể kết nối tới AI Service. Vui lòng đảm bảo `python-service` đang chạy trên cổng 8000.')
        : (isEn ? `⚠️ Unable to connect to AI Service on server. ${errMessage ? `(Details: ${errMessage})` : 'Please check python-service.'}` : `⚠️ Không thể kết nối tới AI Service trên máy chủ. ${errMessage ? `(Chi tiết: ${errMessage})` : 'Vui lòng kiểm tra lại dịch vụ python-service trên Render.'}`);

      setMessages(prev => [
        ...prev, 
        {
          id: String(Date.now() + 1),
          sender: 'tutor',
          text: noticeText
        }
      ]);
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  };

  const handleExplainConcept = async (concept: string, framework: string) => {
    const promptText = isEn 
      ? `Explain the concept of ${concept} (${framework})` 
      : `Giải thích về khái niệm ${concept} (${framework})`;
    handleAsk(promptText);
  };

  const handleRunComparison = async (symOverride?: string, priceOverride?: number) => {
    const sym = symOverride || activeSymbol;
    const price = priceOverride ?? activePrice;
    setCompareLoading(true);
    setCompareError(null);
    try {
      const res = await aiService.compareStrategies({
        symbol: sym,
        side: 'BUY',
        entryPrice: price,
        stopLoss: price * 0.97,
        takeProfit: price * 1.06,
        quantity: 1,
        timeframe: timeframe || '15m'
      }, isEn ? 'en' : 'vi');
      setCompareData(res);
    } catch (err: any) {
      console.error(err);
      setCompareError(
        isEn
          ? 'Unable to load strategy comparison data. Please click to retry.'
          : 'Không thể tải dữ liệu so sánh chiến lược. Vui lòng bấm thử lại.'
      );
    } finally {
      setCompareLoading(false);
    }
  };

  // Auto-run comparison when switching to compare tab or changing asset
  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === 'compare') {
      if (!compareData || compareData.symbol !== activeSymbol) {
        handleRunComparison(activeSymbol, activePrice);
      }
    }
  }, [isOpen, activeTab, activeSymbol]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        style={{ top: `${topOffset}px`, height: `calc(100vh - ${topOffset}px)` }}
        className="fixed right-0 z-40 w-full sm:w-[540px] md:w-[620px] bg-white dark:bg-[#131722] border-l border-[#e6e8ea] dark:border-[#2a2e39] text-[#1e2329] dark:text-slate-200 shadow-2xl flex flex-col transform transition-all duration-200 ease-in-out"
      >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e6e8ea] dark:border-[#2a2e39] bg-[#f8f9fa] dark:bg-[#1e222d] gap-2">
        {/* Left identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/20 via-purple-500/20 to-blue-500/20 border border-amber-500/30 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-[#1e2329] dark:text-white truncate">AI Trading Tutor</h2>
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis">
              <span className="font-semibold text-slate-800 dark:text-slate-200">{currentSymbol}</span>
              <span>•</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                ${currentPrice >= 100 ? currentPrice.toLocaleString('en-US') : currentPrice.toFixed(4)}
              </span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-mono">
                {timeframe}
              </span>
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {user && (
            <>
              {subscription?.plan === 'PRO' ? (
                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-purple-500/15 border border-amber-500/35 hover:border-amber-500/60 text-amber-600 dark:text-amber-400 font-bold text-xs whitespace-nowrap shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
                  title={
                    subscription.premiumExpiresAt
                      ? (isEn
                          ? `PRO VIP Account • Unlimited Chat & Chart Evaluations • Expires: ${new Date(subscription.premiumExpiresAt).toLocaleDateString('en-US')}`
                          : `Tài khoản PRO VIP • Không giới hạn Chat & Chấm bài • Hạn đến: ${new Date(subscription.premiumExpiresAt).toLocaleDateString('vi-VN')}`)
                      : 'PRO VIP Account (Unlimited)'
                  }
                >
                  <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>PRO VIP</span>
                  <span className="font-mono text-[11px] opacity-90 text-amber-500 font-extrabold">(∞)</span>
                  {subscription.premiumExpiresAt && (
                    <span className="hidden sm:inline-flex items-center text-[10px] text-amber-700 dark:text-amber-300 font-normal ml-0.5 border-l border-amber-500/30 pl-1.5 gap-1">
                      <span>{isEn ? 'EXP:' : 'HSD:'}</span>
                      <strong className="font-mono font-medium">{new Date(subscription.premiumExpiresAt).toLocaleDateString(isEn ? 'en-US' : 'vi-VN')}</strong>
                    </span>
                  )}
                </button>
              ) : subscription?.plan === 'PLUS' || subscription?.isPremium ? (
                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-500/15 via-purple-500/10 to-blue-500/15 border border-blue-500/35 hover:border-blue-500/60 text-blue-600 dark:text-blue-400 font-bold text-xs whitespace-nowrap shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
                  title={
                    isEn
                      ? `PLUS Plan • ${subscription.remainingChat ?? subscription.remainingToday}/300 chats • ${subscription.remainingInspect ?? 150}/150 evaluations remaining`
                      : `Gói PLUS • Còn ${subscription.remainingChat ?? subscription.remainingToday}/300 chat • ${subscription.remainingInspect ?? 150}/150 chấm bài (Bấm nâng cấp PRO)`
                  }
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>PLUS</span>
                  <span className="font-mono text-[11px] opacity-85">
                    ({subscription.remainingChat ?? subscription.remainingToday}/300)
                  </span>
                  {subscription.premiumExpiresAt && (
                    <span className="hidden sm:inline-flex items-center text-[10px] text-blue-700 dark:text-blue-300 font-normal ml-0.5 border-l border-blue-500/30 pl-1.5 gap-1">
                      <span>{isEn ? 'EXP:' : 'HSD:'}</span>
                      <strong className="font-mono font-medium">{new Date(subscription.premiumExpiresAt).toLocaleDateString(isEn ? 'en-US' : 'vi-VN')}</strong>
                    </span>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span 
                    className="hidden sm:inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 dark:bg-[#1a1f2c] text-slate-600 dark:text-slate-300 text-xs font-mono border border-slate-200 dark:border-[#2b3347] whitespace-nowrap"
                    title={isEn ? 'Free quota remaining today' : 'Lượt dùng miễn phí hôm nay'}
                  >
                    <span className="text-slate-400 text-[11px] mr-1">Free:</span>
                    <strong className="text-amber-600 dark:text-amber-400">{subscription?.remainingChat ?? (subscription ? subscription.remainingToday : 10)}</strong>
                    <span className="text-slate-400">/10 chat</span>
                    <span className="mx-1 text-slate-300 dark:text-slate-600">•</span>
                    <strong className="text-blue-600 dark:text-blue-400">{subscription?.remainingInspect ?? 1}</strong>
                    <span className="text-slate-400">/1 bài</span>
                  </span>
                  <button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap hover:scale-[1.02]"
                    title={isEn ? 'Upgrade to PLUS (129k) or PRO (299k)' : 'Nâng cấp Gói PLUS (129k) hoặc PRO (299k) qua PayOS'}
                  >
                    <Crown className="w-3.5 h-3.5 shrink-0" />
                    <span>{isEn ? 'Upgrade' : 'Nâng cấp gói'}</span>
                  </button>
                </div>
              )}
              <div className="h-4 w-px bg-slate-200 dark:bg-[#2a2e39] mx-0.5" />
            </>
          )}

          {activeTab === 'tutor' && messages.length > 1 && (
            <button 
              onClick={handleClearChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
              title={isEn ? 'Clear this chat history' : 'Xóa lịch sử đoạn chat này'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#1e2329] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2a2e39] transition-colors shrink-0 cursor-pointer"
            title={isEn ? 'Close AI Tutor' : 'Đóng bảng AI Tutor'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e6e8ea] dark:border-[#2a2e39] bg-[#f0f3fa] dark:bg-[#181b24] px-3 text-xs font-medium">
        <button
          onClick={() => setActiveTab('tutor')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'tutor' 
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-semibold' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-[#1e2329] dark:hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {isEn ? 'AI Tutor (Chat)' : 'Gia sư AI (Chat)'}
        </button>
        <button
          onClick={() => setActiveTab('inspect')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'inspect' 
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-semibold' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-[#1e2329] dark:hover:text-slate-200'
          }`}
        >
          <Target className="w-3.5 h-3.5 text-amber-500" />
          <span>{isEn ? 'Zone Evaluation' : 'Chấm Bài Vùng Vẽ'}</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('compare');
            if (!compareData) handleRunComparison();
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'compare' 
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-semibold' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-[#1e2329] dark:hover:text-slate-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          {isEn ? 'Compare Strategies' : 'So sánh Chiến lược'}
        </button>
      </div>

      {/* Active Challenge Lock Banner */}
      {isChallengeActive && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-300">
          <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{isEn ? 'AI Tutor is temporarily locked during Challenge' : 'Tính năng AI bị tạm khóa trong thời gian thi Quỹ'}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isEn 
                ? 'Under Prop Firm Challenge rules, all AI and automated analysis tools are disabled to ensure fair evaluation.'
                : 'Theo quy chế thi Thử Thách Cấp Vốn Quỹ (Prop Firm Challenge), toàn bộ công cụ AI và phân tích tự động bị vô hiệu hóa để bảo đảm tính minh bạch và đánh giá đúng năng lực thí sinh.'}
            </p>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-white dark:bg-[#131722]">
        {/* TAB 1: TUTOR CHAT */}
        {activeTab === 'tutor' && (
          <>
            {/* Quick badges */}
            <div className="bg-[#f8f9fa] dark:bg-[#181b24] p-3 rounded-xl border border-[#e6e8ea] dark:border-[#2a2e39]/80 space-y-2">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                {isEn ? 'Core Concepts (Knowledge Base):' : 'Khái niệm trọng tâm (Knowledge Base):'}
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Fair Value Gap (FVG)', concept: 'Fair Value Gap', framework: 'ICT' },
                  { label: 'Liquidity Pools (BSL/SSL)', concept: 'Liquidity', framework: 'ICT' },
                  { label: 'Market Structure (HH/HL)', concept: 'Market Structure', framework: 'PRICE_ACTION' },
                  { label: 'Order Block & Breaker', concept: 'Order Block', framework: 'ICT' },
                  { label: isEn ? '1%-2% Risk Management' : 'Quản trị rủi ro 1%-2%', concept: 'Position Size', framework: 'RISK_MANAGEMENT' },
                  { label: isEn ? 'FOMO & Revenge Trading' : 'FOMO & Giao dịch trả thù', concept: 'Trading Psychology', framework: 'PSYCHOLOGY' }
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={() => handleExplainConcept(item.concept, item.framework)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1e222d] hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] border border-[#e6e8ea] dark:border-[#2a2e39] hover:border-amber-500/50 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-300 text-xs font-medium shadow-xs transition-all"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="space-y-5 pt-2">
              {messages.map((msg, idx) => {
                const isLastUserMsg = msg.sender === 'user' && idx >= messages.length - 2;
                return (
                  <div 
                    key={msg.id}
                    ref={isLastUserMsg ? lastUserMsgRef : null}
                    className="space-y-1.5 scroll-mt-3"
                  >
                  {msg.sender === 'user' ? (
                    /* USER MESSAGE */
                    <div className="flex items-end justify-end gap-2 pl-8">
                      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-medium px-3.5 py-2 rounded-2xl rounded-tr-sm shadow-sm text-[13px] leading-relaxed">
                        {msg.imageUrl && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-black/15 shadow-sm max-w-xs">
                            <img
                              src={msg.imageUrl}
                              alt="Chart Snapshot"
                              className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(msg.imageUrl, '_blank')}
                              title="Bấm để mở ảnh kích thước đầy đủ trong tab mới"
                            />
                          </div>
                        )}
                        {msg.text}
                      </div>
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mb-0.5">
                        <User className="w-3 h-3" />
                      </div>
                    </div>
                  ) : (
                    /* AI TUTOR MESSAGE CARD */
                    <div className="flex items-start gap-2.5 pr-1">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500/20 via-blue-500/20 to-purple-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 bg-white dark:bg-[#181d2a]/95 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-[#2b3347]/70 rounded-2xl rounded-tl-sm shadow-sm p-3.5 space-y-2">
                        {/* Header: Title, Model Badge, Copy Action */}
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-[#252c3f]/70">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-bold text-amber-600 dark:text-amber-300 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                              AI Tutor
                            </span>
                            {msg.data?.provider === 'gemini' ? (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[9px] font-mono text-blue-600 dark:text-blue-400 flex items-center gap-1 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
                                {msg.imageUrl ? 'Gemini Vision' : 'Gemini VIP'}
                              </span>
                            ) : (msg.data?.provider === 'openai' || msg.data?.framework === 'VIP_LLM' || (!msg.data?.provider && (!msg.text || !msg.text.includes('Không nhận được')))) ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                                OpenAI GPT-4o
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[9px] font-mono text-amber-600 dark:text-amber-400 flex items-center gap-1 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                                Knowledge Base
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleCopy(msg.id, msg.text)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#202738] hover:bg-slate-200 dark:hover:bg-[#2a334a] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#374158] text-[10px] transition-colors shadow-2xs"
                            title={isEn ? "Copy content" : "Sao chép nội dung"}
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{isEn ? 'Copied' : 'Đã chép'}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>{isEn ? 'Copy' : 'Sao chép'}</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Guardrail alert if user asked for buy/sell */}
                        {msg.data?.guardrailTriggered === 'NO_BUY_SELL_SIGNAL' && (
                          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-amber-800 dark:text-amber-300 text-xs">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                            <div>
                              <strong className="text-amber-900 dark:text-amber-200">{isEn ? 'Notice:' : 'Lưu ý:'}</strong> {isEn ? 'AI acts as an Educational & Independent Analysis Assistant and does not provide direct buy/sell signals.' : 'AI đóng vai trò Trợ lý Giáo dục & Phân tích Độc lập, không đưa ra tín hiệu Buy/Sell hay phím lệnh.'}
                            </div>
                          </div>
                        )}

                        {/* Rendered Formatted Content */}
                        <div className="relative">
                          {renderFormattedText(msg.text)}
                          {isStreaming && idx === messages.length - 1 && msg.sender === 'tutor' && (
                            <span className="inline-block w-2 h-4 ml-1 bg-amber-500 animate-pulse align-middle rounded-[1px]" />
                          )}
                        </div>

                        {/* Quota Exceeded Guardrail Callout */}
                        {(msg.data?.guardrailTriggered === 'QUOTA_EXCEEDED' || msg.text?.includes('QUOTA_EXCEEDED') || msg.text?.includes('lượt tương tác AI miễn phí')) && (
                          <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-amber-500/15 border border-amber-500/40 text-center space-y-2">
                            <div className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1.5">
                              <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                              <span>{isEn ? 'Unlock 500 AI queries / day with PRO package' : 'Mở khóa 500 lượt hỏi AI / ngày với gói PRO'}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300">
                              {isEn 
                                ? 'Activate Senior Prop Firm AI Tutor • Portfolio Risk Measurement • Instant PayOS QR activation' 
                                : 'Kích hoạt Senior Prop Firm AI Tutor • Đo lường rủi ro quỹ • Quét mã QR PayOS kích hoạt ngay'}
                            </p>
                            <button
                              onClick={() => setIsUpgradeModalOpen(true)}
                              className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 mx-auto cursor-pointer hover:scale-[1.02]"
                            >
                              <Crown className="w-3.5 h-3.5" />
                              <span>{isEn ? 'Upgrade PRO Now (99,000₫ / 30 days)' : 'Nâng cấp PRO ngay (99.000₫ / 30 ngày)'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Verified Sources (Compact) */}
                        {msg.data?.sources && msg.data.sources.length > 0 && (
                          <div className="pt-2 border-t border-slate-200 dark:border-[#252c3f]/60 space-y-1.5">
                            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                              {isEn ? 'Verified Reference Sources:' : 'Tài liệu đối chiếu:'}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.data.sources.map((src, i) => (
                                <span 
                                  key={i}
                                  className="px-2 py-0.5 rounded bg-slate-50 dark:bg-[#202738] border border-slate-200 dark:border-[#2b3347] text-[11px] text-slate-700 dark:text-slate-200 flex items-center gap-1 shadow-2xs"
                                >
                                  <span className="text-amber-600 dark:text-amber-300 font-medium">{src.title}</span>
                                  <span className="text-slate-400 dark:text-slate-500">•</span>
                                  <span className="text-slate-600 dark:text-slate-300">{src.author}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

              {/* Dynamic Waiting Status Indicator UX (Giây 1-3, 4-7, 8+) */}
              {loading && (
                <div className="flex items-start gap-2.5 transition-all duration-300">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/20 to-blue-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
                  </div>
                  <div className="p-3.5 rounded-2xl rounded-tl-sm bg-[#f8f9fc] dark:bg-[#181d2a] border border-[#e2e8f0] dark:border-[#2b3347] space-y-2 text-slate-700 dark:text-slate-300 text-xs shadow-sm max-w-[88%]">
                    <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                      <span className="text-base select-none">{getDynamicLoadingStatus(loadingSeconds).icon}</span>
                      <span className="text-[12.5px] text-amber-600 dark:text-amber-400 font-medium">
                        {getDynamicLoadingStatus(loadingSeconds).text}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono ml-auto">
                        {loadingSeconds}s
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {getDynamicLoadingStatus(loadingSeconds).subtext}
                    </p>
                    {/* Visual stage dots */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <div className={`h-1.5 rounded-full transition-all duration-300 ${loadingSeconds >= 1 ? 'w-6 bg-amber-500 shadow-xs shadow-amber-500/50' : 'w-2 bg-slate-200 dark:bg-slate-700'}`} />
                      <div className={`h-1.5 rounded-full transition-all duration-300 ${loadingSeconds >= 4 ? 'w-6 bg-amber-500 shadow-xs shadow-amber-500/50' : 'w-2 bg-slate-200 dark:bg-slate-700'}`} />
                      <div className={`h-1.5 rounded-full transition-all duration-300 ${loadingSeconds >= 8 ? 'w-6 bg-amber-500 shadow-xs shadow-amber-500/50' : 'w-2 bg-slate-200 dark:bg-slate-700'}`} />
                      <span className="text-[10px] text-slate-400 ml-1">
                        {isEn ? `Stage ${loadingSeconds <= 3 ? '1/3' : loadingSeconds <= 7 ? '2/3' : '3/3'}` : (loadingSeconds <= 3 ? 'Giai đoạn 1/3' : loadingSeconds <= 7 ? 'Giai đoạn 2/3' : 'Giai đoạn 3/3')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: AI CHART DRAWINGS DIRECT DATA INSPECTION */}
        {activeTab === 'inspect' && (
          <div className="space-y-4">
            {/* Header Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-blue-500/10 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {isEn ? 'AI Direct Chart Drawing Evaluation' : 'AI Chấm Bài Vùng Vẽ Trực Tiếp'}
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        SMC & ICT DATA PRO
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isEn
                        ? 'Automatically extracts coordinates of boxes and lines drawn on your chart for AI analysis without screenshots'
                        : 'Tự động trích xuất tọa độ vùng hộp, đường kẻ bạn vẽ trên biểu đồ để AI phân tích mà không cần chụp ảnh'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleScanDrawings}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1f2430] hover:bg-slate-200 dark:hover:bg-[#2b3347] text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  title={isEn ? 'Rescan latest drawings on chart' : 'Quét lại hình vẽ mới nhất trên biểu đồ'}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Rescan' : 'Quét lại hình'}</span>
                </button>
              </div>

              {/* Evaluation Quota Strip */}
              <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400">
                    {isEn ? 'Evaluation Quota:' : 'Hạn mức Chấm Bài:'}
                  </span>
                  {subscription?.plan === 'PRO' ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold font-mono">
                      {isEn ? 'PRO VIP: Unlimited' : 'PRO VIP: Không giới hạn'}
                    </span>
                  ) : subscription?.plan === 'PLUS' || subscription?.plan === 'PREMIUM' ? (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold font-mono">
                      {isEn ? `PLUS: ${subscription?.remainingInspect ?? 150}/150 month` : `PLUS: ${subscription?.remainingInspect ?? 150}/150 tháng`}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-[#202533] text-slate-700 dark:text-slate-300 font-semibold font-mono">
                      {isEn ? `Free: ${subscription?.remainingInspect ?? 1}/1 day` : `Free: ${subscription?.remainingInspect ?? 1}/1 lượt/ngày`}
                    </span>
                  )}
                </div>
                {!subscription?.isPremium && (
                  <button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Crown className="w-3 h-3" />
                    <span>{isEn ? 'Upgrade to 20/day' : 'Nâng cấp 20 lượt/ngày'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Error Message */}
            {inspectError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{inspectError}</span>
                  {(inspectError.includes('hạn mức') || inspectError.includes('lượt') || inspectError.toLowerCase().includes('quota') || inspectError.toLowerCase().includes('upgrade')) && (
                    <button
                      onClick={() => setIsUpgradeModalOpen(true)}
                      className="block mt-1 font-bold underline cursor-pointer text-amber-600 dark:text-amber-400"
                    >
                      {isEn ? 'Upgrade to PRO now →' : 'Nâng cấp gói PRO ngay →'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* CASE 1: No drawings found on chart */}
            {detectedDrawings.length === 0 && !inspectResult && !inspectLoading && (
              <div className="p-5 rounded-xl bg-white dark:bg-[#181d2a] border border-dashed border-slate-300 dark:border-[#2b3347] text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                  <PenTool className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {isEn ? 'No drawings detected on chart' : 'Chưa phát hiện vùng vẽ nào trên biểu đồ'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    {isEn
                      ? 'Use the drawing toolbar on the left of the chart to outline your analysis zone. AI will automatically read coordinates to evaluate:'
                      : 'Hãy dùng thanh công cụ vẽ bên trái biểu đồ để vẽ vùng phân tích của bạn, sau đó AI sẽ tự động đọc tọa độ để chấm điểm:'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#131722] border border-slate-200 dark:border-[#202636] text-left text-xs space-y-2 max-w-sm mx-auto">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {isEn ? (
                        <>Select the <strong>Rectangle</strong> or <strong>Trend Line</strong> tool from the left drawing toolbar.</>
                      ) : (
                        <>Chọn công cụ <strong>Hộp chữ nhật (Rectangle)</strong> hoặc <strong>Đường kẻ (Line)</strong> ở thanh công cụ vẽ bên trái biểu đồ.</>
                      )}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {isEn ? (
                        <>Mark the candle zone you identify as an <strong>Order Block (OB)</strong>, <strong>Fair Value Gap (FVG)</strong>, or <strong>Supply/Demand zone</strong>.</>
                      ) : (
                        <>Khoanh vùng nến bạn xác định là <strong>Order Block (OB)</strong>, <strong>Fair Value Gap (FVG)</strong> hoặc <strong>Vùng Cung/Cầu</strong>.</>
                      )}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {isEn ? (
                        <>Click <strong>"Rescan drawings"</strong> for AI to load coordinates and evaluate instantly!</>
                      ) : (
                        <>Bấm nút <strong>"Quét lại hình vẽ"</strong> để AI nạp dữ liệu tọa độ và chấm bài ngay lập tức!</>
                      )}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleScanDrawings}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Rescan drawings on chart' : 'Quét lại hình vẽ trên biểu đồ'}</span>
                </button>
              </div>
            )}

            {/* CASE 2: Drawings found on chart -> show data & ready to inspect */}
            {detectedDrawings.length > 0 && !inspectResult && (
              <div className="p-4 rounded-xl bg-white dark:bg-[#181d2a] border border-slate-200 dark:border-[#2b3347] space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#2b3347]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {isEn
                        ? `Detected ${detectedDrawings.length} drawing(s) on ${activeSymbol} (${timeframe}):`
                        : `Đã phát hiện ${detectedDrawings.length} vùng vẽ trên ${activeSymbol} (${timeframe}):`}
                    </span>
                  </div>
                  <button
                    onClick={handleScanDrawings}
                    className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {isEn ? 'Update' : 'Cập nhật'}
                  </button>
                </div>

                {/* List detected drawing data items */}
                <div className="space-y-2.5">
                  {detectedDrawings.map((d, idx) => {
                    const tagColors: Record<string, string> = {
                      OB: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
                      FVG: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
                      BOS: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
                      CHOCH: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
                      LIQUIDITY: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
                      CUSTOM: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                    };
                    const badgeClass = tagColors[d.tag || ''] || 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';

                    return (
                      <div
                        key={d.id || idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-[#131722] border border-slate-200 dark:border-[#232938] hover:border-amber-500/40 transition-all flex flex-col gap-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-amber-500/20">
                              #{idx + 1}
                            </div>
                            <div className="truncate flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {d.label || (d.name === 'rect' ? (isEn ? 'Price Zone (Rectangle)' : 'Hộp Vùng Giá (Rectangle)') : d.name)}
                              </span>
                              {d.tag && (
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${badgeClass}`}>
                                  {d.tag}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 font-semibold border border-emerald-500/20">
                            {isEn ? 'Ready to evaluate' : 'Sẵn sàng chấm'}
                          </span>
                        </div>

                        {/* Price Details */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono px-0.5">
                          <span>
                            {d.priceLow !== undefined && d.priceHigh !== undefined
                              ? `$${d.priceLow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 })} → $${d.priceHigh.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}`
                              : `${d.points?.length || 0} ${isEn ? 'points' : 'điểm neo'}`}
                          </span>
                          {d.rangeAmount !== undefined && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {isEn ? 'Range:' : 'Biên độ:'} {d.rangeAmount >= 1 ? d.rangeAmount.toLocaleString('en-US', { maximumFractionDigits: 2 }) : d.rangeAmount.toFixed(4)}
                            </span>
                          )}
                        </div>

                        {/* Quick SMC Tag Pill Selection */}
                        <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-200/60 dark:border-[#1e2330] overflow-x-auto pb-0.5">
                          <span className="text-[10px] font-medium text-slate-400 shrink-0">
                            {isEn ? 'SMC Tag:' : 'Ký hiệu:'}
                          </span>
                          {(['OB', 'FVG', 'BOS', 'LIQUIDITY'] as const).map(tTag => (
                            <button
                              key={tTag}
                              type="button"
                              onClick={() => handleTagDrawing(idx, tTag)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer border ${
                                d.tag === tTag
                                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                                  : 'bg-white dark:bg-[#1a1f2e] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#2b3347] hover:border-amber-400 hover:text-amber-500'
                              }`}
                            >
                              {tTag === 'OB' ? 'Order Block' : tTag === 'FVG' ? 'Fair Value Gap' : tTag === 'BOS' ? 'BOS Cấu Trúc' : 'Thanh Khoản'}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* User Notes Input */}
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {isEn ? 'Your rationale / trading thesis (Optional):' : 'Luận điểm / Nhận định của bạn (Tùy chọn):'}
                  </label>
                  <textarea
                    value={inspectNotes}
                    onChange={(e) => setInspectNotes(e.target.value)}
                    placeholder={
                      isEn
                        ? 'e.g., I marked a Bearish Order Block at the last up-candle before strong displacement drop. Planning to Sell on retest...'
                        : 'Ví dụ: Tôi vừa vẽ Bearish Order Block ở cây nến tăng cuối cùng trước khi có nhịp sập mạnh. Tôi định Sell khi giá hồi về test...'
                    }
                    rows={2}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-[#131722] border border-slate-300 dark:border-[#2b3347] text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 resize-none"
                  />
                </div>

                {/* Submit Action */}
                <button
                  onClick={handleInspectDrawings}
                  disabled={inspectLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:from-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${inspectLoading ? 'animate-spin' : ''}`} />
                  <span>
                    {inspectLoading
                      ? (isEn ? 'AI is comparing candle data...' : 'AI đang đối chiếu dữ liệu nến...')
                      : (isEn ? '🚀 Submit for AI Analysis & Grading' : '🚀 Gửi AI Phân Tích & Chấm Điểm Bài Vẽ')}
                  </span>
                </button>
              </div>
            )}

            {/* Loading Indicator */}
            {inspectLoading && (
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center space-y-2.5 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {isEn
                    ? 'AI is comparing drawing coordinates against OHLCV candlestick structure...'
                    : 'AI đang đối chiếu dữ liệu tọa độ hình vẽ với cấu trúc nến OHLCV...'}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isEn
                    ? 'Detecting Displacement moves, FVG / Imbalance gaps, and Smart Money liquidity sweeps...'
                    : 'Xác định nhịp Displacement, cấu trúc FVG / Imbalance và bẫy thanh khoản Smart Money Trap...'}
                </p>
              </div>
            )}

            {/* Inspection Result Presentation */}
            {inspectResult && !inspectLoading && (
              <div className="p-4 rounded-xl bg-white dark:bg-[#181d2a] border border-amber-500/30 shadow-sm space-y-4">
                {/* Result Header: Score & Verdict */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#2b3347]">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                      inspectResult.verdict === 'CORRECT' 
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                        : inspectResult.verdict === 'PARTIALLY_CORRECT'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    }`}>
                      {inspectResult.verdict === 'CORRECT' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {inspectResult.verdict === 'PARTIALLY_CORRECT' && <AlertTriangle className="w-3.5 h-3.5" />}
                      {inspectResult.verdict === 'INCORRECT' && <X className="w-3.5 h-3.5" />}
                      <span>
                        {inspectResult.verdict === 'CORRECT' 
                          ? (isEn ? 'THEORETICALLY ACCURATE' : 'VẼ ĐÚNG LÝ THUYẾT')
                          : inspectResult.verdict === 'PARTIALLY_CORRECT'
                          ? (isEn ? 'PARTIALLY ACCURATE / REVIEW NEEDED' : 'ĐÚNG MỘT PHẦN / CẦN LƯU Ý')
                          : (isEn ? 'INCORRECT' : 'CHƯA ĐÚNG')}
                      </span>
                    </span>
                    {inspectResult.provider === 'gemini' ? (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[9px] font-mono text-blue-600 dark:text-blue-400 flex items-center gap-1 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
                        Gemini Vision
                      </span>
                    ) : inspectResult.provider === 'openai' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                        OpenAI GPT-4o
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-[9px] font-mono text-purple-600 dark:text-purple-400 flex items-center gap-1 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400" />
                        Rule Engine
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{isEn ? 'Score:' : 'Điểm:'}</span>
                    <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-400">
                      {inspectResult.score}/100
                    </span>
                  </div>
                </div>

                {/* AI Suggested Zone & Direct Auto-Draw onto Chart */}
                {inspectResult.suggestedZone && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/35 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {isEn ? 'AI Optimal Correction Zone:' : 'AI Đề Xuất Vùng Vẽ Chuẩn Xác Nhất:'}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px] border border-amber-500/30 shrink-0">
                        {inspectResult.suggestedZone.type || 'Order Block (OB)'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white/70 dark:bg-[#161a22]/70 border border-slate-200/80 dark:border-[#2b3347] space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {inspectResult.suggestedZone.name || (isEn ? 'Optimal Swing Order Block' : 'Vùng Order Block Chuẩn Xác')}
                        </span>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          ${inspectResult.suggestedZone.priceLow?.toLocaleString('en-US')} — ${inspectResult.suggestedZone.priceHigh?.toLocaleString('en-US')}
                        </span>
                      </div>
                      {inspectResult.suggestedZone.explanation && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                          {inspectResult.suggestedZone.explanation}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleApplyAiCorrection}
                      disabled={hasDrawnCorrection}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        hasDrawnCorrection
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                          : 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 shadow-xs'
                      }`}
                    >
                      {hasDrawnCorrection ? (
                        <>
                          <CheckCheck className="w-4 h-4" />
                          <span>
                            {isEn 
                              ? `✓ Plotted "${inspectResult.suggestedZone.type || 'Optimal Zone'}" on chart!` 
                              : `✓ Đã vẽ "${inspectResult.suggestedZone.name || inspectResult.suggestedZone.type || 'Vùng Chuẩn'}" lên biểu đồ!`}
                          </span>
                        </>
                      ) : (
                        <>
                          <PenTool className="w-3.5 h-3.5" />
                          <span>
                            {isEn 
                              ? `🎯 Plot "${inspectResult.suggestedZone.type || 'Optimal Zone'}" onto chart` 
                              : `🎯 Tự động vẽ "${inspectResult.suggestedZone.name || inspectResult.suggestedZone.type || 'Vùng Chuẩn'}" lên biểu đồ`}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Formatted Markdown Analysis */}
                <div className="text-slate-800 dark:text-slate-100 text-xs leading-relaxed space-y-2">
                  {renderFormattedText(inspectResult.analysis)}
                </div>

                {/* Action button to test again */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setInspectResult(null);
                      setHasDrawnCorrection(false);
                      clearAiCorrectionOverlay();
                      handleScanDrawings();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1f2430] hover:bg-slate-200 dark:hover:bg-[#2b3347] text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    {isEn ? 'Evaluate another drawing →' : 'Chấm bài vẽ khác →'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STRATEGY COMPARISON */}
        {activeTab === 'compare' && (
          <div className="space-y-4">
            {/* Exchange & Symbol Selector Card (Redesigned) */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#181b24] border border-[#e2e8f0] dark:border-[#2a2e39] shadow-sm space-y-3">
              {/* Header Row: Title & Real-time Price Badge */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Scale className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                    {isEn ? 'Select Asset for Strategy Comparison:' : 'Chọn Cặp Coin / Cổ phiếu Phân Tích:'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{isEn ? 'Live Price:' : 'Giá Sàn:'}</span>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ${activePrice >= 100 ? activePrice.toLocaleString('en-US') : activePrice.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Controls Row: Full-width Dropdown + Distinct Action Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <select
                    value={activeSymbol}
                    onChange={(e) => {
                      const sym = e.target.value;
                      setActiveSymbol(sym);
                      const s = STOCKS.find(item => item.symbol === sym);
                      if (s) {
                        const newPrice = (sym === currentSymbol && currentPrice) ? currentPrice : s.price;
                        setActivePrice(newPrice);
                        handleRunComparison(sym, newPrice);
                      }
                    }}
                    className="w-full bg-[#f8f9fc] dark:bg-[#1e222d] border border-slate-300 dark:border-[#2f3545] hover:border-amber-400 dark:hover:border-amber-500/60 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-white cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all pr-8"
                  >
                    {STOCKS.map(s => {
                      const marketLabel = isEn
                        ? (s.market.includes('Tiền điện tử') || s.market.toLowerCase().includes('crypto')
                            ? 'Crypto'
                            : s.market === 'Cổ phiếu'
                            ? 'Stocks'
                            : s.market.includes('Ngoại hối') || s.market.toLowerCase().includes('forex')
                            ? 'Forex'
                            : s.market.includes('Hàng hóa') || s.market.toLowerCase().includes('commodit')
                            ? 'Commodities'
                            : s.market.includes('Chỉ số') || s.market.toLowerCase().includes('indice')
                            ? 'Indices'
                            : s.market)
                        : s.market;
                      return (
                        <option key={s.symbol} value={s.symbol}>
                          {s.symbol} — {s.exchange} ({marketLabel})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <button
                  onClick={() => handleRunComparison()}
                  disabled={compareLoading}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                  title={isEn ? 'Send latest market price data for AI to compare Price Action vs ICT strategies' : 'Gửi dữ liệu giá thị trường mới nhất để AI đối chiếu lại chiến lược Price Action vs ICT'}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${compareLoading ? 'animate-spin' : ''}`} />
                  <span>
                    {compareLoading 
                      ? (isEn ? 'Analyzing...' : 'Đang phân tích...') 
                      : (isEn ? 'Re-analyze' : 'Phân tích lại')}
                  </span>
                </button>
              </div>

              {/* Helper Micro-copy */}
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-0.5">
                {isEn
                  ? '💡 AI scans current market prices to benchmark: Support & Demand zones (Price Action) vs Order Blocks / FVG (ICT/SMC).'
                  : '💡 AI sẽ quét giá thị trường hiện tại để đối chiếu song song: vùng cản Cung-Cầu (Price Action) vs Khối Order Block / FVG (ICT/SMC).'}
              </p>
            </div>

            {/* Loading Indicator */}
            {compareLoading && (
              <div className="p-8 rounded-xl bg-[#f8f9fa] dark:bg-[#181b24] border border-[#e6e8ea] dark:border-[#2a2e39] flex flex-col items-center justify-center space-y-3 text-center">
                <Sparkles className="w-8 h-8 text-amber-500 animate-spin" />
                <p className="text-xs font-semibold text-[#1e2329] dark:text-white">
                  {isEn
                    ? `AI is multi-dimensionally comparing Price Action vs ICT for ${activeSymbol}...`
                    : `AI đang đối chiếu đa chiều Price Action vs ICT cho ${activeSymbol}...`}
                </p>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isEn
                    ? 'Calculating key levels, liquidity sweeps, and optimizing Risk:Reward ratio...'
                    : 'Đang tính toán vùng cản, điểm quét thanh khoản và tối ưu tỷ lệ Risk:Reward...'}
                </span>
              </div>
            )}

            {/* Error Message */}
            {compareError && !compareLoading && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
                <span>{compareError}</span>
                <button 
                  onClick={() => handleRunComparison()}
                  className="px-2.5 py-1 rounded bg-red-500 text-white font-semibold text-xs cursor-pointer"
                >
                  {isEn ? 'Retry' : 'Thử lại'}
                </button>
              </div>
            )}

            {/* Compare Content */}
            {!compareLoading && compareData && (
              <div className="space-y-4">
                {/* Section 1: Framework Perspectives */}
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-[#1e2329] dark:text-white flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-blue-500" />
                      {isEn ? '1. Technical Analysis Perspectives (Dual Perspective)' : '1. Góc Nhìn Phân Tích Kỹ Thuật (Dual Perspective)'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {isEn ? `Pair: ${compareData.symbol} • Side: ${compareData.side}` : `Cặp: ${compareData.symbol} • Vị thế: ${compareData.side}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {/* Price Action Card */}
                    <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {compareData.priceAction.frameworkName}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-mono font-semibold">
                            {isEn ? 'Classical & Trend' : 'Cổ điển & Theo Trend'}
                          </span>
                        </div>
                        <p className="text-[#1e2329] dark:text-slate-300 leading-relaxed text-xs">
                          {compareData.priceAction.setupInterpretation}
                        </p>
                      </div>

                      <div className="pt-2 text-[11px] text-slate-600 dark:text-slate-400 border-t border-blue-500/10 space-y-1">
                        <div>🛑 <strong>Stop Loss:</strong> {compareData.priceAction.stopLossPlacement}</div>
                        <div>🎯 <strong>Take Profit:</strong> {compareData.priceAction.takeProfitTarget}</div>
                        {compareData.priceAction.evidenceRequired && (
                          <div className="text-[10px] text-blue-600/80 dark:text-blue-400/80 pt-0.5">
                            🔎 <em>{isEn ? 'Confirmation:' : 'Xác nhận:'}</em> {compareData.priceAction.evidenceRequired}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ICT Card */}
                    <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {compareData.ict.frameworkName}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono font-semibold">
                            {isEn ? 'Smart Money (SMC)' : 'Dòng tiền Thông minh (SMC)'}
                          </span>
                        </div>
                        <p className="text-[#1e2329] dark:text-slate-300 leading-relaxed text-xs">
                          {compareData.ict.setupInterpretation}
                        </p>
                      </div>

                      <div className="pt-2 text-[11px] text-slate-600 dark:text-slate-400 border-t border-amber-500/10 space-y-1">
                        <div>🛑 <strong>Stop Loss:</strong> {compareData.ict.stopLossPlacement}</div>
                        <div>🎯 <strong>Take Profit:</strong> {compareData.ict.takeProfitTarget}</div>
                        {compareData.ict.evidenceRequired && (
                          <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80 pt-0.5">
                            🔎 <em>{isEn ? 'Confirmation:' : 'Xác nhận:'}</em> {compareData.ict.evidenceRequired}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Simulated Numerical Setups Comparison */}
                {compareData.simulatedSetups && (
                  <div className="space-y-2.5">
                    <div className="text-xs font-bold text-[#1e2329] dark:text-white flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-emerald-500" />
                        {isEn ? '2. Simulated Numerical Trade Setups' : '2. Mô Phỏng Thiết Lập Lệnh Số Học (Simulated Setups)'}
                      </span>
                      <span className="text-[10px] text-emerald-500 font-mono font-semibold">
                        {isEn ? 'Ref Price:' : 'Giá tham chiếu:'} ${compareData.entryPrice < 100 ? compareData.entryPrice.toFixed(2) : compareData.entryPrice.toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {/* Price Action Setup */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#181b24] border border-blue-500/20 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-500 flex items-center gap-1">
                            📊 {compareData.simulatedSetups.priceAction.framework}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            R:R {compareData.simulatedSetups.priceAction.rr}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          <div className="p-1.5 rounded-lg bg-white dark:bg-[#1e222d] border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 block">{isEn ? 'Entry' : 'Entry (Vào)'}</span>
                            <span className="text-xs font-mono font-bold text-[#1e2329] dark:text-white">
                              {compareData.simulatedSetups.priceAction.entry}
                            </span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-red-500/5 border border-red-500/20">
                            <span className="text-[10px] text-red-500 block">Stop Loss</span>
                            <span className="text-xs font-mono font-bold text-red-500">
                              {compareData.simulatedSetups.priceAction.stopLoss}
                            </span>
                            <span className="text-[9px] text-red-400 block font-mono">
                              -{compareData.simulatedSetups.priceAction.riskPct}%
                            </span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                            <span className="text-[10px] text-emerald-500 block">Take Profit</span>
                            <span className="text-xs font-mono font-bold text-emerald-500">
                              {compareData.simulatedSetups.priceAction.takeProfit}
                            </span>
                            <span className="text-[9px] text-emerald-400 block font-mono">
                              +{compareData.simulatedSetups.priceAction.rewardPct}%
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-400 italic bg-blue-500/5 p-2 rounded-lg">
                          💬 {compareData.simulatedSetups.priceAction.rationale}
                        </p>
                      </div>

                      {/* ICT Setup */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#181b24] border border-amber-500/20 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                            ⚡ {compareData.simulatedSetups.ict.framework}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            R:R {compareData.simulatedSetups.ict.rr} {isEn ? '(Optimized)' : '(Tối ưu)'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          <div className="p-1.5 rounded-lg bg-white dark:bg-[#1e222d] border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Sniper Entry</span>
                            <span className="text-xs font-mono font-bold text-amber-500">
                              {compareData.simulatedSetups.ict.entry}
                            </span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-red-500/5 border border-red-500/20">
                            <span className="text-[10px] text-red-500 block">{isEn ? 'Stop Loss (Tight)' : 'Stop Loss (Chặt)'}</span>
                            <span className="text-xs font-mono font-bold text-red-500">
                              {compareData.simulatedSetups.ict.stopLoss}
                            </span>
                            <span className="text-[9px] text-red-400 block font-mono">
                              -{compareData.simulatedSetups.ict.riskPct}%
                            </span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                            <span className="text-[10px] text-emerald-500 block">Take Profit (BSL)</span>
                            <span className="text-xs font-mono font-bold text-emerald-500">
                              {compareData.simulatedSetups.ict.takeProfit}
                            </span>
                            <span className="text-[9px] text-emerald-400 block font-mono">
                              +{compareData.simulatedSetups.ict.rewardPct}%
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-400 italic bg-amber-500/5 p-2 rounded-lg">
                          💬 {compareData.simulatedSetups.ict.rationale}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 3: Metric Comparison Matrix */}
                {compareData.metricMatrix && compareData.metricMatrix.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-[#1e2329] dark:text-white flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-500" />
                      {isEn ? '3. Technical Metric Comparison Matrix' : '3. Ma Trận So Sánh Chỉ Số Kỹ Thuật (Metric Matrix)'}
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-[#e6e8ea] dark:border-[#2a2e39] bg-white dark:bg-[#181b24]">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-[#1e222d] border-b border-[#e6e8ea] dark:border-[#2a2e39] text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            <th className="py-2 px-3">{isEn ? 'Criterion' : 'Tiêu chí'}</th>
                            <th className="py-2 px-3 text-blue-600 dark:text-blue-400">Price Action</th>
                            <th className="py-2 px-3 text-amber-600 dark:text-amber-400">ICT / SMC</th>
                            <th className="py-2 px-2.5 text-center">{isEn ? 'Characteristic' : 'Đặc tính'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6e8ea] dark:divide-[#2a2e39] text-[11px]">
                          {compareData.metricMatrix.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-500/5 transition-colors">
                              <td className="py-2 px-3 font-semibold text-[#1e2329] dark:text-slate-200">
                                {item.criterion}
                              </td>
                              <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                                {item.priceAction}
                              </td>
                              <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                                {item.ict}
                              </td>
                              <td className="py-2 px-2.5 text-center">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase whitespace-nowrap ${
                                  item.badge.includes('ICT') 
                                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                                    : item.badge.includes('PA')
                                    ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30'
                                    : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                }`}>
                                  {item.badge}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Section 4: Market Regime Advisory */}
                {compareData.marketRegimeAdvisory && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 border border-indigo-500/20 space-y-2.5">
                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {isEn ? '4. Market Regime Application Advisory' : '4. Lời Khuyên Ứng Dụng Theo Trạng Thái Thị Trường (Market Regime)'}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/15 space-y-1">
                        <span className="font-bold text-blue-600 dark:text-blue-400 block">
                          {isEn ? '📈 TRENDING Market:' : '📈 Thị trường SÓNG MẠNH (Trending):'}
                        </span>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {compareData.marketRegimeAdvisory.trending}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15 space-y-1">
                        <span className="font-bold text-amber-600 dark:text-amber-400 block">
                          {isEn ? '🔄 RANGING & Chop Market:' : '🔄 Thị trường ĐI NGANG & BẪY GIÁ (Ranging):'}
                        </span>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {compareData.marketRegimeAdvisory.ranging}
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-[11px] space-y-1">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        {isEn ? '⚡ Professional Hybrid Synergy:' : '⚡ Công thức Kết hợp Chuyên nghiệp (Hybrid Synergy):'}
                      </span>
                      <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                        {compareData.marketRegimeAdvisory.recommendation}
                      </p>
                    </div>
                  </div>
                )}

                {/* Section 5: Similarities & Differences */}
                <div className="p-3.5 rounded-xl bg-[#f8f9fa] dark:bg-[#181b24] border border-[#e6e8ea] dark:border-[#2a2e39] space-y-2.5">
                  <div className="font-bold text-[#1e2329] dark:text-white text-xs flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-slate-400" />
                    {isEn ? '5. Core Similarities & Contrasting Viewpoints:' : '5. Điểm Tương Đồng & Khác Biệt Cốt Lõi:'}
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="text-emerald-600 dark:text-emerald-400 font-semibold">{isEn ? 'Similarities:' : 'Tương đồng:'}</div>
                    {compareData.similarities.map((s, i) => (
                      <div key={i} className="text-slate-600 dark:text-slate-300 pl-2 border-l border-emerald-500/30">• {s}</div>
                    ))}
                  </div>
                  <div className="space-y-1 text-[11px] pt-1">
                    <div className="text-amber-600 dark:text-amber-400 font-semibold">{isEn ? 'Contrasting viewpoints:' : 'Khác biệt góc nhìn:'}</div>
                    {compareData.differences.map((d, i) => (
                      <div key={i} className="text-slate-600 dark:text-slate-300 pl-2 border-l border-amber-500/30">• {d}</div>
                    ))}
                  </div>
                </div>

                {/* Section 6: Verified Sources & YouTube Video Lectures */}
                {compareData.sources && compareData.sources.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-[#f8f9fa] dark:bg-[#181b24] border border-[#e6e8ea] dark:border-[#2a2e39] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-[#1e2329] dark:text-white flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                        {isEn ? '6. Verified Citations & Original Video Lectures' : '6. Tài Liệu Đối Chiếu & Video Bài Giảng Gốc (Verified Citations)'}
                      </div>
                      <span className="text-[10px] text-cyan-500 font-mono">
                        Academic Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {compareData.sources.map((s, idx) => {
                        const hasLink = s.sourceUrl && s.sourceUrl !== '#' && s.sourceUrl.startsWith('http');
                        const isYouTube = hasLink && (s.sourceUrl.includes('youtube.com') || s.sourceUrl.includes('youtu.be'));
                        return (
                          <a
                            key={idx}
                            href={hasLink ? s.sourceUrl : undefined}
                            target={hasLink ? '_blank' : undefined}
                            rel={hasLink ? 'noopener noreferrer' : undefined}
                            className={`flex items-center justify-between gap-2 p-2 rounded-lg border text-xs transition-all group ${
                              hasLink
                                ? isYouTube
                                  ? 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/25 hover:border-rose-500/50 text-slate-800 dark:text-slate-200'
                                  : 'bg-cyan-500/5 hover:bg-cyan-500/10 border-cyan-500/25 hover:border-cyan-500/50 text-slate-800 dark:text-slate-200'
                                : 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 text-slate-500'
                            }`}
                            title={
                              isYouTube 
                                ? (isEn ? `Watch video lecture directly on YouTube: ${s.source}` : `Xem video bài giảng trực tiếp trên YouTube: ${s.source}`)
                                : (isEn ? `Original reference: ${s.source}` : `Tài liệu gốc: ${s.source}`)
                            }
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {isYouTube ? (
                                <PlayCircle className="w-4 h-4 text-rose-500 shrink-0 group-hover:scale-110 transition-transform" />
                              ) : (
                                <BookOpen className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <span className="font-semibold truncate text-[11px] block group-hover:text-cyan-400">
                                  {s.title}
                                </span>
                                <span className="text-[10px] text-slate-400 truncate block">
                                  {s.source} • {s.author}
                                </span>
                              </div>
                            </div>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 uppercase border ${
                              isYouTube
                                ? 'bg-rose-500/15 text-rose-500 dark:text-rose-300 border-rose-500/30'
                                : 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30'
                            }`}>
                              {isYouTube ? (isEn ? '▶ VIDEO LECTURE' : '▶ VIDEO BÀI GIẢNG') : (isEn ? 'CURRICULUM' : 'GIÁO TRÌNH')}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section 7: AI Coach Conclusion */}
                {compareData.conclusion && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-blue-500/10 border border-amber-500/30 text-xs text-[#1e2329] dark:text-slate-200 flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      {compareData.conclusion}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Footer / Input (For Tutor Tab) */}
      {activeTab === 'tutor' && (
        <div className="p-3 border-t border-[#e6e8ea] dark:border-[#252c3f] bg-white/95 dark:bg-[#161a26]/90 backdrop-blur-md">
          {isChallengeActive ? (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {isEn ? 'AI locked during Prop Challenge' : 'Khóa AI khi đang thi Quỹ'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isEn 
                    ? 'You are currently in a Prop Firm Challenge. AI Tutor is disabled by competition rules.'
                    : 'Bạn đang tham gia bài thi Cấp Vốn. AI Tutor tạm thời vô hiệu hóa theo quy chế thi.'}
                </div>
              </div>
            </div>
          ) : !user ? (
            <div className="py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-[#1a1f2c] border border-slate-200 dark:border-[#262c3d] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {isEn ? 'Account Login Required' : 'Yêu cầu đăng nhập tài khoản'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isEn ? 'Please log in to chat with AI and manage daily quota.' : 'Vui lòng đăng nhập để bắt đầu trò chuyện và quản lý lượt hỏi AI.'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => login()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-sm transition-all whitespace-nowrap cursor-pointer hover:scale-[1.02]"
              >
                {isEn ? 'Log in now' : 'Đăng nhập ngay'}
              </button>
            </div>
          ) : (
            <>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAsk();
                }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isEn ? 'Type any question (e.g., What is FVG?, calculate position risk, review setup...)...' : 'Nhập câu hỏi bất kỳ (ví dụ: FVG là gì?, tính rủi ro lệnh, review vị thế...)...'}
                  className="w-full bg-[#f0f3fa] dark:bg-[#10141f] border border-[#e6e8ea] dark:border-[#2b3347] focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/20 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="absolute right-1.5 p-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-20 disabled:pointer-events-none text-slate-950 transition-all shadow-sm cursor-pointer"
                  title={isEn ? 'Send question (Press Enter)' : 'Gửi câu hỏi (Nhấn Enter)'}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
              <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-2 px-1">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  {isEn ? 'AI Trading Tutor • Ready to assist with any inquiry' : 'AI Trading Tutor • Sẵn sàng giải đáp mọi thắc mắc'}
                </span>
                <span className="hidden sm:inline font-mono text-[10px] text-slate-500 bg-[#edf0f5] dark:bg-[#1e2433] px-1.5 py-0.5 rounded border border-[#dce1ea] dark:border-[#2a3246]">
                  Enter ↵
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>

    <UpgradeProModal
      isOpen={isUpgradeModalOpen}
      onClose={() => setIsUpgradeModalOpen(false)}
      currentSubscription={subscription}
      onSuccess={fetchSubscription}
    />
  </>
  );
};
