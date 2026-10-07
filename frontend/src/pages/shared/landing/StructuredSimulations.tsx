import React from 'react';
import { Link } from 'react-router-dom';
import { SIMULATION_CHALLENGES } from './mockData';
import { Layers, Users, DollarSign, AlertTriangle, Trophy, ArrowRight, ShieldCheck } from 'lucide-react';

export const StructuredSimulations: React.FC = () => {
  return (
    <section id="simulations" className="w-full py-14 bg-[#060911] border-b border-[#1E293B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>ACADEMIC & PROPRIETARY SIMULATIONS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Structured Simulation Environments
            </h2>
            <p className="mt-1 text-sm text-slate-400 max-w-2xl">
              Curated trading challenges engineered for university coursework, finance competitions, and proprietary firm risk evaluations. All portfolios start with simulated USD capital and strict drawdown boundaries.
            </p>
          </div>

          <Link
            to="/simulations"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#0F1728] hover:bg-[#16233B] text-slate-200 border border-[#23324D] text-xs font-mono font-medium transition-colors self-start md:self-auto"
          >
            <span>VIEW ALL SIMULATIONS</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>

        {/* 4 Simulation Challenge Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SIMULATION_CHALLENGES.map(sim => (
            <div
              key={sim.id}
              className="rounded-lg border border-[#212D42] bg-[#0A0F1A] p-5 shadow-lg flex flex-col justify-between hover:border-blue-500/40 transition-all"
            >
              <div>
                {/* Header: Status & Course */}
                <div className="flex items-center justify-between gap-2 mb-2 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded font-bold bg-[#121B2C] text-slate-300 border border-[#21304A]">
                    {sim.course}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] tracking-wider ${
                      sim.status === 'LIVE'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40 animate-pulse'
                        : sim.status === 'ACTIVE'
                        ? 'bg-blue-950 text-blue-400 border border-blue-800/40'
                        : 'bg-amber-950 text-amber-400 border border-amber-800/40'
                    }`}
                  >
                    ● {sim.status}
                  </span>
                </div>

                {/* Challenge Title */}
                <h3 className="text-lg font-bold text-white font-sans">{sim.title}</h3>
                <div className="text-xs font-mono text-slate-400 mt-0.5">Asset Whitelist: {sim.assetClass}</div>

                {/* Core Parameters Grid */}
                <div className="grid grid-cols-3 gap-2 my-4 p-2.5 rounded bg-[#070B14] border border-[#182338] text-center font-mono">
                  <div>
                    <div className="text-[10px] text-slate-400">INITIAL CAPITAL</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      ${sim.initialBalanceUsd.toLocaleString()} USD
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">MAX DRAWDOWN</div>
                    <div className="text-sm font-bold text-rose-400 mt-0.5">
                      {sim.maxDrawdownPercent}% HARD STOP
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">PARTICIPANTS</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">
                      {sim.participantsCount} TRADERS
                    </div>
                  </div>
                </div>

                {/* Rules Summary Checklist */}
                <div className="space-y-1.5 mb-4 text-xs font-mono">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    COURSE RISK CONSTRAINTS:
                  </div>
                  {sim.rulesSummary.map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>

                {/* Leaderboard Snapshot */}
                <div className="p-2.5 rounded bg-[#05080F] border border-[#162032] mb-4 font-mono text-xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5 border-b border-[#141E30] pb-1">
                    <span className="flex items-center gap-1 text-slate-300 font-semibold">
                      <Trophy className="w-3 h-3 text-amber-400" />
                      LEADERBOARD SNAPSHOT
                    </span>
                    <span className="text-emerald-400">TOP ROE: +{sim.topPerformerReturn}%</span>
                  </div>
                  <div className="space-y-1">
                    {sim.leaderboardPreview.map(lb => (
                      <div key={lb.rank} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">
                          #{lb.rank} <strong className="text-slate-200">{lb.name}</strong>
                        </span>
                        <span className="text-emerald-400 font-semibold">
                          +${lb.pnlUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD (+{lb.roe}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action */}
              <Link
                to={`/simulations`}
                className="w-full py-2.5 rounded bg-[#10192A] hover:bg-blue-600 text-slate-200 hover:text-white border border-[#21304A] hover:border-blue-500 font-mono text-xs font-semibold text-center transition-colors flex items-center justify-center gap-2"
              >
                <span>ENTER SIMULATION LEAGUE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
