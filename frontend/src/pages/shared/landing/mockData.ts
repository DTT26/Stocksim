export interface MarketQuote {
  symbol: string;
  name: string;
  category: 'CRYPTO' | 'EQUITIES' | 'COMMODITIES' | 'FOREX';
  price: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  volume24hUsd: number;
  isFutures?: boolean;
  leverageMax?: number;
}

export interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
  depthPercent: number;
}

export interface TradePrint {
  id: string;
  time: string;
  price: number;
  size: number;
  side: 'BUY' | 'SELL';
}

export interface SimulationChallenge {
  id: string;
  title: string;
  course: string;
  initialBalanceUsd: number;
  participantsCount: number;
  maxDrawdownPercent: number;
  maxLeverage: string;
  status: 'LIVE' | 'ACTIVE' | 'REGISTRATION' | 'COMPLETED';
  assetClass: string;
  topPerformerReturn: number;
  leaderboardPreview: { rank: number; name: string; pnlUsd: number; roe: number }[];
  rulesSummary: string[];
}

export interface VerifiedTradeEvidence {
  id: string;
  assignmentTitle: string;
  courseCode: string;
  studentName: string;
  studentId: string;
  submissionTimeUtc: string;
  tradeHash: string;
  verificationBadge: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  realizedPnlUsd: number;
  returnOnEquity: number;
  riskRewardRatio: string;
  holdingTime: string;
  checks: {
    rule: string;
    target: string;
    actual: string;
    passed: boolean;
  }[];
  lecturerGrade: {
    score: number;
    letterGrade: string;
    evaluatedBy: string;
    notes: string;
  };
}

export interface PerformanceMetric {
  label: string;
  value: string;
  delta?: string;
  isPositive?: boolean;
  description: string;
}

export interface EquityCurvePoint {
  date: string;
  equity: number;
  benchmark: number;
  drawdown: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  pnlUsd: number;
  returnPercent: number;
  riskReward: string;
  setupTag: string;
  session: 'London' | 'New York' | 'Asia';
  reflectionNote: string;
  isVerified: boolean;
}

// -------------------------------------------------------------
// Live Market Quotes (All in USD)
// -------------------------------------------------------------
export const MARKET_QUOTES: MarketQuote[] = [
  // Crypto
  {
    symbol: 'BTCUSDT',
    name: 'Bitcoin Perpetual',
    category: 'CRYPTO',
    price: 83090.00,
    change: -1405.00,
    changePercent: -1.66,
    high24h: 85210.00,
    low24h: 82740.00,
    volume24hUsd: 42_500_000_000,
    isFutures: true,
    leverageMax: 125,
  },
  {
    symbol: 'ETHUSDT',
    name: 'Ethereum Perpetual',
    category: 'CRYPTO',
    price: 2667.50,
    change: -19.80,
    changePercent: -0.74,
    high24h: 2740.00,
    low24h: 2635.00,
    volume24hUsd: 21_800_000_000,
    isFutures: true,
    leverageMax: 100,
  },
  {
    symbol: 'SOLUSDT',
    name: 'Solana Perpetual',
    category: 'CRYPTO',
    price: 118.15,
    change: -3.42,
    changePercent: -2.81,
    high24h: 124.60,
    low24h: 116.80,
    volume24hUsd: 7_600_000_000,
    isFutures: true,
    leverageMax: 75,
  },
  // US Equities
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    category: 'EQUITIES',
    price: 224.08,
    change: 5.20,
    changePercent: 2.38,
    high24h: 226.40,
    low24h: 219.80,
    volume24hUsd: 15_200_000_000,
    leverageMax: 20,
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    category: 'EQUITIES',
    price: 340.62,
    change: 3.50,
    changePercent: 1.04,
    high24h: 342.10,
    low24h: 337.50,
    volume24hUsd: 8_500_000_000,
    leverageMax: 20,
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    category: 'EQUITIES',
    price: 517.07,
    change: 6.20,
    changePercent: 1.21,
    high24h: 519.80,
    low24h: 512.40,
    volume24hUsd: 6_800_000_000,
    leverageMax: 20,
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    category: 'EQUITIES',
    price: 370.11,
    change: -4.50,
    changePercent: -1.20,
    high24h: 378.00,
    low24h: 366.50,
    volume24hUsd: 12_400_000_000,
    leverageMax: 20,
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    category: 'EQUITIES',
    price: 245.80,
    change: 2.80,
    changePercent: 1.15,
    high24h: 247.90,
    low24h: 243.10,
    volume24hUsd: 7_100_000_000,
    leverageMax: 20,
  },
  // Commodities
  {
    symbol: 'XAUUSD',
    name: 'Gold Spot (oz)',
    category: 'COMMODITIES',
    price: 4143.40,
    change: 11.08,
    changePercent: 0.27,
    high24h: 4160.00,
    low24h: 4128.50,
    volume24hUsd: 35_000_000_000,
    leverageMax: 200,
  },
  {
    symbol: 'USOIL',
    name: 'Crude Oil WTI',
    category: 'COMMODITIES',
    price: 91.15,
    change: 0.30,
    changePercent: 0.33,
    high24h: 92.40,
    low24h: 90.50,
    volume24hUsd: 18_000_000_000,
    leverageMax: 100,
  },
  // Forex
  {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    category: 'FOREX',
    price: 1.1378,
    change: 0.0012,
    changePercent: 0.11,
    high24h: 1.1395,
    low24h: 1.1350,
    volume24hUsd: 85_000_000_000,
    leverageMax: 500,
  },
  {
    symbol: 'USDJPY',
    name: 'US Dollar / Japanese Yen',
    category: 'FOREX',
    price: 157.76,
    change: 0.85,
    changePercent: 0.54,
    high24h: 158.20,
    low24h: 156.90,
    volume24hUsd: 55_000_000_000,
    leverageMax: 500,
  },
];

