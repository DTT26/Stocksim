import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Trophy, Activity, ArrowRight, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { journalService } from '../../services/journalService';
import { challengeApi } from '../../services/challengeApi';
import { tradingApi } from '../../services/tradingApi';
import type { JournalSession, JournalFilterState, JournalSummaryStats, JournalTrade } from '../../features/journal/types/journalTypes';
import { JournalHeader } from '../../features/journal/components/JournalHeader';
import { JournalSummary } from '../../features/journal/components/JournalSummary';
import { JournalFilters } from '../../features/journal/components/JournalFilters';
import { SessionTable } from '../../features/journal/components/SessionTable';
import { JournalSkeleton } from '../../features/journal/components/JournalSkeleton';
import { JournalEmptyState } from '../../features/journal/components/JournalEmptyState';
import { JournalErrorState } from '../../features/journal/components/JournalErrorState';
import { ChallengeHistoryTable, type ChallengeHistoryItem } from '../../features/journal/components/ChallengeHistoryTable';
import { ChallengeSummary, type ChallengeSummaryStats } from '../../features/journal/components/ChallengeSummary';
import { ChallengeFilters, type ChallengeFilterState } from '../../features/journal/components/ChallengeFilters';

// Realistic sample challenge history for educational demo if student has no challenge attempts yet
const SAMPLE_CHALLENGE_HISTORY: ChallengeHistoryItem[] = [
  {
    id: 'chal-sample-01',
    levelId: 1,
    levelName: 'Cấp 1 • Thử Thách Khởi Đầu ($10,000)',
    capitalUSD: 10000,
    currentEquityUSD: 10842.50,
    status: 'PASSED',
    startedAt: '2026-09-28T08:00:00Z',
    endedAt: '2026-10-02T16:30:00Z',
    tradesCount: 14,
    winRate: 64.3,
    profitUSD: 842.50,
    isDemo: true,
    trades: [
      {
        id: 'ct-01',
        symbol: 'BTCUSDT',
        side: 'BUY',
        entryPrice: 81200,
        exitPrice: 82450,
        quantity: 0.25,
        lot: 0.25,
        pnl: 312.50,
        returnRate: 1.54,
        entryTime: '2026-09-28T09:15:00Z',
        exitTime: '2026-09-28T10:45:00Z',
        status: 'CLOSED',
        sl: 80600,
        tp: 82450,
        closeReason: 'TAKE_PROFIT',
        setupTag: 'ICT 15m FVG Rebound'
      },
      {
        id: 'ct-02',
        symbol: 'NVDA',
        side: 'BUY',
        entryPrice: 182.40,
        exitPrice: 187.10,
        quantity: 50,
        lot: 50,
        pnl: 235.00,
        returnRate: 2.58,
        entryTime: '2026-09-29T14:35:00Z',
        exitTime: '2026-09-29T15:50:00Z',
        status: 'CLOSED',
        sl: 180.20,
        tp: 187.10,
        closeReason: 'TAKE_PROFIT',
        setupTag: 'Opening Range Breakout'
      },
      {
        id: 'ct-03',
        symbol: 'ETHUSDT',
        side: 'SELL',
        entryPrice: 3450,
        exitPrice: 3410,
        quantity: 4,
        lot: 4,
        pnl: 160.00,
        returnRate: 1.16,
        entryTime: '2026-09-30T11:00:00Z',
        exitTime: '2026-09-30T12:20:00Z',
        status: 'CLOSED',
        sl: 3480,
        tp: 3410,
        closeReason: 'TAKE_PROFIT',
        setupTag: 'Liquidity Sweep'
      },
      {
        id: 'ct-04',
        symbol: 'TSLA',
        side: 'BUY',
        entryPrice: 435.00,
        exitPrice: 432.30,
        quantity: 30,
        lot: 30,
        pnl: -81.00,
        returnRate: -0.62,
        entryTime: '2026-10-01T15:10:00Z',
        exitTime: '2026-10-01T15:40:00Z',
        status: 'CLOSED',
        sl: 432.30,
        tp: 442.00,
        closeReason: 'STOP_LOSS',
        setupTag: 'Trend Pullback'
      },
      {
        id: 'ct-05',
        symbol: 'BTCUSDT',
        side: 'BUY',
        entryPrice: 82100,
        exitPrice: 82964,
        quantity: 0.25,
        lot: 0.25,
        pnl: 216.00,
        returnRate: 1.05,
        entryTime: '2026-10-02T10:00:00Z',
        exitTime: '2026-10-02T11:30:00Z',
        status: 'CLOSED',
        sl: 81500,
        tp: 83000,
        closeReason: 'TAKE_PROFIT',
        setupTag: 'Session Expansion'
      }
    ]
  },
  {
    id: 'chal-sample-02',
    levelId: 2,
    levelName: 'Cấp 2 • Thử Thách Khám Phá ($25,000)',
    capitalUSD: 25000,
    currentEquityUSD: 25620.00,
    status: 'ACTIVE',
    startedAt: '2026-10-03T08:30:00Z',
    tradesCount: 8,
    winRate: 62.5,
    profitUSD: 620.00,
    isDemo: true,
    trades: [
      {
        id: 'ct-06',
        symbol: 'BTCUSDT',
        side: 'BUY',
        entryPrice: 82800,
        exitPrice: 83650,
        quantity: 0.5,
        lot: 0.5,
        pnl: 425.00,
        returnRate: 1.03,
        entryTime: '2026-10-03T10:10:00Z',
        exitTime: '2026-10-03T11:45:00Z',
        status: 'CLOSED',
        sl: 82200,
        tp: 83700,
        closeReason: 'TAKE_PROFIT',
        setupTag: 'Bullish Order Block'
      },
      {
        id: 'ct-07',
        symbol: 'AAPL',
        side: 'BUY',
        entryPrice: 245.50,
        exitPrice: 249.40,
        quantity: 50,
        lot: 50,
        pnl: 195.00,
        returnRate: 1.59,
        entryTime: '2026-10-04T14:30:00Z',
        exitTime: '2026-10-04T15:55:00Z',
        status: 'CLOSED',
        sl: 243.50,
        tp: 249.50,
        closeReason: 'TAKE_PROFIT',
        setupTag: 'EMA 20 Bounce'
      }
    ]
  }
];

