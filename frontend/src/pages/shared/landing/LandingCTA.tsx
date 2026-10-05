import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Terminal, ShieldCheck, ArrowUpRight, Cpu, Layers, CheckCircle2 } from 'lucide-react';

export const LandingCTA: React.FC = () => {
  const { login } = useAuth();

  return (
    <section className="w-full py-16 bg-[#060911] border-b border-[#1E293B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-xl border border-[#23324D] bg-[#0A101C] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          {/* Subtle structural grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#161F30_1px,transparent_1px),linear-gradient(to_bottom,#161F30_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20 pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            {/* Telemetry pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0F1829] border border-[#243552] text-slate-300 text-xs font-mono mb-4">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>ZERO CAPITAL AT RISK • 100% REALISTIC FINANCIAL MARKETS</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-sans leading-tight">
              Ready to Test Your Trading Discipline in Real Market Conditions?
            </h2>

            <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-sans leading-relaxed">
              Join thousands of university students and quantitative traders mastering order flow,
              position sizing, and ICT technical confluences on StockSim.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/trade/btcusdt"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-sm font-bold tracking-wide transition-all shadow-lg shadow-blue-950"
              >
                <Terminal className="w-4 h-4" />
                <span>OPEN SIMULATOR TERMINAL</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>

              <button
                onClick={() => login()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#111A2C] hover:bg-[#18253D] text-slate-200 border border-[#263753] hover:border-slate-500 font-mono text-sm font-semibold transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>LOG IN / CREATE ACCOUNT</span>
              </button>
            </div>

            {/* Feature Badges Bar */}
            <div className="mt-10 pt-6 border-t border-[#1C273C] grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-slate-400">
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Sub-Second Matching Engine</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Real-Time L2 Order Book</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Cryptographic Trade Hashes</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Automated Coursework Grading</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
