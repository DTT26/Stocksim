import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HelpCircle, Play, PlayCircle, ChevronDown, ChevronLeft, Calendar, ArrowRight, Edit3, 
  BarChart2, Eye, Trash2, Trophy, Target, Activity, Clock, Check, X 
} from 'lucide-react';
import { type Stock, STOCKS, getContractMultiplier, getAssetUnit } from '../data';
import { AuthOverlay } from './AuthOverlay';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  getSessions, createSession, updateSession, deleteSession, getSessionDetails, 
  type PaperSession 
} from '../../../services/marketApi';
import { useSimulatorStore } from '../engine/useSimulatorStore';
import { useI18n } from '../../../contexts/I18nContext';
import { CustomDatePicker } from '../../../components/CustomDatePicker';
import { SimulatorTradingPanel } from './SimulatorTradingPanel';

interface SimulationPanelProps {
  currentSymbol: string;
  selectedStock?: Stock;
  currentPrice?: number;
  isReplaying: boolean;
  replayTime?: number | null;
  activeTimeframe?: string;
  onResumeSession?: (session: PaperSession, resumeTimestamp?: number, timeframe?: string) => void;
  onStartSimulation: (config: SimulationConfig) => void;
  onStartReplay?: () => void;
  onSelectStock?: (stock: Stock) => void;
  onPreviewTPSLChange?: (tpsl: { tp?: number; sl?: number; side?: 'LONG' | 'SHORT'; enabled: boolean; orderPrice?: number; orderType?: 'LIMIT' | 'STOP'; quantity?: number; lot?: number; actualQty?: number } | null) => void;
  draggedTPSL?: { tp?: number; sl?: number; orderPrice?: number } | null;
}

export interface SimulationConfig {
  balance: number;
  leverage: number;
  minLot: number;
  lotStep: number;
  maxMarginPercent: number;
  spread: number;
  commission: number;
  swapLong: number;
  swapShort: number;
}

const DEFAULT_CONFIG: SimulationConfig = {
  balance: 100_000,
  leverage: 10,
  minLot: 0.01,
  lotStep: 0.01,
  maxMarginPercent: 95,
  spread: 0.2,
  commission: 0,
  swapLong: -0.5,
  swapShort: -0.3,
};

