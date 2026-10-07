import React, { useState } from 'react';
import { VERIFIED_EVIDENCE_SAMPLE } from './mockData';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  FileCheck,
  Award,
  Hash,
  Clock,
  UserCheck,
  ExternalLink,
  Search
} from 'lucide-react';

export const AssignmentAndEvidence: React.FC = () => {
  const [copiedHash, setCopiedHash] = useState(false);
  const sample = VERIFIED_EVIDENCE_SAMPLE;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(sample.tradeHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <section id="evidence" className="w-full py-14 bg-[#080C14] border-b border-[#1E293B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#0F1728] border border-[#23324D] text-slate-300 text-xs font-mono mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>PROOF-OF-EXECUTION FOR ACADEMIC CURRICULA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
            Assignment & System-Verified Trading Evidence
          </h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Eliminate fabricated screenshots, cherry-picked paper trades, and hindsight bias. StockSim cryptographically
            verifies every order directly against the matching engine tape, providing university lecturers with an
            unimpeachable audit trail for coursework grading.
          </p>
        </div>

        {/* Verification Inspector Container */}
        <div className="rounded-lg border border-[#212D42] bg-[#0A0F1A] shadow-2xl overflow-hidden font-mono text-xs">
          {/* Top Verification Header */}
          <div className="bg-[#0D1525] border-b border-[#212D42] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div>
                <span className="font-bold text-white tracking-wider text-xs">
                  CRYPTOGRAPHIC TRADE AUDIT LOG #{sample.id.toUpperCase()}
                </span>
                <span className="ml-2 text-[10px] text-blue-400 font-semibold px-2 py-0.5 rounded bg-blue-950 border border-blue-800/40">
                  {sample.verificationBadge}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>TIMESTAMPORED AT: <strong className="text-slate-200">{sample.submissionTimeUtc}</strong></span>
            </div>
          </div>

          {/* Main Inspection Grid */}
          <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Trade Specifications & Cryptographic Attestation (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Assignment & Student Metadata Card */}
              <div className="p-3.5 rounded bg-[#070B14] border border-[#1A2538] space-y-2">
                <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-[#141E30]">
                  <span className="text-slate-400">ASSIGNMENT:</span>
                  <span className="font-bold text-slate-100">{sample.assignmentTitle}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-[#141E30]">
                  <span className="text-slate-400">COURSE:</span>
                  <span className="text-blue-400 font-semibold">{sample.courseCode}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">STUDENT:</span>
                  <span className="text-slate-200 font-medium">
                    {sample.studentName} ({sample.studentId})
                  </span>
                </div>
              </div>

              {/* Trade Execution Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded bg-[#070B14] border border-[#1A2538]">
                  <div className="text-[10px] text-slate-400">INSTRUMENT</div>
                  <div className="text-xs font-bold text-blue-400 mt-0.5">
                    {sample.symbol} ({sample.side})
                  </div>
                </div>
                <div className="p-2.5 rounded bg-[#070B14] border border-[#1A2538]">
                  <div className="text-[10px] text-slate-400">FILL / EXIT</div>
                  <div className="text-xs font-bold text-slate-200 mt-0.5">
                    ${sample.entryPrice.toLocaleString()} / ${sample.exitPrice.toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-[#070B14] border border-[#1A2538]">
                  <div className="text-[10px] text-slate-400">REALIZED PnL</div>
                  <div className="text-xs font-bold text-emerald-400 mt-0.5">
                    +${sample.realizedPnlUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                  </div>
                </div>
                <div className="p-2.5 rounded bg-[#070B14] border border-[#1A2538]">
                  <div className="text-[10px] text-slate-400">ACHIEVED R:R</div>
                  <div className="text-xs font-bold text-white mt-0.5">{sample.riskRewardRatio}</div>
                </div>
              </div>

              {/* Cryptographic SHA-256 Hash Box */}
              <div className="p-3 rounded bg-[#05080E] border border-[#162032] space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3 text-blue-400" />
                    MATCHING ENGINE SHA-256 IMMUTABLE AUDIT HASH
                  </span>
                  <button
                    onClick={handleCopyHash}
                    className="text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    {copiedHash ? 'COPIED!' : 'COPY HASH'}
                  </button>
                </div>
                <div className="text-[11px] text-slate-300 break-all select-all bg-[#090F1C] p-2 rounded border border-[#1B2940]">
                  {sample.tradeHash}
                </div>
              </div>
            </div>

            {/* Right Column: Automated Rule Compliance Checklist & Lecturer Grade (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Compliance Checklist */}
              <div className="p-3.5 rounded bg-[#070B14] border border-[#1A2538]">
                <div className="text-slate-200 font-bold mb-2 flex items-center justify-between">
                  <span>SYLLABUS RISK AUDIT (5/5 PASS)</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>

                <div className="space-y-2">
                  {sample.checks.map((chk, i) => (
                    <div key={i} className="p-2 rounded bg-[#0A101C] border border-[#162235]">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-slate-200 text-[11px]">{chk.rule}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold">
                          [VERIFIED PASS]
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Target: <span className="text-slate-300">{chk.target}</span>
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">
                        Attested: <strong>{chk.actual}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lecturer Official Grade Card */}
              <div className="p-3.5 rounded bg-[#0B1527] border border-[#1E3355]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white text-xs">OFFICIAL ACADEMIC VERDICT</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-lg text-emerald-400">{sample.lecturerGrade.score}/100</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs">
                      {sample.lecturerGrade.letterGrade}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 font-sans leading-relaxed italic bg-[#070E1A] p-2.5 rounded border border-[#162740]">
                  "{sample.lecturerGrade.notes}"
                </div>

                <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>AUDITOR: {sample.lecturerGrade.evaluatedBy}</span>
                  <span className="text-emerald-400">STATUS: RECORDED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