export const StudentJournal: React.FC = () => {
  const { user } = useAuth();
  const { lang, t } = useI18n();
  const navigate = useNavigate();

  // -------------------------------------------------------------
  // PRIMARY TABS: Simulation Trading History vs Funded Challenge History
  // -------------------------------------------------------------
  const [activeMainTab, setActiveMainTab] = useState<'SIMULATION' | 'CHALLENGE'>('SIMULATION');
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);

  // Simulation tab states
  const [sessions, setSessions] = useState<JournalSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedSimulation, setSelectedSimulation] = useState<string>('ALL');
  const [filters, setFilters] = useState<JournalFilterState>({
    search: '',
    status: 'ALL',
    symbol: 'ALL',
    simulation: 'ALL'
  });

  // Challenge tab states
  const [challengeHistory, setChallengeHistory] = useState<ChallengeHistoryItem[]>([]);
  const [challengeFilters, setChallengeFilters] = useState<ChallengeFilterState>({
    search: '',
    status: 'ALL',
    level: 'ALL',
    symbol: 'ALL'
  });

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(false);
    try {
      // Parallel fetch for simulation sessions and challenge records
      const [sessionsData, chalRes, txRes] = await Promise.all([
        journalService.getSessions(user?._id).catch(() => []),
        challengeApi.getMyChallenge().catch(() => null),
        tradingApi.getTransactions(user?._id).catch(() => null)
      ]);

      // Sort simulation sessions newest first
      const sortedSessions = (sessionsData || []).sort(
        (a: any, b: any) => new Date(b.startedAt || b.createdAt || 0).getTime() - new Date(a.startedAt || a.createdAt || 0).getTime()
      );
      setSessions(sortedSessions);

      // Parse all challenge transactions
      const rawTxList = (txRes && txRes.success && Array.isArray(txRes.data)) ? txRes.data : [];
      const challengeTransactions = rawTxList.filter((t: any) => t.accountType === 'CHALLENGE');

      // Convert transactions to JournalTrade items, sorted newest first
      const allChallengeTrades: JournalTrade[] = challengeTransactions.map((t: any, i: number) => {
        const isClose = t.type === 'CLOSE_POSITION' || t.metadata?.isOpen === false;
        const symbol = t.metadata?.symbol || t.symbol || (t.description?.match(/(?:LONG|SHORT)\s+([A-Z0-9]+)/)?.[1]) || 'BTCUSDT';
        const rawSide = t.metadata?.side || (t.type === 'BUY_STOCK' ? 'BUY' : 'SELL');
        const side = (rawSide === 'LONG' || rawSide === 'BUY') ? 'BUY' : 'SELL';
        const entryPrice = t.metadata?.entryPrice || t.price || 0;
        const exitPrice = isClose ? (t.metadata?.exitPrice || entryPrice) : entryPrice;
        const lot = t.metadata?.quantity || t.metadata?.lot || t.metadata?.margin || 1;
        const pnl = isClose ? (t.metadata?.pnl ?? (typeof t.amount === 'number' ? t.amount : 0)) : 0;
        const leverage = t.metadata?.leverage || 1;
        const margin = t.metadata?.margin || (entryPrice > 0 ? (entryPrice * lot) / leverage : 1);
        const returnRate = margin > 0 && isClose ? (pnl / margin) * 100 : 0;

        return {
          id: t._id ? String(t._id) : `ct-${i}`,
          symbol: String(symbol).toUpperCase(),
          side,
          entryPrice: Number(Number(entryPrice).toFixed(2)),
          exitPrice: Number(Number(exitPrice).toFixed(2)),
          quantity: Number(Number(lot).toFixed(4)),
          lot: Number(Number(lot).toFixed(4)),
          pnl: Number(Number(pnl).toFixed(4)),
          returnRate: Number(Number(returnRate).toFixed(2)),
          entryTime: t.createdAt,
          exitTime: isClose ? (t.updatedAt || t.createdAt) : undefined,
          status: isClose ? 'CLOSED' : 'OPEN',
          sl: t.metadata?.stopLoss,
          tp: t.metadata?.takeProfit,
          setupTag: isClose ? 'Đã đóng vị thế' : 'Vị thế đang mở'
        };
      }).sort((a: any, b: any) => new Date(b.entryTime || 0).getTime() - new Date(a.entryTime || 0).getTime());

      // Construct challenge items
      const challengeItems: ChallengeHistoryItem[] = [];

      // 1. Current active / paused / ongoing challenge attempt (if status !== 'NOT_STARTED')
      if (chalRes && chalRes.success && chalRes.challenge && chalRes.challenge.status !== 'NOT_STARTED') {
        const chal = chalRes.challenge;
        const startTime = new Date(chal.startedAt || chal.createdAt || Date.now()).getTime() - 60000;
        
        // Trades occurring during this active attempt
        const chalTrades = allChallengeTrades.filter(tr => {
          const tTime = new Date(tr.entryTime || 0).getTime();
          return tTime >= startTime;
        });

        const totalT = chalTrades.length;
        const winT = chalTrades.filter(t => (t.pnl || 0) > 0).length;
        const wRate = totalT > 0 ? (winT / totalT) * 100 : 0;

        challengeItems.push({
          id: chal._id ? String(chal._id) : 'chal-active',
          levelId: chal.currentLevel || 1,
          levelName: chal.levelName || `Cấp ${chal.currentLevel || 1} • ${chal.currentLevel === 1 ? 'Tập Sự' : 'Thử Thách Quỹ'} ($${(chal.startingCapitalUSD || 10000).toLocaleString()})`,
          capitalUSD: chal.startingCapitalUSD || 10000,
          currentEquityUSD: chal.currentEquityUSD || chal.startingCapitalUSD || 10000,
          status: chal.status === 'PASSED' ? 'PASSED' : (chal.status === 'FAILED' ? 'FAILED' : (chal.status === 'PAUSED' ? 'PAUSED' : 'ACTIVE')),
          startedAt: chal.startedAt || chal.createdAt || new Date().toISOString(),
          tradesCount: totalT,
          winRate: wRate,
          profitUSD: chal.totalProfitUSD || (chal.currentEquityUSD - (chal.startingCapitalUSD || 10000)),
          breachReason: chal.breachReason,
          isDemo: false,
          trades: chalTrades
        });
      }

      // 2. Past historical attempts from challenge.history
      if (chalRes && chalRes.success && chalRes.challenge?.history && Array.isArray(chalRes.challenge.history)) {
        const hist = chalRes.challenge.history;
        hist.forEach((h: any, idx: number) => {
          const startTime = new Date(h.startedAt || 0).getTime() - 60000;
          const endTime = h.endedAt ? (new Date(h.endedAt).getTime() + 60000) : Infinity;

          let hTrades = allChallengeTrades.filter(tr => {
            const tTime = new Date(tr.entryTime || 0).getTime();
            return tTime >= startTime && tTime <= endTime;
          });

          // If this is the most recent attempt and current status is NOT_STARTED and no exact time matches,
          // attach recent challenge trades so user sees their executed orders
          if (idx === hist.length - 1 && chalRes.challenge.status === 'NOT_STARTED' && hTrades.length === 0) {
            hTrades = allChallengeTrades.filter(tr => {
              const tTime = new Date(tr.entryTime || 0).getTime();
              return tTime >= startTime;
            });
            if (hTrades.length === 0 && allChallengeTrades.length > 0) {
              hTrades = allChallengeTrades;
            }
          }

          const totalT = hTrades.length || h.tradesCount || 0;
          const winT = hTrades.filter(t => (t.pnl || 0) > 0).length;
          const wRate = totalT > 0 ? (winT / totalT) * 100 : (h.winRate || 0);

          challengeItems.push({
            id: `chal-hist-${idx}`,
            levelId: h.levelId || 1,
            levelName: h.levelName || `Cấp ${h.levelId || 1} • Tập Sự ($${(h.capitalUSD || 10000).toLocaleString()})`,
            capitalUSD: h.capitalUSD || 10000,
            currentEquityUSD: (h.capitalUSD || 10000) + (h.profitUSD || 0),
            status: h.result === 'PASSED' ? 'PASSED' : (h.result === 'FAILED' ? 'FAILED' : 'ABANDONED'),
            startedAt: h.startedAt || new Date().toISOString(),
            endedAt: h.endedAt,
            tradesCount: totalT,
            winRate: wRate,
            profitUSD: h.profitUSD || 0,
            breachReason: h.breachReason,
            isDemo: false,
            trades: hTrades
          });
        });
      }

      // 3. SORT NEWEST ATTEMPTS TO THE VERY TOP (Descending by startedAt)
      challengeItems.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

      // If user hasn't participated in any challenge yet, provide demo challenge history
      if (challengeItems.length === 0) {
        setChallengeHistory(SAMPLE_CHALLENGE_HISTORY);
      } else {
        setChallengeHistory(challengeItems);
      }

    } catch (e) {
      console.error('Failed to load trading journal sessions', e);
      if (showLoading) setError(true);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);

    const handleUpdate = () => {
      loadData(false);
    };

    window.addEventListener('simulator-session-updated', handleUpdate);
    window.addEventListener('simulator-session-ended', handleUpdate);
    window.addEventListener('trading-transaction-created', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadData(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('simulator-session-updated', handleUpdate);
      window.removeEventListener('simulator-session-ended', handleUpdate);
      window.removeEventListener('trading-transaction-created', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user?._id]);

  // -------------------------------------------------------------
  // SIMULATION DATA FILTERING & METRICS
  // -------------------------------------------------------------
  // Extract distinct simulations for the top selector dropdown
  const simulationOptions = useMemo(() => {
    const map = new Map<string, string>();
    sessions.forEach(s => {
      const simId = s.simulationId || s.simulationName;
      if (!map.has(simId)) {
        map.set(simId, s.simulationName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [sessions]);

  // Extract available symbols for filters
  const availableSymbols = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach(s => {
      if (s.symbol) set.add(s.symbol.toUpperCase());
    });
    return Array.from(set).sort();
  }, [sessions]);

  // Filtered session list
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      // Top simulation dropdown
      if (selectedSimulation !== 'ALL') {
        const simId = session.simulationId || session.simulationName;
        if (simId !== selectedSimulation && session.simulationName !== selectedSimulation) {
          return false;
        }
      }

      // Filter search
      if (filters.search.trim()) {
        const query = filters.search.trim().toLowerCase();
        const matchName = session.name.toLowerCase().includes(query);
        const matchSym = session.symbol.toLowerCase().includes(query);
        const matchSim = session.simulationName.toLowerCase().includes(query);
        if (!matchName && !matchSym && !matchSim) return false;
      }

      // Filter status
      if (filters.status !== 'ALL') {
        if (session.status !== filters.status) return false;
      }

      // Filter symbol
      if (filters.symbol !== 'ALL') {
        if (session.symbol.toUpperCase() !== filters.symbol.toUpperCase()) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }, [sessions, selectedSimulation, filters]);

  // Summary statistics computed across currently filtered sessions
  const summaryStats: JournalSummaryStats = useMemo(() => {
    const totalSessions = filteredSessions.length;
    let totalTrades = 0;
    let netPnL = 0;
    let totalWinTrades = 0;

    filteredSessions.forEach(s => {
      totalTrades += s.tradesCount;
      netPnL += s.netPnL;
      totalWinTrades += Math.round((s.tradesCount * s.winRate) / 100);
    });

    const winRate = totalTrades > 0 ? parseFloat(((totalWinTrades / totalTrades) * 100).toFixed(1)) : 0;

    return {
      totalSessions,
      totalTrades,
      winRate,
      netPnL
    };
  }, [filteredSessions]);

  const handleResetFilters = () => {
    setSelectedSimulation('ALL');
    setFilters({
      search: '',
      status: 'ALL',
      symbol: 'ALL',
      simulation: 'ALL'
    });
  };

  const handleSelectSession = (sessionId: string) => {
    navigate(`/student/journal/${sessionId}`);
  };

  // -------------------------------------------------------------
  // CHALLENGE DATA FILTERING & METRICS
  // -------------------------------------------------------------
  const availableChallengeLevels = useMemo(() => {
    const map = new Map<string, string>();
    challengeHistory.forEach(c => {
      const key = String(c.levelId);
      if (!map.has(key)) {
        map.set(key, c.levelName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [challengeHistory]);

  const availableChallengeSymbols = useMemo(() => {
    const set = new Set<string>();
    challengeHistory.forEach(c => {
      c.trades.forEach(t => {
        if (t.symbol) set.add(t.symbol.toUpperCase());
      });
    });
    return Array.from(set).sort();
  }, [challengeHistory]);

  const filteredChallenges = useMemo(() => {
    return challengeHistory.filter(item => {
      // Level filter
      if (challengeFilters.level !== 'ALL') {
        if (String(item.levelId) !== challengeFilters.level) return false;
      }

      // Status filter
      if (challengeFilters.status !== 'ALL') {
        if (item.status !== challengeFilters.status) return false;
      }

      // Symbol filter
      if (challengeFilters.symbol !== 'ALL') {
        const hasSym = item.trades.some(t => t.symbol.toUpperCase() === challengeFilters.symbol.toUpperCase());
        if (!hasSym) return false;
      }

      // Search
      if (challengeFilters.search.trim()) {
        const q = challengeFilters.search.trim().toLowerCase();
        const matchName = item.levelName.toLowerCase().includes(q);
        const matchTrades = item.trades.some(t => t.symbol.toLowerCase().includes(q));
        if (!matchName && !matchTrades) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime());
  }, [challengeHistory, challengeFilters]);

  const challengeSummaryStats: ChallengeSummaryStats = useMemo(() => {
    const totalAttempts = filteredChallenges.length;
    let totalTrades = 0;
    let totalWinTrades = 0;
    let netPnLUSD = 0;

    filteredChallenges.forEach(c => {
      totalTrades += c.tradesCount;
      netPnLUSD += c.profitUSD;
      totalWinTrades += Math.round((c.tradesCount * c.winRate) / 100);
    });

    const winRate = totalTrades > 0 ? parseFloat(((totalWinTrades / totalTrades) * 100).toFixed(1)) : 0;
    const activeChal = filteredChallenges.find(c => c.status === 'ACTIVE') || filteredChallenges[0];
    const activeLevelName = activeChal ? activeChal.levelName.split('•')[0].trim() : (lang === 'vi' ? 'Cấp $10,000' : '$10,000 Tier');

    const statusText = activeChal
      ? (lang === 'vi'
          ? `Trạng thái: ${activeChal.status === 'ACTIVE' ? 'Đang thi' : (activeChal.status === 'PASSED' ? 'Đã đạt' : activeChal.status)}`
          : `Status: ${activeChal.status}`)
      : (lang === 'vi' ? `${totalAttempts} lượt thi đã ghi nhận` : `${totalAttempts} attempts`);

    return {
      activeLevelName,
      totalAttempts,
      totalTrades,
      winRate,
      netPnLUSD,
      statusText
    };
  }, [filteredChallenges, lang]);

  const handleResetChallengeFilters = () => {
    setChallengeFilters({
      search: '',
      status: 'ALL',
      level: 'ALL',
      symbol: 'ALL'
    });
  };

  if (loading) {
    return <JournalSkeleton />;
  }

  if (error) {
    return <JournalErrorState onRetry={loadData} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300 min-w-0">
      {/* 1. Header with dynamic dropdown based on active tab */}
      <JournalHeader
        simulations={simulationOptions}
        selectedSimulation={selectedSimulation}
        onSelectSimulation={setSelectedSimulation}
        activeMainTab={activeMainTab}
        challengeLevels={availableChallengeLevels}
        selectedChallengeLevel={challengeFilters.level}
        onSelectChallengeLevel={(lvlId) => setChallengeFilters(prev => ({ ...prev, level: lvlId }))}
      />

      {/* 2. Main Tab Navigation Switcher */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-[#253047]">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Tab 1: Mô phỏng giao dịch */}
          <button
            type="button"
            onClick={() => setActiveMainTab('SIMULATION')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeMainTab === 'SIMULATION'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/10 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-t-lg'
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" />
            <span>{lang === 'vi' ? 'Lịch sử mô phỏng giao dịch' : 'Simulation Trading History'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
              activeMainTab === 'SIMULATION'
                ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white'
                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {sessions.length}
            </span>
          </button>

          {/* Tab 2: Thử thách quỹ */}
          <button
            type="button"
            onClick={() => setActiveMainTab('CHALLENGE')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeMainTab === 'CHALLENGE'
                ? 'border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-t-lg'
            }`}
          >
            <Trophy className="w-4 h-4 shrink-0 text-amber-500" />
            <span>{lang === 'vi' ? 'Lịch sử thử thách quỹ' : 'Funded Challenge History'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
              activeMainTab === 'CHALLENGE'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {challengeHistory.length}
            </span>
          </button>
        </div>

        {/* Quick action: Open Challenge Terminal */}
        {activeMainTab === 'CHALLENGE' && (
          <button
            type="button"
            onClick={() => navigate('/trade/btcusdt?openChallenge=true')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer shrink-0"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>{lang === 'vi' ? 'Đăng Ký Thử Thách' : 'Join Challenge'}</span>
          </button>
        )}
      </div>

      {/* 3. Tab Contents */}
      {activeMainTab === 'SIMULATION' ? (
        <>
          {/* Compact Journal Summary */}
          <JournalSummary stats={summaryStats} />

          {/* Filter Bar */}
          <JournalFilters
            filters={filters}
            onFilterChange={(newF) => setFilters(prev => ({ ...prev, ...newF }))}
            onReset={handleResetFilters}
            availableSymbols={availableSymbols}
          />

          {/* Session Table / Empty State */}
          {filteredSessions.length === 0 ? (
            sessions.length === 0 ? (
              <JournalEmptyState />
            ) : (
              <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-xl p-10 text-center">
                <h4 className="text-base font-bold text-slate-800 dark:text-white">
                  {lang === 'vi' ? 'Không có phiên nào phù hợp với bộ lọc' : 'No sessions match the selected filters'}
                </h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  {lang === 'vi' ? 'Thử chọn "Tất cả kỳ thi" hoặc đặt lại bộ lọc tìm kiếm.' : 'Try choosing "All Simulations" or resetting your search filters.'}
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  {lang === 'vi' ? 'Đặt lại bộ lọc' : 'Reset Filters'}
                </button>
              </div>
            )
          ) : (
            <SessionTable
              sessions={filteredSessions}
              onSelectSession={handleSelectSession}
            />
          )}
        </>
      ) : (
        <>
          {/* Challenge 4 Summary Cards */}
          <ChallengeSummary stats={challengeSummaryStats} />

          {/* Challenge Filters */}
          <ChallengeFilters
            filters={challengeFilters}
            onFilterChange={(newF) => setChallengeFilters(prev => ({ ...prev, ...newF }))}
            onReset={handleResetChallengeFilters}
            availableSymbols={availableChallengeSymbols}
            availableLevels={availableChallengeLevels}
          />

          {/* Challenge History Table with Expandable Trade Executions */}
          <ChallengeHistoryTable
            challenges={filteredChallenges}
            onOpenChallengeModal={() => navigate('/trade/btcusdt?openChallenge=true')}
          />
        </>
      )}
    </div>
  );
};
