import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import type { JournalSession } from '../types/journalTypes';

interface SessionHeaderProps {
  session: JournalSession;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({ session }) => {
  const navigate = useNavigate();

  const startDateFormatted = session.startedAt
    ? new Date(session.startedAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : 'N/A';

  const startTimeFormatted = session.startedAt
    ? new Date(session.startedAt).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  const endTimeFormatted = session.completedAt
    ? new Date(session.completedAt).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : (session.status === 'ACTIVE' ? 'Hiện tại' : '');

  return (
    <div className="space-y-4 pb-4 border-b border-slate-200 dark:border-[#253047]">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/student/journal')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Quay lại Nhật ký</span>
        </button>
      </div>

      {/* Main Info Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {session.name}
            </h1>

            {/* Status Badge */}
            {session.status === 'ACTIVE' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ĐANG MỞ
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                ĐÃ HOÀN THÀNH
              </span>
            )}

            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {session.symbol}
            </span>
          </div>

          {/* Subtitle details: simulation, date, time */}
          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
            <span className="text-slate-700 dark:text-slate-300 font-semibold">
              {session.simulationName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {startDateFormatted}
            </span>
            {startTimeFormatted && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {startTimeFormatted} {endTimeFormatted ? `– ${endTimeFormatted}` : ''}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Button: View Trading Terminal */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button
            onClick={() => navigate(`/trade/${session.symbol.toLowerCase()}`)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <span>Mở Terminal Giao dịch</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
