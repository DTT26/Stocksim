from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any, Literal

SourceType = Literal["PRIMARY", "SECONDARY", "AI_GENERATED"]

class KnowledgeDocument(BaseModel):
    id: str
    title: str
    concept: str
    framework: str # 'ICT' | 'PRICE_ACTION' | 'RISK_MANAGEMENT' | 'PSYCHOLOGY'
    content: str
    source: str
    sourceUrl: str
    author: str
    publishedDate: Optional[str] = None
    sourceType: SourceType
    tags: List[str] = []
    language: str = "vi"

class RetrievalResult(BaseModel):
    document: KnowledgeDocument
    score: float
    citationText: str

class AskQuestionRequest(BaseModel):
    question: str
    context: Optional[str] = None
    framework: Optional[str] = None # 'ICT', 'PRICE_ACTION', 'RISK_MANAGEMENT', or None
    symbol: Optional[str] = None
    currentPrice: Optional[float] = None
    timeframe: Optional[str] = None
    marketContext: Optional[Dict[str, Any]] = None
    chatHistory: Optional[List[Dict[str, Any]]] = None
    allStocks: Optional[List[Dict[str, Any]]] = None
    userData: Optional[Dict[str, Any]] = None
    userId: Optional[str] = None
    plan: Optional[str] = None
    lang: Optional[str] = "vi"

class ConceptExplainRequest(BaseModel):
    concept: str
    framework: Optional[str] = None
    lang: Optional[str] = "vi"

class TradeInput(BaseModel):
    model_config = ConfigDict(extra="allow")
    tradeId: Optional[str] = "TRD-CUSTOM" 
    symbol: str = "BTCUSDT"
    side: Literal["BUY", "SELL", "LONG", "SHORT"] = "BUY"
    entryPrice: float
    exitPrice: Optional[float] = None
    stopLoss: Optional[float] = None
    takeProfit: Optional[float] = None
    quantity: float = 1
    accountBalance: Optional[float] = 10000.0 # 10k USD default
    timeframe: Optional[str] = "15m"
    strategy: Optional[str] = "ICT" # 'ICT' | 'PRICE_ACTION' | 'TECHNICAL_ANALYSIS'
    setupName: Optional[str] = "Liquidity sweep + FVG"
    reason: Optional[str] = "Giá quét thanh khoản đáy phiên sáng rồi xuất hiện FVG tăng"
    entryTime: Optional[str] = None
    exitTime: Optional[str] = None
    historicalHighSinceEntry: Optional[float] = None
    historicalLowSinceEntry: Optional[float] = None
    currentPrice: Optional[float] = None
    isOpen: Optional[bool] = None
    realPnL: Optional[float] = None
    duration: Optional[str] = None
    lang: Optional[str] = "vi"

class StudentReflectionRequest(BaseModel):
    trade: TradeInput
    question: Optional[str] = "Nếu thực hiện lại trade này, bạn sẽ thay đổi điều gì?"
    reflectionText: str

class StrategyComparisonRequest(BaseModel):
    trade: TradeInput
    strategies: List[str] = ["PRICE_ACTION", "ICT"]
    lang: Optional[str] = "vi"

class BacktestAssistantRequest(BaseModel):
    strategy: str = "FVG"
    symbol: str = "FPT"
    timeframe: Optional[str] = "15m"
    period: Optional[str] = "2024"
    entryRule: Optional[str] = None
    stopLossRule: Optional[str] = None
    takeProfitRule: Optional[str] = None
    riskPerTrade: Optional[float] = 1.0 # 1%
    maxTradesPerDay: Optional[int] = 3

class TradeInsightsRequest(BaseModel):
    trades: List[TradeInput]
