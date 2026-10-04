import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  ShieldAlert,
  Binary,
  ArrowRight,
  CheckCircle2,
  Terminal,
  Zap,
  Gauge
} from 'lucide-react';

export const TradingTerminalShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MATCHING' | 'MARGIN' | 'ORDER_TYPES' | 'ICT_PD'>('MATCHING');

  const capabilities = [
    {
      id: 'MATCHING',
      title: 'Deterministic L2 Matching Engine',
      badge: 'LATENCY < 1ms',
      icon: Cpu,
      description:
        'Engineered to replicate institutional exchange mechanics. Simulates price-time queue priority, order book depth consumption, and liquidity slippage without real financial risk.',
      telemetry: [
        { label: 'THROUGHPUT', value: '45,000 ORDERS / SEC' },
        { label: 'SLIPPAGE MODEL', value: 'ORDER BOOK VOLUME-WEIGHTED' },
        { label: 'EXECUTION TICK', value: '0.12ms IN-MEMORY DISPATCH' },
        { label: 'API COMPATIBILITY', value: 'REST + BINANCE L2 WS' },
      ],
      codeSnippet: `// StockSim Matching Engine Core Logic (Deterministic)
interface OrderBookDepth {
  consumeLiquidity(side: 'BUY' | 'SELL', size: number): FillResult {
    const queue = side === 'BUY' ? this.asks : this.bids;
    let remaining = size;
    const fills: ExecutionFill[] = [];
    
    for (const level of queue) {
      const filled = Math.min(remaining, level.size);
      fills.push({ price: level.price, size: filled, time: Date.now() });
      remaining -= filled;
      if (remaining <= 0) break;
    }
    return { fills, avgPrice: calcVwap(fills), state: 'FILLED' };
  }
}`,
    },
    {
      id: 'MARGIN',
      title: 'Multi-Asset Cross & Isolated Margin Engine',
      badge: 'UP TO 125x LEVERAGE',
      icon: Layers,
      description:
        'Simulates tier-based maintenance margins, multi-currency collateral conversion, automated liquidation thresholds, and real-time margin call warnings.',
      telemetry: [
        { label: 'COLLATERAL CURRENCY', value: '100% US DOLLAR (USD)' },
        { label: 'MARGIN MODES', value: 'CROSS MARGIN & ISOLATED' },
        { label: 'LIQUIDATION THRESHOLD', value: 'MAINTENANCE RATIO < 100%' },
        { label: 'AUTO-DELEVERAGING (ADL)', value: 'ACTIVE PROFIT RANKING' },
      ],
      codeSnippet: `// Maintenance Margin & Liquidation Calculator
function evaluateLiquidation(position: Position, markPrice: number): boolean {
  const notional = position.size * markPrice;
  const mmr = getMaintenanceMarginRate(notional, position.symbol);
  const maintMarginReq = notional * mmr;
  const equity = position.initialMargin + position.unrealizedPnl(markPrice);
  
  // Real-time liquidation trigger:
  return equity <= maintMarginReq;
}`,
    },
    {
      id: 'ORDER_TYPES',
      title: 'Advanced Institutional Order Routing',
      badge: 'LIMIT / STOP / OCO',
      icon: Binary,
      description:
        'Full spectrum of order types required by professional prop firms and academic curricula: Post-Only, Reduce-Only, Trailing Stops, Take-Profit, and One-Cancels-the-Other.',
      telemetry: [
        { label: 'SUPPORTED ORDERS', value: 'LIMIT, MARKET, STOP, OCO, TRAILING' },
        { label: 'TIME IN FORCE', value: 'GTC, IOC, FOK' },
        { label: 'POSITION FLAGS', value: 'REDUCE-ONLY & POST-ONLY' },
        { label: 'AUDIT HASH', value: 'SHA-256 STAMP PER EXECUTION' },
      ],
      codeSnippet: `// Advanced Order Lifecycle Event
const stopLimitOrder = {
  type: 'STOP_MARKET',
  triggerPrice: 82500.00, // Trigger level in USD
  triggerType: 'MARK_PRICE',
  side: 'SELL',
  flags: ['REDUCE_ONLY'], // Protects capital without flipping
  slippageTolerance: 0.0015, // 0.15%
  executionVerification: 'CRYPTOGRAPHIC_STAMP'
};`,
    },
    {
      id: 'ICT_PD',
      title: 'Automated ICT PD-Array & Market Structure Detector',
      badge: 'AI PATTERN ENGINE',
      icon: ShieldAlert,
      description:
        'Integrated automated recognition for Fair Value Gaps (FVG), Order Blocks (OB), Breaker Blocks, and Liquidity Sweeps, directly verifying student technical setups against price action.',
      telemetry: [
        { label: 'ICT DETECTORS', value: 'FVG, OB, BREAKER, BSL / SSL SWEEP' },
        { label: 'TIMEFRAME ENGINE', value: 'MULTI-TIMEFRAME (15m, 1H, 4H, 1D)' },
        { label: 'CONFLUENCE SCORE', value: '0 - 100 ALGORITHMIC GRADING' },
        { label: 'DISQUALIFICATION', value: 'TAMPER-PROOF CHART REPLAY' },
      ],
      codeSnippet: `// ICT Fair Value Gap (FVG) Canonical Detector
function detectFairValueGap(c1: Candle, c2: Candle, c3: Candle): FvgZone | null {
  // Bullish FVG: High of Candle 1 < Low of Candle 3
  if (c3.low > c1.high) {
    return {
      type: 'BULLISH_FVG',
      top: c3.low,
      bottom: c1.high,
      midpoint: (c3.low + c1.high) / 2, // Consequent Encroachment
      isValidated: true
    };
  }
  return null;
}`,
    },
  ];

  const currentCapability = capabilities.find(c => c.id === activeTab)!;

  return (
    <section className="w-full py-14 bg-[#080C14] border-b border-[#1E293B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Heading */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#0F1728] border border-[#23324D] text-slate-300 text-xs font-mono mb-2">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>TERMINAL ARCHITECTURE SHOWCASE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
            Engineered For Deterministic Financial Simulation
          </h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Unlike generic educational platforms that use delayed quotes and basic form buttons, StockSim executes orders
            against real-time L2 order books with sub-millisecond dispatch and rigorous risk management rules.
          </p>
        </div>

        {/* Feature Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6 font-mono text-xs">
          {capabilities.map(cap => {
            const Icon = cap.icon;
            const isActive = activeTab === cap.id;
            return (
              <button
                key={cap.id}
                onClick={() => setActiveTab(cap.id as any)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isActive
                    ? 'bg-[#10192A] border-blue-500/60 text-white shadow-md'
                    : 'bg-[#0A0F1A] border-[#1E293B] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-[#141C2B] text-slate-500'
                    }`}
                  >
                    {cap.badge}
                  </span>
                </div>
                <div className="font-semibold text-xs truncate">{cap.title}</div>
              </button>
            );
          })}
        </div>

        {/* Technical Detail Card */}
        <div className="rounded-lg border border-[#212D42] bg-[#0A0F1A] p-5 sm:p-6 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Narrative & Telemetry */}
            <div className="lg:col-span-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>ARCHITECTURE MODULE // {currentCapability.id}</span>
                </div>
                <h3 className="text-xl font-bold text-white font-sans">{currentCapability.title}</h3>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  {currentCapability.description}
                </p>
              </div>

              {/* Telemetry Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                {currentCapability.telemetry.map(t => (
                  <div key={t.label} className="p-2.5 rounded bg-[#070B14] border border-[#1A263A] font-mono">
                    <div className="text-[10px] text-slate-400 tracking-wider">{t.label}</div>
                    <div className="text-xs font-bold text-slate-200 mt-0.5">{t.value}</div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400">STATUS:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800/40 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" />
                  PRODUCTION ACTIVE
                </span>
              </div>
            </div>

            {/* Right Side: Code / Engine Logic Inspection */}
            <div className="lg:col-span-6 rounded border border-[#1E293B] bg-[#060910] p-3 text-xs font-mono overflow-hidden">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1A2538] text-[11px] text-slate-400">
                <span className="text-slate-300 font-semibold">ENGINE SPECIFICATION (TypeScript)</span>
                <span className="text-blue-400 text-[10px]">VERIFIED KERNEL</span>
              </div>
              <pre className="text-[11px] text-slate-300 overflow-x-auto leading-relaxed font-mono">
                <code>{currentCapability.codeSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