// -------------------------------------------------------------
// Realistic Candlesticks for Hero Terminal Chart
// -------------------------------------------------------------
export interface TerminalCandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20: number;
  ema50: number;
  isFvg?: boolean;
  fvgTop?: number;
  fvgBottom?: number;
}

export const HERO_CHART_DATA: TerminalCandle[] = [
  { time: '09:00', open: 82400, high: 82650, low: 82300, close: 82580, volume: 1420, ema20: 82420, ema50: 82310 },
  { time: '09:15', open: 82580, high: 82900, low: 82510, close: 82820, volume: 1890, ema20: 82470, ema50: 82340 },
  { time: '09:30', open: 82820, high: 83200, low: 82750, close: 83140, volume: 2450, ema20: 82550, ema50: 82380, isFvg: true, fvgTop: 83200, fvgBottom: 82850 },
  { time: '09:45', open: 83140, high: 83450, low: 83050, close: 83390, volume: 2100, ema20: 82650, ema50: 82430 },
  { time: '10:00', open: 83390, high: 83780, low: 83300, close: 83650, volume: 3200, ema20: 82780, ema50: 82490 },
  { time: '10:15', open: 83650, high: 83720, low: 83200, close: 83280, volume: 2800, ema20: 82850, ema50: 82540 },
  { time: '10:30', open: 83280, high: 83350, low: 82880, close: 82950, volume: 1950, ema20: 82860, ema50: 82570 },
  { time: '10:45', open: 82950, high: 83120, low: 82800, close: 82890, volume: 1640, ema20: 82870, ema50: 82590 },
  { time: '11:00', open: 82890, high: 83250, low: 82840, close: 83180, volume: 1820, ema20: 82910, ema50: 82620 },
  { time: '11:15', open: 83180, high: 83500, low: 83100, close: 83420, volume: 2150, ema20: 82980, ema50: 82660 },
  { time: '11:30', open: 83420, high: 83890, low: 83380, close: 83820, volume: 2980, ema20: 83080, ema50: 82720 },
  { time: '11:45', open: 83820, high: 84150, low: 83750, close: 84080, volume: 3410, ema20: 83210, ema50: 82790 },
  { time: '12:00', open: 84080, high: 84220, low: 83620, close: 83740, volume: 2540, ema20: 83280, ema50: 82840 },
  { time: '12:15', open: 83740, high: 83900, low: 83450, close: 83520, volume: 1980, ema20: 83310, ema50: 82880 },
  { time: '12:30', open: 83520, high: 83650, low: 83180, close: 83290, volume: 1760, ema20: 83310, ema50: 82910 },
  { time: '12:45', open: 83290, high: 83410, low: 82960, close: 83090, volume: 2210, ema20: 83280, ema50: 82930 },
];

