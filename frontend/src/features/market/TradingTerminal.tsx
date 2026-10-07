import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChartArea } from './components/ChartArea';
import { RightSidebar } from './components/RightSidebar';
import { RightToolbar } from './components/RightToolbar';
import { WatchlistPanel, type Watchlist } from './components/WatchlistPanel';
import { SimulationPanel, type SimulationConfig } from './components/SimulationPanel';
import { CalculatorPanel } from './components/CalculatorPanel';
import { TradingJournalPanel } from './components/TradingJournalPanel';
import { LeftToolbar } from './components/LeftToolbar';
import { ToolbarNavbar } from '../../components/ToolbarNavbar';
import { ChartSettingsModal } from './components/ChartSettingsModal';
import { getWatchlists, createWatchlist as apiCreateWatchlist, updateWatchlist as apiUpdateWatchlist, deleteWatchlist as apiDeleteWatchlist } from '../../services/marketApi';
import { useAuth } from '../../contexts/AuthContext';
import { STOCKS, type Stock } from './data';
import { DEFAULT_CHART_SETTINGS, type ChartSettings } from './chartSettings';
import { SymbolSearchModal } from './components/SymbolSearchModal';
import { IndicatorModal } from './components/IndicatorModal';
import { BottomPanel } from './components/BottomPanel';
import { TickerHeader } from './components/TickerHeader';
import { CoinInfoPanel } from './components/CoinInfoPanel';
import { ContractInfoPanel } from './components/ContractInfoPanel';
import { tradingApi } from '../../services/tradingApi';
import { fetchAllMarketLivePrices, syncLiveMarketData } from '../../services/marketDataService';
import { useMarketStore } from '../../stores/useMarketStore';
import { PositionsManager } from './components/PositionsManager';
import { useSimulatorStore } from './engine/useSimulatorStore';
import { useNotificationStore } from '../../stores/useNotificationStore';
import { Trophy, RefreshCw, ChevronRight, Pause, Play, Square, X, List, ArrowLeftRight, BarChart2, Calculator, BookOpen } from 'lucide-react';
import { challengeApi } from '../../services/challengeApi';
import type { UserChallengeState, ChallengeLevelConfig } from '../challenge/types';
import { ChallengeModal } from '../challenge/ChallengeModal';
import { useModal } from '../../contexts/ModalContext';
import { AiTutorDrawer } from '../ai/AiTutorDrawer';
import { BacktestRuleCard } from './components/BacktestRuleCard';

const MAX_RESETS_PER_WEEK = 4;

export interface TradeOrder {
  id: string;
  type: 'buy' | 'sell';
  symbol: string;
  price: number;
  qty: number;
  timestamp: number;
  tp?: number;
  sl?: number;
}