export const SimulationPanel = ({ 
  currentSymbol, 
  selectedStock, 
  currentPrice, 
  isReplaying, 
  replayTime,
  activeTimeframe,
  onResumeSession,
  onStartSimulation, 
  onStartReplay,
  onSelectStock,
  onPreviewTPSLChange,
  draggedTPSL
}: SimulationPanelProps) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'running' | 'completed'>('running');
  const [currentView, setCurrentView] = useState<'list' | 'trading'>('list');
  const [isCreating, setIsCreating] = useState(false);
  const [showReplayWarning, setShowReplayWarning] = useState(false);
  
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);

  const [sessions, setSessions] = useState<PaperSession[]>([]);

  // Selected completed session for detail view
  const [selectedCompletedSession, setSelectedCompletedSession] = useState<PaperSession | null>(null);
  const [sessionDetailData, setSessionDetailData] = useState<{ session: any; positions: any[]; orders: any[]; history: any[] } | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Renaming state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  // Deleting state
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatSessionMoney = (amount: number = 0) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatSessionLastTime = (dStr?: string | Date) => {
    if (!dStr) return '';
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return '';
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  };

  const formatSessionPnL = (amount: number = 0) => {
    const sign = amount >= 0 ? '+' : '-';
    const abs = Math.abs(amount);
    return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatSessionDate = (dStr?: string | Date) => {
    if (!dStr) return '';
    const d = new Date(dStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const handleContinueSession = async (session: any) => {
    try {
      let targetSession = session;
      let resumeTimeStr = store.currentTime || store.session?.replayCurrentTime || targetSession.replayCurrentTime || targetSession.replayStartTime;
      let sessionTimeframe = store.session?.timeframe || targetSession.timeframe || activeTimeframe || '1m';

      if (!store.isActive || store.session?._id !== session._id) {
        const { getSessionDetails } = await import('../../../services/marketApi');
        const data = await getSessionDetails(session._id);
        targetSession = data.session;
        resumeTimeStr = targetSession.replayCurrentTime || targetSession.replayStartTime;
        sessionTimeframe = targetSession.timeframe || activeTimeframe || '1m';

        const effectiveStockPrice = (currentPrice && currentPrice > 0) 
          ? currentPrice 
          : (STOCKS.find((s: Stock) => s.symbol === data.session.symbol)?.price || 100);

        store.loadSession(
          {
            _id: data.session._id,
            name: data.session.name,
            symbol: data.session.symbol,
            timeframe: sessionTimeframe,
            config: {
              initialBalance: data.session.initialBalance,
              leverage: data.session.leverage,
              minLot: data.session.minLot,
              lotStep: data.session.lotStep,
              maxMarginPercent: data.session.maxMarginPercent,
              spread: data.session.spread,
              commission: data.session.commission,
              swapLong: data.session.swapLong,
              swapShort: data.session.swapShort
            },
            balance: data.session.balance,
            equity: data.session.equity,
            usedMargin: data.session.usedMargin,
            freeMargin: data.session.freeMargin,
            replayStartTime: data.session.replayStartTime,
            replayCurrentTime: data.session.replayCurrentTime,
            status: data.session.status
          },
          data.positions,
          data.orders,
          data.history,
          effectiveStockPrice
        );
      } else {
        resumeTimeStr = store.currentTime || store.session?.replayCurrentTime || targetSession.replayCurrentTime || targetSession.replayStartTime;
        sessionTimeframe = store.session?.timeframe || targetSession.timeframe || activeTimeframe || '1m';
      }

      const resumeTimestamp = resumeTimeStr ? new Date(resumeTimeStr).getTime() : undefined;
      if (onResumeSession) {
        onResumeSession(targetSession, resumeTimestamp, sessionTimeframe);
      } else if (onSelectStock && targetSession.symbol) {
        const matchStock = STOCKS.find(s => s.symbol === targetSession.symbol);
        if (matchStock) onSelectStock(matchStock);
      }

      setCurrentView('trading');
    } catch (error) {
      console.error("Failed to continue session", error);
    }
  };

  const handleCompleteSession = async (session: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      if (store.isActive && store.session?._id === session._id) {
        await store.endSession();
      } else {
        await updateSession(session._id, {
          sessionData: {
            status: 'completed',
            completedAt: new Date().toISOString()
          }
        });
      }
      await fetchSessions();
      if (currentView === 'trading' && store.session?._id === session._id) {
        setCurrentView('list');
      }
    } catch (error) {
      console.error("Failed to complete session", error);
    }
  };

  const handleRename = async (sessionId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingName.trim()) return;
    try {
      await updateSession(sessionId, { sessionData: { name: editingName.trim() } });
      setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, name: editingName.trim() } : s));
      if (selectedCompletedSession?._id === sessionId) {
        setSelectedCompletedSession(prev => prev ? { ...prev, name: editingName.trim() } : null);
      }
      setEditingSessionId(null);
    } catch (err) {
      console.error('Failed to rename session', err);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      setIsDeleting(true);
      await deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s._id !== sessionId));
      if (selectedCompletedSession?._id === sessionId) {
        setSelectedCompletedSession(null);
        setSessionDetailData(null);
      }
      setDeletingSessionId(null);
    } catch (err) {
      console.error('Failed to delete session', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewSessionDetail = async (session: PaperSession) => {
    setSelectedCompletedSession(session);
    setIsLoadingDetail(true);
    try {
      const data = await getSessionDetails(session._id);
      setSessionDetailData(data);
    } catch (err) {
      console.error('Failed to fetch session detail', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const fetchSessions = async () => {
    if (user) {
      try {
        const data = await getSessions();
        setSessions(data);
      } catch (error) {
        console.error("Failed to fetch sessions", error);
      }
    } else {
      setSessions([]);
      if (store.isActive) {
        // Optionally end session, but it will be hidden anyway
      }
    }
  };

  useEffect(() => {
    fetchSessions();
    const handleSessionEnded = () => fetchSessions();
    const handleSessionUpdated = () => fetchSessions();
    window.addEventListener('simulator-session-ended', handleSessionEnded);
    window.addEventListener('simulator-session-updated', handleSessionUpdated);
    return () => {
      window.removeEventListener('simulator-session-ended', handleSessionEnded);
      window.removeEventListener('simulator-session-updated', handleSessionUpdated);
    };
  }, [user]);

  const store = useSimulatorStore();

  // Filters for completed sessions
  const [symbolFilter, setSymbolFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const activeSessions = sessions.filter(s => s.status === 'running');
  const allCompletedSessions = sessions.filter(s => s.status === 'completed');

  // Get unique symbols from completed sessions
  const completedSymbols = useMemo(() => {
    const symbols = new Set(allCompletedSessions.map(s => s.symbol));
    return Array.from(symbols).sort();
  }, [allCompletedSessions]);

  // Apply filters
  const completedSessions = useMemo(() => {
    let filtered = allCompletedSessions;
    if (symbolFilter) {
      filtered = filtered.filter(s => s.symbol === symbolFilter);
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      filtered = filtered.filter(s => {
        const d = new Date(s.completedAt || s.startedAt || '');
        return d >= from;
      });
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(s => {
        const d = new Date(s.completedAt || s.startedAt || '');
        return d <= to;
      });
    }
    return filtered;
  }, [allCompletedSessions, symbolFilter, dateFrom, dateTo]);

  const handleChange = (field: keyof SimulationConfig, value: number) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleStart = async () => {
    onStartSimulation(config);
    if (!user) {
      setIsCreating(false);
      return;
    }

    try {
      const sessionReplayTime = (replayTime && !isNaN(replayTime))
        ? new Date(replayTime).toISOString()
        : (store.currentTime || new Date().toISOString());

      const sessionTimeframe = activeTimeframe || '1m';

      const newSession = await createSession({
        symbol: currentSymbol,
        timeframe: sessionTimeframe,
        initialBalance: config.balance,
        leverage: config.leverage,
        minLot: config.minLot,
        lotStep: config.lotStep,
        maxMarginPercent: config.maxMarginPercent,
        spread: config.spread,
        commission: config.commission,
        swapLong: config.swapLong,
        swapShort: config.swapShort,
        replayStartTime: sessionReplayTime
      });
      
      setSessions(prev => [newSession, ...prev]);
      setIsCreating(false);

      // Start locally
      const stockPrice = (currentPrice && currentPrice > 0) ? currentPrice : (STOCKS.find((s: Stock) => s.symbol === newSession.symbol)?.price || 100);
      store.startSession({
        _id: newSession._id,
        name: newSession.name,
        symbol: newSession.symbol,
        timeframe: newSession.timeframe,
        config: {
          initialBalance: newSession.initialBalance,
          leverage: newSession.leverage,
          minLot: newSession.minLot,
          lotStep: newSession.lotStep,
          maxMarginPercent: newSession.maxMarginPercent,
          spread: newSession.spread,
          commission: newSession.commission,
          swapLong: newSession.swapLong,
          swapShort: newSession.swapShort,
        },
        balance: newSession.balance,
        equity: newSession.equity,
        usedMargin: newSession.usedMargin,
        freeMargin: newSession.freeMargin,
        replayStartTime: newSession.replayStartTime,
        replayCurrentTime: newSession.replayCurrentTime,
        status: newSession.status
      }, stockPrice);

      const resumeTimestamp = (replayTime && !isNaN(replayTime)) ? replayTime : new Date(sessionReplayTime).getTime();
      onResumeSession?.(newSession, resumeTimestamp, sessionTimeframe);

      setCurrentView('trading');
    } catch (error) {
      console.error("Failed to create session", error);
    }
  };

  if (isCreating) {
    return (
      <div className="w-full lg:w-[320px] lg:border-l border-[#e6e8ea] dark:border-[#2a2e39] bg-white dark:bg-[#131722] shrink-0 h-full flex flex-col text-[#1e2329] dark:text-[#d1d4dc] font-sans">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#e6e8ea] dark:border-[#2a2e39] shrink-0">
          <h2 className="text-lg font-bold text-[#1e2329] dark:text-white">Bắt đầu phiên giao dịch</h2>
          <button className="w-6 h-6 rounded-full bg-[#f0f1f3] dark:bg-[#1e222d] hover:bg-[#e6e8ea] dark:hover:bg-[#2a2e39] flex items-center justify-center text-[#787b86] transition-colors">
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-5">
          {/* SỐ DƯ BAN ĐẦU */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#1e2329] dark:text-white tracking-wider flex items-center gap-1.5 uppercase">
              Số dư ban đầu (USD)
              <HelpCircle className="w-3.5 h-3.5 text-[#787b86]" />
            </label>
            <input 
              type="number"
              value={config.balance}
              onChange={e => handleChange('balance', parseFloat(e.target.value))}
              className="bg-[#f8f9fa] dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] focus:border-[#2962ff] rounded-md px-3 py-2.5 text-sm text-[#1e2329] dark:text-white font-mono outline-none transition-colors"
            />
          </div>

          {/* ĐÒN BẨY */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#1e2329] dark:text-white tracking-wider flex items-center gap-1.5 uppercase">
              Đòn bẩy (1-1000)
              <HelpCircle className="w-3.5 h-3.5 text-[#787b86]" />
            </label>
            <input 
              type="number"
              value={config.leverage}
              onChange={e => handleChange('leverage', parseFloat(e.target.value))}
              className="bg-[#f8f9fa] dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] focus:border-[#2962ff] rounded-md px-3 py-2.5 text-sm text-[#1e2329] dark:text-white font-mono outline-none transition-colors"
            />
          </div>

          {/* LOT */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[11px] font-bold text-[#1e2329] dark:text-white tracking-wider uppercase">Lot tối thiểu</label>
              <input 
                type="number"
                step="0.01"
                value={config.minLot}
                onChange={e => handleChange('minLot', parseFloat(e.target.value))}
                className="bg-[#f8f9fa] dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] focus:border-[#2962ff] rounded-md px-3 py-2.5 text-sm text-[#1e2329] dark:text-white font-mono outline-none transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[11px] font-bold text-[#1e2329] dark:text-white tracking-wider uppercase">Bước nhảy Lot</label>
              <input 
                type="number"
                step="0.01"
                value={config.lotStep}
                onChange={e => handleChange('lotStep', parseFloat(e.target.value))}
                className="bg-[#f8f9fa] dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] focus:border-[#2962ff] rounded-md px-3 py-2.5 text-sm text-[#1e2329] dark:text-white font-mono outline-none transition-colors"
              />
            </div>
          </div>

          {/* SỬ DỤNG KÝ QUỸ TỐI ĐA */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#1e2329] dark:text-white tracking-wider uppercase">
              Sử dụng ký quỹ tối đa (%)
            </label>
            <input 
              type="number"
              value={config.maxMarginPercent}
              onChange={e => handleChange('maxMarginPercent', parseFloat(e.target.value))}
              className="bg-[#f8f9fa] dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] focus:border-[#2962ff] rounded-md px-3 py-2.5 text-sm text-[#1e2329] dark:text-white font-mono outline-none transition-colors"
            />
            
            <div className="mt-1 bg-[#f0f3fa] dark:bg-[#151924] rounded-md p-3 text-xs text-[#787b86] flex items-start gap-2 border border-[#e6e8ea] dark:border-[#1e222d]">
              <span className="text-yellow-500">💡</span>
              <p>
                Ký quỹ {config.minLot} lot: <strong className="text-[#1e2329] dark:text-white">${
                  ((STOCKS.find((s: Stock) => s.symbol === currentSymbol)?.price || 1000) * config.minLot / config.leverage).toFixed(2)
                }</strong> · Tối đa: <strong className="text-[#1e2329] dark:text-white">{
                  (((config.balance * config.maxMarginPercent / 100) * config.leverage) / (STOCKS.find((s: Stock) => s.symbol === currentSymbol)?.price || 1000)).toFixed(2)
                } lots</strong>
              </p>
            </div>
          </div>

          {/* SPREAD */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#1e2329] dark:text-white tracking-wider uppercase">Spread (điểm)</label>
            <input 
              type="number"
              value={config.spread}
              onChange={e => handleChange('spread', parseFloat(e.target.value))}
              className="bg-[#f8f9fa] dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] focus:border-[#2962ff] rounded-md px-3 py-2.5 text-sm text-[#1e2329] dark:text-white font-mono outline-none transition-colors"
            />
            <div className="bg-[#f0f3fa] dark:bg-[#151924] border border-[#e6e8ea] dark:border-transparent rounded-md p-2.5 text-xs text-[#787b86]">
              20 pt ≈ 0.20
            </div>
          </div>

          {/* PHÍ HOA HỒNG */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#1e2329] dark:text-white tracking-wider flex items-center gap-1.5 uppercase">
              Phí hoa hồng mỗi lot ($)
              <HelpCircle className="w-3.5 h-3.5 text-[#787b86]" />
            </label>
            <input 
              type="number"
              value={config.commission}
              onChange={e => handleChange('commission', parseFloat(e.target.value))}
              className="bg-[#f8f9fa] dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] focus:border-[#2962ff] rounded-md px-3 py-2.5 text-sm text-[#1e2329] dark:text-white font-mono outline-none transition-colors"
            />
          </div>

          {/* PHÍ QUA ĐÊM LONG */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#1e2329] dark:text-white tracking-wider flex items-center gap-1.5 uppercase">
              Phí qua đêm Long ($/Lot/Đêm)
              <HelpCircle className="w-3.5 h-3.5 text-[#787b86]" />
            </label>
            <input 
              type="number"
              step="0.1"
              value={config.swapLong}
              onChange={e => handleChange('swapLong', parseFloat(e.target.value))}
              className="bg-[#f8f9fa] dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] focus:border-[#2962ff] rounded-md px-3 py-2.5 text-sm text-[#1e2329] dark:text-white font-mono outline-none transition-colors"
            />
          </div>

          {/* PHÍ QUA ĐÊM SHORT */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#1e2329] dark:text-white tracking-wider flex items-center gap-1.5 uppercase">
              Phí qua đêm Short ($/Lot/Đêm)
              <HelpCircle className="w-3.5 h-3.5 text-[#787b86]" />
            </label>
            <input 
              type="number"
              step="0.1"
              value={config.swapShort}
              onChange={e => handleChange('swapShort', parseFloat(e.target.value))}
              className="bg-[#f8f9fa] dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] focus:border-[#2962ff] rounded-md px-3 py-2.5 text-sm text-[#1e2329] dark:text-white font-mono outline-none transition-colors"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 border-t border-[#e6e8ea] dark:border-[#2a2e39] flex gap-3 shrink-0">
          <button 
            onClick={() => setIsCreating(false)}
            className="flex-1 bg-white hover:bg-[#f0f1f3] dark:bg-transparent dark:hover:bg-[#2a2e39] text-[#1e2329] dark:text-white font-bold py-2.5 rounded-md border border-[#e6e8ea] dark:border-[#2a2e39] transition-colors text-sm cursor-pointer"
          >
            HỦY
          </button>
          <button 
            data-tour="sim-start-create-btn"
            onClick={handleStart}
            className="flex-1 bg-[#089981] hover:bg-[#089981]/90 text-white font-bold py-2.5 rounded-md transition-colors text-sm cursor-pointer shadow-sm"
          >
            BẮT ĐẦU
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'trading' && store.isActive && store.session) {
    const sessionStock = STOCKS.find(s => s.symbol === store.session!.symbol) || selectedStock || STOCKS[0];
    return (
      <div className="w-full lg:w-[320px] lg:border-l border-[#e6e8ea] dark:border-[#2a2e39] bg-white dark:bg-[#131722] shrink-0 h-full flex flex-col text-[#1e2329] dark:text-[#d1d4dc] font-sans">
        <SimulatorTradingPanel
          selectedStock={sessionStock}
          onBack={async () => {
            await store.flushSync();
            await fetchSessions();
            setCurrentView('list');
          }}
          onPreviewTPSLChange={onPreviewTPSLChange}
          draggedTPSL={draggedTPSL}
        />
      </div>
    );
  }

  return (
    <div className="w-full lg:w-[320px] lg:border-l border-[#e6e8ea] dark:border-[#2a2e39] bg-white dark:bg-[#131722] shrink-0 h-full flex flex-col text-[#1e2329] dark:text-[#d1d4dc] font-sans relative">
      {!user ? (
        <AuthOverlay
          icon={<BarChart2 className="w-8 h-8" />}
          title={t('sim.title', 'Mô phỏng Giao dịch')}
          subtitle="Thực hành giao dịch không rủi ro bằng dữ liệu thực tế"
          features={[
            "Tua lại biểu đồ để kiểm tra chiến lược",
            "Mô phỏng chân thực với thanh khoản thị trường",
            "Đo lường hiệu suất với Nhật ký giao dịch chi tiết"
          ]}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center gap-2 p-4 shrink-0">
            <h2 className="text-lg font-bold text-[#1e2329] dark:text-white">{t('sim.title', 'Mô phỏng Giao dịch')}</h2>
            <button className="w-6 h-6 rounded-full bg-[#f0f1f3] dark:bg-[#1e222d] hover:bg-[#e6e8ea] dark:hover:bg-[#2a2e39] flex items-center justify-center text-[#787b86] transition-colors">
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-4 shrink-0">
        <button
          onClick={() => setActiveTab('running')}
          className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${
            activeTab === 'running' 
              ? 'bg-[#089981] text-white' 
              : 'bg-[#f0f1f3] dark:bg-[#1e222d] text-[#787b86] hover:text-[#1e2329] dark:hover:text-white'
          }`}
        >
          {t('sim.running', 'Đang chạy')}
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${
            activeTab === 'completed' 
              ? 'bg-[#089981] text-white' 
              : 'bg-[#f0f1f3] dark:bg-[#1e222d] text-[#787b86] hover:text-[#1e2329] dark:hover:text-white'
          }`}
        >
          {t('sim.completed', 'Đã xong')}
        </button>
      </div>

      {activeTab === 'running' && (
        <div className="flex flex-col px-4 flex-1 overflow-hidden">
          <button 
            data-tour="sim-new-session-btn"
            onClick={() => {
              if (!isReplaying) {
                setShowReplayWarning(true);
              } else {
                setIsCreating(true);
              }
            }}
            className="w-full bg-[#089981] hover:bg-[#089981]/90 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors shrink-0 uppercase text-sm mb-4 shadow-lg shadow-[#089981]/20"
          >
            <PlayCircle className="w-5 h-5 fill-white/20 stroke-white" />
            {t('sim.startNew', 'BẮT ĐẦU PHIÊN MỚI')}
          </button>
          
          {activeSessions.length === 0 ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center p-6 text-center text-[#787b86]">
              <div className="w-16 h-16 rounded-full bg-[#f0f1f3] dark:bg-[#1e222d] flex items-center justify-center mb-4">
                <Play className="w-8 h-8 text-[#a0a3af] dark:text-[#434651] ml-1" />
              </div>
              <p className="mb-4 text-sm font-medium text-[#1e2329] dark:text-white">Không có phiên giao dịch nào</p>
              <p className="mb-6 text-xs text-[#787b86] max-w-[200px] leading-relaxed">Sử dụng nút ở trên để tạo và định cấu hình phiên mới.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pb-4">
              {activeSessions.map((session: any) => {
                const isCurrentlyActiveInStore = store.isActive && store.session?._id === session._id;
                const currentBalance = isCurrentlyActiveInStore ? store.session!.balance : (session.balance || session.initialBalance || 0);
                const lastTime = isCurrentlyActiveInStore 
                  ? (store.currentTime || session.replayCurrentTime || session.updatedAt || session.createdAt)
                  : (session.replayCurrentTime || session.updatedAt || session.createdAt);

                return (
                  <div 
                    key={session._id} 
                    className="bg-white dark:bg-[#161a29] border border-[#e6e8ea] dark:border-[#2a2e39] rounded-xl p-3.5 flex flex-col gap-2 hover:border-[#cbd5e1] dark:hover:border-[#3d4560] transition-colors relative shadow-sm dark:shadow-none"
                  >
                    {/* Header: Name & Edit Icon */}
                    <div className="flex items-center justify-between gap-2">
                      {editingSessionId === session._id ? (
                        <form onSubmit={(e) => handleRename(session._id, e)} className="flex items-center gap-1 flex-1">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="bg-[#f8f9fa] dark:bg-[#1e222d] border border-[#089981] text-[#1e2329] dark:text-white text-sm rounded px-2 py-1 flex-1 outline-none font-bold"
                            autoFocus
                            onBlur={() => handleRename(session._id)}
                          />
                          <button type="submit" className="p-1 text-emerald-500 hover:text-emerald-400">
                            <Check className="w-4 h-4" />
                          </button>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <span className="font-bold text-[#1e2329] dark:text-white text-[15px] truncate">
                              {session.name || `${session.symbol} · ${formatSessionDate(session.createdAt)}`}
                            </span>
                            {isCurrentlyActiveInStore && (
                              <span className="text-[9px] text-[#089981] bg-[#089981]/15 px-1.5 py-0.5 rounded font-bold shrink-0">
                                Đang mở
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSessionId(session._id);
                              setEditingName(session.name || `${session.symbol} · ${formatSessionDate(session.createdAt)}`);
                            }}
                            className="text-[#787b86] hover:text-[#1e2329] dark:hover:text-white transition-colors p-1 shrink-0 cursor-pointer"
                            title="Đổi tên phiên"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Subtitle: symbol · timeframe */}
                    <div className="text-xs text-[#787b86] dark:text-[#8c92a4] font-medium">
                      {session.symbol} &middot; {session.timeframe || '4h'}
                    </div>

                    {/* SỐ DƯ */}
                    <div className="text-xs text-[#787b86] dark:text-[#8c92a4] font-medium flex items-center gap-1.5">
                      <span>SỐ DƯ:</span>
                      <span className="text-[#1e2329] dark:text-white font-bold font-mono text-[13px]">
                        {formatSessionMoney(currentBalance)}
                      </span>
                    </div>

                    {/* Gần nhất */}
                    <div className="text-xs text-[#787b86] dark:text-[#8c92a4] font-medium flex items-center gap-1.5 mb-1">
                      <span>Gần nhất:</span>
                      <span className="text-[#1e2329] dark:text-white font-bold font-mono text-[13px]">
                        {formatSessionLastTime(lastTime)}
                      </span>
                    </div>

                    {/* Action buttons: Tiếp tục & Hoàn thành */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[#e6e8ea] dark:border-[#2a2e39]/60">
                      <button
                        data-tour="sim-continue-btn"
                        onClick={() => handleContinueSession(session)}
                        className="flex-1 py-2 px-3 rounded-lg border border-[#089981]/30 dark:border-[#089981]/50 bg-[#089981]/10 hover:bg-[#089981]/15 dark:bg-[#0e2722] dark:hover:bg-[#133730] text-[#089981] dark:text-[#26a69a] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Tiếp tục
                      </button>
                      <button
                        data-tour="sim-finish-session-btn"
                        onClick={(e) => handleCompleteSession(session, e)}
                        className="flex-1 py-2 px-3 rounded-lg border border-[#f23645]/30 dark:border-[#f23645]/40 bg-[#f23645]/10 hover:bg-[#f23645]/15 dark:bg-[#2b1723] dark:hover:bg-[#3d1e31] text-[#f23645] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        Hoàn thành
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

          {activeTab === 'completed' && (
            selectedCompletedSession ? (
              /* --- VIEW 2: CHI TIẾT PHIÊN HOÀN TẤT --- */
              <div className="flex flex-col px-4 flex-1 overflow-hidden">
                {/* Back button */}
                <button
                  onClick={() => { setSelectedCompletedSession(null); setSessionDetailData(null); }}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-[#818cf8] dark:hover:text-[#a5b4fc] transition-colors py-2 font-medium self-start mb-2 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Quay lại danh sách phiên</span>
                </button>

                {/* Title & Subtitle */}
                <div className="mb-4">
                  {editingSessionId === selectedCompletedSession._id ? (
                    <form onSubmit={(e) => handleRename(selectedCompletedSession._id, e)} className="flex items-center gap-1.5 mb-1">
                      <input
                        type="text"
                        value={editingName}
                        autoFocus
                        onChange={e => setEditingName(e.target.value)}
                        className="bg-[#f8f9fa] dark:bg-[#1e222d] border border-blue-500 rounded px-2 py-1 text-sm text-[#1e2329] dark:text-white outline-none w-full font-bold"
                      />
                      <button type="submit" className="text-green-500 hover:text-green-400 p-1"><Check className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setEditingSessionId(null)} className="text-red-500 hover:text-red-400 p-1"><X className="w-4 h-4" /></button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <h3 className="font-bold text-[#1e2329] dark:text-white text-base truncate" title={selectedCompletedSession.name}>
                        {selectedCompletedSession.name || `${selectedCompletedSession.symbol} - ${selectedCompletedSession.timeframe || '4h'}`}
                      </h3>
                      <button 
                        onClick={() => { setEditingSessionId(selectedCompletedSession._id); setEditingName(selectedCompletedSession.name || ''); }}
                        className="text-[#787b86] hover:text-[#1e2329] dark:hover:text-white transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                        title="Đổi tên"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="text-xs text-[#787b86] mt-0.5 font-medium">
                    {selectedCompletedSession.symbol} &middot; {selectedCompletedSession.timeframe || '4h'} &middot; {formatSessionDate(selectedCompletedSession.completedAt || selectedCompletedSession.startedAt)}
                  </div>
                </div>

                {/* 2x2 Prominent Stat Cards Grid */}
                {(() => {
                  const historyList = sessionDetailData?.history || [];
                  const detailStats = sessionDetailData?.session?.statistics || selectedCompletedSession.statistics;
                  const totalTrades = detailStats?.totalTrades ?? (historyList.length > 0 ? historyList.length : 0);
                  const wins = detailStats?.wins ?? historyList.filter((h: any) => h.netPnL > 0).length;
                  const winRate = detailStats?.winRate ?? (totalTrades > 0 ? (wins / totalTrades) * 100 : 0);
                  const currentBal = sessionDetailData?.session?.balance ?? selectedCompletedSession.balance ?? selectedCompletedSession.initialBalance ?? 0;
                  const initBal = sessionDetailData?.session?.initialBalance ?? selectedCompletedSession.initialBalance ?? currentBal;
                  const netPnL = detailStats?.netPnL ?? (historyList.length > 0 ? historyList.reduce((s: number, h: any) => s + (h.netPnL || 0), 0) : (currentBal - initBal));

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-2.5 mb-5">
                        {/* Card 1: LỆNH */}
                        <div className="bg-[#f8f9fa] dark:bg-[#151924] border border-[#e6e8ea] dark:border-[#2a2e39] rounded-xl p-3 flex flex-col justify-between shadow-sm dark:shadow-none">
                          <div className="flex items-center gap-1.5 text-[#787b86] text-[11px] font-bold uppercase tracking-wider">
                            <BarChart2 className="w-3.5 h-3.5 text-[#787b86]" />
                            <span>LỆNH</span>
                          </div>
                          <div className="font-mono text-xl font-bold text-[#1e2329] dark:text-white mt-2">
                            {totalTrades}
                          </div>
                        </div>

                        {/* Card 2: TỶ LỆ THẮNG */}
                        <div className="bg-[#f8f9fa] dark:bg-[#151924] border border-[#e6e8ea] dark:border-[#2a2e39] rounded-xl p-3 flex flex-col justify-between shadow-sm dark:shadow-none">
                          <div className="flex items-center gap-1.5 text-[#787b86] text-[11px] font-bold uppercase tracking-wider">
                            <Trophy className="w-3.5 h-3.5 text-[#787b86]" />
                            <span>TỶ LỆ THẮNG</span>
                          </div>
                          <div className="font-mono text-xl font-bold text-[#1e2329] dark:text-white mt-2">
                            {winRate.toFixed(1)}%
                          </div>
                        </div>

                        {/* Card 3: SỐ DƯ */}
                        <div className="bg-[#f8f9fa] dark:bg-[#151924] border border-[#e6e8ea] dark:border-[#2a2e39] rounded-xl p-3 flex flex-col justify-between shadow-sm dark:shadow-none">
                          <div className="flex items-center gap-1.5 text-[#787b86] text-[11px] font-bold uppercase tracking-wider">
                            <Target className="w-3.5 h-3.5 text-[#787b86]" />
                            <span>SỐ DƯ</span>
                          </div>
                          <div className="font-mono text-lg font-bold text-[#1e2329] dark:text-white mt-2 truncate" title={formatSessionMoney(currentBal)}>
                            {formatSessionMoney(currentBal)}
                          </div>
                        </div>

                        {/* Card 4: LỜI / LỖ (PNL) */}
                        <div className="bg-[#f8f9fa] dark:bg-[#151924] border border-[#e6e8ea] dark:border-[#2a2e39] rounded-xl p-3 flex flex-col justify-between shadow-sm dark:shadow-none">
                          <div className="flex items-center gap-1.5 text-[#787b86] text-[11px] font-bold uppercase tracking-wider">
                            <Activity className="w-3.5 h-3.5 text-[#787b86]" />
                            <span>LỜI / LỖ (PNL)</span>
                          </div>
                          <div className={`font-mono text-lg font-bold mt-2 truncate ${netPnL >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`} title={formatSessionPnL(netPnL)}>
                            {formatSessionPnL(netPnL)}
                          </div>
                        </div>
                      </div>

                      {/* Trades List Section */}
                      <div className="flex items-center justify-between mb-2 shrink-0">
                        <h4 className="text-xs font-bold text-[#1e2329] dark:text-[#d1d4dc] uppercase tracking-wider">
                          Lệnh ({historyList.length})
                        </h4>
                      </div>

                      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pb-4">
                        {isLoadingDetail ? (
                          <div className="text-center py-8 text-xs text-[#787b86]">Đang tải chi tiết lệnh...</div>
                        ) : historyList.length === 0 ? (
                          <div className="text-center py-8 text-xs text-[#787b86]">
                            Không có lệnh nào trong phiên này
                          </div>
                        ) : (
                          historyList.map((tx: any, idx: number) => {
                            const isLong = tx.side === 'LONG';
                            const isWin = tx.netPnL >= 0;
                            return (
                              <div key={tx.id || idx} className="bg-[#f8f9fa] dark:bg-[#151924] border border-[#e6e8ea] dark:border-[#2a2e39] rounded-lg p-2.5 text-xs flex flex-col gap-1.5 hover:border-[#cbd5e1] dark:hover:border-[#3a4052] transition-colors shadow-sm dark:shadow-none">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isLong ? 'bg-[#089981]/20 text-[#089981]' : 'bg-[#f23645]/20 text-[#f23645]'}`}>
                                      {tx.side}
                                    </span>
                                    <span className="font-bold text-[#1e2329] dark:text-white">{tx.symbol}</span>
                                    <span className="text-[#787b86] text-[10px]">
                                      {(() => {
                                        const mult = getContractMultiplier(tx.symbol);
                                        const qty = tx.lot * mult;
                                        const unit = getAssetUnit(tx.symbol);
                                        const formatted = qty < 1 ? Number(qty.toFixed(6)).toString() : qty.toLocaleString('vi-VN');
                                        return `${formatted} ${unit} (${tx.lot} Lot)`;
                                      })()}
                                    </span>
                                  </div>
                                  <span className={`font-mono font-bold ${isWin ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                                    {formatSessionPnL(tx.netPnL)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-[#787b86] font-mono">
                                  <div>
                                    {tx.entryPrice?.toLocaleString('vi-VN')} &rarr; {tx.exitPrice?.toLocaleString('vi-VN')}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="bg-[#e6e8ea] dark:bg-[#1e222d] text-[#1e2329] dark:text-[#d1d4dc] px-1.5 py-0.5 rounded text-[10px]">{tx.closeReason || 'MANUAL'}</span>
                                    {tx.closeTime && <span>{new Date(tx.closeTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              /* --- VIEW 1: DANH SÁCH PHIÊN HOÀN TẤT --- */
              <div className="flex flex-col px-4 flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <h3 className="font-bold text-[#1e2329] dark:text-white text-base">Lịch sử Phiên</h3>
                  <span className="bg-purple-100 dark:bg-[#2a1d45] text-purple-700 dark:text-[#a78bfa] border border-purple-200 dark:border-[#6b21a8]/30 text-xs font-bold px-2 py-0.5 rounded-full">
                    {completedSessions.length}
                  </span>
                </div>
                
                <div className="flex gap-2 mb-3 shrink-0">
                  {/* Symbol Filter Dropdown */}
                  <div className="relative flex-1">
                    <button 
                      onClick={() => { setShowSymbolDropdown(!showSymbolDropdown); setShowDatePicker(false); }}
                      className={`w-full bg-white dark:bg-transparent border rounded px-3 py-1.5 text-xs flex items-center justify-between hover:border-[#787b86] transition-colors ${
                        symbolFilter ? 'border-[#2962ff] text-[#2962ff]' : 'border-[#e6e8ea] dark:border-[#2a2e39] text-[#1e2329] dark:text-[#d1d4dc]'
                      }`}
                    >
                      <span className="truncate">{symbolFilter || 'Tất cả mã...'}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#787b86]" />
                    </button>
                    {showSymbolDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                        <button 
                          onClick={() => { setSymbolFilter(''); setShowSymbolDropdown(false); }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] transition-colors ${
                            !symbolFilter ? 'text-[#2962ff] font-bold' : 'text-[#1e2329] dark:text-[#d1d4dc]'
                          }`}
                        >
                          Tất cả mã
                        </button>
                        {completedSymbols.map(sym => (
                          <button 
                            key={sym}
                            onClick={() => { setSymbolFilter(sym); setShowSymbolDropdown(false); }}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] transition-colors ${
                              symbolFilter === sym ? 'text-[#2962ff] font-bold' : 'text-[#1e2329] dark:text-[#d1d4dc]'
                            }`}
                          >
                            {sym}
                          </button>
                        ))}
                        {completedSymbols.length === 0 && (
                          <div className="px-3 py-2 text-xs text-[#787b86]">Không có mã nào</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Date Range Filter */}
                  <div className="relative flex-1">
                    <button 
                      onClick={() => { setShowDatePicker(!showDatePicker); setShowSymbolDropdown(false); }}
                      className={`w-full bg-white dark:bg-transparent border rounded px-3 py-1.5 text-xs flex items-center justify-between hover:border-[#787b86] transition-colors ${
                        (dateFrom || dateTo) ? 'border-[#2962ff] text-[#2962ff]' : 'border-[#e6e8ea] dark:border-[#2a2e39] text-[#1e2329] dark:text-[#d1d4dc]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5" />
                        {(dateFrom || dateTo) 
                          ? `${dateFrom ? new Date(dateFrom).toLocaleDateString('vi-VN', {day:'2-digit',month:'2-digit'}) : '...'} - ${dateTo ? new Date(dateTo).toLocaleDateString('vi-VN', {day:'2-digit',month:'2-digit'}) : '...'}`
                          : 'Khoảng ngày...'
                        }
                      </span>
                    </button>
                    {showDatePicker && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] rounded-lg shadow-xl z-50 p-3 space-y-2">
                        <CustomDatePicker 
                          label="Từ ngày"
                          value={dateFrom} 
                          onChange={(val) => setDateFrom(val)}
                          align="right"
                        />
                        <div className="mt-2"></div>
                        <CustomDatePicker 
                          label="Đến ngày"
                          value={dateTo} 
                          onChange={(val) => setDateTo(val)}
                          align="right"
                        />
                        <div className="flex gap-2 pt-1">
                          <button 
                            onClick={() => { setDateFrom(''); setDateTo(''); setShowDatePicker(false); }}
                            className="flex-1 text-xs text-[#787b86] hover:text-[#1e2329] dark:hover:text-[#d1d4dc] py-1.5 rounded border border-[#e6e8ea] dark:border-[#2a2e39] hover:border-[#787b86] transition-colors"
                          >
                            Xóa lọc
                          </button>
                          <button 
                            onClick={() => setShowDatePicker(false)}
                            className="flex-1 text-xs text-white bg-[#2962ff] hover:bg-[#2962ff]/90 py-1.5 rounded font-medium transition-colors"
                          >
                            Áp dụng
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner: Mở Nhật ký Giao dịch */}
                <div 
                  onClick={() => navigate('/student/journal')}
                  className="bg-[#089981]/10 border border-[#089981]/25 rounded-lg p-3 cursor-pointer hover:bg-[#089981]/15 dark:hover:bg-[#089981]/20 transition-all shrink-0 mb-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#089981] flex items-center justify-center shrink-0 shadow-sm">
                      <Edit3 className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#089981] text-xs mb-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        Mở Nhật ký Giao dịch
                      </h4>
                      <p className="text-[11px] text-[#787b86] truncate">
                        Xem lại, gắn thẻ và phân tích các phiên giao dịch
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#089981] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* List of completed session cards */}
                {completedSessions.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center pb-10">
                    <p className="font-bold text-[#787b86] text-sm">Chưa có phiên nào hoàn tất</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pb-4">
                    {completedSessions.map(session => {
                      const finalBalance = session.balance ?? session.initialBalance ?? 0;
                      const initialBal = session.initialBalance ?? finalBalance;
                      const netPnL = session.statistics?.netPnL ?? (finalBalance - initialBal);
                      const totalTrades = session.statistics?.totalTrades ?? 0;
                      const winRate = session.statistics?.winRate ?? 0;

                      return (
                        <div 
                          key={session._id} 
                          className="bg-white dark:bg-[#131722] border border-[#e6e8ea] dark:border-[#2a2e39] rounded-xl p-3 flex flex-col gap-2.5 hover:border-[#cbd5e1] dark:hover:border-[#3a4052] transition-colors shadow-sm dark:shadow-none"
                        >
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              {editingSessionId === session._id ? (
                                <form onSubmit={(e) => handleRename(session._id, e)} className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={editingName}
                                    autoFocus
                                    onChange={e => setEditingName(e.target.value)}
                                    className="bg-[#f8f9fa] dark:bg-[#1e222d] border border-blue-500 rounded px-1.5 py-0.5 text-xs text-[#1e2329] dark:text-white outline-none w-full font-bold"
                                  />
                                  <button type="submit" className="text-green-500 hover:text-green-400 p-0.5"><Check className="w-3.5 h-3.5" /></button>
                                  <button type="button" onClick={() => setEditingSessionId(null)} className="text-red-500 hover:text-red-400 p-0.5"><X className="w-3.5 h-3.5" /></button>
                                </form>
                              ) : (
                                <div className="flex items-center gap-1.5 group">
                                  <h4 className="font-bold text-[#1e2329] dark:text-white text-sm truncate" title={session.name || `${session.symbol} - ${session.timeframe || '4h'}`}>
                                    {session.name || `${session.symbol} - ${session.timeframe || '4h'}`}
                                  </h4>
                                  <button 
                                    onClick={() => { setEditingSessionId(session._id); setEditingName(session.name || `${session.symbol} - ${session.timeframe || '4h'}`); }}
                                    className="text-[#787b86] hover:text-[#1e2329] dark:hover:text-white transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                                    title="Đổi tên phiên"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                              <div className="text-[11px] text-[#787b86] font-medium mt-0.5">
                                {session.symbol} &middot; {session.timeframe || '4h'}
                              </div>
                            </div>

                            {/* Action buttons: [👁 Xem] & [🗑] */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleViewSessionDetail(session)}
                                className="bg-purple-50 hover:bg-purple-100 dark:bg-[#261f3d] dark:hover:bg-[#342756] text-purple-700 dark:text-[#b392f0] text-xs font-semibold px-2.5 py-1 rounded flex items-center gap-1 border border-purple-200 dark:border-[#6b21a8]/30 transition-all active:scale-95 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Xem</span>
                              </button>
                              <button
                                onClick={() => setDeletingSessionId(session._id)}
                                className="text-[#787b86] hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/20 p-1 rounded transition-colors cursor-pointer"
                                title="Xóa phiên"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Metrics Grid 2x2 */}
                          <div className="grid grid-cols-2 gap-y-2 text-xs">
                            <div>
                              <div className="text-[10px] text-[#787b86] uppercase font-bold tracking-wider">SỐ DƯ</div>
                              <div className="font-mono font-bold text-[#1e2329] dark:text-white text-xs mt-0.5 truncate" title={formatSessionMoney(finalBalance)}>
                                {formatSessionMoney(finalBalance)}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-[#787b86] uppercase font-bold tracking-wider">LỆNH</div>
                              <div className="font-mono font-bold text-[#1e2329] dark:text-white text-xs mt-0.5">
                                {totalTrades}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-[#787b86] uppercase font-bold tracking-wider">TỶ LỆ THẮNG</div>
                              <div className="font-mono font-bold text-[#1e2329] dark:text-white text-xs mt-0.5">
                                {winRate.toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-[#787b86] uppercase font-bold tracking-wider">LỜI / LỖ (PNL)</div>
                              <div className={`font-mono font-bold text-xs mt-0.5 truncate ${netPnL >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`} title={formatSessionPnL(netPnL)}>
                                {formatSessionPnL(netPnL)}
                              </div>
                            </div>
                          </div>

                          {/* Footer Date */}
                          <div className="flex items-center gap-1 text-[11px] text-[#787b86] pt-1.5 border-t border-[#e6e8ea] dark:border-[#2a2e39]/50">
                            <Clock className="w-3 h-3" />
                            <span>{formatSessionDate(session.completedAt || session.startedAt)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSessionId && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 px-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e222d] rounded-lg p-5 w-full border border-[#e6e8ea] dark:border-[#2a2e39] shadow-2xl flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-3 text-red-500">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-[#1e2329] dark:text-white font-bold mb-1">Xóa phiên giao dịch?</h3>
            <p className="text-xs text-[#787b86] mb-4">
              Toàn bộ lịch sử lệnh và dữ liệu của phiên này sẽ bị xóa vĩnh viễn.
            </p>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setDeletingSessionId(null)}
                className="flex-1 bg-[#f0f1f3] hover:bg-[#e6e8ea] dark:bg-[#2a2e39] dark:hover:bg-[#363a45] text-[#1e2329] dark:text-white text-xs font-bold py-2 rounded transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteSession(deletingSessionId)}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Đang xóa...' : 'Xóa phiên'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replay Warning Modal */}
      {showReplayWarning && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 px-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e222d] rounded-lg p-5 w-full border border-[#e6e8ea] dark:border-[#2a2e39] shadow-2xl flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mb-3">
              <span className="text-yellow-500 text-2xl">⚠️</span>
            </div>
            <h3 className="text-[#1e2329] dark:text-white font-bold mb-2">Hãy bật Chế độ Phát lại trước</h3>
            <p className="text-sm text-[#787b86] mb-5">
              Trading Simulator chỉ hoạt động trong chế độ Bar Replay để tránh việc nhìn thấy dữ liệu tương lai.
              <br/><br/>
              Vui lòng bật Replay trên thanh công cụ phía trên và chọn một điểm bắt đầu.
            </p>
            <div className="flex gap-2 w-full">
              <button 
                onClick={() => setShowReplayWarning(false)}
                className="flex-1 bg-[#f0f1f3] hover:bg-[#e6e8ea] dark:bg-[#2a2e39] dark:hover:bg-[#363a45] text-[#1e2329] dark:text-white font-bold py-2 rounded transition-colors text-sm cursor-pointer"
              >
                Đóng
              </button>
              <button 
                onClick={() => {
                  setShowReplayWarning(false);
                  onStartReplay?.();
                }}
                className="flex-1 bg-[#2962ff] hover:bg-[#2962ff]/90 text-white font-bold py-2 rounded transition-colors text-sm cursor-pointer"
              >
                Bật Replay ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