// Order Book Generator Helper
export const generateOrderBook = (centerPrice: number): { asks: OrderBookLevel[]; bids: OrderBookLevel[] } => {
  const asks: OrderBookLevel[] = [];
  const bids: OrderBookLevel[] = [];
  let askTotal = 0;
  let bidTotal = 0;

  for (let i = 5; i >= 1; i--) {
    const price = +(centerPrice + i * 2.5).toFixed(2);
    const size = +(Math.random() * 1.8 + 0.35).toFixed(3);
    askTotal += size;
    asks.push({
      price,
      size,
      total: +askTotal.toFixed(3),
      depthPercent: Math.min(100, Math.round((askTotal / 12) * 100)),
    });
  }

  for (let i = 1; i <= 5; i++) {
    const price = +(centerPrice - i * 2.5).toFixed(2);
    const size = +(Math.random() * 2.1 + 0.4).toFixed(3);
    bidTotal += size;
    bids.push({
      price,
      size,
      total: +bidTotal.toFixed(3),
      depthPercent: Math.min(100, Math.round((bidTotal / 12) * 100)),
    });
  }

  return { asks, bids };
};

// Recent Trade Tape
export const INITIAL_TRADES_TAPE: TradePrint[] = [
  { id: 't-1', time: '12:47:19', price: 83090.00, size: 0.854, side: 'BUY' },
  { id: 't-2', time: '12:47:18', price: 83088.50, size: 1.200, side: 'SELL' },
  { id: 't-3', time: '12:47:16', price: 83090.00, size: 0.412, side: 'BUY' },
  { id: 't-4', time: '12:47:14', price: 83087.00, size: 2.150, side: 'SELL' },
  { id: 't-5', time: '12:47:11', price: 83091.50, size: 0.180, side: 'BUY' },
  { id: 't-6', time: '12:47:08', price: 83092.00, size: 3.420, side: 'BUY' },
  { id: 't-7', time: '12:47:04', price: 83086.00, size: 0.950, side: 'SELL' },
];