export const TradingTerminal = () => {
  const { simulationId } = useParams<{ simulationId?: string }>();
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useModal();
  const [activeTool, setActiveTool] = useState<string>('cursor');
  const [selectedStock, setSelectedStock] = useState<Stock>(() => {
    if (simulationId) {
      const match = STOCKS.find(s => s.symbol.toLowerCase() === simulationId.toLowerCase());
      if (match) return match;
    }
    const saved = localStorage.getItem('lastSelectedStock');
    if (saved) {
      const match = STOCKS.find(s => s.symbol.toLowerCase() === saved.toLowerCase());
      if (match) return match;
    }
    return STOCKS[0];
  });

  const [tradeOrders, setTradeOrders] = useState<TradeOrder[]>([]);
  const [activeTimeframe, setActiveTimeframe] = useState<string>('D');
  const [balance, setBalance] = useState<number>(10_000);
  const [positions, setPositions] = useState<Record<string, { quantity: number, averagePrice: number, side: 'LONG' | 'SHORT', leverage: number, tp?: number, sl?: number }>>({});
  const store = useSimulatorStore();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isIndicatorModalOpen, setIsIndicatorModalOpen] = useState(false);
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const pendingOrdersRef = useRef(pendingOrders);
  pendingOrdersRef.current = pendingOrders;
  const closingPositionsRef = useRef<Set<string>>(new Set());
  const [tradeCount, setTradeCount] = useState(0);
  const [toast, setToast] = useState<{ msg: string, type: 'info' | 'warning' | 'success' | 'error' } | null>(null);
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);

  const [activeRightPanel, setActiveRightPanel] = useState<'watchlist' | 'order' | 'simulation' | 'calculator' | 'journal' | null>('watchlist');

  const { user, login } = useAuth();
  const { addNotification } = useNotificationStore();
  const fetchMarketData = useMarketStore(state => state.fetchMarketData);
  const currentTicker = useMarketStore(state => state.tickers[selectedStock.symbol]);

  // Khởi động polling live market data (Binance + BingX) mỗi 3 giây
  useEffect(() => {
    fetchMarketData(); // gọi ngay lần đầu
    const interval = setInterval(fetchMarketData, 3000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  // Luôn đồng bộ selectedStock với ticker 24h thực tế từ các sàn
  useEffect(() => {
    if (currentTicker && currentTicker.price > 0) {
      setSelectedStock(prev => {
        if (prev.symbol !== currentTicker.symbol && `${prev.symbol}.P` !== currentTicker.symbol) return prev;
        const currentP = prev.price || currentTicker.price;
        const chg = currentTicker.openPrice ? (currentP - currentTicker.openPrice) : currentTicker.change;
        const pct = currentTicker.openPrice ? ((currentP - currentTicker.openPrice) / currentTicker.openPrice) * 100 : currentTicker.percent;
        return {
          ...prev,
          price: currentP,
          change: chg,
          percent: pct,
          type: chg >= 0 ? 'up' : 'down',
          volume24h: currentTicker.quoteVolume24h || prev.volume24h,
        };
      });
    }
  }, [currentTicker]);

  const [watchlists, setWatchlists] = useState<Watchlist[]>(() => {
    try {
      const saved = localStorage.getItem('watchlists');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.map((w: any) => ({
            ...w,
            symbols: (w.symbols || []).filter((sym: string) => STOCKS.some(s => s.symbol.toUpperCase() === sym.toUpperCase()))
          })).filter((w: any) => w.symbols.length > 0);
          if (cleaned.length > 0) return cleaned;
        }
      }
    } catch { }
    return [{ id: '1', name: 'Danh sách của tôi', symbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'] }];
  });

  // Fetch watchlists from API if user is logged in
  useEffect(() => {
    const fetchAPI = async () => {
      if (user) {
        try {
          const data = await getWatchlists();
          if (data && data.length > 0) {
            // map _id to id if needed
            const mapped = data.map((w: any) => ({ ...w, id: w._id || w.id }));
            setWatchlists(mapped);
          }
        } catch (error) {
          console.error("Failed to fetch watchlists", error);
        }
      }
    };
    fetchAPI();
  }, [user]);

  useEffect(() => {
    // Only save to local storage if NOT logged in, otherwise let API handle it.
    // Actually, saving to localStorage as a fallback is fine.
    if (!user) {
      localStorage.setItem('watchlists', JSON.stringify(watchlists));
    }
  }, [watchlists, user]);

  const [activeWatchlistId, setActiveWatchlistId] = useState<string>(watchlists[0]?.id || '1');

  const handleUpdateWatchlist = async (id: string, symbols: string[]) => {
    setWatchlists(prev => prev.map(w => w.id === id ? { ...w, symbols } : w));

    if (user) {
      try {
        await apiUpdateWatchlist(id, { symbols });
      } catch (error) {
        console.error("Failed to update watchlist on server", error);
      }
    }
  };

  const handleCreateWatchlist = async (name: string) => {
    const tempId = Date.now().toString();
    const newWatchlist = { id: tempId, name, symbols: [] };
    setWatchlists(prev => [...prev, newWatchlist]);
    setActiveWatchlistId(tempId);

    if (user) {
      try {
        const created = await apiCreateWatchlist({ name, symbols: [] });
        // Replace tempId with actual DB id
        const realId = (created as any)._id || created.id;
        setWatchlists(prev => prev.map(w => w.id === tempId ? { ...w, id: realId } : w));
        setActiveWatchlistId(realId);
      } catch (error) {
        console.error("Failed to create watchlist on server", error);
      }
    }
  };

  const handleDeleteWatchlist = async (id: string) => {
    setWatchlists(prev => prev.filter(w => w.id !== id));
    if (activeWatchlistId === id) {
      setActiveWatchlistId(watchlists.find(w => w.id !== id)?.id || watchlists[0]?.id || '');
    }

    if (user) {
      try {
        await apiDeleteWatchlist(id);
      } catch (error) {
        console.error("Failed to delete watchlist on server", error);
      }
    }
  };

  const handleRenameWatchlist = async (id: string, newName: string) => {
    setWatchlists(prev => prev.map(w => w.id === id ? { ...w, name: newName } : w));

    if (user) {
      try {
        await apiUpdateWatchlist(id, { name: newName });
      } catch (error) {
        console.error("Failed to rename watchlist on server", error);
      }
    }
  };

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [chartSettings, setChartSettings] = useState<ChartSettings>(() => {
    try {
      const saved = localStorage.getItem('chartSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_CHART_SETTINGS,
          ...parsed,
          symbol: { ...DEFAULT_CHART_SETTINGS.symbol, ...(parsed.symbol || {}) },
          status: { ...DEFAULT_CHART_SETTINGS.status, ...(parsed.status || {}) },
          scales: { ...DEFAULT_CHART_SETTINGS.scales, ...(parsed.scales || {}) },
          canvas: { ...DEFAULT_CHART_SETTINGS.canvas, ...(parsed.canvas || {}) },
          alerts: { ...DEFAULT_CHART_SETTINGS.alerts, ...(parsed.alerts || {}) },
          events: { ...DEFAULT_CHART_SETTINGS.events, ...(parsed.events || {}) },
          candle: { ...DEFAULT_CHART_SETTINGS.candle, ...(parsed.candle || {}) },
        };
      }
      return DEFAULT_CHART_SETTINGS;
    } catch {
      return DEFAULT_CHART_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem('chartSettings', JSON.stringify(chartSettings));
  }, [chartSettings]);

  const handleToggleIndicator = (name: string) => {
    setActiveIndicators(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  // Toggles for lower toolbar buttons
  const [magnetMode, setMagnetMode] = useState(false);
  const [magnetType, setMagnetType] = useState<'weak' | 'strong'>('strong');
  const [stayInDrawingMode, setStayInDrawingMode] = useState(false);
  const [lockDrawing, setLockDrawing] = useState(false);
  const [hideDrawing, setHideDrawing] = useState(false);

  // Keyboard modifiers
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  useEffect(() => {
    let isMouseDown = false;
    const handleMouseDown = () => { isMouseDown = true; };
    const handleMouseUp = () => { isMouseDown = false; };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsCtrlPressed(true);
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
        // Attach to window object for ChartArea to access
        (window as any)._isShiftPressed = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsCtrlPressed(false);
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
        (window as any)._isShiftPressed = false;
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const effectiveMagnetMode = magnetMode !== isCtrlPressed;

  const showToast = (msg: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Bar Replay state
  const [isReplaying, setIsReplaying] = useState(false);
  const [isSelectingReplayStart, setIsSelectingReplayStart] = useState(false);
  const [replayTime, setReplayTime] = useState<number | null>(null);
  const [replayPrice, setReplayPrice] = useState<number | null>(null);
  const [replayStepTrigger, setReplayStepTrigger] = useState(0);
  const [replayPrevStepTrigger, setReplayPrevStepTrigger] = useState(0);
  const [replayReloadTrigger, setReplayReloadTrigger] = useState(0);
  const [totalBars, setTotalBars] = useState(1000);
  const [goToRealtimeTrigger, setGoToRealtimeTrigger] = useState(0);

  // Added missing states
  const [activeTab, setActiveTab] = useState<'chart' | 'coin_info' | 'info'>('chart');
  const [previewTPSL, setPreviewTPSL] = useState<{ tp?: number; sl?: number; side?: 'LONG' | 'SHORT'; enabled: boolean; orderPrice?: number; orderType?: 'LIMIT' | 'STOP'; quantity?: number; lot?: number; actualQty?: number } | null>(null);
  const [draggedTPSL, setDraggedTPSL] = useState<{ tp?: number; sl?: number; orderPrice?: number } | null>(null);

  const handleToolClick = (toolName: string) => {
    if (toolName === activeTool && toolName !== 'cursor') {
      setActiveTool('cursor');
      setTimeout(() => setActiveTool(toolName), 10);
    } else {
      setActiveTool(toolName);
    }
  };

  // Undo / Redo triggers & state
  const [undoTrigger, setUndoTrigger] = useState(0);
  const [redoTrigger, setRedoTrigger] = useState(0);
  const [undoRedoState, setUndoRedoState] = useState({ canUndo: false, canRedo: false });

  // Authentication & 6-Level Prop Trading Challenge State (100% Backend Sync)
  const [challengeLevels, setChallengeLevels] = useState<ChallengeLevelConfig[]>([]);
  const [challengeState, setChallengeState] = useState<UserChallengeState>({
    currentLevel: 1,
    unlockedLevels: [1],
    status: 'NOT_STARTED',
    startingCapitalUSD: 10_000,
    dayStartEquityUSD: 10_000,
    currentEquityUSD: 10_000,
    currentBalanceUSD: 10_000,
    totalProfitUSD: 0,
    dailyLossUSD: 0,
    maxLossUSD: 0,
    tradingDaysCount: 0,
    tradingDates: [],
    resetsUsedThisWeek: 0,
    weekResetTimestamp: 0,
    certificates: [],
  });
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [isAiTutorOpen, setIsAiTutorOpen] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('challenge') === 'true' || searchParams.get('openChallenge') === 'true') {
      setIsChallengeModalOpen(true);
    }
  }, [searchParams]);

  // Store backtest rules when launching Bar Replay from AI Tutor
  const [activeBacktestRules, setActiveBacktestRules] = useState<{
    strategy: string;
    symbol: string;
    timeframe: string;
    entryRule: string;
    stopLossRule: string;
    takeProfitRule: string;
    invalidationRule?: string;
  } | null>(null);

  // Tải cấu hình cấp độ từ Backend API
  useEffect(() => {
    challengeApi.getLevels().then(res => {
      if (res && res.success && res.levels) {
        setChallengeLevels(res.levels);
      }
    }).catch(err => {
      console.warn('Lỗi tải cấp độ từ backend:', err);
    });
  }, []);

  const currentChallengeLevel = challengeLevels.find(l => l.id === challengeState.currentLevel) || challengeLevels[0] || {
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

  const isChallengeActive = challengeState.status === 'ACTIVE' || challengeState.status === 'PAUSED';

  // Tính toán Cấp độ cao nhất tài khoản đã đạt được (để hiển thị khi không trong bài thi)
  const maxCertLevel = challengeState.certificates && challengeState.certificates.length > 0
    ? Math.max(...challengeState.certificates.map(c => c.levelId))
    : 0;
  const maxUnlockedLevel = challengeState.unlockedLevels && challengeState.unlockedLevels.length > 0
    ? Math.max(...challengeState.unlockedLevels)
    : 1;
  const accountRankLevelId = Math.max(maxCertLevel, maxUnlockedLevel);
  const accountRankConfig = challengeLevels.find(l => l.id === accountRankLevelId) || {
    id: accountRankLevelId,
    levelName: accountRankLevelId === 6 ? 'Bậc Thầy' : `Level ${accountRankLevelId}`,
    badge: `Cấp ${accountRankLevelId}`
  };

  useEffect(() => {
    if (simulationId) {
      const match = STOCKS.find(s => s.symbol.toLowerCase() === simulationId.toLowerCase());
      if (match) {
        if (match.symbol !== selectedStock.symbol) {
          setSelectedStock(match);
        }
      } else {
        // If simulationId is not in STOCKS (e.g. outdated /trade/fpt link) -> redirect to default valid stock
        navigate(`/trade/${STOCKS[0].symbol.toLowerCase()}`, { replace: true });
      }
    }
  }, [simulationId, selectedStock.symbol, navigate]);

  useEffect(() => {
    if (selectedStock?.symbol) {
      localStorage.setItem('lastSelectedStock', selectedStock.symbol.toLowerCase());
    }
  }, [selectedStock]);

  const handleStockSelect = (stock: Stock) => {
    const liveStock = useMarketStore.getState().stocks.find(s => s.symbol.toUpperCase() === stock.symbol.toUpperCase()) || stock;
    setSelectedStock(liveStock);
    setPreviewTPSL(null);
    setDraggedTPSL(null);
    localStorage.setItem('lastSelectedStock', stock.symbol.toLowerCase());
    navigate(`/trade/${stock.symbol.toLowerCase()}`, { replace: true });
    if (isReplaying || isSelectingReplayStart) {
      setIsReplaying(false);
      setIsSelectingReplayStart(false);
      setReplayTime(null);
    }
  };

  const fetchPortfolio = async (targetUserId?: string) => {
    const uid = targetUserId || user?._id;
    if (!uid) {
      setPositions({});
      setPendingOrders([]);
      setTradeOrders([]);
      return;
    }
    try {
      const res = await tradingApi.getPortfolio(uid);
      if (res.success && res.data) {
        if (res.data.wallet) {
          setBalance(res.data.wallet.availableBalance);
        }
        if (res.data.holdings && Array.isArray(res.data.holdings)) {
          const newPositions: Record<string, { quantity: number, averagePrice: number, side: 'LONG' | 'SHORT', leverage: number, tp?: number, sl?: number }> = {};
          res.data.holdings.forEach((h: any) => {
            newPositions[h.symbol] = { quantity: h.quantity, averagePrice: h.averagePrice, side: h.side, leverage: h.leverage, tp: h.tp, sl: h.sl };
          });
          setPositions(newPositions);
        } else {
          setPositions({});
        }
        if (res.data.pendingOrders && Array.isArray(res.data.pendingOrders)) {
          setPendingOrders(res.data.pendingOrders);
        } else {
          setPendingOrders([]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch portfolio', e);
    }
  };

  // Khi user đăng nhập hoặc đổi tài khoản, nạp đúng tiến trình thi từ Backend API
  useEffect(() => {
    if (user?._id) {
      challengeApi.getMyChallenge().then(async (res) => {
        if (res.success && res.challenge) {
          setChallengeState(res.challenge);
          if (res.challenge.status === 'ACTIVE' || res.challenge.status === 'PAUSED') {
            setBalance(res.challenge.currentBalanceUSD || res.challenge.startingCapitalUSD);
          }
          await fetchPortfolio(user._id);
        }
      }).catch(err => {
        console.warn('Backend getMyChallenge error:', err);
      });
      fetchPortfolio(user._id);
    } else {
      setPositions({});
      setPendingOrders([]);
      setTradeOrders([]);
      setBalance(100_000_000);
      store.reset();
      setChallengeState({
        currentLevel: 1,
        unlockedLevels: [1],
        status: 'NOT_STARTED',
        startingCapitalUSD: 10_000,
        dayStartEquityUSD: 10_000,
        currentEquityUSD: 10_000,
        currentBalanceUSD: 10_000,
        totalProfitUSD: 0,
        dailyLossUSD: 0,
        maxLossUSD: 0,
        tradingDaysCount: 0,
        tradingDates: [],
        resetsUsedThisWeek: 0,
        weekResetTimestamp: 0,
        certificates: [],
      });
    }
  }, [user?._id]);

  // Ensure simulator store receives valid price immediately when active
  useEffect(() => {
    if (store.isActive && store.session && selectedStock?.price > 0) {
      if (store.currentPrice === 0) {
        const simTime = (isReplaying && replayTime)
          ? new Date(replayTime).toISOString()
          : (store.currentTime || store.session.replayCurrentTime || store.session.replayStartTime || new Date().toISOString());
        store.tick(selectedStock.price, simTime);
      }
    }
  }, [store.isActive, store.session, selectedStock?.price, store.currentPrice, isReplaying, replayTime]);

  const calculateUnrealizedPnL = () => {
    let totalPnL = 0;
    Object.entries(positions).forEach(([sym, pos]) => {
      const currentPrice = sym === selectedStock.symbol ? selectedStock.price : (STOCKS.find(s => s.symbol === sym)?.price || pos.averagePrice);
      const diff = pos.side === 'LONG' ? (currentPrice - pos.averagePrice) : (pos.averagePrice - currentPrice);
      totalPnL += diff * pos.quantity;
    });
    return totalPnL;
  };

  // Đánh giá chỉ số rủi ro thời gian thực qua Backend Service
  useEffect(() => {
    if (challengeState.status === 'ACTIVE' && user?._id) {
      const uPnL = calculateUnrealizedPnL();
      challengeApi.evaluateRisk(uPnL, false).then(res => {
        if (res && res.success && res.challenge) {
          if (res.challenge.status !== challengeState.status || res.challenge.totalProfitUSD !== challengeState.totalProfitUSD) {
            setChallengeState(res.challenge);
            if (res.challenge.status === 'FAILED') {
              showToast(`❌ Bài thi đã vi phạm: ${res.challenge.breachReason}`, 'warning');
            } else if (res.challenge.status === 'PASSED') {
              showToast(`🏆 CHÚC MỪNG! Bạn đã hoàn thành xuất sắc bài thi Level ${res.challenge.currentLevel}!`, 'info');
            }
          }
        }
      }).catch(err => {
        console.error('Lỗi đánh giá rủi ro từ backend:', err);
      });
    }
  }, [selectedStock.price, positions, user?._id]);

  // Tự động đóng lệnh ngay tức khắc trong Bar Replay khi giá nến cắn Chốt lời (TP) hoặc Cắt lỗ (SL)
  const checkReplayTriggers = async (
    symbol: string,
    price: number,
    bar?: { open: number; high: number; low: number; close: number; timestamp: number }
  ) => {
    if (!user?._id) return;

    const pos = positionsRef.current[symbol];
    if (pos && !closingPositionsRef.current.has(symbol)) {
      const high = bar ? Math.max(bar.high, price) : price;
      const low = bar ? Math.min(bar.low, price) : price;
      let hitReason: 'TP' | 'SL' | null = null;
      let triggerPrice = price;

      if (pos.side === 'LONG') {
        if (pos.sl && low <= pos.sl && pos.tp && high >= pos.tp) {
          if (bar && Math.abs(bar.open - pos.sl) < Math.abs(bar.open - pos.tp)) {
            hitReason = 'SL';
            triggerPrice = pos.sl;
          } else {
            hitReason = 'TP';
            triggerPrice = pos.tp;
          }
        } else if (pos.tp && high >= pos.tp) {
          hitReason = 'TP';
          triggerPrice = pos.tp;
        } else if (pos.sl && low <= pos.sl) {
          hitReason = 'SL';
          triggerPrice = pos.sl;
        }
      } else if (pos.side === 'SHORT') {
        if (pos.sl && high >= pos.sl && pos.tp && low <= pos.tp) {
          if (bar && Math.abs(bar.open - pos.sl) < Math.abs(bar.open - pos.tp)) {
            hitReason = 'SL';
            triggerPrice = pos.sl;
          } else {
            hitReason = 'TP';
            triggerPrice = pos.tp;
          }
        } else if (pos.tp && low <= pos.tp) {
          hitReason = 'TP';
          triggerPrice = pos.tp;
        } else if (pos.sl && high >= pos.sl) {
          hitReason = 'SL';
          triggerPrice = pos.sl;
        }
      }

      if (hitReason) {
        closingPositionsRef.current.add(symbol);
        const isTP = hitReason === 'TP';
        const label = isTP ? 'Chốt lời (TP)' : 'Cắt lỗ (SL)';

        // 1. Đóng ngay lập tức trên UI (Optimistic Update) để lệnh tự đóng liền
        setPositions(prev => {
          const next = { ...prev };
          delete next[symbol];
          return next;
        });

        // 2. Cập nhật số dư tiền mặt tức thì
        const pnl = pos.side === 'LONG'
          ? (triggerPrice - pos.averagePrice) * pos.quantity
          : (pos.averagePrice - triggerPrice) * pos.quantity;
        const returnedMargin = (pos.averagePrice * pos.quantity) / (pos.leverage || 1);
        setBalance(prev => Math.max(0, prev + pnl + returnedMargin));

        // 3. Thông báo tức thì
        showToast(
          `${isTP ? '🎯' : '🛑'} [Bar Replay] Vị thế ${pos.side} ${symbol} đã cắn ${label} tại giá $${triggerPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}!`,
          isTP ? 'success' : 'warning'
        );
        addNotification?.({
          title: `${isTP ? '🎯 Khớp Chốt Lời' : '🛑 Khớp Cắt Lỗ'} (Replay)`,
          message: `Vị thế ${pos.side} ${symbol} đã tự động đóng tại giá $${triggerPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Lợi nhuận: ${pnl >= 0 ? '+' : '-'}$${Math.abs(pnl).toFixed(2)}`,
          type: isTP ? 'success' : 'warning'
        });

        // 4. Lưu vào database backend
        tradingApi.closePosition(symbol, pos.side, triggerPrice, undefined, user._id)
          .then(async (res) => {
            if (res && res.success) {
              await fetchPortfolio(user._id);
              setTradeCount(c => c + 1);
              useNotificationStore.getState().fetchNotifications();
            }
          })
          .catch((err) => {
            console.error('Lỗi lưu đóng vị thế Replay về backend:', err);
          })
          .finally(() => {
            setTimeout(() => {
              closingPositionsRef.current.delete(symbol);
            }, 1000);
          });
      }
    }

    // Tự động khớp các lệnh chờ Limit / Stop trong Bar Replay
    const pendings = pendingOrdersRef.current.filter(o => o.symbol === symbol && o.status === 'PENDING');
    for (const ord of pendings) {
      const key = `order_${ord._id}`;
      if (closingPositionsRef.current.has(key)) continue;

      const high = bar ? Math.max(bar.high, price) : price;
      const low = bar ? Math.min(bar.low, price) : price;
      let shouldFill = false;
      let fillPrice = ord.price;

      if (ord.type === 'LIMIT') {
        if (ord.side === 'LONG' && low <= ord.price) { shouldFill = true; fillPrice = ord.price; }
        if (ord.side === 'SHORT' && high >= ord.price) { shouldFill = true; fillPrice = ord.price; }
      } else if (ord.type === 'STOP') {
        if (ord.side === 'LONG' && high >= ord.price) { shouldFill = true; fillPrice = ord.price; }
        if (ord.side === 'SHORT' && low <= ord.price) { shouldFill = true; fillPrice = ord.price; }
      }

      if (shouldFill) {
        closingPositionsRef.current.add(key);
        tradingApi.checkTriggers({ [symbol]: fillPrice }, user._id)
          .then(async () => {
            await fetchPortfolio(user._id);
            setTradeCount(c => c + 1);
            showToast(`⚡ [Bar Replay] Lệnh chờ ${ord.side} ${ord.type} ${symbol} đã khớp tại giá $${fillPrice.toLocaleString('en-US')}`, 'info');
          })
          .catch((e) => {
            console.error('Lỗi khớp lệnh chờ Replay:', e);
          })
          .finally(() => {
            setTimeout(() => {
              closingPositionsRef.current.delete(key);
            }, 1000);
          });
      }
    }
  };

  // Tự động kiểm tra TP/SL ngay khi vị thế mới được mở hoặc cập nhật trong lúc Replay đang chạy
  useEffect(() => {
    if (isReplaying && (replayPrice || selectedStock.price)) {
      checkReplayTriggers(selectedStock.symbol, replayPrice || selectedStock.price);
    }
  }, [positions, isReplaying]);

  // Kiểm tra Real-time TP/SL/Lệnh chờ mỗi khi giá thay đổi (~1s) - Chỉ áp dụng cho Live Trading
  useEffect(() => {
    if (!user?._id) return;
    if (isReplaying) return; // Bar Replay đã được xử lý ngay lập tức từng nến qua checkReplayTriggers

    const checkTriggers = async () => {
      const priceMap: Record<string, number> = {};
      STOCKS.forEach(s => {
        priceMap[s.symbol] = s.symbol === selectedStock.symbol ? selectedStock.price : s.price;
      });

      try {
        if (Date.now() - (window as any).lastMarketFetchTime > 3000 || !(window as any).lastMarketFetchTime) {
          (window as any).lastMarketFetchTime = Date.now();
          const livePrices = await fetchAllMarketLivePrices();
          (window as any).cachedMarketPrices = livePrices;
          syncLiveMarketData(STOCKS);
        }
      } catch (err) { }

      // Ghi đè toàn bộ giá Live đa sàn (Binance, BingX) để tránh việc gửi giá cũ lên server gây cắt lỗ oan
      if ((window as any).cachedMarketPrices) {
        const cached = (window as any).cachedMarketPrices;
        Object.keys(priceMap).forEach(sym => {
          if (cached[sym]) priceMap[sym] = cached[sym];
        });
        Object.keys(positions).forEach(sym => {
          if (cached[sym]) priceMap[sym] = cached[sym];
        });
        pendingOrders.forEach(o => {
          if (cached[o.symbol]) priceMap[o.symbol] = cached[o.symbol];
        });
      }

      // Đảm bảo giá của mã đang xem luôn chính xác nhất từng tick (từ WebSocket)
      // TUY NHIÊN: Chỉ lấy nếu giá đã được WebSocket cập nhật (khác với giá ảo ban đầu 64200.5)
      const defaultStock = STOCKS.find(s => s.symbol === selectedStock.symbol);
      if (defaultStock && selectedStock.price !== defaultStock.price) {
        priceMap[selectedStock.symbol] = selectedStock.price;
      }

      tradingApi.checkTriggers(priceMap, user._id)
        .then(res => {
          if (res && res.processed > 0) {
            fetchPortfolio(user._id);
            setTradeCount(c => c + 1);
            useNotificationStore.getState().fetchNotifications();
            if (res.messages && Array.isArray(res.messages)) {
              res.messages.forEach((msg: string, i: number) => {
                setTimeout(() => showToast(msg, 'success'), i * 800);
              });
            }
          }
        })
        .catch(() => {
          // silent catch
        });
    };
    checkTriggers();
  }, [user?._id, selectedStock.price, selectedStock.symbol, positions, pendingOrders, isReplaying]);

  const handleChallengeStateUpdate = async (newState: UserChallengeState) => {
    setChallengeState(newState);
    if (newState.status === 'ACTIVE' || newState.status === 'PAUSED') {
      // Khi bắt đầu hoặc reset bài thi: Lập tức đặt số dư tương ứng với cấp độ đó và dọn trắng vị thế
      setBalance(newState.currentBalanceUSD || newState.startingCapitalUSD);
      setPositions({});
      setPendingOrders([]);
    }
    await fetchPortfolio(user?._id);
  };

  const handlePauseChallenge = async () => {
    try {
      const res = await challengeApi.pauseChallenge();
      if (res.success && res.challenge) {
        setChallengeState(res.challenge);
        showAlert({
          title: 'Tạm dừng bài thi',
          message: '⏸️ Đã tạm dừng bài thi cấp vốn. Giám sát rủi ro tạm thời được hoãn.',
          type: 'info'
        });
      }
    } catch (e: any) {
      showAlert({
        title: 'Lỗi tạm dừng bài thi',
        message: `Lỗi: ${e.message}`,
        type: 'error'
      });
    }
  };

  const handleResumeChallenge = async () => {
    try {
      const res = await challengeApi.resumeChallenge();
      if (res.success && res.challenge) {
        setChallengeState(res.challenge);
        showAlert({
          title: 'Tiếp tục bài thi',
          message: '▶️ Đã tiếp tục bài thi cấp vốn!',
          type: 'success'
        });
      }
    } catch (e: any) {
      showAlert({
        title: 'Lỗi tiếp tục bài thi',
        message: `Lỗi: ${e.message}`,
        type: 'error'
      });
    }
  };

  const handleEndChallenge = async () => {
    const confirmed = await showConfirm({
      title: 'Xác nhận kết thúc bài thi',
      message: 'Bạn có chắc chắn muốn KẾT THÚC bài thi này để quay về trạng thái tài khoản thường không?',
      type: 'danger',
      confirmText: 'Kết thúc bài thi',
      cancelText: 'Hủy bỏ',
    });
    if (!confirmed) {
      return;
    }
    try {
      const res = await challengeApi.endChallenge();
      if (res.success && res.challenge) {
        setChallengeState(res.challenge);
        setPositions({});
        setPendingOrders([]);
        await fetchPortfolio(user?._id); // Khôi phục lại 100% số dư và vị thế tài khoản thường trước khi thi
        showAlert({
          title: 'Đã kết thúc bài thi',
          message: '⏹️ Đã kết thúc bài thi cấp vốn. Đã khôi phục đầy đủ số dư và vị thế tài khoản thường của bạn!',
          type: 'success'
        });
      }
    } catch (e: any) {
      showAlert({
        title: 'Lỗi kết thúc bài thi',
        message: `Lỗi: ${e.message}`,
        type: 'error'
      });
    }
  };

  const handleUndo = () => {
    if (undoRedoState.canUndo) {
      setUndoTrigger(t => t + 1);
    }
  };

  const handleRedo = () => {
    if (undoRedoState.canRedo) {
      setRedoTrigger(t => t + 1);
    }
  };

  // Keyboard shortcut listener (Ctrl+Z: Undo, Ctrl+Y: Redo, Shift+ArrowRight: Replay Next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // Replay Next Step (Shift + ArrowRight)
      if (e.shiftKey && e.key === 'ArrowRight' && isReplaying) {
        e.preventDefault();
        e.stopPropagation();
        handleReplayNext();
        return;
      }

      // Replay Prev Step (Shift + ArrowLeft)
      if (e.shiftKey && e.key === 'ArrowLeft' && isReplaying) {
        e.preventDefault();
        e.stopPropagation();
        handleReplayPrev();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        handleUndo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        handleRedo();
      }
    };
    // Use capture phase (true) to intercept the event before it reaches klinecharts canvas
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [undoRedoState.canUndo, undoRedoState.canRedo, isReplaying]);

  const handleTPSLDragChange = (type: 'tp' | 'sl' | 'orderPrice', price: number) => {
    if (store.isActive && store.session) {
      const activeSimPos = store.positions.find(
        p => p.symbol?.toUpperCase() === selectedStock.symbol?.toUpperCase()
      );
      if (activeSimPos) {
        if (type === 'tp') {
          store.updateTPSL(activeSimPos.id, activeSimPos.sl, price);
        } else if (type === 'sl') {
          store.updateTPSL(activeSimPos.id, price, activeSimPos.tp);
        }
        return;
      }
    }
    setPreviewTPSL(prev => prev ? { ...prev, [type]: price } : { enabled: true, [type]: price });
    setDraggedTPSL(prev => ({ ...prev, [type]: price }));
  };

  // Clear preview and dragged TP/SL when simulator position closes
  const prevSimPosRef = useRef<boolean>(false);
  useEffect(() => {
    if (store.isActive && store.session) {
      const hasSimPos = store.positions.some(
        p => p.symbol?.toUpperCase() === selectedStock.symbol?.toUpperCase()
      );
      if (prevSimPosRef.current && !hasSimPos) {
        setPreviewTPSL(null);
        setDraggedTPSL(null);
      }
      prevSimPosRef.current = hasSimPos;
    } else {
      prevSimPosRef.current = false;
    }
  }, [store.isActive, store.session, store.positions, selectedStock.symbol]);

  // Clear preview and dragged TP/SL when live position closes
  const prevLivePosRef = useRef<boolean>(false);
  useEffect(() => {
    const hasLivePos = !!positions[selectedStock.symbol] && (positions[selectedStock.symbol]?.quantity || 0) > 0;
    if (prevLivePosRef.current && !hasLivePos) {
      setPreviewTPSL(null);
      setDraggedTPSL(null);
    }
    prevLivePosRef.current = hasLivePos;
  }, [positions, selectedStock.symbol]);

  const handlePriceChange = (newPrice: number) => {
    setSelectedStock(prev => prev.price === newPrice ? prev : { ...prev, price: newPrice });
  };

  const handleTrade = async (type: 'buy' | 'sell' | 'close' | 'limit_buy' | 'limit_sell' | 'stop_buy' | 'stop_sell', price: number, margin: number, leverage: number, tp?: number, sl?: number) => {
    if (!user) {
      login();
      return { success: false, message: 'Vui lòng đăng nhập để thực hiện giao dịch' };
    }
    try {
      if (type === 'close') {
        const pos = positions[selectedStock.symbol];
        if (!pos) return { success: false, message: 'Không có vị thế để đóng' };

        const res = await tradingApi.closePosition(selectedStock.symbol, pos.side, price, undefined, user._id);
        if (res.success) {
          await fetchPortfolio();
          setTradeCount(c => c + 1);
          setPreviewTPSL(null);
          setDraggedTPSL(null);
          addNotification?.({ title: 'Đóng vị thế', message: `Đã chốt vị thế ${pos.side} mã ${selectedStock.symbol} thành công.`, type: 'success' });
          return { success: true, message: `✅ Đã chốt vị thế ${pos.side} thành công` };
        }
      } else if (type === 'limit_buy' || type === 'limit_sell') {
        const side = type === 'limit_buy' ? 'LONG' : 'SHORT';
        const res = await tradingApi.placeLimitOrder(selectedStock.symbol, side, price, margin, leverage, sl, tp, 'LIMIT', user._id);
        if (res.success) {
          await fetchPortfolio();
          setTradeCount(c => c + 1);
          addNotification?.({ title: 'Đặt lệnh Limit', message: `Lệnh ${side} Limit mã ${selectedStock.symbol} tại giá ${price.toLocaleString('vi-VN')} đã được đặt.`, type: 'info' });
          return { success: true, message: res.message };
        }
      } else if (type === 'stop_buy' || type === 'stop_sell') {
        const side = type === 'stop_buy' ? 'LONG' : 'SHORT';
        const res = await tradingApi.placeLimitOrder(selectedStock.symbol, side, price, margin, leverage, sl, tp, 'STOP', user._id);
        if (res.success) {
          await fetchPortfolio();
          setTradeCount(c => c + 1);
          addNotification?.({ title: 'Đặt lệnh Stop', message: `Lệnh ${side} Stop mã ${selectedStock.symbol} tại giá ${price.toLocaleString('vi-VN')} đã được đặt.`, type: 'info' });
          return { success: true, message: res.message };
        }
      } else if (type === 'buy') {
        const qty = (margin * leverage) / price;
        // Optimistic update so activePosition and chart overlays don't flicker or disappear
        setPositions(prev => ({
          ...prev,
          [selectedStock.symbol]: {
            quantity: qty,
            averagePrice: price,
            side: 'LONG',
            leverage,
            tp,
            sl
          }
        }));
        const res = await tradingApi.buyStock(selectedStock.symbol, margin, leverage, price, sl, tp, user._id);
        if (res.success) {
          await fetchPortfolio();
          const order: TradeOrder = {
            id: `${Date.now()}-${Math.random()}`,
            type, symbol: selectedStock.symbol, price, qty, timestamp: Date.now(), tp, sl,
          };
          setTradeOrders(prev => [...prev, order]);
          setTradeCount(c => c + 1);
          addNotification?.({ title: 'Mở vị thế LONG', message: `Đã mở LONG ${selectedStock.symbol} tại giá ${price.toLocaleString('vi-VN')} đòn bẩy ${leverage}x.`, type: 'success' });
          return { success: true, message: `✅ Mở LONG ${selectedStock.symbol} thành công` };
        }
      } else if (type === 'sell') {
        const qty = (margin * leverage) / price;
        // Optimistic update so activePosition and chart overlays don't flicker or disappear
        setPositions(prev => ({
          ...prev,
          [selectedStock.symbol]: {
            quantity: qty,
            averagePrice: price,
            side: 'SHORT',
            leverage,
            tp,
            sl
          }
        }));
        const res = await tradingApi.sellStock(selectedStock.symbol, margin, leverage, price, sl, tp, user._id);
        if (res.success) {
          await fetchPortfolio();
          const order: TradeOrder = {
            id: `${Date.now()}-${Math.random()}`,
            type, symbol: selectedStock.symbol, price, qty, timestamp: Date.now(), tp, sl,
          };
          setTradeOrders(prev => [...prev, order]);
          setTradeCount(c => c + 1);
          addNotification?.({ title: 'Mở vị thế SHORT', message: `Đã mở SHORT ${selectedStock.symbol} tại giá ${price.toLocaleString('vi-VN')} đòn bẩy ${leverage}x.`, type: 'success' });
          return { success: true, message: `✅ Mở SHORT ${selectedStock.symbol} thành công` };
        }
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Giao dịch thất bại' };
    }
    return { success: false, message: 'Lỗi không xác định' };
  };

  const handleCancelOrder = async (orderId: string) => {
    const confirmed = await showConfirm({
      title: 'Xác nhận hủy lệnh',
      message: 'Bạn có chắc chắn muốn hủy lệnh chờ này không?',
      type: 'warning',
      confirmText: 'Hủy lệnh',
      cancelText: 'Quay lại',
    });
    if (!confirmed) return;

    try {
      const res = await tradingApi.cancelLimitOrder(orderId, user?._id);
      if (res.success) {
        await fetchPortfolio();
        setTradeCount(c => c + 1);
        showToast('Đã hủy lệnh chờ thành công!', 'info');
        addNotification?.({ title: 'Hủy lệnh', message: `Lệnh chờ đã bị hủy.`, type: 'warning' });
        showAlert({
          title: 'Hủy lệnh',
          message: 'Đã hủy lệnh chờ thành công!',
          type: 'success'
        });
      }
    } catch (e: any) {
      showToast(e.message || 'Hủy lệnh thất bại', 'warning');
      showAlert({
        title: 'Hủy lệnh thất bại',
        message: e.message || 'Hủy lệnh thất bại',
        type: 'error'
      });
    }
  };

  const handleUpdateTPSL = async (tp?: number, sl?: number) => {
    try {
      const pos = positions[selectedStock.symbol];
      if (!pos) return { success: false, message: 'Không có vị thế' };

      const res = await tradingApi.updateTPSL(selectedStock.symbol, pos.side, tp, sl, user?._id);
      if (res.success) {
        await fetchPortfolio();
        addNotification?.({ title: 'Cập nhật TP/SL', message: `Đã cập nhật Chốt lời/Cắt lỗ cho vị thế ${pos.side} mã ${selectedStock.symbol}.`, type: 'info' });
        return { success: true, message: `✅ Đã cập nhật TP/SL` };
      }
      return { success: false, message: 'Lỗi cập nhật' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Lỗi hệ thống' };
    }
  };

  const handleCloseSpecificPosition = async (symbolToClose: string) => {
    try {
      const pos = positions[symbolToClose];
      if (!pos) return { success: false, message: 'Không có vị thế' };

      const currentPrice = symbolToClose === selectedStock.symbol ? selectedStock.price : (STOCKS.find(s => s.symbol === symbolToClose)?.price || pos.averagePrice);

      const res = await tradingApi.closePosition(symbolToClose, pos.side, currentPrice, undefined, user?._id);
      if (res.success) {
        await fetchPortfolio();
        setTradeCount(c => c + 1);
        addNotification?.({ title: 'Đóng vị thế', message: `Đã chốt vị thế ${pos.side} mã ${symbolToClose}.`, type: 'success' });
        return { success: true, message: `✅ Đã chốt vị thế ${symbolToClose} thành công` };
      }
      return { success: false, message: res.message || 'Lỗi đóng lệnh' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Lỗi hệ thống' };
    }
  };

  const handleAddMargin = async (symbol: string, side: 'LONG' | 'SHORT', amount: number) => {
    try {
      const res = await tradingApi.addMargin(symbol, side, amount, user?._id);
      if (res.success) {
        await fetchPortfolio();
        addNotification?.({ title: 'Thêm ký quỹ', message: `Đã bơm thêm $${amount.toLocaleString('en-US')} ký quỹ cho vị thế ${side} mã ${symbol}.`, type: 'info' });
        return { success: true, message: res.message || `✅ Đã bơm thêm ký quỹ` };
      }
      return { success: false, message: res.message || 'Lỗi bơm ký quỹ' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Lỗi hệ thống' };
    }
  };

  // Tính tổng tài sản thực tế (Total Equity) = Tiền mặt khả dụng + Ký quỹ vị thế mở + Ký quỹ lệnh chờ
  const totalOpenPositionMargin = useMemo(() => {
    return Object.values(positions || {}).reduce((sum: number, p: any) => {
      const lev = p.leverage || 1;
      return sum + ((p.averagePrice * p.quantity) / lev);
    }, 0);
  }, [positions]);

  const totalPendingOrderMargin = useMemo(() => {
    return (pendingOrders || []).reduce((sum: number, ord: any) => {
      return sum + (ord.margin || 0);
    }, 0);
  }, [pendingOrders]);

  const totalEquity = balance + totalOpenPositionMargin + totalPendingOrderMargin;

  const handleResetWallet = async () => {
    if (totalEquity >= 5000) {
      const inTrades = totalOpenPositionMargin + totalPendingOrderMargin;
      let msg = `Tài khoản của bạn hiện vẫn còn $${balance.toLocaleString('en-US')} USD tiền mặt.`;
      if (inTrades > 0) {
        msg = `Tổng tài sản thực tế của bạn hiện là $${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD (gồm $${balance.toLocaleString('en-US')} tiền mặt khả dụng + $${inTrades.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ký quỹ đang nằm trong vị thế và lệnh chờ).\n\nBạn không thể khôi phục tài khoản khi vẫn còn tiền đang rải trong các lệnh! Hệ thống chỉ cho phép khôi phục khi tổng tài sản thực tế dưới $5,000 USD.`;
      } else {
        msg = `Tài khoản của bạn hiện đang có $${balance.toLocaleString('en-US')} USD. Hệ thống chỉ cho phép khôi phục lại $100k vốn khi tổng tài sản còn dưới $5,000 USD!`;
      }

      showAlert({
        title: 'Chưa đủ điều kiện khôi phục',
        message: msg,
        type: 'warning'
      });
      return;
    }

    const confirmed = await showConfirm({
      title: 'Khôi phục số dư về $100,000 USD',
      message: 'Bạn có chắc muốn khôi phục số dư tài khoản về $100,000 USD không?\n\n• Điều kiện: Tổng tài sản thực tế dưới $5,000 USD.\n• Quy định: Tối đa 1 lần trong ngày, 4 lần trong 1 tuần.\n• Lưu ý: Các vị thế đang mở và lệnh chờ sẽ được đóng để làm sạch tài sản.',
      confirmText: 'Xác nhận khôi phục',
      cancelText: 'Hủy'
    });

    if (!confirmed) return;

    try {
      const res = await tradingApi.resetWallet(100000);
      if (res.success) {
        await fetchPortfolio();
        showToast(res.message || '✅ Đã khôi phục số dư về $100,000 USD thành công!', 'info');
      }
    } catch (e: any) {
      showAlert({
        title: 'Không thể khôi phục',
        message: e.message || 'Đã có lỗi xảy ra',
        type: 'warning'
      });
    }
  };

  // Auto Close on TP / SL / LIQUIDATION (Đã được chuyển sang xử lý Realtime ở Backend bằng checkPriceTriggers)
  // useEffect(() => { ... }, [selectedStock.price, positions, selectedStock.symbol]);

  // Auto Execute Limit & Stop Orders (Đã được chuyển sang Backend)
  // useEffect(() => { ... }, [selectedStock.price, pendingOrders, selectedStock.symbol]);

  const handleStartReplaySelection = () => {
    setIsSelectingReplayStart(true);
    setReplayPrice(null);
  };

  const handleCancelReplaySelection = () => {
    setIsSelectingReplayStart(false);
  };

  const handleConfirmReplayStart = (timestamp: number, price?: number) => {
    setReplayTime(timestamp);
    if (price && !isNaN(price)) {
      setReplayPrice(price);
      setSelectedStock(prev => {
        const curTicker = useMarketStore.getState().tickers[prev.symbol];
        const openPrice = curTicker?.openPrice;
        const change = openPrice ? (price - openPrice) : (curTicker ? curTicker.change : prev.change);
        const percent = openPrice ? ((price - openPrice) / openPrice) * 100 : (curTicker ? curTicker.percent : prev.percent);
        return { ...prev, price, change, percent, type: change >= 0 ? 'up' : 'down' };
      });
      handlePriceChange(price);
    }
    setIsSelectingReplayStart(false);
    setIsReplaying(true);
    setReplayReloadTrigger(t => t + 1);
    if (store.isActive && store.session) {
      const isoTime = new Date(timestamp).toISOString();
      store.tick(price || selectedStock.price, isoTime);
    }
  };

  const handleResumeSession = (session: any, resumeTimestamp?: number, timeframe?: string) => {
    // 1. Switch stock without resetting replay
    if (session.symbol && session.symbol.toUpperCase() !== selectedStock.symbol.toUpperCase()) {
      const matchStock = STOCKS.find(s => s.symbol.toUpperCase() === session.symbol.toUpperCase()) || {
        ...selectedStock,
        symbol: session.symbol.toUpperCase(),
        name: session.symbol.toUpperCase()
      };
      setSelectedStock(matchStock);
      localStorage.setItem('lastSelectedStock', matchStock.symbol.toLowerCase());
      navigate(`/trade/${matchStock.symbol.toLowerCase()}`, { replace: true });
    }

    // 2. Switch timeframe if needed
    if (timeframe && timeframe !== activeTimeframe) {
      setActiveTimeframe(timeframe);
    }
    if (store.isActive && store.session && timeframe) {
      store.setTimeframe(timeframe);
    }

    // 3. Set Replay state
    if (resumeTimestamp && !isNaN(resumeTimestamp)) {
      setReplayTime(resumeTimestamp);
      setIsSelectingReplayStart(false);
      setIsReplaying(true);
      setReplayReloadTrigger(t => t + 1);
    }
  };


  const handleGoToRealtime = () => {
    if (isReplaying || isSelectingReplayStart) {
      setIsReplaying(false);
      setIsSelectingReplayStart(false);
      setReplayTime(null);
      setReplayPrice(null);
    }
    setGoToRealtimeTrigger(t => t + 1);
  };

  const handleReplayNext = () => {
    setReplayStepTrigger(t => t + 1);
  };

  const handleReplayPrev = () => {
    setReplayPrevStepTrigger(t => t + 1);
  };

  const handleStartSimulation = (config: SimulationConfig) => {
    console.log("Start simulation with config:", config);
    // Only enter replay selection mode if replay is not already active
    if (!isReplaying) {
      setIsSelectingReplayStart(true);
    }
  };

  const handleStopReplay = () => {
    setIsReplaying(false);
    setIsSelectingReplayStart(false);
    setReplayTime(null);
    setReplayPrice(null);
    setToast(null); // clear any lingering toast immediately
  };

  const handleStartBacktestReplayFromAi = (symbol: string, timeframe: string, rules?: any) => {
    const stock = STOCKS.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
    if (stock) {
      setSelectedStock(stock);
    }
    if (timeframe) {
      setActiveTimeframe(timeframe);
    }
    if (rules) {
      setActiveBacktestRules({
        strategy: rules.strategy || '',
        symbol,
        timeframe,
        entryRule: rules.entryRule || '',
        stopLossRule: rules.stopLossRule || '',
        takeProfitRule: rules.takeProfitRule || '',
        invalidationRule: rules.invalidationRule || '',
      });
    }
    setIsAiTutorOpen(false);
    handleStartReplaySelection();
    setToast({
      msg: `🎯 Kế hoạch Backtest đã nạp! Hãy nhấp vào 1 cây nến trên biểu đồ ${symbol} (${timeframe}) để bắt đầu Bar Replay.`,
      type: 'info'
    });
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-white dark:bg-[#131722] text-[#1e2329] dark:text-[#d1d4dc]">
      <ToolbarNavbar
        balance={balance}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenChallenge={() => setIsChallengeModalOpen(true)}
        onOpenAiTutor={() => {
          if (challengeState.status === 'ACTIVE') {
            showAlert({
              title: 'Tính năng AI bị khóa khi thi quỹ',
              message: 'Trong quá trình thực hiện bài thi Thử Thách Cấp Vốn Quỹ (Prop Firm Challenge), mọi công cụ AI Trading Tutor và phân tích tự động đều bị vô hiệu hóa để bảo đảm tính minh bạch và đánh giá đúng năng lực giao dịch thực tế của thí sinh.',
              type: 'warning'
            });
            return;
          }
          setIsAiTutorOpen(true);
        }}
        challengeLevelName={currentChallengeLevel.badge}
        challengeStatus={challengeState.status}
        accountRankBadge={accountRankConfig.badge}
        accountRankName={`${accountRankConfig.badge} - ${accountRankConfig.levelName}`}
        certCount={challengeState.certificates?.length || 0}
        selectedStock={selectedStock}
        activeTimeframe={activeTimeframe}
      />

      {/* Dynamic Prop Challenge Header Bar - Chỉ hiển thị khi đang trong bài thi hoặc có kết quả */}
      {challengeState.status !== 'NOT_STARTED' && (
        <div className="h-9 bg-[#161a24] border-b border-[#232936] flex items-center px-4 justify-between text-xs text-[#d1d4dc] shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentChallengeLevel.levelName}</span>
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${challengeState.status === 'ACTIVE'
                ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30'
                : challengeState.status === 'PAUSED'
                  ? 'bg-amber-900/30 text-amber-300 border-amber-500/30'
                  : challengeState.status === 'PASSED'
                    ? 'bg-purple-900/30 text-purple-400 border-purple-500/30'
                    : challengeState.status === 'FAILED'
                      ? 'bg-rose-900/30 text-rose-400 border-rose-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                {challengeState.status === 'ACTIVE' && '🟢 ĐANG THI (LIVE)'}
                {challengeState.status === 'PAUSED' && '⏸️ ĐANG TẠM DỪNG'}
                {challengeState.status === 'PASSED' && '🏆 ĐÃ ĐỖ'}
                {challengeState.status === 'FAILED' && '🔴 BỊ VI PHẠM'}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-4 border-l border-[#232936] pl-3 text-[11px]">
              {/* Target */}
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Mục tiêu:</span>
                <span className={`font-bold font-mono ${challengeState.totalProfitUSD > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {challengeState.totalProfitUSD > 0
                    ? `+$${challengeState.totalProfitUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                    : '$0'} / +${((currentChallengeLevel.capitalUSD * currentChallengeLevel.profitTargetPercent) / 100).toLocaleString('en-US')}
                </span>
              </div>

              {/* Daily Loss */}
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Lỗ ngày:</span>
                <span className={`font-bold font-mono ${challengeState.dailyLossUSD > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {challengeState.dailyLossUSD > 0 ? `-$${challengeState.dailyLossUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '$0'} / -${((currentChallengeLevel.capitalUSD * currentChallengeLevel.dailyLossLimitPercent) / 100).toLocaleString('en-US')}
                </span>
              </div>

              {/* Max Drawdown */}
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Sụt giảm tối đa:</span>
                <span className={`font-bold font-mono ${challengeState.maxLossUSD > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {challengeState.maxLossUSD > 0 ? `-$${challengeState.maxLossUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '$0'} / -${((currentChallengeLevel.capitalUSD * currentChallengeLevel.maxDrawdownPercent) / 100).toLocaleString('en-US')}
                </span>
              </div>

              {/* Reset Quota */}
              <div className="flex items-center gap-1 text-cyan-400">
                <RefreshCw className="w-3 h-3" />
                <span>Reset: <strong>{MAX_RESETS_PER_WEEK - challengeState.resetsUsedThisWeek}/{MAX_RESETS_PER_WEEK}</strong></span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {challengeState.status === 'ACTIVE' && (
              <button
                onClick={handlePauseChallenge}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[11px] font-semibold transition-all"
                title="Tạm dừng bài thi để quay về giao dịch tự do"
              >
                <Pause className="w-3 h-3" />
                <span>Tạm Dừng</span>
              </button>
            )}

            {challengeState.status === 'PAUSED' && (
              <button
                onClick={handleResumeChallenge}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 rounded text-[11px] font-bold transition-all"
                title="Tiếp tục bài thi cấp vốn"
              >
                <Play className="w-3 h-3" />
                <span>Tiếp Tục Thi</span>
              </button>
            )}

            {(challengeState.status === 'ACTIVE' || challengeState.status === 'PAUSED' || challengeState.status === 'FAILED') && (
              <button
                onClick={handleEndChallenge}
                className="flex items-center gap-1 px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[11px] font-semibold transition-all"
                title="Hủy bài thi để trở về tài khoản thường"
              >
                <Square className="w-3 h-3" />
                <span>Hủy Thi</span>
              </button>
            )}

            <button
              onClick={() => setIsChallengeModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[11px] font-bold transition-all"
            >
              <span>Chi Tiết Bài Thi</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden">
        <LeftToolbar
          activeTool={activeTool}
          onToolSelect={handleToolClick}
          magnetMode={effectiveMagnetMode}
          magnetType={magnetType}
          onToggleMagnet={() => setMagnetMode(!magnetMode)}
          onMagnetTypeSelect={(type) => setMagnetType(type)}
          stayInDrawingMode={stayInDrawingMode}
          onToggleStayInDrawingMode={() => setStayInDrawingMode(!stayInDrawingMode)}
          lockDrawing={lockDrawing}
          onToggleLock={() => setLockDrawing(!lockDrawing)}
          hideDrawing={hideDrawing}
          onToggleHide={() => setHideDrawing(!hideDrawing)}
        />
        <div className="flex flex-col flex-1 overflow-visible lg:overflow-hidden min-h-[500px] lg:min-h-0 pb-16 lg:pb-0">
          <TickerHeader
            stock={selectedStock}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            activeTimeframe={activeTimeframe}
            onTimeframeChange={(tf) => {
              setActiveTimeframe(tf);
              if (store.isActive && store.session) {
                store.setTimeframe(tf);
              }
            }}
            isReplaying={isReplaying}
            isSelectingReplayStart={isSelectingReplayStart}
            replayTime={replayTime}
            totalBars={totalBars}
            isChallengeActive={challengeState.status === 'ACTIVE'}
            onStartReplay={handleStartReplaySelection}
            onCancelReplay={handleCancelReplaySelection}
            onReplayNext={handleReplayNext}
            onStopReplay={handleStopReplay}
            onGoToRealtime={handleGoToRealtime}
            onOpenSearch={() => setIsSearchModalOpen(true)}
            onOpenIndicator={() => setIsIndicatorModalOpen(true)}
            activeIndicatorCount={activeIndicators.length}
            canUndo={undoRedoState.canUndo}
            canRedo={undoRedoState.canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />

          {activeTab === 'chart' && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex flex-col flex-1 min-h-[340px] md:min-h-[460px] lg:min-h-[300px] overflow-hidden border-b border-[#2a2e39]">
                <ChartArea
                  activeTool={activeTool}
                  onToolSelect={setActiveTool}
                  magnetMode={effectiveMagnetMode}
                  magnetType={magnetType}
                  stayInDrawingMode={stayInDrawingMode}
                  lockDrawing={lockDrawing}
                  hideDrawing={hideDrawing}
                  selectedStock={selectedStock}
                  activeTimeframe={activeTimeframe}
                  isReplaying={isReplaying}
                  isSelectingReplayStart={isSelectingReplayStart}
                  onSelectReplayStart={handleConfirmReplayStart}
                  replayTime={replayTime}
                  replayPrice={replayPrice}
                  replayStepTrigger={replayStepTrigger}
                  replayPrevStepTrigger={replayPrevStepTrigger}
                  replayReloadTrigger={replayReloadTrigger}
                  onReplayReload={() => setReplayReloadTrigger(t => t + 1)}
                  onReplayTimeChange={setReplayTime}
                  onReplayPriceChange={setReplayPrice}
                  goToRealtimeTrigger={goToRealtimeTrigger}
                  onDataLoaded={setTotalBars}
                  tradeOrders={tradeOrders.filter(o => o.symbol === selectedStock.symbol)}
                  pendingOrders={store.isActive ? store.orders.map(o => ({ ...o, price: o.limitPrice, quantity: o.lot })) : pendingOrders}
                  activeIndicators={activeIndicators}
                  activePosition={
                    store.isActive
                      ? (store.positions.find(p => p.symbol?.toUpperCase() === selectedStock.symbol?.toUpperCase()) ? {
                        quantity: store.positions.find(p => p.symbol?.toUpperCase() === selectedStock.symbol?.toUpperCase())!.lot,
                        averagePrice: store.positions.find(p => p.symbol?.toUpperCase() === selectedStock.symbol?.toUpperCase())!.entryPrice,
                        side: store.positions.find(p => p.symbol?.toUpperCase() === selectedStock.symbol?.toUpperCase())!.side,
                        leverage: store.session?.config?.leverage || 1,
                        tp: store.positions.find(p => p.symbol?.toUpperCase() === selectedStock.symbol?.toUpperCase())!.tp,
                        sl: store.positions.find(p => p.symbol?.toUpperCase() === selectedStock.symbol?.toUpperCase())!.sl
                      } : undefined)
                      : (positions[selectedStock.symbol] as any)
                  }
                  simulatorPositions={store.isActive ? store.positions : undefined}
                  previewTPSL={previewTPSL}
                  onTPSLChange={handleTPSLDragChange}
                  undoTrigger={undoTrigger}
                  redoTrigger={redoTrigger}
                  onUndoRedoChange={setUndoRedoState}
                  chartSettings={chartSettings}
                  onPriceUpdate={(price, timestamp, bar) => {
                    if (isReplaying) {
                      setReplayPrice(price);
                      checkReplayTriggers(selectedStock.symbol, price, bar);
                    }
                    setSelectedStock(prev => {
                      if (prev.price === price) return prev;
                      const curTicker = useMarketStore.getState().tickers[prev.symbol];
                      const openPrice = curTicker?.openPrice;
                      const change = openPrice ? (price - openPrice) : (curTicker ? curTicker.change : prev.change);
                      const percent = openPrice ? ((price - openPrice) / openPrice) * 100 : (curTicker ? curTicker.percent : prev.percent);
                      return { ...prev, price, change, percent, type: change >= 0 ? 'up' : 'down' };
                    });
                    handlePriceChange(price);

                    if (store.isActive && store.session) {
                      let candleTimeStr: string;
                      if (isReplaying && replayTime) {
                        const targetMs = Math.max(timestamp || 0, replayTime);
                        candleTimeStr = new Date(targetMs).toISOString();
                      } else if (timestamp) {
                        candleTimeStr = new Date(timestamp).toISOString();
                      } else {
                        candleTimeStr = store.currentTime || store.session.replayCurrentTime || store.session.replayStartTime || new Date().toISOString();
                      }
                      store.tick(price, candleTimeStr, bar?.high, bar?.low);
                    }
                  }}
                />
              </div>
              {store.isActive && store.session ? (
                <PositionsManager currentPrice={selectedStock.price} />
              ) : (
                <BottomPanel
                  balance={balance}
                  totalEquity={totalEquity}
                  positions={positions as any}
                  pendingOrders={pendingOrders}
                  selectedSymbol={selectedStock.symbol}
                  currentPrice={selectedStock.price}
                  isChallengeActive={challengeState.status === 'ACTIVE'}
                  onClosePosition={async (symbol, side, price, closeQty) => {
                    try {
                      const res = await tradingApi.closePosition(symbol, side, price, closeQty);
                      if (res.success) {
                        await fetchPortfolio();
                        setTradeCount(c => c + 1);
                        setPreviewTPSL(null);
                        setDraggedTPSL(null);
                        addNotification?.({
                          title: 'Đóng vị thế',
                          message: `Đã chốt vị thế ${side} mã ${symbol} thành công ở giá ${price.toLocaleString('vi-VN')}đ.`,
                          type: 'success'
                        });
                        return { success: true, message: res.message || `✅ Đã chốt vị thế ${side} ${symbol}` };
                      }
                      return { success: false, message: 'Lỗi khi đóng vị thế' };
                    } catch (e: any) {
                      return { success: false, message: e.message };
                    }
                  }}
                  onCancelOrder={handleCancelOrder}
                  onUpdateTPSL={async (symbol, side, tp, sl) => {
                    try {
                      const res = await tradingApi.updateTPSL(symbol, side, tp, sl, user?._id);
                      if (res.success) {
                        await fetchPortfolio();
                        return { success: true, message: '✅ Đã cập nhật TP/SL' };
                      }
                      return { success: false, message: 'Lỗi cập nhật' };
                    } catch (e: any) {
                      return { success: false, message: e.message };
                    }
                  }}
                  onAddMargin={handleAddMargin}
                  onEditPosition={(symbol) => {
                    if (symbol !== selectedStock.symbol) {
                      const stock = STOCKS.find(s => s.symbol === symbol);
                      if (stock) handleStockSelect(stock);
                    }
                    setEditingSymbol(symbol);
                    setActiveRightPanel('order');
                  }}
                  refreshTrigger={tradeCount}
                />
              )}
            </div>
          )}

          {activeTab === 'coin_info' && (
            <CoinInfoPanel stock={selectedStock} />
          )}
          {activeTab === 'info' && (
            <ContractInfoPanel stock={selectedStock} />
          )}
        </div>
        {/* Desktop Right Panels & Toolbar */}
        <div className="hidden lg:flex flex-row shrink-0 h-full border-l border-[#e6e8ea] dark:border-[#2a2e39]">
          {activeRightPanel === 'watchlist' && (
            <WatchlistPanel
              watchlists={watchlists}
              activeWatchlistId={activeWatchlistId}
              onWatchlistChange={setActiveWatchlistId}
              onUpdateWatchlist={handleUpdateWatchlist}
              onCreateWatchlist={handleCreateWatchlist}
              onDeleteWatchlist={handleDeleteWatchlist}
              onRenameWatchlist={handleRenameWatchlist}
              onSelectStock={handleStockSelect}
              currentSymbol={selectedStock.symbol}
            />
          )}

          {activeRightPanel === 'order' && (
            <RightSidebar
              selectedStock={selectedStock}
              positions={positions as any}
              balance={balance}
              totalEquity={totalEquity}
              maxAllowedLeverage={isChallengeActive ? (currentChallengeLevel.id === 6 ? undefined : currentChallengeLevel.maxLeverage) : undefined}
              challengeBadge={isChallengeActive ? (currentChallengeLevel.id === 6 ? `${currentChallengeLevel.badge} (${currentChallengeLevel.levelName}) · Tối đa theo sàn` : `${currentChallengeLevel.badge} (${currentChallengeLevel.levelName})`) : undefined}
              onStockSelect={(stock) => {
                handleStockSelect(stock);
                setEditingSymbol(null);
              }}
              onTrade={handleTrade}
              onUpdateTPSL={async (symbol, side, tp, sl) => {
                const res = await handleUpdateTPSL(tp, sl);
                if (res.success) setEditingSymbol(null);
                return res;
              }}
              onAddMargin={handleAddMargin}
              isEditing={editingSymbol === selectedStock.symbol}
              onCancelEdit={() => setEditingSymbol(null)}
              onPreviewTPSLChange={setPreviewTPSL}
              draggedTPSL={draggedTPSL}
              onResetWallet={handleResetWallet}
            />
          )}

          {activeRightPanel === 'simulation' && (
            <SimulationPanel
              currentSymbol={selectedStock.symbol}
              selectedStock={selectedStock}
              currentPrice={selectedStock.price}
              isReplaying={isReplaying}
              replayTime={replayTime}
              activeTimeframe={activeTimeframe}
              onResumeSession={handleResumeSession}
              onStartSimulation={handleStartSimulation}
              onStartReplay={handleStartReplaySelection}
              onSelectStock={handleStockSelect}
              onPreviewTPSLChange={setPreviewTPSL}
              draggedTPSL={draggedTPSL}
            />
          )}

          {activeRightPanel === 'calculator' && (
            <CalculatorPanel
              initialBalance={balance}
              currentStock={selectedStock}
            />
          )}

          {activeRightPanel === 'journal' && (
            <TradingJournalPanel />
          )}

          <RightToolbar
            activePanel={activeRightPanel}
            onChangePanel={setActiveRightPanel}
          />
        </div>
      </div>

      {/* ─── Mobile Active Panel Drawer (Slide-up modal on mobile) ─── */}
      {activeRightPanel && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="absolute inset-0"
            onClick={() => setActiveRightPanel(null)}
          />
          <div className="relative bg-white dark:bg-[#131722] rounded-t-2xl shadow-2xl max-h-[85vh] h-[82vh] flex flex-col border-t border-[#e6e8ea] dark:border-[#2a2e39] z-10 animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e6e8ea] dark:border-[#2a2e39] shrink-0 bg-[#f8f9fa] dark:bg-[#181c27] rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="font-bold text-sm text-[#1e2329] dark:text-white">
                  {activeRightPanel === 'watchlist' && 'Danh Sách Theo Dõi'}
                  {activeRightPanel === 'order' && `Đặt Lệnh & Sổ Lệnh (${selectedStock.symbol})`}
                  {activeRightPanel === 'simulation' && 'Mô Phỏng Giao Dịch'}
                  {activeRightPanel === 'calculator' && 'Tính Khối Lượng Vị Thế'}
                  {activeRightPanel === 'journal' && 'Nhật Ký Giao Dịch'}
                </span>
              </div>
              <button
                onClick={() => setActiveRightPanel(null)}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-[#2a2e39] text-[#787b86] hover:text-[#1e2329] dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Panel Content (Full width inside drawer) */}
            <div className="flex-1 overflow-hidden flex flex-col w-full [&>div]:w-full [&>div]:border-l-0">
              {activeRightPanel === 'watchlist' && (
                <WatchlistPanel
                  watchlists={watchlists}
                  activeWatchlistId={activeWatchlistId}
                  onWatchlistChange={setActiveWatchlistId}
                  onUpdateWatchlist={handleUpdateWatchlist}
                  onCreateWatchlist={handleCreateWatchlist}
                  onDeleteWatchlist={handleDeleteWatchlist}
                  onRenameWatchlist={handleRenameWatchlist}
                  onSelectStock={(s) => {
                    handleStockSelect(s);
                    setActiveRightPanel(null);
                  }}
                  currentSymbol={selectedStock.symbol}
                />
              )}

              {activeRightPanel === 'order' && (
                <RightSidebar
                  selectedStock={selectedStock}
                  positions={positions as any}
                  balance={balance}
                  totalEquity={totalEquity}
                  maxAllowedLeverage={isChallengeActive ? (currentChallengeLevel.id === 6 ? undefined : currentChallengeLevel.maxLeverage) : undefined}
                  challengeBadge={isChallengeActive ? (currentChallengeLevel.id === 6 ? `${currentChallengeLevel.badge} (${currentChallengeLevel.levelName}) · Tối đa theo sàn` : `${currentChallengeLevel.badge} (${currentChallengeLevel.levelName})`) : undefined}
                  onStockSelect={(stock) => {
                    handleStockSelect(stock);
                    setEditingSymbol(null);
                  }}
                  onTrade={handleTrade}
                  onUpdateTPSL={async (symbol, side, tp, sl) => {
                    const res = await handleUpdateTPSL(tp, sl);
                    if (res.success) setEditingSymbol(null);
                    return res;
                  }}
                  onAddMargin={handleAddMargin}
                  isEditing={editingSymbol === selectedStock.symbol}
                  onCancelEdit={() => setEditingSymbol(null)}
                  onPreviewTPSLChange={setPreviewTPSL}
                  draggedTPSL={draggedTPSL}
                  onResetWallet={handleResetWallet}
                />
              )}

              {activeRightPanel === 'simulation' && (
                <SimulationPanel
                  currentSymbol={selectedStock.symbol}
                  selectedStock={selectedStock}
                  currentPrice={selectedStock.price}
                  isReplaying={isReplaying}
                  replayTime={replayTime}
                  activeTimeframe={activeTimeframe}
                  onResumeSession={handleResumeSession}
                  onStartSimulation={handleStartSimulation}
                  onStartReplay={handleStartReplaySelection}
                  onSelectStock={handleStockSelect}
                  onPreviewTPSLChange={setPreviewTPSL}
                  draggedTPSL={draggedTPSL}
                />
              )}

              {activeRightPanel === 'calculator' && (
                <CalculatorPanel
                  initialBalance={balance}
                  currentStock={selectedStock}
                />
              )}

              {activeRightPanel === 'journal' && (
                <TradingJournalPanel />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Mobile Bottom Navigation Bar (Fixed) ─── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-[#131722] border-t border-[#e6e8ea] dark:border-[#2a2e39] h-14 px-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveRightPanel(activeRightPanel === 'watchlist' ? null : 'watchlist')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded transition-colors ${activeRightPanel === 'watchlist'
            ? 'text-blue-600 dark:text-blue-400 font-semibold'
            : 'text-[#787b86] hover:text-[#1e2329] dark:hover:text-white'
            }`}
        >
          <List className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5">Theo dõi</span>
        </button>

        <button
          onClick={() => setActiveRightPanel(activeRightPanel === 'simulation' ? null : 'simulation')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded transition-colors ${activeRightPanel === 'simulation'
            ? 'text-[#089981] font-semibold'
            : 'text-[#787b86] hover:text-[#1e2329] dark:hover:text-white'
            }`}
        >
          <BarChart2 className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5">Mô phỏng</span>
        </button>

        {/* Primary Action Button: Đặt Lệnh */}
        <button
          onClick={() => setActiveRightPanel(activeRightPanel === 'order' ? null : 'order')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded transition-all ${activeRightPanel === 'order'
            ? 'text-white'
            : 'text-[#787b86] hover:text-[#1e2329] dark:hover:text-white'
            }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center -mt-2 shadow-md transition-transform ${activeRightPanel === 'order'
            ? 'bg-blue-600 text-white scale-110 ring-2 ring-blue-400'
            : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
            }`}>
            <ArrowLeftRight className="w-4 h-4 stroke-[2]" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold">Đặt lệnh</span>
        </button>

        <button
          onClick={() => setActiveRightPanel(activeRightPanel === 'journal' ? null : 'journal')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded transition-colors ${activeRightPanel === 'journal'
            ? 'text-blue-600 dark:text-blue-400 font-semibold'
            : 'text-[#787b86] hover:text-[#1e2329] dark:hover:text-white'
            }`}
        >
          <BookOpen className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5">Nhật ký</span>
        </button>

        <button
          onClick={() => setActiveRightPanel(activeRightPanel === 'calculator' ? null : 'calculator')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded transition-colors ${activeRightPanel === 'calculator'
            ? 'text-[#089981] font-semibold'
            : 'text-[#787b86] hover:text-[#1e2329] dark:hover:text-white'
            }`}
        >
          <Calculator className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5">Máy tính</span>
        </button>
      </div>

      {toast && (
        <div className="fixed top-4 right-1/2 translate-x-1/2 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-lg shadow-xl border flex items-center gap-3 ${(toast.type === 'warning' || toast.type === 'error')
            ? 'bg-red-900/90 border-red-500 text-red-100'
            : 'bg-green-900/90 border-green-500 text-green-100'
            }`}>
            <span className="font-medium whitespace-pre-line text-sm">{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Floating Backtest Rule Card — draggable, replaces old fixed card */}
      {isReplaying && activeBacktestRules && (
        <BacktestRuleCard
          rules={activeBacktestRules}
          replayTime={replayTime}
          onStop={handleStopReplay}
          onDismiss={() => setActiveBacktestRules(null)}
        />
      )}

      <SymbolSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelect={(stock) => {
          handleStockSelect(stock);
          setIsSearchModalOpen(false);
        }}
      />
      <IndicatorModal
        isOpen={isIndicatorModalOpen}
        onClose={() => setIsIndicatorModalOpen(false)}
        activeIndicators={activeIndicators}
        onToggle={(ind) => {
          setActiveIndicators(prev =>
            prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]
          );
        }}
      />
      {isSettingsModalOpen && (
        <ChartSettingsModal
          onClose={() => setIsSettingsModalOpen(false)}
          chartSettings={chartSettings}
          onSettingsChange={setChartSettings}
        />
      )}

      <ChallengeModal
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        challengeState={challengeState}
        onStateUpdate={handleChallengeStateUpdate}
        userName={user?.name || 'Trader'}
      />
      <AiTutorDrawer
        isOpen={isAiTutorOpen}
        isChallengeActive={challengeState.status === 'ACTIVE'}
        onClose={() => setIsAiTutorOpen(false)}
        currentSymbol={selectedStock.symbol}
        currentPrice={selectedStock.price}
        timeframe={activeTimeframe}
        topOffset={challengeState.status !== 'NOT_STARTED' ? 84 : 48}
        marketContext={{
          change24h: selectedStock.percent !== undefined ? Number(selectedStock.percent.toFixed(2)) : undefined,
          exchange: selectedStock.exchange,
          market: selectedStock.market,
          high24h: currentTicker?.high24h,
          low24h: currentTicker?.low24h,
          volume: currentTicker?.volume24h
        }}
        onStartBacktestReplay={handleStartBacktestReplayFromAi}
      />
    </div>
  );
};
