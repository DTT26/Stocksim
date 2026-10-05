import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { journalService } from '../../services/journalService';
import type { JournalSession, JournalFilterState, JournalSummaryStats } from '../../features/journal/types/journalTypes';
import { JournalHeader } from '../../features/journal/components/JournalHeader';
import { JournalSummary } from '../../features/journal/components/JournalSummary';
import { JournalFilters } from '../../features/journal/components/JournalFilters';
import { SessionTable } from '../../features/journal/components/SessionTable';
import { JournalSkeleton } from '../../features/journal/components/JournalSkeleton';
import { JournalEmptyState } from '../../features/journal/components/JournalEmptyState';
import { JournalErrorState } from '../../features/journal/components/JournalErrorState';

export const StudentJournal: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useI18n();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<JournalSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Selected Simulation dropdown from top header
  const [selectedSimulation, setSelectedSimulation] = useState<string>('ALL');

  // Filter bar states
  const [filters, setFilters] = useState<JournalFilterState>({
    search: '',
    status: 'ALL',
    symbol: 'ALL',
    simulation: 'ALL'
  });

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(false);
    try {
      const data = await journalService.getSessions(user?._id);
      setSessions(data);
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
    return () => {
      window.removeEventListener('simulator-session-updated', handleUpdate);
      window.removeEventListener('simulator-session-ended', handleUpdate);
    };
  }, [user?._id]);

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
    });
  }, [sessions, selectedSimulation, filters]);

  // Summary statistics computed across currently filtered sessions (or all)
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

  if (loading) {
    return <JournalSkeleton />;
  }

  if (error) {
    return <JournalErrorState onRetry={loadData} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300 min-w-0">
      {/* 1. Header with simulation dropdown */}
      <JournalHeader
        simulations={simulationOptions}
        selectedSimulation={selectedSimulation}
        onSelectSimulation={setSelectedSimulation}
      />

      {/* 2. Compact Journal Summary */}
      <JournalSummary stats={summaryStats} />

      {/* 3. Filter Bar */}
      <JournalFilters
        filters={filters}
        onFilterChange={(newF) => setFilters(prev => ({ ...prev, ...newF }))}
        onReset={handleResetFilters}
        availableSymbols={availableSymbols}
      />

      {/* 4. Session Table / Empty State */}
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
    </div>
  );
};