// -------------------------------------------------------------
// Structured Simulations Challenges
// -------------------------------------------------------------
export const SIMULATION_CHALLENGES: SimulationChallenge[] = [
  {
    id: 'sim-wallst-2026',
    title: 'Wall Street Equity & Risk League',
    course: 'FIN-301: Portfolio Theory & Equity Analysis',
    initialBalanceUsd: 100_000,
    participantsCount: 342,
    maxDrawdownPercent: 8.0,
    maxLeverage: '2x Reg-T',
    status: 'LIVE',
    assetClass: 'US S&P 500 & Nasdaq 100',
    topPerformerReturn: 18.42,
    leaderboardPreview: [
      { rank: 1, name: 'S. Al-Mansoor', pnlUsd: 18420.00, roe: 18.42 },
      { rank: 2, name: 'C. Chen', pnlUsd: 15310.50, roe: 15.31 },
      { rank: 3, name: 'E. Kowalski', pnlUsd: 12890.00, roe: 12.89 },
    ],
    rulesSummary: [
      'Maximum single stock allocation: 15% of total equity',
      'Mandatory Stop-Loss within 2 minutes of market open',
      'Daily Loss Limit: $3,000 USD (3.0%) hard stop',
    ],
  },
  {
    id: 'sim-macro-fx',
    title: 'Global Macro & Commodities Championship',
    course: 'ECON-410: International Finance & Currency Markets',
    initialBalanceUsd: 250_000,
    participantsCount: 188,
    maxDrawdownPercent: 6.0,
    maxLeverage: 'Up to 50x Isolated',
    status: 'ACTIVE',
    assetClass: 'G10 FX & Gold / Crude Oil',
    topPerformerReturn: 24.15,
    leaderboardPreview: [
      { rank: 1, name: 'H. Bergstrom', pnlUsd: 60375.00, roe: 24.15 },
      { rank: 2, name: 'M. Patel', pnlUsd: 48920.00, roe: 19.57 },
      { rank: 3, name: 'L. Dubois', pnlUsd: 36700.00, roe: 14.68 },
    ],
    rulesSummary: [
      'G10 pairs and Precious Metals only',
      'Maximum overnight open margin: 40%',
      'System-logged rationales required for trades > 20 lots',
    ],
  },
  {
    id: 'sim-prop-crypto',
    title: 'Derivatives & Prop Firm Risk Sandbox',
    course: 'FIN-505: Advanced Derivatives & Algorithmic Hedging',
    initialBalanceUsd: 50_000,
    participantsCount: 512,
    maxDrawdownPercent: 5.0,
    maxLeverage: '25x Max Capped',
    status: 'LIVE',
    assetClass: 'BTC, ETH & High-Cap Perpetuals',
    topPerformerReturn: 31.80,
    leaderboardPreview: [
      { rank: 1, name: 'T. Nakamura', pnlUsd: 15900.00, roe: 31.80 },
      { rank: 2, name: 'A. Vance', pnlUsd: 14210.00, roe: 28.42 },
      { rank: 3, name: 'J. Rodriguez', pnlUsd: 11450.00, roe: 22.90 },
    ],
    rulesSummary: [
      'Strict 1.5% maximum risk per trade rule',
      'Zero liquidation tolerance — automatic disqualification',
      'Minimum of 10 closed positions with 1:2 R:R proof',
    ],
  },
  {
    id: 'sim-quant-algo',
    title: 'Quantitative Alpha & Systematic Execution',
    course: 'CS/FIN-480: Computational Finance & Order Books',
    initialBalanceUsd: 500_000,
    participantsCount: 96,
    maxDrawdownPercent: 4.0,
    maxLeverage: '10x Multi-Asset Cross',
    status: 'REGISTRATION',
    assetClass: 'Cross-Asset Multi-Exchange',
    topPerformerReturn: 14.60,
    leaderboardPreview: [
      { rank: 1, name: 'AlgoFund Alpha', pnlUsd: 73000.00, roe: 14.60 },
      { rank: 2, name: 'DeepVolt Syst.', pnlUsd: 58400.00, roe: 11.68 },
      { rank: 3, name: 'K-Means Arb', pnlUsd: 41200.00, roe: 8.24 },
    ],
    rulesSummary: [
      'Sharpe ratio >= 1.80 required for grade clearance',
      'Automated API trade execution logs submission',
      'Market-neutral delta exposure during weekends',
    ],
  },
];

