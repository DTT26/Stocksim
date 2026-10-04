export interface KnowledgeSource {
  id?: string;
  title: string;
  concept: string;
  framework: string;
  source: string;
  sourceUrl: string;
  author: string;
  sourceType: 'PRIMARY' | 'SECONDARY' | 'AI_GENERATED';
  tags?: string[];
  score?: number;
}

export interface AskResponse {
  answer: string;
  concept?: string;
  framework?: string;
  reasoning?: string;
  sources: KnowledgeSource[];
  socraticQuestions: string[];
  guardrailTriggered?: string | null;
  provider?: string;
}

export interface TradeAnalysisSummary {
  symbol: string;
  side: string;
  entryPrice: number;
  currentPrice?: number;
  exitPrice?: number;
  isOpen?: boolean;
  stopLoss?: number;
  takeProfit?: number;
  quantity: number;
  pnl: number;
  returnPct: number;
  plannedRR: string;
  actualRR: string;
  riskPctOfAccount: string;
  mfe: string;
  mae: string;
  processScore: number;
  tradeVerdict: string;
  verdictDescription: string;
  coachingAdvice?: string;
  hasStopLoss?: boolean;
  hasTakeProfit?: boolean;
  entryTime?: string;
  exitTime?: string;
  timeframe?: string;
  strategy?: string;
  duration?: string;
}

export interface RubricItem {
  score: number;
  max: number;
  label: string;
}

export interface RubricBreakdown {
  setupValidation: RubricItem;
  riskManagement: RubricItem;
  entryDiscipline: RubricItem;
  exitPlanning: RubricItem;
  tradeReasoning: RubricItem;
  total: number;
  disclaimer: string;
}

export interface SetupCondition {
  condition: string;
  met: boolean | null;
  rule: string;
}

export interface ExcursionFlow {
  entry: number;
  maePrice: number;
  maePts: number;
  maeR: string;
  currentOrExit: number;
  mfePrice: number;
  mfePts: number;
  mfeR: string;
  isLive: boolean;
}

export interface TradeReviewData {
  summary: TradeAnalysisSummary;
  rubricScore?: RubricBreakdown;
  marketContext: {
    timeframe: string;
    higherTimeframeTrend?: string;
    currentTimeframeTrend?: string;
    marketStructure?: string;
    volatility?: string;
    volumeContext?: string;
    supportResistance: string;
    liquidity?: string;
    tradingSession?: string;
    relevantConditions?: string;
    trend?: string;
  };
  setupValidation?: {
    strategy: string;
    checklist: SetupCondition[];
    completeness: string;
    disclaimer?: string;
  };
  setupQuality?: {
    strategy: string;
    setupName: string;
    reasonGiven: string;
    score: number;
  };
  beforeTrade?: {
    entry: number;
    plannedStopLoss: any;
    plannedTakeProfit: any;
    risk: string;
    plannedRR: string;
    userReasoning: string;
    evaluation: string;
  };
  afterTrade?: {
    actualEntry: number;
    actualExit?: number;
    currentPrice?: number;
    pnl: number;
    returnPct: number;
    actualRR: string;
    mfe: string;
    mae: string;
    holdingDuration: string;
    maxDrawdown: string;
    maxFavorableMove: string;
    exitReason: string;
  };
  planVsExecution?: {
    status: 'RULE_FOLLOWED' | 'PARTIALLY_FOLLOWED' | 'RULE_VIOLATED' | string;
    description: string;
    plan: {
      entry: string;
      stopLoss: string;
      takeProfit: string;
      risk: string;
      rr: string;
    };
    actual: {
      entry: string;
      stopLoss: string;
      takeProfit: string;
      risk: string;
      rr: string;
      exit: string;
    };
    auditNote: string;
  };
  riskAnalysis?: {
    hasStopLoss: boolean;
    capitalAtRisk: number;
    maxPotentialLoss: number | null;
    riskWarning?: string | null;
    riskPct: string;
    positionSizeValue: number;
    positionSizeRiskPct: number;
    stopLossDistanceUsd: number;
    stopLossDistancePct: number;
    targetDistanceUsd: number;
    targetDistancePct: number;
    plannedRR: number;
    actualRR: number;
  };
  excursionFlow?: ExcursionFlow;
  entryAnalysis?: {
    entryPrice: number;
    assessment: string;
  };
  stopLossAnalysis?: {
    stopLoss?: number;
    riskAmount: number;
    riskPct: string;
    comment: string;
  };
  takeProfitAnalysis?: {
    takeProfit?: number;
    plannedReward: number;
    comment: string;
  };
  excursionAnalysis?: {
    mfe: string;
    mae: string;
    drawdownRisk: string;
    exitEfficiency: string;
  };
  strengths: string[];
  improvements?: string[];
  ruleViolations?: string[];
  categorizedImprovements?: {
    ruleViolations: string[];
    executionIssues: string[];
    riskIssues: string[];
    strategyIssues: string[];
  };
  aiCoach?: {
    explanation: string;
    actionItem: string;
    reflectionQuestion: string;
  };
  learningTakeaways?: string[];
  studentReflection?: {
    question: string;
    placeholder: string;
  };
  socraticQuestions?: string[];
  sources: KnowledgeSource[];
}

