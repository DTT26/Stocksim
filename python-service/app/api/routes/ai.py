from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from typing import Dict, Any, List
from app.rag.schema import (
    AskQuestionRequest,
    ConceptExplainRequest,
    TradeInput,
    StudentReflectionRequest,
    StrategyComparisonRequest,
    BacktestAssistantRequest,
    TradeInsightsRequest
)
from app.services.ai_tutor_service import ai_tutor_service
from app.services.trade_analyzer import trade_analyzer
from app.services.strategy_comparator import strategy_comparator
from app.services.journal_pattern_detector import journal_pattern_detector
from app.services.backtest_assistant import backtest_assistant
from app.rag.vector_store import vector_store

router = APIRouter()

@router.post("/ask")
def ask_question(req: AskQuestionRequest):
    return ai_tutor_service.answer_question(req)

@router.post("/ask-stream")
def ask_question_stream(req: AskQuestionRequest):
    return StreamingResponse(
        ai_tutor_service.answer_question_stream(req),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/explain-concept")
def explain_concept(req: ConceptExplainRequest):
    return ai_tutor_service.explain_concept(req)

@router.post("/analyze-trade")
def analyze_trade(req: TradeInput):
    return trade_analyzer.analyze(req)

@router.post("/review-trade")
def review_trade(req: TradeInput):
    # Review trade produces the comprehensive report
    return trade_analyzer.analyze(req)

@router.post("/submit-reflection")
def submit_reflection(req: StudentReflectionRequest):
    return trade_analyzer.evaluate_reflection(
        trade=req.trade,
        question=req.question or "Nếu thực hiện lại trade này, bạn sẽ thay đổi điều gì?",
        reflection_text=req.reflectionText
    )

@router.post("/compare-strategies")
def compare_strategies(req: StrategyComparisonRequest):
    return strategy_comparator.compare(req.trade, req.lang or "vi")

@router.post("/backtest-assistant")
def backtest_assist(req: BacktestAssistantRequest):
    return backtest_assistant.generate_specification(req)

@router.post("/trade-insights")
def trade_insights(req: TradeInsightsRequest):
    return journal_pattern_detector.analyze_patterns(req.trades)

@router.post("/inspect-chart")
async def inspect_chart(request: Request):
    data = await request.json()
    image = data.get("image", "")
    symbol = data.get("symbol")
    timeframe = data.get("timeframe")
    user_notes = data.get("userNotes", "")
    user_id = request.headers.get("x-user-id") or data.get("userId")
    lang = data.get("lang", "vi")
    klines = data.get("klines", [])
    market_context = data.get("marketContext", {})
    return ai_tutor_service.inspect_chart_vision(
        image_base64=image,
        symbol=symbol,
        timeframe=timeframe,
        user_notes=user_notes,
        user_id=user_id,
        lang=lang,
        klines=klines,
        market_context=market_context
    )

@router.post("/inspect-chart-data")
async def inspect_chart_data(request: Request):
    data = await request.json()
    drawings = data.get("drawings", [])
    klines = data.get("klines", [])
    symbol = data.get("symbol")
    timeframe = data.get("timeframe")
    user_notes = data.get("userNotes", "")
    user_id = request.headers.get("x-user-id") or data.get("userId")
    lang = data.get("lang", "vi")
    return ai_tutor_service.inspect_chart_data(
        drawings=drawings,
        klines=klines,
        symbol=symbol,
        timeframe=timeframe,
        user_notes=user_notes,
        user_id=user_id,
        lang=lang
    )

@router.get("/sources")
def get_sources():
    """Return all verified knowledge documents currently indexed in vector store"""
    sources = []
    for doc in vector_store.documents:
        sources.append({
            "id": doc.id,
            "title": doc.title,
            "concept": doc.concept,
            "framework": doc.framework,
            "source": doc.source,
            "sourceUrl": doc.sourceUrl,
            "author": doc.author,
            "sourceType": doc.sourceType,
            "tags": doc.tags
        })
    return {"count": len(sources), "sources": sources}

@router.get("/learning-progress")
def get_learning_progress():
    # Return default baseline progress for concept mastery
    return {
        "conceptMastery": {
            "Market Structure": 78,
            "Liquidity (BSL / SSL)": 65,
            "Fair Value Gap (FVG)": 72,
            "Risk Management (1-2% Rule)": 88,
            "Trading Psychology & Discipline": 60
        },
        "completedReviews": 12,
        "primaryFocus": "Giảm thiểu vào lệnh sớm (Early Entry) và duy trì tỷ lệ R:R >= 1:1.5"
    }