// -------------------------------------------------------------
// System-Verified Trading Evidence
// -------------------------------------------------------------
export const VERIFIED_EVIDENCE_SAMPLE: VerifiedTradeEvidence = {
  id: 'ev-89104',
  assignmentTitle: 'Assignment 4: ICT Fair Value Gap & Strict Invalidation Execution',
  courseCode: 'FIN-402: Quantitative Derivatives & Risk Audit',
  studentName: 'Marcus Vance',
  studentId: 'STU-94021',
  submissionTimeUtc: '2026-10-04 12:48:22 UTC',
  tradeHash: '0x7f8d4e92a10b98c39485721d604a37b42f618e90c88b72e19fa82110c7143c3d',
  verificationBadge: 'CRYPTOGRAPHICALLY ATTESTED BY STOCKSIM ENGINE',
  symbol: 'BTCUSDT.P',
  side: 'LONG',
  entryPrice: 82400.00,
  exitPrice: 83820.00,
  quantity: 2.50,
  realizedPnlUsd: 3550.00,
  returnOnEquity: 86.16,
  riskRewardRatio: '1:2.45',
  holdingTime: '2 hours 18 minutes',
  checks: [
    {
      rule: 'Pre-Trade Stop-Loss Invalidation',
      target: 'SL placed <= 60s from order fill',
      actual: 'SL registered at 14.2s ($81,820.00)',
      passed: true,
    },
    {
      rule: 'Capital Risk Constraint',
      target: 'Max 2.0% equity risked on entry',
      actual: '1.45% risked ($1,450.00 USD on $100k balance)',
      passed: true,
    },
    {
      rule: 'Risk-to-Reward Execution',
      target: 'Minimum planned R:R >= 1:2.00',
      actual: '1:2.45 achieved at TP exit',
      passed: true,
    },
    {
      rule: 'Market Quote Execution Integrity',
      target: 'Zero off-market quotes or delayed fills',
      actual: 'Matched directly at Binance book tick',
      passed: true,
    },
    {
      rule: 'No Margin Call or Distress Event',
      target: 'Margin Ratio < 60% at peak drawdown',
      actual: 'Peak Margin Ratio 18.2% (Comfortable)',
      passed: true,
    },
  ],
  lecturerGrade: {
    score: 98,
    letterGrade: 'A+',
    evaluatedBy: 'Dr. Robert Sterling, Chair of Financial Markets',
    notes: 'Flawless execution discipline. The trade captured the 15m Fair Value Gap re-test at London open. Stop loss was set strictly below the swing low with no manual tampering.',
  },
};

// -------------------------------------------------------------
// Performance Analytics Data (USD)
// -------------------------------------------------------------
export const PERFORMANCE_METRICS: PerformanceMetric[] = [
  {
    label: 'Net Simulated Profit',
    value: '+$18,450.00 USD',
    delta: '+18.45%',
    isPositive: true,
    description: 'Starting Capital: $100,000 USD over 90 trading days',
  },
  {
    label: 'Sharpe Ratio',
    value: '2.18',
    delta: 'Top 3%',
    isPositive: true,
    description: 'Risk-free rate: 4.25% (US 3M Treasury benchmark)',
  },
  {
    label: 'Profit Factor',
    value: '2.45',
    delta: 'Institutional Grade',
    isPositive: true,
    description: 'Gross Profit ($31,200) / Gross Loss ($12,750)',
  },
  {
    label: 'Win Rate',
    value: '64.2%',
    delta: '52W / 29L',
    isPositive: true,
    description: '81 total verified trade executions',
  },
  {
    label: 'Max Drawdown',
    value: '-3.2%',
    delta: 'Strict Control',
    isPositive: true,
    description: 'Peak-to-trough decline (Course threshold: 8.0%)',
  },
  {
    label: 'Expectancy Per Trade',
    value: '+$336.50 USD',
    delta: 'Positive Edge',
    isPositive: true,
    description: '(Win% x Avg Win) - (Loss% x Avg Loss)',
  },
];

export const EQUITY_CURVE_DATA: EquityCurvePoint[] = [
  { date: 'Jul 01', equity: 100000, benchmark: 100000, drawdown: 0 },
  { date: 'Jul 08', equity: 101850, benchmark: 100400, drawdown: 0 },
  { date: 'Jul 15', equity: 103200, benchmark: 100900, drawdown: 0 },
  { date: 'Jul 22', equity: 102400, benchmark: 100600, drawdown: -0.77 },
  { date: 'Jul 29', equity: 104500, benchmark: 101200, drawdown: 0 },
  { date: 'Aug 05', equity: 106800, benchmark: 101500, drawdown: 0 },
  { date: 'Aug 12', equity: 105100, benchmark: 100800, drawdown: -1.59 },
  { date: 'Aug 19', equity: 107900, benchmark: 101900, drawdown: 0 },
  { date: 'Aug 26', equity: 110200, benchmark: 102300, drawdown: 0 },
  { date: 'Sep 02', equity: 108900, benchmark: 101800, drawdown: -1.18 },
  { date: 'Sep 09', equity: 111800, benchmark: 102600, drawdown: 0 },
  { date: 'Sep 16', equity: 114200, benchmark: 103100, drawdown: 0 },
  { date: 'Sep 23', equity: 113400, benchmark: 102800, drawdown: -0.70 },
  { date: 'Sep 30', equity: 116500, benchmark: 103700, drawdown: 0 },
  { date: 'Oct 04', equity: 118450, benchmark: 104200, drawdown: 0 },
];