export interface StrategySetupSimulation {
  framework: string;
  entry: string;
  stopLoss: string;
  takeProfit: string;
  rr: string;
  riskPct: string;
  rewardPct: string;
  rationale: string;
}

export interface StrategyMetricMatrixItem {
  criterion: string;
  priceAction: string;
  ict: string;
  badge: string;
}

export interface MarketRegimeAdvisory {
  trending: string;
  ranging: string;
  recommendation: string;
}

export interface StrategyComparisonData {
  symbol: string;
  side: string;
  entryPrice: number;
  priceAction: {
    frameworkName: string;
    keyFocus: string[];
    setupInterpretation: string;
    stopLossPlacement: string;
    takeProfitTarget: string;
    evidenceRequired: string;
  };
  ict: {
    frameworkName: string;
    keyFocus: string[];
    setupInterpretation: string;
    stopLossPlacement: string;
    takeProfitTarget: string;
    evidenceRequired: string;
  };
  simulatedSetups?: {
    priceAction: StrategySetupSimulation;
    ict: StrategySetupSimulation;
  };
  metricMatrix?: StrategyMetricMatrixItem[];
  marketRegimeAdvisory?: MarketRegimeAdvisory;
  similarities: string[];
  differences: string[];
  conclusion: string;
  sources: KnowledgeSource[];
}

const getRootApi = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/+$/, '')}/api`;
};
const API_BASE = `${getRootApi()}/ai`;

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export const aiService = {
  async askQuestion(
    question: string,
    framework?: string,
    symbol?: string,
    currentPrice?: number,
    timeframe?: string,
    marketContext?: any,
    chatHistory?: Array<{ sender: string; text: string }>,
    allStocks?: any[],
    lang: string = 'vi'
  ): Promise<AskResponse> {
    const res = await fetch(`${API_BASE}/ask`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ question, framework, symbol, currentPrice, timeframe, marketContext, chatHistory, allStocks, lang }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Lỗi kết nối AI Tutor');
    const data = json.data || {};
    if (!data.provider && (data.framework === 'VIP_LLM' || json.provider)) {
      data.provider = json.provider || 'openai';
    }
    return data;
  },

  async askQuestionStream(
    params: {
      question: string;
      framework?: string;
      symbol?: string;
      currentPrice?: number;
      timeframe?: string;
      marketContext?: any;
      chatHistory?: Array<{ sender: string; text: string }>;
      allStocks?: any[];
      lang?: string;
    },
    onChunk: (token: string, currentFullText: string) => void,
    onMeta?: (meta: any) => void
  ): Promise<AskResponse> {
    const res = await fetch(`${API_BASE}/ask-stream`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ ...params, lang: params.lang || 'vi' }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`HTTP Error ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = '';
    let buffer = '';
    let metaInfo: any = {};
    let doneData: any = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunkStr = decoder.decode(value, { stream: true });
      buffer += chunkStr;

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            if (parsed.type === 'error') {
              throw new Error(parsed.message || 'Lỗi xử lý AI');
            } else if (parsed.type === 'meta') {
              metaInfo = parsed;
              onMeta?.(parsed);
            } else if (parsed.type === 'token') {
              accumulatedText += parsed.token;
              onChunk(parsed.token, accumulatedText);
            } else if (parsed.type === 'done') {
              doneData = parsed;
              if (parsed.answer) accumulatedText = parsed.answer;
            }
          } catch (e: any) {
            if (e.message && !e.message.includes('JSON')) {
              throw e;
            }
          }
        }
      }
    }

    const finalAnswer = accumulatedText || doneData?.answer || metaInfo?.message || metaInfo?.answer;
    const finalProvider = doneData?.provider || metaInfo?.provider || (doneData?.framework === 'VIP_LLM' || metaInfo?.framework === 'VIP_LLM' ? 'openai' : 'knowledge_base');

    return {
      answer: finalAnswer || 'Không nhận được câu trả lời từ AI.',
      concept: doneData?.concept || metaInfo?.concept || 'AI Trading Tutor',
      framework: doneData?.framework || metaInfo?.framework || 'VIP_LLM',
      provider: finalProvider,
      sources: doneData?.sources || metaInfo?.sources || [],
      socraticQuestions: doneData?.socraticQuestions || [],
      guardrailTriggered: metaInfo?.guardrailTriggered || null
    };
  },

  async explainConcept(concept: string, framework?: string, lang: string = 'vi'): Promise<AskResponse> {
    const res = await fetch(`${API_BASE}/explain-concept`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ concept, framework, lang }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Lỗi giải thích khái niệm');
    return json.data;
  },

  async analyzeTrade(tradeData: any, lang: string = 'vi'): Promise<TradeReviewData> {
    const res = await fetch(`${API_BASE}/analyze-trade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...tradeData, lang: tradeData?.lang || lang }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Lỗi phân tích lệnh');
    return json.data;
  },

  async reviewTrade(tradeData: any, lang: string = 'vi'): Promise<TradeReviewData> {
    const res = await fetch(`${API_BASE}/review-trade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...tradeData, lang: tradeData?.lang || lang }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Lỗi xuất bản Trade Review');
    return json.data;
  },

  async submitReflection(payload: { trade: any; question?: string; reflectionText: string; lang?: string }): Promise<{ feedback: string; encouragement: string; reflectionReceived: string }> {
    const res = await fetch(`${API_BASE}/submit-reflection`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ ...payload, lang: payload.lang || 'vi' })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Lỗi gửi phản hồi tự phản biện');
    return json.data;
  },

  async compareStrategies(tradeData: any, lang: string = 'vi'): Promise<StrategyComparisonData> {
    const res = await fetch(`${API_BASE}/compare-strategies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trade: tradeData, lang }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Lỗi so sánh chiến lược');
    return json.data;
  },

  async getBacktestSpec(data: any) {
    const res = await fetch(`${API_BASE}/backtest-assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Lỗi tạo kế hoạch backtest');
    return json.data;
  },

  async getTradeInsights(trades?: any[]) {
    const res = await fetch(`${API_BASE}/trade-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trades: trades || [] }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Lỗi phân tích thói quen giao dịch');
    return json.data;
  },

  async getSources(): Promise<{ count: number; sources: KnowledgeSource[] }> {
    const res = await fetch(`${API_BASE}/sources`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Lỗi tải nguồn tri thức');
    return json.data;
  },

  async getLearningProgress() {
    const res = await fetch(`${API_BASE}/learning-progress`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Lỗi tải tiến độ');
    return json.data;
  },

  async getSavedReviews() {
    const res = await fetch(`${API_BASE}/reviews`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Lỗi tải danh sách review');
    return json.data;
  },

  async getChatHistory(symbol?: string): Promise<Array<{ id: string; sender: 'user' | 'tutor'; text: string; data?: AskResponse }>> {
    const query = symbol ? `?symbol=${encodeURIComponent(symbol)}` : '';
    const res = await fetch(`${API_BASE}/chat-history${query}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Lỗi tải lịch sử chat');
    return json.data;
  },

  async clearChatHistory(symbol?: string): Promise<void> {
    const query = symbol ? `?symbol=${encodeURIComponent(symbol)}` : '';
    const res = await fetch(`${API_BASE}/chat-history${query}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Lỗi xóa lịch sử chat');
  },

  async inspectChart(params: {
    image: string;
    symbol: string;
    timeframe: string;
    userNotes?: string;
  }): Promise<{
    success: boolean;
    symbol?: string;
    timeframe?: string;
    score?: number;
    verdict?: 'CORRECT' | 'PARTIALLY_CORRECT' | 'INCORRECT';
    analysis?: string;
    remainingToday?: number;
    isPremium?: boolean;
    quotaExceeded?: boolean;
    message?: string;
  }> {
    const res = await fetch(`${API_BASE}/inspect-chart`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(params)
    });
    const json = await res.json();
    return json;
  },

  async inspectChartDrawings(params: {
    symbol: string;
    timeframe: string;
    drawings: any[];
    klines: any[];
    userNotes?: string;
    lang?: string;
  }): Promise<{
    success: boolean;
    symbol?: string;
    timeframe?: string;
    score?: number;
    verdict?: 'CORRECT' | 'PARTIALLY_CORRECT' | 'INCORRECT';
    analysis?: string;
    suggestedZone?: {
      name?: string;
      priceHigh: number;
      priceLow: number;
      startTimestamp?: number;
      endTimestamp?: number;
      label?: string;
    };
    remainingToday?: number;
    isPremium?: boolean;
    quotaExceeded?: boolean;
    message?: string;
  }> {
    const res = await fetch(`${API_BASE}/inspect-chart-data`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(params)
    });
    const json = await res.json();
    return json;
  }
};