// -------------------------------------------------------------
// Trading Journal Entries (USD)
// -------------------------------------------------------------
export const JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'j-01',
    date: '2026-10-04 10:15',
    symbol: 'BTCUSDT.P',
    side: 'LONG',
    entryPrice: 82400.00,
    exitPrice: 83820.00,
    pnlUsd: 3550.00,
    returnPercent: 4.31,
    riskReward: '1:2.45',
    setupTag: 'ICT 15m FVG Re-test',
    session: 'London',
    reflectionNote: 'Strong rejection at the Fair Value Gap low. Let the winner run to the second liquidity pool at previous session high.',
    isVerified: true,
  },
  {
    id: 'j-02',
    date: '2026-10-03 14:35',
    symbol: 'NVDA',
    side: 'LONG',
    entryPrice: 218.40,
    exitPrice: 224.00,
    pnlUsd: 1680.00,
    returnPercent: 2.56,
    riskReward: '1:2.10',
    setupTag: 'Opening Range Breakout',
    session: 'New York',
    reflectionNote: 'Clean 15-minute ORB above pre-market high with massive institutional volume. Scaled out half at +2R.',
    isVerified: true,
  },
  {
    id: 'j-03',
    date: '2026-10-02 08:20',
    symbol: 'EURUSD',
    side: 'SHORT',
    entryPrice: 1.1420,
    exitPrice: 1.1375,
    pnlUsd: 900.00,
    returnPercent: 0.39,
    riskReward: '1:3.00',
    setupTag: 'London Open Sweep',
    session: 'London',
    reflectionNote: 'Asian high sweep followed by market structure shift. Tight stop above liquidity wick. Target hit during London fix.',
    isVerified: true,
  },
  {
    id: 'j-04',
    date: '2026-10-01 16:10',
    symbol: 'TSLA',
    side: 'SHORT',
    entryPrice: 376.50,
    exitPrice: 379.80,
    pnlUsd: -660.00,
    returnPercent: -0.88,
    riskReward: '1:1.80',
    setupTag: 'Mean Reversion Failed',
    session: 'New York',
    reflectionNote: 'Stock showed unexpected relative strength despite broader market sell-off. Stop loss executed as planned. No emotional tampering.',
    isVerified: true,
  },
  {
    id: 'j-05',
    date: '2026-09-29 11:05',
    symbol: 'XAUUSD',
    side: 'LONG',
    entryPrice: 4120.00,
    exitPrice: 4145.00,
    pnlUsd: 2500.00,
    returnPercent: 0.61,
    riskReward: '1:2.80',
    setupTag: 'Order Block Reaction',
    session: 'London',
    reflectionNote: 'Gold tapped 4H bullish order block with oversold RSI divergence. Closed position before US CPI release.',
    isVerified: true,
  },
];

// -------------------------------------------------------------
// Cinematic Experience Enriched Datasets
// -------------------------------------------------------------
export interface FeaturedStockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
  peRatio: string;
  chartData: { time: string; price: number; volume: number }[];
}

export const FEATURED_STOCKS: FeaturedStockData[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 248.42,
    change: 6.85,
    changePercent: 2.84,
    volume: '$14.2B USD',
    marketCap: '$3.78T USD',
    peRatio: '34.2',
    chartData: [
      { time: '09:30', price: 242.10, volume: 420 },
      { time: '10:00', price: 243.80, volume: 680 },
      { time: '10:30', price: 245.20, volume: 890 },
      { time: '11:00', price: 244.60, volume: 530 },
      { time: '11:30', price: 246.40, volume: 720 },
      { time: '12:00', price: 247.10, volume: 610 },
      { time: '12:30', price: 246.80, volume: 490 },
      { time: '13:00', price: 247.90, volume: 780 },
      { time: '13:30', price: 248.20, volume: 830 },
      { time: '14:00', price: 247.50, volume: 670 },
      { time: '14:30', price: 248.10, volume: 910 },
      { time: '15:00', price: 248.42, volume: 1420 },
    ],
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    price: 189.27,
    change: 8.52,
    changePercent: 4.72,
    volume: '$28.5B USD',
    marketCap: '$4.62T USD',
    peRatio: '48.6',
    chartData: [
      { time: '09:30', price: 180.75, volume: 920 },
      { time: '10:00', price: 182.40, volume: 1100 },
      { time: '10:30', price: 184.80, volume: 1450 },
      { time: '11:00', price: 183.90, volume: 890 },
      { time: '11:30', price: 186.20, volume: 1320 },
      { time: '12:00', price: 187.40, volume: 950 },
      { time: '12:30', price: 186.90, volume: 840 },
      { time: '13:00', price: 188.10, volume: 1200 },
      { time: '13:30', price: 188.80, volume: 1380 },
      { time: '14:00', price: 188.20, volume: 1040 },
      { time: '14:30', price: 189.05, volume: 1680 },
      { time: '15:00', price: 189.27, volume: 2240 },
    ],
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 438.12,
    change: -5.22,
    changePercent: -1.18,
    volume: '$19.8B USD',
    marketCap: '$1.39T USD',
    peRatio: '88.4',
    chartData: [
      { time: '09:30', price: 445.00, volume: 780 },
      { time: '10:00', price: 442.80, volume: 890 },
      { time: '10:30', price: 440.10, volume: 650 },
      { time: '11:00', price: 441.50, volume: 540 },
      { time: '11:30', price: 439.20, volume: 620 },
      { time: '12:00', price: 437.80, volume: 710 },
      { time: '12:30', price: 438.50, volume: 490 },
      { time: '13:00', price: 436.90, volume: 680 },
      { time: '13:30', price: 437.40, volume: 740 },
      { time: '14:00', price: 436.80, volume: 810 },
      { time: '14:30', price: 437.90, volume: 920 },
      { time: '15:00', price: 438.12, volume: 1340 },
    ],
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 521.44,
    change: 5.31,
    changePercent: 1.03,
    volume: '$11.4B USD',
    marketCap: '$3.87T USD',
    peRatio: '36.8',
    chartData: [
      { time: '09:30', price: 516.10, volume: 380 },
      { time: '10:00', price: 517.80, volume: 490 },
      { time: '10:30', price: 519.20, volume: 540 },
      { time: '11:00', price: 518.90, volume: 410 },
      { time: '11:30', price: 520.10, volume: 480 },
      { time: '12:00', price: 520.60, volume: 390 },
      { time: '12:30', price: 520.20, volume: 340 },
      { time: '13:00', price: 521.00, volume: 510 },
      { time: '13:30', price: 521.30, volume: 580 },
      { time: '14:00', price: 520.90, volume: 470 },
      { time: '14:30', price: 521.20, volume: 640 },
      { time: '15:00', price: 521.44, volume: 980 },
    ],
  },
  {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    price: 734.21,
    change: 15.52,
    changePercent: 2.16,
    volume: '$10.6B USD',
    marketCap: '$1.86T USD',
    peRatio: '28.5',
    chartData: [
      { time: '09:30', price: 718.70, volume: 410 },
      { time: '10:00', price: 722.40, volume: 530 },
      { time: '10:30', price: 726.80, volume: 620 },
      { time: '11:00', price: 725.90, volume: 480 },
      { time: '11:30', price: 729.10, volume: 590 },
      { time: '12:00', price: 731.40, volume: 520 },
      { time: '12:30', price: 730.80, volume: 440 },
      { time: '13:00', price: 732.50, volume: 610 },
      { time: '13:30', price: 733.20, volume: 670 },
      { time: '14:00', price: 732.80, volume: 560 },
      { time: '14:30', price: 733.90, volume: 740 },
      { time: '15:00', price: 734.21, volume: 1120 },
    ],
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 219.62,
    change: 1.78,
    changePercent: 0.82,
    volume: '$9.2B USD',
    marketCap: '$2.29T USD',
    peRatio: '42.1',
    chartData: [
      { time: '09:30', price: 217.80, volume: 350 },
      { time: '10:00', price: 218.40, volume: 420 },
      { time: '10:30', price: 219.10, volume: 480 },
      { time: '11:00', price: 218.70, volume: 390 },
      { time: '11:30', price: 219.30, volume: 460 },
      { time: '12:00', price: 219.50, volume: 410 },
      { time: '12:30', price: 219.20, volume: 330 },
      { time: '13:00', price: 219.70, volume: 470 },
      { time: '13:30', price: 219.90, volume: 510 },
      { time: '14:00', price: 219.40, volume: 440 },
      { time: '14:30', price: 219.55, volume: 580 },
      { time: '15:00', price: 219.62, volume: 890 },
    ],
  },
];

export const DUAL_TICKER_ITEMS = [
  { symbol: 'AAPL', price: 248.42, changePercent: 2.84 },
  { symbol: 'NVDA', price: 189.27, changePercent: 4.72 },
  { symbol: 'TSLA', price: 438.12, changePercent: -1.18 },
  { symbol: 'MSFT', price: 521.44, changePercent: 1.03 },
  { symbol: 'META', price: 734.21, changePercent: 2.16 },
  { symbol: 'AMZN', price: 219.62, changePercent: 0.82 },
  { symbol: 'BTCUSDT', price: 83090.00, changePercent: -1.66 },
  { symbol: 'ETHUSDT', price: 2667.50, changePercent: -0.74 },
  { symbol: 'XAUUSD', price: 4143.40, changePercent: 0.27 },
  { symbol: 'EURUSD', price: 1.1378, changePercent: 0.11 },
];

export const CINEMATIC_LEADERBOARD = [
  { rank: 1, name: 'Alex Morgan', returnPercent: 18.42, portfolio: '$118,420', trades: 42, isUser: false },
  { rank: 2, name: 'Daniel Kim', returnPercent: 14.08, portfolio: '$114,080', trades: 38, isUser: false },
  { rank: 3, name: 'Sophia Lee', returnPercent: 9.17, portfolio: '$109,170', trades: 29, isUser: false },
  { rank: 4, name: 'Bạn', returnPercent: 8.42, portfolio: '$108,420', trades: 34, isUser: true },
];

export const CINEMATIC_TIMELINE = [
  {
    id: 'tx-1',
    time: '10:24:03',
    symbol: 'AAPL',
    side: 'BUY',
    quantity: 20,
    price: 246.80,
    statusSequence: ['ĐÃ GỬI LỆNH', 'ĐÃ KHỚP SỔ', 'ĐÃ KHỚP HẾT', 'ĐÃ XÁC THỰC'],
    realizedPnl: null,
    isVerified: true,
  },
  {
    id: 'tx-2',
    time: '11:03:42',
    symbol: 'AAPL',
    side: 'SELL',
    quantity: 20,
    price: 250.20,
    statusSequence: ['ĐÃ GỬI LỆNH', 'ĐÃ KHỚP SỔ', 'ĐÃ KHỚP HẾT', 'ĐÃ XÁC THỰC'],
    realizedPnl: 68.00,
    isVerified: true,
  },
  {
    id: 'tx-3',
    time: '13:15:20',
    symbol: 'NVDA',
    side: 'BUY',
    quantity: 50,
    price: 186.40,
    statusSequence: ['ĐÃ GỬI LỆNH', 'ĐÃ KHỚP SỔ', 'ĐÃ KHỚP HẾT', 'ĐÃ XÁC THỰC'],
    realizedPnl: null,
    isVerified: true,
  },
  {
    id: 'tx-4',
    time: '14:48:10',
    symbol: 'NVDA',
    side: 'SELL',
    quantity: 50,
    price: 191.10,
    statusSequence: ['ĐÃ GỬI LỆNH', 'ĐÃ KHỚP SỔ', 'ĐÃ KHỚP HẾT', 'ĐÃ XÁC THỰC'],
    realizedPnl: 235.00,
    isVerified: true,
  },
];

