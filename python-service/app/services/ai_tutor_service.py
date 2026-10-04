from typing import Dict, Any, List, Optional, Iterator
import re
import json
from app.rag.retriever import retriever
from app.rag.schema import AskQuestionRequest, ConceptExplainRequest, RetrievalResult
from app.services.llm_client import llm_client
from app.services.market_context_helper import (
    check_strict_signal_guardrail,
    extract_relevant_stocks,
    classify_user_intent,
    get_all_methods_overview,
    SYMBOL_ALIASES,
    extract_chart_swings_and_extrema,
    format_detailed_chart_context
)
from app.services.prop_firm_risk_tool import (
    extract_trade_intent,
    evaluate_prop_firm_risk
)
from app.services.trading_methods_registry import (
    route_query_to_method,
    TradingMethod
)
from app.services.time_helper import (
    get_current_time_context,
    is_time_query
)
from app.services.subscription_service import subscription_service
from app.services.intent_router import route_question_intent
from app.core.config import FREE_DAILY_LIMIT, PREMIUM_DAILY_LIMIT, INSPECT_FREE_DAILY_LIMIT, INSPECT_PREMIUM_DAILY_LIMIT

SIGNAL_KEYWORDS = [
  "có nên mua", "có nên bán", "buy hay sell", "mua hay bán", 
  "nên vào lệnh không", "target bao nhiêu", "phím hàng", "kèo", "cho kèo",
  "should i buy", "should i sell", "buy or sell"
]

GREETING_KEYWORDS = [
  "hi", "hello", "chào", "xin chào", "hey", "halo", "alo", "chào bạn", "bạn là ai", 
  "who are you", "giới thiệu", "bạn làm được gì", "hướng dẫn", "bắt đầu", "help"
]


ICT_SMC_CANONICAL_GUIDELINES = """
==================================================
📚 BỘ QUY CHUẨN ĐỊNH NGHĨA CHÍNH XÁC ICT / SMC (INNER CIRCLE TRADER & SMART MONEY CONCEPTS):
==================================================
Khi giải thích hoặc phân tích bất kỳ khái niệm nào về ICT / SMC, bạn BẮT BUỘC phải tuân thủ 100% định nghĩa chuẩn xác sau:

1. BSL (Buy-Side Liquidity - Thanh khoản Phía Mua):
   - VỊ TRÍ: Luôn luôn nằm ở PHÍA TRÊN CÁC ĐỈNH (Old Highs, Swing Highs, Equal Highs - EQH, Previous Day High - PDH, Session Highs).
   - BẢN CHẤT: Nơi tập trung các lệnh BUY STOP gồm: (1) Lệnh Dừng Lỗ (Stop Loss) của phe Bán/Short và (2) Lệnh Mua Đuổi (Buy Stop) của Breakout Traders.
   - HÀNH VI SMART MONEY: Smart Money cần một lượng MUA cực lớn để khớp lệnh BÁN (Short/Sell) của họ. Do đó họ ĐẨY GIÁ VƯỢT ĐỈNH để quét BSL (kích hoạt các lệnh Buy của nhỏ lẻ), biến nhỏ lẻ thành đối ứng để Smart Money BÁN RA ở giá cao (Premium), sau đó giá đảo chiều GIẢM mạnh.
   - TUYỆT ĐỐI KHÔNG NÓI: BSL là "lực mua", BSL là "vùng hỗ trợ", hay BSL nằm ở dưới đáy (sai hoàn toàn!).

2. SSL (Sell-Side Liquidity - Thanh khoản Phía Bán):
   - VỊ TRÍ: Luôn luôn nằm ở PHÍA DƯỚI CÁC ĐÁY (Old Lows, Swing Lows, Equal Lows - EQL, Previous Day Low - PDL, Session Lows).
   - BẢN CHẤT: Nơi tập trung các lệnh SELL STOP gồm: (1) Lệnh Dừng Lỗ (Stop Loss) của phe Mua/Long và (2) Lệnh Bán Đuổi (Sell Stop) của Breakdown Traders.
   - HÀNH VI SMART MONEY: Smart Money cần một lượng BÁN cực lớn để khớp lệnh MUA (Long/Buy) của họ. Do đó họ ĐẨY GIÁ ĐÂM THỦNG ĐÁY để quét SSL (kích hoạt các lệnh Sell cắt lỗ của nhỏ lẻ), biến nhỏ lẻ thành đối ứng để Smart Money MUA VÀO ở giá rẻ (Discount), sau đó giá đảo chiều TĂNG mạnh.
   - TUYỆT ĐỐI KHÔNG NÓI: SSL là "lực bán", SSL là "vùng kháng cự", hay SSL nằm ở trên đỉnh (sai hoàn toàn!).

3. LIQUIDITY SWEEP (Săn / Quét thanh khoản - Raid / Turtle Soup):
   - Giá chỉ đâm râu nến (Wick) qua đỉnh BSL hoặc đáy SSL để gom thanh khoản rồi lập tức rút chân đóng nến quay ngược lại bên trong (SFP - Swing Failure Pattern) -> Tín hiệu chuẩn bị đảo chiều.
   - Phân biệt với LIQUIDITY RUN (Expansion): Thân nến (Candle Body) đóng cửa dứt khoát vượt qua kèm nến Displacement dài -> Bứt phá tiếp diễn để tìm đến vùng thanh khoản tiếp theo.

4. ERL (External Range Liquidity) vs IRL (Internal Range Liquidity):
   - ERL: Các mốc đỉnh/đáy lớn bên ngoài cấu trúc (Swing Highs/Lows, BSL, SSL).
   - IRL: Các vùng mất cân bằng bên trong cấu trúc, bao gồm FVG (Fair Value Gap) và Order Block (OB).
   - Quy luật IPDA: Giá luôn đi từ ERL -> IRL (quét đỉnh đáy ngoài xong hồi về FVG/OB trong), rồi từ IRL -> ERL (bật từ FVG/OB trong để mở rộng ra quét đỉnh đáy ngoài tiếp theo).
"""

class AiTutorService:
    """
    AI Trading Tutor Service.
    Enforces educational integrity:
    1. Welcomes user and handles assistance requests intelligently.
    2. Rejects buy/sell signal requests and redirects to objective reasoning.
    3. If API Key is present: Answers any question with full LLM intelligence.
       If RAG documents match, enriches LLM with Ground Truth and citations.
    4. If no API Key: Answers from verified local Knowledge Base documents
       with framework-specific Socratic questions.
    """

    def is_asking_for_signal(self, text: str) -> bool:
        lower = text.lower()
        return any(kw in lower for kw in SIGNAL_KEYWORDS)

    def is_greeting(self, text: str) -> bool:
        cleaned = re.sub(r'[^\w\s]', '', text.lower()).strip()
        words = cleaned.split()
        if len(words) <= 3 and any(kw in cleaned for kw in GREETING_KEYWORDS):
            return True
        return False

    def is_assistance_request(self, text: str) -> bool:
        lower = text.lower().strip()
        phrases = [
            "giúp tôi", "giúp đỡ", "hỗ trợ tôi", "bạn làm được gì", 
            "bạn có thể làm gì", "chỉ tôi", "dạy tôi", "help me", 
            "bạn có thể giúp", "hướng dẫn tôi", "giúp được gì"
        ]
        return any(p in lower for p in phrases)

    def get_socratic_questions(self, doc, lang: str = "vi") -> List[str]:
        concept = doc.concept
        framework = doc.framework.upper()
        is_en = str(lang).lower().startswith("en")

        if framework == "PSYCHOLOGY":
            if is_en:
                return [
                    "Under what market conditions did you last experience FOMO or an urge to revenge trade?",
                    "Do you log your setup rationale into your trading journal before entering or only after closing?",
                    "Following two consecutive losses, what does your mandatory cool-down protocol look like?"
                ]
            return [
                "Lần gần nhất bạn cảm thấy FOMO hoặc muốn giao dịch trả thù (Revenge Trading) là trong bối cảnh nào?",
                "Bạn thường ghi chép lại lý do vào lệnh vào nhật ký trước khi vào lệnh hay sau khi lệnh đã đóng?",
                "Sau 2 lệnh thua liên tiếp, kế hoạch nghỉ giải lao (Cool-down) của bạn được thực hiện ra sao?"
            ]
        elif framework == "RISK_MANAGEMENT":
            if is_en:
                return [
                    "Does your current position size strictly ensure that risk does not exceed 1-2% of total equity?",
                    "What is the minimum Risk:Reward (R:R) ratio you require before clicking the order button?",
                    "During high volatility, do you ever widen or tamper with your predetermined Stop Loss?"
                ]
            return [
                "Khối lượng vị thế (Position Size) hiện tại của bạn có đảm bảo mức rủi ro không vượt quá 2% tổng tài khoản không?",
                "Tỷ lệ Risk:Reward (R:R) tối thiểu mà bạn kiên quyết yêu cầu trước khi bấm nút mở vị thế là bao nhiêu?",
                "Khi thị trường biến động mạnh, bạn có bao giờ nới lỏng hoặc dời Stop Loss ra xa hơn không?"
            ]
        elif "LIQUIDITY" in concept.upper():
            if is_en:
                return [
                    "Is the liquidity pool (BSL/SSL) you are observing a session high/low or daily high/low?",
                    "After sweeping the liquidity pool, does the reaction candle show a clear rejection wick?",
                    "Is your technical Stop Loss placed safely behind the liquidity sweep high/low?"
                ]
            return [
                "Vùng thanh khoản (BSL/SSL) bạn vừa quan sát là đỉnh/đáy của phiên hôm nay hay khung ngày?",
                "Sau khi giá quét qua vùng đỉnh/đáy cũ, nến phản ứng có xuất hiện râu từ chối (Rejection) rõ ràng không?",
                "Điểm dừng lỗ kỹ thuật của bạn có nằm an toàn phía ngoài cây nến quét thanh khoản không?"
            ]
        else: # Technical setups: FVG, Order Block, Market Structure, Breakout
            if is_en:
                return [
                    f"What specific candlestick characteristics at the {concept} area confirm the reliability of this setup?",
                    f"In this {concept} setup, where is the exact Invalidation Level (Stop Loss) that nullifies the idea?",
                    "If the market pulls back 1R against your entry, what is your predetermined risk mitigation plan?"
                ]
            return [
                f"Đặc điểm nào của cây nến tại vùng {concept} giúp bạn xác nhận độ tin cậy của setup này?",
                f"Trong setup {concept}, điểm Invalidation (Stop Loss) vô hiệu hóa toàn bộ cấu trúc nằm ở đâu?",
                "Nếu giá đi ngược 1R so với dự kiến, kế hoạch quản trị rủi ro dự phòng của bạn là gì?"
            ]

    def answer_question(self, req: AskQuestionRequest) -> Dict[str, Any]:
        query = req.question.strip()
        lang = getattr(req, "lang", None) or "vi"
        is_en = str(lang).lower().startswith("en")

        # 0. User Subscription & Daily Quota Guardrail Check (Sections 3, 4, 5, 31)
        user_id = req.userId or (req.userData and req.userData.get("userId")) or "64f7b1e4a3b9c2d1e8f9a0b1"
        sub = subscription_service.get_or_create_subscription(user_id)
        plan = req.plan or sub.get("plan", "FREE")
        
        # 0.1 Scoring-based Question Intent Router (Sections 22 - 28)
        intent_info = route_question_intent(query)
        question_intent = intent_info["intent"]
        matched_tags = intent_info["matchedTags"]

        limit = 999999
        used = 0
        if plan != "PRO":
            limit = sub.get("monthly_chat_limit", 300) if plan in ["PLUS", "PREMIUM"] else sub.get("daily_ai_limit", FREE_DAILY_LIMIT)
            used = sub.get("monthly_chat_used", 0) if plan in ["PLUS", "PREMIUM"] else sub.get("daily_ai_used", 0)
            if used >= limit:
                if plan in ["PLUS", "PREMIUM"]:
                    err_msg = (
                        "⚠️ You have used up your 300 chat quota for this month! Please upgrade to ✨ AI Tutor PRO for unlimited chat."
                        if is_en else
                        "⚠️ Bạn đã sử dụng hết 300/300 lượt chat của gói PLUS trong tháng này!\nVui lòng nâng cấp lên gói ✨ AI Tutor PRO để trò chuyện không giới hạn."
                    )
                else:
                    err_msg = (
                        f"⚠️ You have used up your {used}/{limit} free AI interactions for today!\nPlease upgrade to PLUS (129k - 300 chats) or PRO (299k - Unlimited)."
                        if is_en else
                        f"⚠️ Bạn đã sử dụng hết {used}/{limit} lượt tương tác AI miễn phí hôm nay!\nVui lòng nâng cấp gói PLUS (129k - 300 lượt) hoặc PRO (299k - Không giới hạn)."
                    )
                return {
                    "success": False,
                    "intent": question_intent,
                    "message": err_msg,
                    "guardrailTriggered": "QUOTA_EXCEEDED",
                    "remainingToday": 0,
                    "plan": plan
                }

        # 1. Kích hoạt Strict Signal Guardrail trước mọi luồng xử lý (kể cả khi có LLM)
        # Ngăn chặn hoàn toàn prompt injection hoặc yêu cầu phím lệnh trực tiếp
        strict_guard = check_strict_signal_guardrail(query, req.symbol, lang=lang)
        if strict_guard:
            return strict_guard

        # Static Guardrail for Buy/Sell signals (khi không có LLM)
        if not llm_client.is_configured() and self.is_asking_for_signal(query):
            symbol = req.symbol or ("this asset" if is_en else "cổ phiếu này")
            if is_en:
                return {
                    "answer": (
                        f"⚠️ **System Policy**: The AI functions as an Educational Assistant & Independent Analytical Tutor, "
                        f"strictly avoiding direct Buy/Sell calls or trade execution recommendations for {symbol}.\n\n"
                        f"Instead, I can help you dissect key technical factors supporting or contradicting "
                        f"a position based on Price Action or ICT/SMC principles so you make your own independent decisions."
                    ),
                    "reasoning": "Trade execution decisions must be owned by the trader based on an objective plan and predefined risk.",
                    "sources": [],
                    "socraticQuestions": [],
                    "guardrailTriggered": "NO_BUY_SELL_SIGNAL"
                }
            else:
                return {
                    "answer": (
                        f"⚠️ **Nguyên tắc hệ thống**: AI hoạt động như một Trợ lý Giáo dục & Phân tích Độc lập, "
                        f"tuyệt đối không đưa ra khuyến nghị Mua (Buy) / Bán (Sell) hay phím lệnh giao dịch cho {symbol}.\n\n"
                        f"Thay vào đó, tôi có thể hỗ trợ bạn bóc tách các yếu tố kỹ thuật đang ủng hộ hoặc phản đối "
                        f"một vị thế dựa trên phương pháp Price Action hoặc ICT/SMC để bạn tự đưa ra quyết định độc lập."
                    ),
                    "reasoning": "Quyết định vào lệnh phải do chính trader chịu trách nhiệm dựa trên kế hoạch và tỷ lệ rủi ro định trước.",
                    "sources": [],
                    "socraticQuestions": [],
                    "guardrailTriggered": "NO_BUY_SELL_SIGNAL"
                }

        # 2. Retrieve relevant verified knowledge documents from Knowledge Base
        results: List[RetrievalResult] = retriever.retrieve(
            query=query,
            framework=req.framework,
            top_k=3
        )

        citations = []
        if results:
            for r in results:
                citations.append({
                    "title": r.document.title,
                    "concept": r.document.concept,
                    "framework": r.document.framework,
                    "source": r.document.source,
                    "sourceUrl": r.document.sourceUrl,
                    "author": r.document.author,
                    "sourceType": r.document.sourceType,
                    "score": r.score
                })

        # Function Calling / Risk Tool: Tự động tính toán Position Sizing & Kiểm tra vi phạm quỹ
        trade_intent = extract_trade_intent(query, active_symbol=req.symbol)
        risk_eval = evaluate_prop_firm_risk(trade_intent, req.userData or {}) if trade_intent else None

        # Real-time Clock & Trading Sessions (Giờ Việt Nam, UTC, New York, Session & Killzones)
        time_ctx = get_current_time_context()

        # 3. VIP MODE: Senior Prop Firm Funded Trader & ICT/SMC Coach Engine
        if llm_client.is_configured():
            # Concurrency-safe atomic quota reservation (Section 6)
            reserved, updated_sub = subscription_service.reserve_quota_slot(user_id)
            if not reserved:
                return {
                    "success": False,
                    "intent": question_intent,
                    "message": f"⚠️ Bạn đã sử dụng hết {limit}/{limit} lượt tương tác AI miễn phí hôm nay!\nVui lòng nâng cấp lên gói ✨ AI Tutor PRO để tiếp tục phân tích.",
                    "guardrailTriggered": "QUOTA_EXCEEDED",
                    "remainingToday": 0,
                    "plan": plan
                }

            active_method = route_query_to_method(
                query,
                has_positions=bool(req.userData and req.userData.get("positions"))
            )
            intent_guidance = active_method.to_prompt_text()

            # Dynamic Risk Tool Prompt Injection
            risk_tool_instruction = ""
            if risk_eval:
                risk_tool_instruction = (
                    "\n\n==================================================\n"
                    "⚡ FUNCTION CALLING: KẾT QUẢ ĐO LƯỜNG VỊ THẾ & RỦI RO QUỸ (PROP FIRM RISK TOOL)\n"
                    "==================================================\n"
                    "Hệ thống đã tự động chạy Function Calling / Risk Tool tính toán vị thế của học viên với kết quả sau:\n"
                    f"- Mã: {risk_eval['symbol']} | Lệnh: {risk_eval['side']} | Entry: ${risk_eval['entry']:,.2f} | SL: ${risk_eval['sl']:,.2f}\n"
                    f"- Khoảng cách SL: {risk_eval['sl_distance']:,.2f} giá\n"
                    f"- Khối lượng dự kiến: {risk_eval['volume']} lot\n"
                    f"- Thua lỗ ước tính nếu dính SL: ${risk_eval['estimated_loss']:,.2f}\n"
                    f"- Giới hạn Daily Loss còn lại trong ngày: ${risk_eval['remaining_daily_loss']:,.2f} (Số dư ví: ${risk_eval['account_balance']:,.2f})\n"
                    f"- Có vi phạm luật quỹ (Hard Breach) không: {'CÓ (NGUY HIỂM CỰC ĐỘ - TRƯỢT QUỸ NGAY LẬP TỨC)' if risk_eval['is_hard_breach'] else 'KHÔNG'}\n"
                    f"- Khối lượng tối đa cho phép để không vi phạm quỹ: {risk_eval['max_safe_lot']} lot\n"
                    f"- Khối lượng khuyến nghị chuẩn 1% rủi ro: {risk_eval['recommended_1pct_lot']} lot\n\n"
                    "QUY TẮC BẮT BUỘC KHI CÓ KẾT QUẢ RỦI RO:\n"
                    "1. KHÔNG nói đạo lý chung chung 'hãy quản lý vốn 1%'. Phải dùng chính xác các con số cụ thể đã tính toán ở trên.\n"
                    "2. Nếu có vi phạm luật quỹ (is_hard_breach = True), BẮT BUỘC đưa khối cảnh báo to rõ lên ngay ĐẦU TIÊN của câu trả lời:\n"
                    "   🔴 **CẢNH BÁO VI PHẠM LUẬT QUỸ (HARD BREACH RISK)**\n"
                    f"   - Đi {risk_eval['volume']} lot với SL này, nếu thua bạn mất ${risk_eval['estimated_loss']:,.2f}.\n"
                    f"   - Daily Drawdown còn lại hôm nay của bạn chỉ là ${risk_eval['remaining_daily_loss']:,.2f}. Lệnh này dính SL đồng nghĩa **TRƯỢT QUỸ NGAY LẬP TỨC**.\n"
                    f"   - Khối lượng tối đa cho phép vào: **Không quá {risk_eval['max_safe_lot']} lot**.\n"
                    "3. Sau đó phân tích ngắn gọn lý do kỹ thuật hoặc hướng dẫn đặt lệnh kỷ luật theo quy định quỹ."
                )

            time_prompt_section = (
                "\n\n==================================================\n"
                "🕒 THỜI GIAN THỰC TẾ HỆ THỐNG & PHIÊN GIAO DỊCH (REAL-TIME CLOCK):\n"
                "==================================================\n"
                f"- Giờ & Ngày Việt Nam (Chuẩn chính hệ thống): {time_ctx['vn_time']}\n"
                f"- Giờ Quốc tế (UTC): {time_ctx['utc_time']}\n"
                f"- Giờ New York (Wall Street): {time_ctx['ny_time']}\n"
                f"- Phiên thị trường hiện tại: {time_ctx['active_session']}\n"
                f"- Trạng thái Killzone ICT: {time_ctx['active_killzone']}\n"
                "QUY TẮC BẮT BUỘC: Khi học viên hỏi về thời gian, ngày hôm nay, thứ mấy hoặc năm nay, bạn BẮT BUỘC sử dụng "
                f"CHÍNH XÁC thời gian thực tế ở trên ({time_ctx['vn_time']}). TUYỆT ĐỐI KHÔNG dùng thời gian cũ trong dữ liệu training (như năm 2023)."
            )

            # Tiered Prompting (Section 33: FREE vs PREMIUM)
            if plan == "PREMIUM":
                tiered_prompt_section = (
                    "\n\n==================================================\n"
                    "✨ CẤU HÌNH PHẢN HỒI CHUYÊN SÂU [TIER: PREMIUM AI TUTOR PRO]\n"
                    "==================================================\n"
                    "Học viên đang sử dụng gói PREMIUM AI TUTOR PRO. Cung cấp phân tích chuyên sâu đa chiều khi dữ liệu thị trường hỗ trợ:\n"
                    "1. Phân tích đa khung thời gian: HTF (khung lớn định hướng) -> MTF (cấu trúc) -> LTF (thực thi).\n"
                    "2. Cấu trúc thị trường & Dòng tiền thông minh (Market Structure, BOS, CHoCH, MSS).\n"
                    "3. Quét thanh khoản (Liquidity Pools, BSL/SSL Sweep, Internal/External range).\n"
                    "4. Xung lực giá (Displacement), POI, Fair Value Gap (FVG), Order Block (OB).\n"
                    "5. Bối cảnh mở vị thế (Entry context), điểm vô hiệu hóa (Invalidation), mục tiêu (Target) và tỷ lệ R:R.\n"
                    "6. Đánh giá rủi ro (Risk & Drawdown) dựa trên số liệu thực tế từ tài khoản.\n"
                    "7. Luận điểm phản biện (Counter-thesis) & Kịch bản thị trường thay thế (Scenario Analysis).\n"
                    "Giữ phong thái sắc sảo, kỷ luật của một Senior Prop Firm Funded Trader."
                )
            else:
                tiered_prompt_section = (
                    "\n\n==================================================\n"
                    "🎯 CẤU HÌNH PHẢN HỒI GÓI TIÊU CHUẨN [TIER: FREE USER PLAN]\n"
                    "==================================================\n"
                    "Học viên đang sử dụng gói FREE.\n"
                    "Quy chuẩn phản hồi: Ngắn gọn, cô đọng khoảng 2-3 đoạn văn.\n"
                    "Tập trung chính vào:\n"
                    f"- Ý định câu hỏi: [{question_intent}]\n"
                    "- Bằng chứng then chốt (Main Evidence) & Lý do quan trọng nhất.\n"
                    "- Vùng POI / FVG / Mốc thanh khoản chính.\n"
                    "- Điểm vô hiệu hóa (Main Invalidation).\n"
                    "- Đúng 1 câu hỏi dẫn dắt tư duy (One Critical Socratic Question).\n"
                    "Tránh giải thích quá dài dòng hoặc lan man."
                )

            if question_intent in ["BAR_REPLAY", "BACKTEST_HISTORICAL"]:
                tiered_prompt_section += (
                    "\n\n==================================================\n"
                    "⏳ QUY TẮC PHÂN TÍCH REPLAY & BACKTEST (CHỐNG THIÊN KIẾN TƯƠNG LAI):\n"
                    "==================================================\n"
                    "- Tuyệt đối KHÔNG sử dụng thông tin hay diễn biến của nến tương lai để phân tích quyết định tại mốc lịch sử.\n"
                    "- Chỉ sử dụng dữ liệu có sẵn tại đúng thời điểm đó để đánh giá logic vào lệnh."
                )

            sys_prompt = (
                "Bạn là Senior Prop Firm Funded Trader & AI Trading Coach của nền tảng StockSim.\n"
                "Bạn phân tích thị trường với tư duy của một trader chuyên nghiệp theo phương pháp ICT, SMC (Smart Money Concepts) và Price Action thuần túy.\n\n"
                "Bạn có quyền truy cập ĐẦY ĐỦ VÀO DATABASE HỆ THỐNG gồm:\n"
                "1. Bảng giá thời gian thực của các mã tài sản trên hệ thống liên quan đến câu hỏi (Crypto, Cổ phiếu Mỹ, Hàng hóa Vàng/Dầu, Ngoại hối Forex, Chỉ số).\n"
                "2. Toàn bộ dữ liệu tài khoản của học viên trong Database (Số dư ví, các vị thế/lệnh đang mở LONG/SHORT, lệnh chờ, trạng thái thi Thử Thách Quỹ Prop Firm).\n\n"
                "==================================================\n"
                "PHƯƠNG PHÁP ĐƯỢC KÍCH HOẠT CHO CÂU HỎI HIỆN TẠI:\n"
                "==================================================\n"
                f"{intent_guidance}\n\n" + f"{ICT_SMC_CANONICAL_GUIDELINES}\n\n"
                f"{tiered_prompt_section}\n\n"
                "YÊU CẦU BẮT BUỘC:\n"
                "1. Tuân thủ nghiêm ngặt các mục trong [Các yếu tố bắt buộc phân tích] và [Quy chuẩn phản hồi] của phương pháp trên.\n"
                "2. Khi học viên hỏi về GIÁ CỦA BẤT KỲ MÃ NÀO: Tra cứu trong [BẢNG GIÁ THỊ TRƯỜNG LIÊN QUAN] để trả lời chính xác giá thực và biến động 24h.\n"
                "3. Khi học viên hỏi về TÀI KHOẢN/LỆNH: Tra cứu trong [DỮ LIỆU TÀI KHOẢN & VỊ THẾ HỌC VIÊN TRONG DATABASE].\n"
                "4. Tuyệt đối KHÔNG đưa ra tín hiệu Mua/Bán/Phím lệnh cụ thể (No Buy/Sell signal). Nếu học viên hỏi có nên vào lệnh hay không, áp dụng Phương Pháp 20 [NO-TRADE ANALYSIS / WAIT FOR CONFIRMATION] và chỉ rõ các điều kiện còn thiếu.\n"
                "5. TRẢ LỜI NGẮN GỌN, CÔ ĐỌNG, ĐI THẲNG VÀO TRỌNG TÂM, in đậm các mốc giá và POI quan trọng.\n"
                "6. DUY TRÌ MẠCH HỘI THOẠI LIÊN TIẾP: Tham chiếu lịch sử hội thoại gần đây để hiểu rõ các câu hỏi tiếp nối và đại từ thay thế.\n"
                "7. QUY TẮC PHẢN HỒI THỜI GIAN & HỘI THOẠI ĐỜI THƯỜNG:\n"
                "   - Khi học viên hỏi về thời gian/giờ giấc (ví dụ: 'giờ mấy giờ rồi em', 'bây giờ là mấy giờ', 'hôm nay ngày mấy', 'đang là phiên nào'):\n"
                "     + BẮT BUỘC trả lời chính xác theo [Giờ Việt Nam (UTC+7)] làm mốc giờ chuẩn mặc định của học viên.\n"
                "     + Cung cấp thêm giờ UTC và phiên giao dịch hiện tại nếu có ý nghĩa trong trading.\n"
                "     + Trả lời tự nhiên, thân thiện, lễ phép và đi thẳng vào câu hỏi.\n"
                "     + TUYỆT ĐỐI KHÔNG tự tiện chèn câu phân tích biểu đồ không liên quan (như 'Quay trở lại với bối cảnh thị trường BTCUSDT...') khi học viên KHÔNG hỏi về mã đó!"
                f"{time_prompt_section}"
                f"{risk_tool_instruction}\n\n"
                "==================================================\n"
                "QUY TẮC TRẢ LỜI CHỐNG NÓI CHUNG CHUNG (ANTI-GENERIC RESPONSE RULE)\n"
                "==================================================\n"
                "Tuyệt đối TRÁNH những câu nói sáo rỗng vô nghĩa như: 'BTC đang tăng', 'Xu hướng đang mạnh', 'Nên cân nhắc Long', 'Đặt SL dưới hỗ trợ', 'Hãy chờ xác nhận'.\n"
                "Mọi câu trả lời phân tích phải tuân theo chuỗi lập luận chặt chẽ:\n"
                "• CÁI GÌ (WHAT): Hiện tượng nến/thị trường cụ thể đang diễn ra.\n"
                "• Ở ĐÂU (WHERE): Mức giá, vùng POI, mốc FVG, đỉnh/đáy thanh khoản chính xác.\n"
                "• TẠI SAO (WHY): Động cơ của Dòng tiền thông minh (Smart Money) / Liquidity Sweep.\n"
                "• BẰNG CHỨNG (EVIDENCE): Nến Displacement, Volume, Thân nến đóng qua cản.\n"
                "• ĐIỀU GÌ VÔ HIỆU HÓA (INVALIDATION): Mức giá cụ thể mà nếu chạm vào thì luận điểm bị HỦY BỎ.\n"
                "• YẾU TỐ CÒN CHƯA RÕ (UNKNOWN): Điều kiện cần chờ thị trường xác nhận thêm.\n\n"
                "==================================================\n"
                "🌐 LANGUAGE REQUIREMENT (ƯU TIÊN TUYỆT ĐỐI / HIGHEST PRIORITY):\n"
                "==================================================\n"
                + (
                    "The user is using the ENGLISH interface.\n"
                    "You MUST respond 100% in natural, fluent, professional ENGLISH. Translate all analysis and terms into English."
                    if is_en else
                    "Giao diện người dùng đang đặt là TIẾNG VIỆT.\n"
                    "Bạn BẮT BUỘC phải trả lời 100% bằng TIẾNG VIỆT tự nhiên, chuẩn mực tài chính và thân thiện."
                )
            )
            
            chat_history_str = ""
            if req.chatHistory and len(req.chatHistory) > 0:
                history_lines = []
                for turn in req.chatHistory[-6:]:
                    sender = turn.get("sender") or turn.get("role")
                    role_label = "Học viên" if sender == "user" else "AI Tutor"
                    msg_text = str(turn.get("text", "")).strip()
                    if msg_text:
                        if len(msg_text) > 400:
                            msg_text = msg_text[:400] + "..."
                        history_lines.append(f"{role_label}: {msg_text}")
                    if history_lines:
                        chat_history_str = "\n\n💬 [LỊCH SỬ HỘI THOẠI GẦN ĐÂY ĐỂ TRẢ LỜI LIÊN TIẾP]:\n" + "\n".join(history_lines)

            # 1. Mã hiện tại và cấu trúc Đỉnh/Đáy thực tế trên biểu đồ
            current_chart_str = format_detailed_chart_context(
                symbol=req.symbol,
                current_price=req.currentPrice,
                timeframe=req.timeframe,
                market_context=req.marketContext,
                is_en=is_en
            )

            # 2. Bảng giá lọc thông minh (chỉ nạp 3-5 mã liên quan, chống tràn token & giảm độ trễ)
            all_stocks_str = ""
            relevant_stocks = extract_relevant_stocks(
                query=query,
                chat_history=req.chatHistory,
                active_symbol=req.symbol,
                all_stocks=req.allStocks
            )
            if relevant_stocks:
                stock_lines = []
                for s in relevant_stocks:
                    sym = s.get("symbol", "")
                    name = s.get("name", sym)
                    p = s.get("price")
                    pct = s.get("percent")
                    exch = s.get("exchange", "")
                    mkt = s.get("market", "")
                    if sym and p is not None:
                        p_fmt = f"${p:,.4f}".rstrip('0').rstrip('.') if p < 1 else f"${p:,.2f}"
                        pct_fmt = f" ({pct:+.2f}%)" if pct is not None else ""
                        stock_lines.append(f"• {sym} ({name} - {exch} [{mkt}]): {p_fmt}{pct_fmt}")
                if stock_lines:
                    all_stocks_str = "\n\n📈 [BẢNG GIÁ THỊ TRƯỜNG LIÊN QUAN]:\n" + "\n".join(stock_lines)

            # 3. Dữ liệu tài khoản & vị thế của học viên trong Database
            user_data_str = ""
            if req.userData:
                ud = req.userData
                ud_lines = []
                wallet = ud.get("wallet", {})
                if wallet:
                    ud_lines.append(f"- Ví tiền: Tổng số dư ${wallet.get('balance', 0):,.2f} | Khả dụng: ${wallet.get('availableBalance', 0):,.2f}")
                positions = ud.get("positions", [])
                if positions:
                    pos_items = []
                    for pos in positions:
                        pos_items.append(f"{pos.get('side')} {pos.get('symbol')} (Entry: ${pos.get('entryPrice')}, x{pos.get('leverage')}, Qty: {pos.get('quantity')}, TP: {pos.get('tp') or 'Chưa đặt'}, SL: {pos.get('sl') or 'Chưa đặt'})")
                    ud_lines.append(f"- Vị thế đang mở ({len(positions)} vị thế): " + "; ".join(pos_items))
                else:
                    ud_lines.append("- Vị thế đang mở: Hiện không có vị thế mở nào.")
                
                challenge = ud.get("challenge")
                if challenge:
                    ud_lines.append(f"- Thử thách Quỹ Cấp Vốn: Cấp {challenge.get('level')}, Trạng thái: {challenge.get('status')}, Vốn ban đầu: ${challenge.get('capital', 0):,.0f}, Lợi nhuận: ${challenge.get('totalProfit', 0):,.2f}, Lỗ ngày: ${challenge.get('dailyLoss', 0):,.2f}, Drawdown: ${challenge.get('maxLoss', 0):,.2f}")
                
                if ud_lines:
                    user_data_str = "\n\n👤 [DỮ LIỆU TÀI KHOẢN & VỊ THẾ HỌC VIÊN TRONG DATABASE]:\n" + "\n".join(ud_lines)

            risk_context = ""
            if risk_eval:
                risk_context = f"\n\n🚨 [KẾT QUẢ ĐO LƯỜNG VỊ THẾ TỰ ĐỘNG - FUNCTION CALLING RISK TOOL]:\n{risk_eval['alert_markdown']}"

            kb_context = ""
            if results:
                kb_context = "\n\nTài liệu tham khảo đối chiếu từ Knowledge Base:\n" + "\n---\n".join([
                    f"• {r.document.title} [{r.document.sourceType}] ({r.document.author}): {r.document.content}"
                    for r in results
                ])

            if is_time_query(query):
                user_p = (
                    f"{chat_history_str}\n\n"
                    f"Câu hỏi hiện tại của học viên: {query}\n\n"
                    f"🕒 [DỮ LIỆU ĐỒNG HỒ THỜI GIAN THỰC CỦA HỆ THỐNG]:\n"
                    f"- Giờ Việt Nam (UTC+7): {time_ctx['vn_time']}\n"
                    f"- Giờ Quốc tế: {time_ctx['utc_time']}\n"
                    f"- Giờ New York: {time_ctx['ny_time']}\n"
                    f"- Phiên giao dịch hiện tại: {time_ctx['active_session']}\n"
                    f"- Trạng thái Killzone ICT: {time_ctx['active_killzone']}\n\n"
                    "Hãy trả lời trực tiếp, chính xác Giờ Việt Nam cho học viên một cách thân thiện và súc tích. "
                    "Vì học viên chỉ hỏi về thời gian/giờ giấc, TUYỆT ĐỐI KHÔNG tự tiện chèn thêm phân tích biểu đồ mã tài sản vào câu trả lời."
                )
            else:
                user_p = (
                    f"{chat_history_str}\n\n"
                    f"Câu hỏi hiện tại của học viên: {query}"
                    f"{risk_context}"
                    f"{current_chart_str}"
                    f"{all_stocks_str}"
                    f"{user_data_str}"
                    f"{kb_context}\n\n"
                    "Hãy trả lời súc tích, hoàn chỉnh, chuyên nghiệp và chuẩn xác dựa trên toàn bộ dữ liệu thị trường và database học viên được cung cấp ở trên."
                )
            llm_answer = llm_client.generate_text(sys_prompt, user_p, max_tokens=2000 if plan == "PREMIUM" else 750)

            if llm_answer:
                # Nếu có rủi ro vi phạm quỹ Hard Breach, đảm bảo khối cảnh báo ở đầu bài
                if risk_eval and risk_eval.get("is_hard_breach"):
                    if "🔴" not in llm_answer and "HARD BREACH" not in llm_answer.upper():
                        llm_answer = f"{risk_eval['alert_markdown']}\n\n---\n\n{llm_answer}"

                new_used = updated_sub.get("daily_ai_used", used + 1)
                remaining = max(0, limit - new_used)

                return {
                    "success": True,
                    "intent": question_intent,
                    "answer": llm_answer,
                    "provider": llm_client.active_provider or llm_client.preferred_provider or "openai",
                    "plan": plan,
                    "dailyAiUsed": new_used,
                    "dailyAiLimit": limit,
                    "remainingToday": remaining,
                    "guardrailTriggered": "HARD_BREACH_ALERT" if (risk_eval and risk_eval.get("is_hard_breach")) else None,
                    "concept": results[0].document.concept if results else ("Session Timing & Real-time Clock" if is_time_query(query) else ("Prop Firm Risk Management" if risk_eval else "AI Trading Tutor")),
                    "framework": results[0].document.framework if results else "VIP_LLM",
                    "sources": citations,
                    "socraticQuestions": [],
                    "matchedTags": matched_tags
                }
            else:
                # LLM request failed -> Rollback reserved quota so user quota is NOT consumed (Section 6, 38)
                subscription_service.rollback_quota_slot(user_id)

                if llm_client.last_error and any(code in llm_client.last_error for code in ["401", "403"]):
                    return {
                        "success": False,
                        "intent": question_intent,
                        "plan": plan,
                        "dailyAiUsed": used,
                        "dailyAiLimit": limit,
                        "remainingToday": max(0, limit - used),
                        "answer": (
                            f"⚠️ **Key AI trong file `.env` bị Google từ chối cấp quyền:**\n\n"
                            f"> 🔴 **Mã lỗi từ Google**: `{llm_client.last_error}`\n\n"
                            f"**Nguyên nhân:** Project hoặc Token này bị hạn chế quyền truy cập API (`PERMISSION_DENIED`).\n\n"
                            f"**Cách xử lý:**\n"
                            f"1. Vào: https://aistudio.google.com/app/apikey bằng một tài khoản Gmail khác\n"
                            f"2. Bấm **'Create API key'** và dán vào `GEMINI_API_KEY=` trong file `python-service/.env`"
                        ),
                        "concept": "Lỗi phân quyền API Key",
                        "framework": "CONFIG_ERROR",
                        "sources": citations,
                        "socraticQuestions": [
                            "Bạn có muốn đổi sang key từ một Gmail khác không?",
                            "Hoặc dùng key OpenAI (bắt đầu bằng sk-...) vào file .env."
                        ],
                        "guardrailTriggered": "API_KEY_ERROR"
                    }

        # 4. OFFLINE / TOOL FALLBACK: Nếu có tính toán rủi ro lệnh hoặc gửi ảnh chart
        if risk_eval:
            return {
                "answer": risk_eval["alert_markdown"],
                "concept": "Position Sizing & Prop Firm Risk Alert",
                "framework": "RISK_MANAGEMENT",
                "sources": citations,
                "socraticQuestions": [
                    f"Nếu bạn giảm khối lượng xuống {risk_eval['max_safe_lot']} lot, mức thua lỗ tối đa là bao nhiêu đô?",
                    "Quy tắc quản lý rủi ro của bạn cho phép mất tối đa bao nhiêu % tài khoản trên mỗi lệnh?"
                ],
                "guardrailTriggered": "HARD_BREACH_ALERT" if risk_eval["is_hard_breach"] else None
            }

        # 4.1 OFFLINE REAL-TIME CLOCK & SESSION HANDLER
        if is_time_query(query):
            return {
                "answer": (
                    f"⏰ **Bây giờ là: {time_ctx['vn_short']}**\n\n"
                    f"📅 **Ngày:** {time_ctx['vn_date']} *(Giờ Việt Nam, UTC+7)*\n"
                    f"🌐 **Giờ Quốc tế:** {time_ctx['utc_time']}\n"
                    f"🏙️ **Giờ New York:** {time_ctx['ny_time']}\n\n"
                    f"🏛️ **Phiên giao dịch:** {time_ctx['active_session']}\n"
                    f"🎯 **Killzone ICT:** {time_ctx['active_killzone']}"
                ),
                "concept": "Session Timing & Real-time Clock",
                "framework": "ICT",
                "sources": [],
                "socraticQuestions": [
                    "Bạn thường giao dịch vào phiên nào trong ngày: Phiên London hay Phiên New York?",
                    "Theo bạn, tại sao phiên Á thường có biên độ đi ngang (Asian Range) và ít thanh khoản hơn phiên Âu/Mỹ?"
                ],
                "guardrailTriggered": None
            }

        # 4.2 OFFLINE MODE: Conversational Greeting or General Assistance Handler
        if self.is_greeting(query) or self.is_assistance_request(query):
            return {
                "answer": (
                    f"👋 **Dạ chắc chắn rồi! Tôi luôn sẵn sàng đồng hành và hỗ trợ bạn.**\n\n"
                    f"Tôi là **AI Trading Tutor & Trade Review Assistant**, chuyên hỗ trợ sinh viên học và thực hành giao dịch chứng khoán:\n\n"
                    f"1. 📚 **Giải thích kiến thức & Chiến lược trading**:\n"
                    f"   - **ICT / Smart Money Concepts**: *Fair Value Gap (FVG)*, *Liquidity Pools (BSL/SSL)*, *Order Block*, *Optimal Trade Entry (OTE)*...\n"
                    f"   - **Price Action Cổ điển**: *Cấu trúc thị trường (HH/HL/LH/LL)*, *Breakout & Retest*, *Nến từ chối (Pinbar)*...\n"
                    f"   - **Quản trị vốn & Rủi ro**: *Quy tắc 1%-2%*, *Tỷ lệ Risk:Reward (R:R)*, *Chỉ số MAE & MFE*...\n"
                    f"   - **Tâm lý & Kỷ luật**: *Kiểm soát FOMO*, *Chống giao dịch trả thù (Revenge Trading)*, *Nhật ký giao dịch*.\n\n"
                    f"2. 🔍 **Đánh giá & Review lệnh giao dịch**:\n"
                    f"   - Phân tích xem lệnh bạn vừa đánh là **Good Trade** (đúng quy trình) hay **Bad Trade**.\n"
                    f"   - Bạn có thể bấm nút **'✨ AI Review'** trong bảng Lịch sử lệnh để tôi chấm điểm lệnh đó nhé!\n\n"
                    f"3. ⚖️ **So sánh đa phương pháp & Lập kế hoạch Backtest**.\n\n"
                    f"👉 **Bạn muốn bắt đầu tìm hiểu về khái niệm nào trước, hay cần hỗ trợ phân tích điều gì?**"
                ),
                "concept": "Trợ lý Gia sư AI",
                "framework": "TUTOR_SYSTEM",
                "sources": [],
                "socraticQuestions": [
                    "Bạn đang muốn học phương pháp nào hôm nay: ICT (Smart Money) hay Price Action cổ điển?",
                    "Mục tiêu trading quan trọng nhất của bạn trong tuần này là gì: Tỷ lệ thắng hay Kỷ luật tuân thủ Stop Loss?"
                ],
                "guardrailTriggered": None
            }

        # 4.5 OFFLINE CONTEXTUAL FALLBACK: Live Price & Follow-up Analysis for previously mentioned asset/exchange
        lower_q = query.lower()
        
        # Resolve contextual asset & exchange from immediate previous turn or active chart
        context_symbol = None
        context_exchange = None
        context_price = None
        context_percent = None

        if req.chatHistory:
            for turn in reversed(req.chatHistory):
                txt = str(turn.get("text", ""))
                txt_upper = txt.upper()
                
                # Match symbol aliases accurately using centralized helper
                for s_candidate, aliases in SYMBOL_ALIASES.items():
                    if any(a in f" {txt_upper} " for a in aliases):
                        context_symbol = s_candidate
                        break

                for exch in ["BINGX", "BINANCE", "OANDA", "HOSE"]:
                    if exch in txt_upper:
                        context_exchange = exch
                        break

                price_match = re.search(r'\$([0-9,]+(?:\.[0-9]+)?)', txt)
                if price_match:
                    try:
                        context_price = float(price_match.group(1).replace(',', ''))
                    except ValueError:
                        pass

                # Stop as soon as we identify the asset discussed in the most recent message!
                if context_symbol:
                    break

        if not context_symbol:
            context_symbol = req.symbol or "BTCUSDT"
        if not context_exchange:
            context_exchange = "BINANCE"
        if context_price is None:
            context_price = req.currentPrice

        # Check if user mentioned a specific symbol in the current question
        target_stock = None
        if req.allStocks:
            for s in req.allStocks:
                sym = s.get("symbol", "").lower()
                name = s.get("name", "").lower()
                clean_sym = sym.replace("usdt", "").replace(".p", "").replace("swap", "").replace(".", "")
                if (clean_sym and len(clean_sym) >= 3 and clean_sym in lower_q) or (name and name in lower_q):
                    target_stock = s
                    context_symbol = s.get("symbol", context_symbol)
                    context_exchange = s.get("exchange", context_exchange)
                    context_price = s.get("price", context_price)
                    context_percent = s.get("percent", context_percent)
                    break
            if not target_stock:
                for s in req.allStocks:
                    if s.get("symbol", "").upper() == context_symbol.upper():
                        target_stock = s
                        context_price = s.get("price", context_price)
                        context_percent = s.get("percent", context_percent)
                        context_exchange = s.get("exchange", context_exchange)
                        break

        # Case A: User asks about live price
        if any(w in lower_q for w in ["giá bao nhiêu", "giá hiện tại", "giá đang là", "current price", "mấy đô", "bao nhiêu đô", "giá btc", "giá eth", "giá sàn", "giá vàng"]):
            p_val = context_price
            sym_val = context_symbol
            exch_val = context_exchange
            pct_val = context_percent

            if p_val is not None:
                formatted_p = f"{p_val:,.4f}".rstrip('0').rstrip('.') if p_val < 1 else f"{p_val:,.2f}"
                pct_str = f" (Biến động 24h: {pct_val:+.2f}%)" if pct_val is not None else ""
                tf_info = f" trên khung `{req.timeframe}`" if req.timeframe and not target_stock else ""
                return {
                    "answer": (
                        f"📊 **Dữ liệu thời gian thực từ sàn {exch_val}:**\n\n"
                        f"- **Mã giao dịch**: `{sym_val}`\n"
                        f"- **Giá thị trường hiện tại**: **`${formatted_p}`**{pct_str}{tf_info}\n\n"
                        f"> 💡 **Phân tích kỹ thuật gợi ý**: Quanh mốc giá **`${formatted_p}`**, bạn hãy quan sát các vùng mất cân bằng cung cầu (FVG) hoặc các đỉnh/đáy cũ (Liquidity Pools) trên biểu đồ để xác định vùng phản ứng tiềm năng thay vì vào lệnh theo cảm xúc FOMO nhé!"
                    ),
                    "concept": "Realtime Market Price",
                    "framework": "MARKET_DATA",
                    "sources": citations,
                    "socraticQuestions": [
                        f"Mức giá ${formatted_p} hiện tại đang nằm gần vùng hỗ trợ hay kháng cự quan trọng nào?",
                        "Nếu thị trường xuất hiện nến đảo chiều tại vùng này, tỷ lệ R:R dự kiến của bạn là bao nhiêu?"
                    ],
                    "guardrailTriggered": None
                }

        # Case B: Follow-up question asking for analysis of the mentioned asset / exchange ("phân tích sàn đó", "phân tích mã đó", "phân tích nó")
        if any(w in lower_q for w in ["phân tích sàn đó", "sàn đó", "mã đó", "coin đó", "phân tích nó", "phân tích con đó", "phân tích tiếp", "đánh giá nó", "nhận định", "xu hướng thế nào", "phân tích thử"]):
            p_val = context_price
            sym_val = context_symbol
            exch_val = context_exchange
            formatted_p = f"${p_val:,.2f}" if p_val else "vùng giá hiện tại"

            return {
                "answer": (
                    f"🔎 **Phân tích kỹ thuật nối tiếp cho `{sym_val}` trên sàn {exch_val}:**\n\n"
                    f"Tiếp nối câu hỏi của bạn về mức giá **{formatted_p}**, dưới đây là góc nhìn cấu trúc kỹ thuật theo phương pháp ICT & Price Action:\n\n"
                    f"1. 🏛️ **Đặc tính sàn {exch_val} & Thanh khoản**:\n"
                    f"   - Cặp `{sym_val}` trên sàn **{exch_val}** có thanh khoản dồi dào, spread hẹp và phản ứng nhạy với các tin tức vĩ mô.\n"
                    f"   - Smart Money thường xuyên tạo các bẫy quét thanh khoản (*Liquidity Sweeps*) tại các vùng đỉnh/đáy phiên Á hoặc phiên Âu trước khi mở sóng chính.\n\n"
                    f"2. 📉 **Vùng Cung - Cầu & Cấu trúc thị trường**:\n"
                    f"   - **Vùng Kháng cự (BSL)**: Quan sát vùng đỉnh cũ gần nhất. Nếu xuất hiện nến từ chối (Rejection Wick / SFP), đó là dấu hiệu cạn kiệt lực mua.\n"
                    f"   - **Vùng Hỗ trợ (FVG / SSL)**: Chú ý các khoảng mất cân bằng Fair Value Gap khung H1/H4 phía dưới mốc {formatted_p} để đón phản ứng giá hồi phục.\n\n"
                    f"3. 🛡️ **Chiến lược khuyến nghị**:\n"
                    f"   - Kiên nhẫn chờ xác nhận tín hiệu đóng nến thay vì vào lệnh sớm đón đầu.\n"
                    f"   - Đặt Stop Loss tuyệt đối ngoài vùng vô hiệu hóa (Invalidation Point) và giới hạn rủi ro tối đa 1-2% tài khoản."
                ),
                "concept": f"Technical Analysis {sym_val}",
                "framework": "ICT_SMC",
                "sources": citations,
                "socraticQuestions": [
                    f"Trên biểu đồ {sym_val}, bạn có thấy xuất hiện mô hình nến đảo chiều nào ở khung H1 không?",
                    "Nếu mở vị thế tại đây, tỷ lệ Risk:Reward (R:R) mục tiêu của bạn là bao nhiêu (tối thiểu 1:2)?"
                ],
                "guardrailTriggered": None
            }

        # 5. OFFLINE FALLBACK MODE (When no API Key is provided)
        if results:
            primary_doc = results[0].document
            if is_en:
                answer_text = (
                    f"### Concept: {primary_doc.concept} ({primary_doc.framework})\n\n"
                    f"{primary_doc.content}\n\n"
                    f"> 💡 **Core Takeaway**: Under the {primary_doc.framework} methodology, "
                    f"this tool is used to establish probabilistic market edge, **not a guaranteed rule ensuring 100% win rate**."
                )
            else:
                answer_text = (
                    f"### Khái niệm: {primary_doc.concept} ({primary_doc.framework})\n\n"
                    f"{primary_doc.content}\n\n"
                    f"> 💡 **Lưu ý cốt lõi**: Trong phương pháp {primary_doc.framework}, "
                    f"đây là công cụ dùng để định vị xác suất thị trường, **không phải quy luật chắc chắn đảm bảo lợi nhuận 100%**."
                )
            return {
                "answer": answer_text,
                "concept": primary_doc.concept,
                "framework": primary_doc.framework,
                "sources": citations,
                "socraticQuestions": self.get_socratic_questions(primary_doc, lang=lang),
                "guardrailTriggered": None
            }

        if is_en:
            return {
                "answer": (
                    f"👋 **Absolutely! I am ready to guide you through trading concepts.**\n\n"
                    f"I can provide in-depth breakdowns, verified citations (Tier 1 & Tier 2), and Socratic reflection questions on:\n\n"
                    f"1. 📚 **ICT / Smart Money Concepts (SMC)**:\n"
                    f"   - *Fair Value Gap (FVG)*, *Order Block*, *Liquidity Sweep*, *Optimal Trade Entry (OTE)*, *Market Structure Shift (MSS)*...\n\n"
                    f"2. 📈 **Classical Price Action**:\n"
                    f"   - *Market Structure (Higher High / Higher Low)*, *Breakout & Retest*, *Pinbar Rejections*...\n\n"
                    f"3. 🛡️ **Risk Management & Trading Psychology**:\n"
                    f"   - *1%-2% Capital Preservation Rule*, *Risk:Reward (R:R)*, *MAE & MFE Drawdown metrics*, *Managing FOMO & Revenge Trading*...\n\n"
                    f"👉 **Which concept would you like to explore first? Type your topic to begin!**"
                ),
                "concept": "Knowledge Base Scope",
                "framework": "TUTOR_SYSTEM",
                "sources": [],
                "socraticQuestions": [
                    "Would you prefer to explore ICT (Smart Money) or classical Price Action first?",
                    "Do you currently have a fixed risk management rule for every trade?"
                ],
                "guardrailTriggered": "INSUFFICIENT_KNOWLEDGE"
            }

        return {
            "answer": (
                f"👋 **Dạ được chứ! Tôi sẵn sàng giải đáp kiến thức cho bạn.**\n\n"
                f"Tôi có thể giải thích chi tiết, cung cấp tài liệu kiểm chứng (Tier 1 & Tier 2) và đưa ra câu hỏi phản biện về các chủ đề sau:\n\n"
                f"1. 📚 **Phương pháp ICT / Smart Money Concepts**:\n"
                f"   - *Fair Value Gap (FVG)*, *Khối lệnh (Order Block)*, *Quét thanh khoản (Liquidity Sweep)*, *Optimal Trade Entry (OTE)*, *Market Structure Shift (MSS)*...\n\n"
                f"2. 📈 **Phương pháp Price Action Cổ điển**:\n"
                f"   - *Cấu trúc thị trường (Higher High / Higher Low)*, *Breakout & Retest*, *Nến từ chối (Pinbar Rejection)*...\n\n"
                f"3. 🛡️ **Quản trị rủi ro & Tâm lý giao dịch**:\n"
                f"   - *Quy tắc quản trị vốn 1%-2%*, *Tỷ lệ Risk:Reward (R:R)*, *Chỉ số Drawdown MAE & MFE*, *Kiểm soát FOMO & Trả thù thị trường*...\n\n"
                f"👉 **Bạn muốn tìm hiểu chi tiết về khái niệm nào trước? Hãy gõ tên chủ đề bạn quan tâm nhé!**"
            ),
            "concept": "Knowledge Base Scope",
            "framework": "TUTOR_SYSTEM",
            "sources": [],
            "socraticQuestions": [
                "Bạn muốn tìm hiểu về ICT (Smart Money) hay Price Action cổ điển trước?",
                "Bạn đã có quy tắc quản trị rủi ro cố định cho mỗi lệnh giao dịch chưa?"
            ],
            "guardrailTriggered": "INSUFFICIENT_KNOWLEDGE"
        }

    def explain_concept(self, req: ConceptExplainRequest) -> Dict[str, Any]:
        ask_req = AskQuestionRequest(
            question=req.concept,
            framework=req.framework,
            lang=req.lang
        )
        return self.answer_question(ask_req)

    def answer_question_stream(self, req: AskQuestionRequest) -> Iterator[str]:
        query = req.question.strip()
        lang = getattr(req, "lang", None) or "vi"
        is_en = str(lang).lower().startswith("en")

        # 0. User Subscription & Quota Guardrail Check
        user_id = req.userId or (req.userData and req.userData.get("userId")) or "64f7b1e4a3b9c2d1e8f9a0b1"
        sub = subscription_service.get_or_create_subscription(user_id)
        plan = req.plan or sub.get("plan", "FREE")

        intent_info = route_question_intent(query)
        question_intent = intent_info["intent"]

        if plan != "PRO":
            limit = sub.get("monthly_chat_limit", 300) if plan in ["PLUS", "PREMIUM"] else sub.get("daily_ai_limit", FREE_DAILY_LIMIT)
            used = sub.get("monthly_chat_used", 0) if plan in ["PLUS", "PREMIUM"] else sub.get("daily_ai_used", 0)
            if used >= limit:
                if plan in ["PLUS", "PREMIUM"]:
                    err_msg = (
                        "⚠️ You have used up your 300 chat quota for this month! Please upgrade to ✨ AI Tutor PRO for unlimited chat."
                        if is_en else
                        "⚠️ Bạn đã sử dụng hết 300/300 lượt chat của gói PLUS trong tháng này!\nVui lòng nâng cấp lên gói ✨ AI Tutor PRO để trò chuyện không giới hạn."
                    )
                else:
                    err_msg = (
                        f"⚠️ You have used up your {used}/{limit} free AI interactions for today!\nPlease upgrade to PLUS (129k - 300 chats) or PRO (299k - Unlimited)."
                        if is_en else
                        f"⚠️ Bạn đã sử dụng hết {used}/{limit} lượt tương tác AI miễn phí hôm nay!\nVui lòng nâng cấp gói PLUS (129k - 300 lượt) hoặc PRO (299k - Không giới hạn)."
                    )
                err_payload = {
                    "type": "error",
                    "message": err_msg,
                    "guardrailTriggered": "QUOTA_EXCEEDED",
                    "remainingToday": 0,
                    "plan": plan
                }
                yield f"data: {json.dumps(err_payload, ensure_ascii=False)}\n\n"
                return

        # 1. Kích hoạt Strict Signal Guardrail
        strict_guard = check_strict_signal_guardrail(query, req.symbol, lang=lang)
        if strict_guard:
            err_payload = {
                "type": "error",
                "message": strict_guard.get("answer", ""),
                "guardrailTriggered": strict_guard.get("guardrailTriggered", "NO_BUY_SELL_SIGNAL"),
                "plan": plan
            }
            yield f"data: {json.dumps(err_payload, ensure_ascii=False)}\n\n"
            return

        # Static Guardrail for Buy/Sell signals (khi không có LLM)
        if not llm_client.is_configured() and self.is_asking_for_signal(query):
            symbol = req.symbol or ("this asset" if is_en else "cổ phiếu này")
            if is_en:
                msg = (
                    f"⚠️ **System Policy**: The AI functions as an Educational Assistant & Independent Analytical Tutor, "
                    f"strictly avoiding direct Buy/Sell calls or trade execution recommendations for {symbol}.\n\n"
                    f"Instead, I can help you dissect key technical factors supporting or contradicting "
                    f"a position based on Price Action or ICT/SMC principles so you make your own independent decisions."
                )
            else:
                msg = (
                    f"⚠️ **Nguyên tắc hệ thống**: AI hoạt động như một Trợ lý Giáo dục & Phân tích Độc lập, "
                    f"tuyệt đối không đưa ra khuyến nghị Mua (Buy) / Bán (Sell) hay phím lệnh giao dịch cho {symbol}.\n\n"
                    f"Thay vào đó, tôi có thể hỗ trợ bạn bóc tách các yếu tố kỹ thuật đang ủng hộ hoặc phản đối "
                    f"một vị thế dựa trên phương pháp Price Action hoặc ICT/SMC để bạn tự đưa ra quyết định độc lập."
                )
            err_payload = {
                "type": "error",
                "message": msg,
                "guardrailTriggered": "NO_BUY_SELL_SIGNAL",
                "plan": plan
            }
            yield f"data: {json.dumps(err_payload, ensure_ascii=False)}\n\n"
            return

        # 2. Retrieve relevant verified knowledge documents
        results: List[RetrievalResult] = retriever.retrieve(
            query=query,
            framework=req.framework,
            top_k=3
        )

        citations = []
        if results:
            for r in results:
                citations.append({
                    "title": r.document.title,
                    "concept": r.document.concept,
                    "framework": r.document.framework,
                    "source": r.document.source,
                    "sourceUrl": r.document.sourceUrl,
                    "author": r.document.author,
                    "sourceType": r.document.sourceType,
                    "score": r.score
                })

        trade_intent = extract_trade_intent(query, active_symbol=req.symbol)
        risk_eval = evaluate_prop_firm_risk(trade_intent, req.userData or {}) if trade_intent else None
        time_ctx = get_current_time_context()

        # If LLM is configured, run streaming
        if llm_client.is_configured():
            reserved, updated_sub = subscription_service.reserve_quota_slot(user_id)
            if not reserved:
                err_payload = {
                    "type": "error",
                    "message": f"⚠️ Bạn đã sử dụng hết {limit}/{limit} lượt tương tác AI miễn phí hôm nay!\nVui lòng nâng cấp lên gói ✨ AI Tutor PRO để tiếp tục phân tích.",
                    "guardrailTriggered": "QUOTA_EXCEEDED",
                    "remainingToday": 0,
                    "plan": plan
                }
                yield f"data: {json.dumps(err_payload, ensure_ascii=False)}\n\n"
                return

            active_method = route_query_to_method(
                query,
                has_positions=bool(req.userData and req.userData.get("positions"))
            )
            intent_guidance = active_method.to_prompt_text()

            risk_tool_instruction = ""
            if risk_eval:
                risk_tool_instruction = (
                    "\n\n==================================================\n"
                    "⚡ FUNCTION CALLING: KẾT QUẢ ĐO LƯỜNG VỊ THẾ & RỦI RO QUỸ (PROP FIRM RISK TOOL)\n"
                    "==================================================\n"
                    "Hệ thống đã tự động chạy Function Calling / Risk Tool tính toán vị thế của học viên với kết quả sau:\n"
                    f"- Mã: {risk_eval['symbol']} | Lệnh: {risk_eval['side']} | Entry: ${risk_eval['entry']:,.2f} | SL: ${risk_eval['sl']:,.2f}\n"
                    f"- Khoảng cách SL: {risk_eval['sl_distance']:,.2f} giá\n"
                    f"- Khối lượng dự kiến: {risk_eval['volume']} lot\n"
                    f"- Thua lỗ ước tính nếu dính SL: ${risk_eval['estimated_loss']:,.2f}\n"
                    f"- Giới hạn Daily Loss còn lại trong ngày: ${risk_eval['remaining_daily_loss']:,.2f} (Số dư ví: ${risk_eval['account_balance']:,.2f})\n"
                    f"- Có vi phạm luật quỹ (Hard Breach) không: {'CÓ (NGUY HIỂM CỰC ĐỘ - TRƯỢT QUỸ NGAY LẬP TỨC)' if risk_eval['is_hard_breach'] else 'KHÔNG'}\n"
                    f"- Khối lượng tối đa cho phép để không vi phạm quỹ: {risk_eval['max_safe_lot']} lot\n"
                    f"- Khối lượng khuyến nghị chuẩn 1% rủi ro: {risk_eval['recommended_1pct_lot']} lot\n\n"
                    "QUY TẮC BẮT BUỘC KHI CÓ KẾT QUẢ RỦI RO:\n"
                    "1. KHÔNG nói đạo lý chung chung 'hãy quản lý vốn 1%'. Phải dùng chính xác các con số cụ thể đã tính toán ở trên.\n"
                    "2. Nếu có vi phạm luật quỹ (is_hard_breach = True), BẮT BUỘC đưa khối cảnh báo to rõ lên ngay ĐẦU TIÊN của câu trả lời:\n"
                    "   🔴 **CẢNH BÁO VI PHẠM LUẬT QUỸ (HARD BREACH RISK)**\n"
                    f"   - Đi {risk_eval['volume']} lot với SL này, nếu thua bạn mất ${risk_eval['estimated_loss']:,.2f}.\n"
                    f"   - Daily Drawdown còn lại hôm nay của bạn chỉ là ${risk_eval['remaining_daily_loss']:,.2f}. Lệnh này dính SL đồng nghĩa **TRƯỢT QUỸ NGAY LẬP TỨC**.\n"
                    f"   - Khối lượng tối đa cho phép vào: **Không quá {risk_eval['max_safe_lot']} lot**.\n"
                    "3. Sau đó phân tích ngắn gọn lý do kỹ thuật hoặc hướng dẫn đặt lệnh kỷ luật theo quy định quỹ."
                )

            time_prompt_section = (
                "\n\n==================================================\n"
                "🕒 THỜI GIAN THỰC TẾ HỆ THỐNG & PHIÊN GIAO DỊCH (REAL-TIME CLOCK):\n"
                "==================================================\n"
                f"- Giờ & Ngày Việt Nam (Chuẩn chính hệ thống): {time_ctx['vn_time']}\n"
                f"- Giờ Quốc tế (UTC): {time_ctx['utc_time']}\n"
                f"- Giờ New York (Wall Street): {time_ctx['ny_time']}\n"
                f"- Phiên thị trường hiện tại: {time_ctx['active_session']}\n"
                f"- Trạng thái Killzone ICT: {time_ctx['active_killzone']}\n"
                "QUY TẮC BẮT BUỘC: Khi học viên hỏi về thời gian, ngày hôm nay, thứ mấy hoặc năm nay, bạn BẮT BUỘC sử dụng "
                f"CHÍNH XÁC thời gian thực tế ở trên ({time_ctx['vn_time']}). TUYỆT ĐỐI KHÔNG dùng thời gian cũ trong dữ liệu training (như năm 2023)."
            )

            if plan == "PREMIUM":
                tiered_prompt_section = (
                    "\n\n==================================================\n"
                    "✨ CẤU HÌNH PHẢN HỒI CHUYÊN SÂU [TIER: PREMIUM AI TUTOR PRO]\n"
                    "==================================================\n"
                    "Học viên đang sử dụng gói PREMIUM AI TUTOR PRO. Cung cấp phân tích chuyên sâu đa chiều khi dữ liệu thị trường hỗ trợ:\n"
                    "1. Phân tích đa khung thời gian: HTF -> MTF -> LTF.\n"
                    "2. Cấu trúc thị trường & Dòng tiền thông minh (Market Structure, BOS, CHoCH, MSS).\n"
                    "3. Quét thanh khoản (Liquidity Pools, BSL/SSL Sweep).\n"
                    "4. Xung lực giá (Displacement), POI, Fair Value Gap (FVG), Order Block (OB).\n"
                    "5. Bối cảnh mở vị thế, điểm vô hiệu hóa, mục tiêu và R:R.\n"
                    "6. Đánh giá rủi ro dựa trên số liệu thực tế.\n"
                    "Giữ phong thái sắc sảo, kỷ luật của một Senior Prop Firm Funded Trader."
                )
            else:
                tiered_prompt_section = (
                    "\n\n==================================================\n"
                    "🎯 CẤU HÌNH PHẢN HỒI GÓI TIÊU CHUẨN [TIER: FREE USER PLAN]\n"
                    "==================================================\n"
                    "Học viên đang sử dụng gói FREE.\n"
                    "Quy chuẩn phản hồi: Ngắn gọn, cô đọng khoảng 2-3 đoạn văn.\n"
                    "Tập trung chính vào:\n"
                    f"- Ý định câu hỏi: [{question_intent}]\n"
                    "- Bằng chứng then chốt (Main Evidence) & Lý do quan trọng nhất.\n"
                    "- Vùng POI / FVG / Mốc thanh khoản chính.\n"
                    "- Điểm vô hiệu hóa (Main Invalidation).\n"
                    "- Đúng 1 câu hỏi dẫn dắt tư duy.\n"
                    "Tránh giải thích quá dài dòng hoặc lan man."
                )

            if question_intent in ["BAR_REPLAY", "BACKTEST_HISTORICAL"]:
                tiered_prompt_section += (
                    "\n\n==================================================\n"
                    "⏳ QUY TẮC PHÂN TÍCH REPLAY & BACKTEST (CHỐNG THIÊN KIẾN TƯƠNG LAI):\n"
                    "==================================================\n"
                    "- Tuyệt đối KHÔNG sử dụng thông tin hay diễn biến của nến tương lai để phân tích quyết định tại mốc lịch sử.\n"
                    "- Chỉ sử dụng dữ liệu có sẵn tại đúng thời điểm đó để đánh giá logic vào lệnh."
                )

            sys_prompt = (
                "Bạn là Senior Prop Firm Funded Trader & AI Trading Coach của nền tảng StockSim.\n"
                "Bạn phân tích thị trường với tư duy của một trader chuyên nghiệp theo phương pháp ICT, SMC (Smart Money Concepts) và Price Action thuần túy.\n\n"
                "Bạn có quyền truy cập ĐẦY ĐỦ VÀO DATABASE HỆ THỐNG gồm:\n"
                "1. Bảng giá thời gian thực của các mã tài sản trên hệ thống liên quan đến câu hỏi.\n"
                "2. Toàn bộ dữ liệu tài khoản của học viên trong Database.\n\n"
                f"{intent_guidance}\n\n" + f"{ICT_SMC_CANONICAL_GUIDELINES}\n\n"
                f"{tiered_prompt_section}\n\n"
                "YÊU CẦU BẮT BUỘC:\n"
                "1. Tuân thủ nghiêm ngặt phương pháp trên.\n"
                "2. Tra cứu giá thực và biến động 24h từ dữ liệu cung cấp.\n"
                "3. Tuyệt đối KHÔNG đưa ra tín hiệu Mua/Bán/Phím lệnh cụ thể (No Buy/Sell signal).\n"
                "4. TRẢ LỜI NGẮN GỌN, CÔ ĐỌNG, ĐI THẲNG VÀO TRỌNG TÂM, in đậm các mốc giá và POI quan trọng.\n"
                "5. DUY TRÌ MẠCH HỘI THOẠI LIÊN TIẾP.\n"
                f"{time_prompt_section}"
                f"{risk_tool_instruction}\n\n"
                "QUY TẮC TRẢ LỜI CHỐNG NÓI CHUNG CHUNG:\n"
                "Cung cấp CÁI GÌ, Ở ĐÂU, TẠI SAO, BẰNG CHỨNG, ĐIỀU GÌ VÔ HIỆU HÓA.\n\n"
                "==================================================\n"
                "🌐 LANGUAGE REQUIREMENT (ƯU TIÊN TUYỆT ĐỐI / HIGHEST PRIORITY):\n"
                "==================================================\n"
                + (
                    "The user is using the ENGLISH interface.\n"
                    "You MUST respond 100% in natural, fluent, professional ENGLISH. Translate all analysis and terms into English."
                    if is_en else
                    "Giao diện người dùng đang đặt là TIẾNG VIỆT.\n"
                    "Bạn BẮT BUỘC phải trả lời 100% bằng TIẾNG VIỆT tự nhiên, chuẩn mực tài chính và thân thiện."
                )
            )

            chat_history_str = ""
            if req.chatHistory and len(req.chatHistory) > 0:
                history_lines = []
                for turn in req.chatHistory[-6:]:
                    sender = turn.get("sender") or turn.get("role")
                    role_label = "Học viên" if sender == "user" else "AI Tutor"
                    msg_text = str(turn.get("text", "")).strip()
                    if msg_text:
                        if len(msg_text) > 400:
                            msg_text = msg_text[:400] + "..."
                        history_lines.append(f"{role_label}: {msg_text}")
                    if history_lines:
                        chat_history_str = "\n\n💬 [LỊCH SỬ HỘI THOẠI GẦN ĐÂY ĐỂ TRẢ LỜI LIÊN TIẾP]:\n" + "\n".join(history_lines)

            current_chart_str = format_detailed_chart_context(
                symbol=req.symbol,
                current_price=req.currentPrice,
                timeframe=req.timeframe,
                market_context=req.marketContext,
                is_en=is_en
            )

            all_stocks_str = ""
            relevant_stocks = extract_relevant_stocks(
                query=query,
                chat_history=req.chatHistory,
                active_symbol=req.symbol,
                all_stocks=req.allStocks
            )
            if relevant_stocks:
                stock_lines = []
                for s in relevant_stocks:
                    sym = s.get("symbol", "")
                    name = s.get("name", sym)
                    p = s.get("price")
                    pct = s.get("percent")
                    exch = s.get("exchange", "")
                    mkt = s.get("market", "")
                    if sym and p is not None:
                        p_fmt = f"${p:,.4f}".rstrip('0').rstrip('.') if p < 1 else f"${p:,.2f}"
                        pct_fmt = f" ({pct:+.2f}%)" if pct is not None else ""
                        stock_lines.append(f"• {sym} ({name} - {exch} [{mkt}]): {p_fmt}{pct_fmt}")
                if stock_lines:
                    all_stocks_str = "\n\n📈 [BẢNG GIÁ THỊ TRƯỜNG LIÊN QUAN]:\n" + "\n".join(stock_lines)

            user_data_str = ""
            if req.userData:
                ud = req.userData
                ud_lines = []
                wallet = ud.get("wallet", {})
                if wallet:
                    ud_lines.append(f"- Ví tiền: Tổng số dư ${wallet.get('balance', 0):,.2f} | Khả dụng: ${wallet.get('availableBalance', 0):,.2f}")
                positions = ud.get("positions", [])
                if positions:
                    pos_items = []
                    for pos in positions:
                        pos_items.append(f"{pos.get('side')} {pos.get('symbol')} (Entry: ${pos.get('entryPrice')}, x{pos.get('leverage')}, Qty: {pos.get('quantity')})")
                    ud_lines.append(f"- Vị thế đang mở: " + "; ".join(pos_items))
                challenge = ud.get("challenge")
                if challenge:
                    ud_lines.append(f"- Thử thách Quỹ: Cấp {challenge.get('level')}, Trạng thái: {challenge.get('status')}")
                if ud_lines:
                    user_data_str = "\n\n👤 [DỮ LIỆU TÀI KHOẢN HỌC VIÊN]:\n" + "\n".join(ud_lines)

            risk_context = ""
            if risk_eval:
                risk_context = f"\n\n🚨 [KẾT QUẢ ĐO LƯỜNG VỊ THẾ TỰ ĐỘNG - RISK TOOL]:\n{risk_eval['alert_markdown']}"

            kb_context = ""
            if results:
                kb_context = "\n\nTài liệu tham khảo đối chiếu từ Knowledge Base:\n" + "\n---\n".join([
                    f"• {r.document.title} [{r.document.sourceType}] ({r.document.author}): {r.document.content}"
                    for r in results
                ])

            if is_time_query(query):
                user_p = (
                    f"{chat_history_str}\n\n"
                    f"Câu hỏi của học viên: {query}\n\n"
                    f"🕒 [DỮ LIỆU ĐỒNG HỒ HỆ THỐNG]:\n"
                    f"- Giờ Việt Nam (UTC+7): {time_ctx['vn_time']}\n"
                    f"- Giờ Quốc tế: {time_ctx['utc_time']}\n"
                    f"- Giờ New York: {time_ctx['ny_time']}\n"
                    f"- Phiên: {time_ctx['active_session']}\n"
                    f"- Killzone ICT: {time_ctx['active_killzone']}\n\n"
                    "Trả lời trực tiếp và thân thiện cho học viên."
                )
            else:
                user_p = (
                    f"{chat_history_str}\n\n"
                    f"Câu hỏi của học viên: {query}"
                    f"{risk_context}"
                    f"{current_chart_str}"
                    f"{all_stocks_str}"
                    f"{user_data_str}"
                    f"{kb_context}\n\n"
                    "Hãy trả lời súc tích, hoàn chỉnh, chuyên nghiệp và chuẩn xác dựa trên dữ liệu trên."
                )

            concept_val = results[0].document.concept if results else ("Session Timing & Real-time Clock" if is_time_query(query) else ("Prop Firm Risk Management" if risk_eval else "AI Trading Tutor"))
            framework_val = results[0].document.framework if results else "VIP_LLM"
            new_used = updated_sub.get("daily_ai_used", used + 1)
            remaining = max(0, limit - new_used)

            meta_data = {
                "type": "meta",
                "intent": question_intent,
                "plan": plan,
                "dailyAiUsed": new_used,
                "dailyAiLimit": limit,
                "remainingToday": remaining,
                "concept": concept_val,
                "framework": framework_val,
                "provider": llm_client.preferred_provider or "openai",
                "sources": citations
            }
            yield f"data: {json.dumps(meta_data, ensure_ascii=False)}\n\n"

            # If Hard Breach risk detected, stream warning banner first
            if risk_eval and risk_eval.get("is_hard_breach"):
                hard_breach_header = f"{risk_eval['alert_markdown']}\n\n---\n\n"
                yield f"data: {json.dumps({'type': 'token', 'token': hard_breach_header}, ensure_ascii=False)}\n\n"

            streamed_tokens = []
            max_out = 2000 if plan == "PREMIUM" else 750
            try:
                for token in llm_client.stream_text(sys_prompt, user_p, max_tokens=max_out):
                    if token:
                        streamed_tokens.append(token)
                        yield f"data: {json.dumps({'type': 'token', 'token': token}, ensure_ascii=False)}\n\n"
            except Exception as stream_err:
                print(f"Error during stream generation: {stream_err}")

            # If stream produced no tokens, fallback to regular generate_text or static knowledge base
            if not streamed_tokens:
                fallback_text = llm_client.generate_text(sys_prompt, user_p, max_tokens=max_out)
                if fallback_text:
                    streamed_tokens.append(fallback_text)
                    yield f"data: {json.dumps({'type': 'token', 'token': fallback_text}, ensure_ascii=False)}\n\n"
                else:
                    # Seamlessly fall back to verified Knowledge Base without cutting off user
                    print("LLM stream and generate_text produced empty output, falling back to Knowledge Base")
                    offline_res = self.answer_question(req)
                    ans = offline_res.get("answer") or offline_res.get("message")
                    if not ans and results:
                        primary_doc = results[0].document
                        ans = f"### {primary_doc.concept} ({primary_doc.framework})\n\n{primary_doc.content}"
                    elif not ans:
                        ans = (
                            "AI Tutor đang kết nối dữ liệu. Bạn có thể hỏi về các khái niệm như FVG, Order Block, Liquidity Sweep, hoặc nhờ phân tích vị thế hiện tại."
                            if not is_en else
                            "AI Tutor is syncing data. Feel free to ask about FVG, Order Block, Liquidity Sweeps, or risk sizing."
                        )
                    words = ans.split(" ")
                    for i, w in enumerate(words):
                        chunk = w + (" " if i < len(words) - 1 else "")
                        streamed_tokens.append(chunk)
                        yield f"data: {json.dumps({'type': 'token', 'token': chunk}, ensure_ascii=False)}\n\n"

            full_answer = "".join(streamed_tokens)
            provider_val = llm_client.active_provider or llm_client.preferred_provider or "openai"
            done_payload = {
                "type": "done",
                "answer": full_answer,
                "concept": concept_val,
                "framework": framework_val,
                "provider": provider_val,
                "sources": citations,
                "socraticQuestions": []
            }
            yield f"data: {json.dumps(done_payload, ensure_ascii=False)}\n\n"
            return

        # 4. Fallback when LLM is offline: Call static answer_question and stream it smoothly
        offline_res = self.answer_question(req)
        ans = offline_res.get('answer') or offline_res.get('message') or ''
        if not ans and results:
            primary_doc = results[0].document
            ans = f'### {primary_doc.concept} ({primary_doc.framework})\n\n' + primary_doc.content
        elif not ans:
            ans = (
                'AI Tutor sẵn sàng giải đáp kiến thức ICT/SMC, Price Action và quản trị rủi ro cho bạn. Hãy gõ câu hỏi để bắt đầu nhé!'
                if not is_en else
                'AI Tutor is ready to guide you on ICT/SMC, Price Action, and risk management. Type a question to begin!'
            )

        provider_val = offline_res.get('provider') or ('openai' if llm_client.is_configured() else 'knowledge_base')
        meta_data = {
            'type': 'meta',
            'intent': offline_res.get('intent', question_intent),
            'plan': offline_res.get('plan', plan),
            'dailyAiUsed': offline_res.get('dailyAiUsed', used),
            'dailyAiLimit': limit,
            'remainingToday': offline_res.get('remainingToday', max(0, limit - used)),
            'concept': offline_res.get('concept', 'AI Trading Tutor'),
            'framework': offline_res.get('framework', 'VIP_LLM' if provider_val == 'openai' else 'OFFLINE'),
            'provider': provider_val,
            'sources': offline_res.get('sources', citations)
        }
        yield f'data: {json.dumps(meta_data, ensure_ascii=False)}\n\n'

        words = ans.split(' ')
        for i, w in enumerate(words):
            chunk = w + (' ' if i < len(words) - 1 else '')
            yield f'data: {json.dumps({"type": "token", "token": chunk}, ensure_ascii=False)}\n\n'

        done_payload = {
            'type': 'done',
            'answer': ans,
            'provider': provider_val,
            'concept': offline_res.get('concept'),
            'framework': offline_res.get('framework'),
            'sources': offline_res.get('sources', []),
            'socraticQuestions': offline_res.get('socraticQuestions', [])
        }
        yield f'data: {json.dumps(done_payload, ensure_ascii=False)}\n\n'

    def inspect_chart_vision(
        self,
        image_base64: str,
        symbol: Optional[str] = None,
        timeframe: Optional[str] = None,
        user_notes: str = "",
        user_id: Optional[str] = None,
        lang: str = "vi",
        klines: Optional[List[Dict[str, Any]]] = None,
        market_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Multimodal Chart Vision Inspector & Grader.
        Uses Google Gemini Vision to inspect user-drawn chart analysis,
        grade theory accuracy (ICT/SMC/Price Action), evaluate real-world trade quality,
        and provide corrections.
        """
        # 1. Atomic Quota check & reservation for Chart Vision Inspection
        remaining_today = 999999
        is_premium = False
        is_en = str(lang).lower().startswith("en")
        if user_id:
            reserved, sub_record = subscription_service.reserve_inspect_slot(user_id)
            plan = (sub_record or {}).get("plan", "FREE")
            is_premium = plan in ["PLUS", "PRO", "PREMIUM"]
            if not reserved:
                if plan in ["PLUS", "PREMIUM"]:
                    msg = (
                        "⚠️ You have used up your 150 chart evaluation quota for this month! Upgrade to PRO for unlimited evaluations."
                        if is_en else
                        "⚠️ Bạn đã sử dụng hết 150/150 lượt Chấm Bài của gói PLUS trong tháng này! Nâng cấp gói PRO VIP để chấm bài không giới hạn."
                    )
                else:
                    msg = (
                        "⚠️ You have used your daily chart evaluation quota (2/2). Upgrade to PLUS (150/mo) or PRO (Unlimited)!"
                        if is_en else
                        "⚠️ Bạn đã dùng hết 2/2 lượt Chấm Bài miễn phí hôm nay. Nâng cấp gói PLUS (129k - 150 bài) hoặc PRO (299k - Không giới hạn)!"
                    )
                return {
                    "success": False,
                    "quotaExceeded": True,
                    "message": msg
                }
            if plan == "PRO":
                remaining_today = 999999
            elif plan in ["PLUS", "PREMIUM"]:
                remaining_today = max(0, sub_record.get("monthly_inspect_limit", 150) - sub_record.get("monthly_inspect_used", 0))
            else:
                remaining_today = max(0, sub_record.get("daily_inspect_limit", 2) - sub_record.get("daily_inspect_used", 0))

        # 2. System prompt
        system_prompt = (
            "Bạn là Chuyên gia Cao cấp Đào tạo Phân tích Kỹ thuật và Huấn luyện viên Chiến lược Thực chiến "
            "(Senior Quantitative & Technical Analyst Tutor, chuyên sâu về Price Action, ICT - Inner Circle Trader, SMC - Smart Money Concepts, Wyckoff).\n"
            "Nhiệm vụ của bạn là soi kỹ ảnh chụp màn hình biểu đồ nến mà học viên cung cấp, đặc biệt chú ý đến:\n"
            "- Các vùng hình hộp chữ nhật (Box / Zone), đường kẻ (Trendline, Support/Resistance), mũi tên hoặc ghi chú mà học viên ĐÃ VẼ trên biểu đồ.\n"
            "- Cấu trúc giá hiện tại (Đỉnh/Đáy, Swing High/Low, Cấu trúc xu hướng tăng/giảm).\n"
            "- Các khái niệm ICT/SMC: Order Block (OB), Fair Value Gap (FVG), Imbalance, Liquidity Sweep (BSL nằm trên Đỉnh, SSL nằm dưới Đáy), CHoCH, BOS, Premium vs Discount.\n- BẮT BUỘC TUÂN THỦ NGUYÊN TẮC: BSL (Buy-Side Liquidity) luôn ở trên ĐỈNH (chứa Buy Stop của phe Short và Breakout). SSL (Sell-Side Liquidity) luôn ở dưới ĐÁY (chứa Sell Stop của phe Long và Breakdown).\n\n"
            "Hãy trả lời theo cấu trúc Markdown rõ ràng, chuẩn sư phạm, truyền cảm hứng và sắc sảo như sau:\n\n"
            "### 1. Đánh giá sơ bộ về hình thức lý thuyết\n"
            "- Kết luận rõ ràng: Bạn vẽ **ĐÚNG** hay **SAI / CHƯA CHUẨN**?\n"
            "- Nhận diện đúng học viên đã khoanh vùng nến/vùng giá nào (ví dụ: cây nến tăng cuối cùng trước khi một nhịp sập mạnh - Bearish Displacement, hay vùng FVG).\n\n"
            "### 2. Lăng kính thực chiến chuyên sâu (Độ tin cậy & Xác suất)\n"
            "- **Phân loại vùng:** Đây là vùng Tiếp diễn (Continuation OB/FVG) hay vùng Cực trị / Gốc (Extreme / Original)?\n"
            "- **Chất lượng sóng đẩy:** Nhịp Displacement có đủ mạnh không? Có tạo ra FVG (Imbalance) đi kèm không?\n"
            "- **Thanh khoản & Bẫy giá:** Có hiện tượng Quét thanh khoản (Liquidity Sweep) đỉnh/đáy trước đó không? Có nguy cơ là bẫy Smart Money Trap (SMT) hay thanh khoản dụ dỗ (Inducement) không?\n\n"
            "### 3. Vùng chuẩn xác nhất theo Smart Money\n"
            "- Chỉ rõ mức giá hoặc vùng nến mà theo ICT/SMC là nơi an toàn và có tỷ lệ Risk:Reward tối ưu nhất (ví dụ: đỉnh/đáy cực trị nào, mức giá cụ thể nào trên chart).\n\n"
            "### 4. 💡 Bài học thực chiến cốt lõi\n"
            "- Tóm tắt 1-2 lời khuyên thực chiến ngắn gọn giúp học viên không bị thị trường lừa.\n\n"
            "### 5. Điểm số đánh giá\n"
            "- Cho điểm số theo thang điểm 100 (Ví dụ: **Điểm đánh giá: 85/100**)."
        )

        asset_info = f"mã cổ phiếu/tiền tệ: {symbol}" if symbol else "mã hiển thị trực tiếp trên ảnh biểu đồ"
        tf_info = f", khung thời gian: {timeframe}" if timeframe else ""
        user_prompt = f"Phân tích biểu đồ {asset_info}{tf_info}."
        if user_notes:
            user_prompt += f"\nGhi chú/Nhận định của học viên: {user_notes}"
        else:
            user_prompt += "\nHãy kiểm tra xem các vùng tôi đã vẽ trên biểu đồ (Order Block, FVG, Hỗ trợ/Kháng cự...) đã chính xác chưa và nhận xét chi tiết giúp tôi."

        # Inject factual ground truth price & swing high/low data to Gemini Vision prompt
        factual_chart_str = format_detailed_chart_context(
            symbol=symbol,
            current_price=(market_context or {}).get("currentPrice"),
            timeframe=timeframe,
            market_context=market_context,
            klines=klines,
            is_en=is_en
        )
        if factual_chart_str:
            user_prompt += "\n" + factual_chart_str

        # 3. Call Vision
        analysis = llm_client.generate_vision_text(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            image_base64=image_base64,
            max_tokens=2500
        )

        if not analysis:
            analysis = (
                "⚠️ **Không thể kết nối đến AI Vision.**\n\n"
                "Vui lòng kiểm tra lại kết nối mạng hoặc thử lại với ảnh chụp rõ nét hơn."
            )

        # 4. Extract score and verdict
        score = 80
        score_match = re.search(r'(?:Điểm\s*(?:đánh giá|số)?|Score)[:\s*]+(\d{1,3})\s*(?:/\s*100)?', analysis, re.IGNORECASE)
        if score_match:
            try:
                score = int(score_match.group(1))
            except:
                pass

        verdict = "CORRECT" if "ĐÚNG" in analysis.upper() and "SAI" not in analysis[:300].upper() else "PARTIALLY_CORRECT"
        if "CHƯA ĐÚNG" in analysis[:300].upper() or "SAI" in analysis[:300].upper():
            verdict = "INCORRECT"

        return {
            "success": True,
            "symbol": symbol,
            "timeframe": timeframe,
            "score": score,
            "verdict": verdict,
            "analysis": analysis,
            "provider": llm_client.active_provider or "gemini",
            "remainingToday": remaining_today,
            "isPremium": is_premium
        }

    def inspect_chart_data(
        self,
        drawings: List[Dict[str, Any]],
        klines: List[Dict[str, Any]],
        symbol: Optional[str] = None,
        timeframe: Optional[str] = None,
        user_notes: str = "",
        user_id: Optional[str] = None,
        lang: str = "vi"
    ) -> Dict[str, Any]:
        """
        Pure Data Analysis of User Chart Drawings + Real KLine Data.
        Evaluates coordinates, prices, and candle patterns (ICT / SMC) directly
        without requiring screenshots.
        """
        is_en = lang == "en"
        remaining_today = 999999
        is_premium = False
        if user_id:
            reserved, sub_record = subscription_service.reserve_inspect_slot(user_id)
            plan = (sub_record or {}).get("plan", "FREE")
            is_premium = plan in ["PLUS", "PRO", "PREMIUM"]
            if not reserved:
                if plan in ["PLUS", "PREMIUM"]:
                    msg = (
                        "⚠️ You have used up your 150 chart evaluation quota for this month! Upgrade to PRO for unlimited evaluations."
                        if is_en else
                        "⚠️ Bạn đã sử dụng hết 150/150 lượt Chấm Bài của gói PLUS trong tháng này! Nâng cấp gói PRO VIP để chấm bài không giới hạn."
                    )
                else:
                    msg = (
                        "⚠️ You have used your daily chart evaluation quota (2/2). Upgrade to PLUS (150/mo) or PRO (Unlimited)!"
                        if is_en else
                        "⚠️ Bạn đã dùng hết 2/2 lượt Chấm Bài miễn phí hôm nay. Nâng cấp gói PLUS (129k - 150 bài) hoặc PRO (299k - Không giới hạn)!"
                    )
                return {
                    "success": False,
                    "quotaExceeded": True,
                    "message": msg
                }
            if plan == "PRO":
                remaining_today = 999999
            elif plan in ["PLUS", "PREMIUM"]:
                remaining_today = max(0, sub_record.get("monthly_inspect_limit", 150) - sub_record.get("monthly_inspect_used", 0))
            else:
                remaining_today = max(0, sub_record.get("daily_inspect_limit", 2) - sub_record.get("daily_inspect_used", 0))

        # Summarize drawings with student labels & SMC concepts
        drawings_summary = []
        for idx, d in enumerate(drawings, 1):
            name = d.get("name", "Vùng vẽ")
            label = d.get("label") or d.get("userLabel") or name
            tag = d.get("tag") or ""
            concept = d.get("detectedConcept") or tag
            p_high = d.get("priceHigh")
            p_low = d.get("priceLow")
            p_mid = d.get("priceMid")
            range_amt = d.get("rangeAmount")
            pts = d.get("points", [])

            tag_part = f" [SMC Tag: {tag}]" if tag else ""
            concept_part = f" - Khái niệm: {concept}" if concept and concept != label else ""
            mid_part = f" (Giá tâm: {p_mid})" if p_mid is not None else ""
            range_part = f" (Biên độ: {range_amt})" if range_amt is not None else ""

            if is_en:
                drawings_summary.append(
                    f"- Figure #{idx}: Student Label/Annotation: '{label}'{tag_part}, Tool Type: {name}, "
                    f"Price Range: {p_low} -> {p_high}{mid_part}{range_part}, with {len(pts)} anchor points."
                )
            else:
                drawings_summary.append(
                    f"- Hình #{idx}: Ký hiệu / Tên học viên đặt: '{label}'{tag_part}{concept_part}, Loại công cụ: {name}, "
                    f"Vùng giá: {p_low} -> {p_high}{mid_part}{range_part}, gồm {len(pts)} điểm neo."
                )
        drawings_str = "\n".join(drawings_summary)

        # Extract swings & extrema across ALL klines provided (up to 120 candles)
        swings = extract_chart_swings_and_extrema(klines)
        wave_max = swings["global_high"] or 0
        wave_min = swings["global_low"] or 0

        recent_sh = swings["swing_highs"][-4:] if swings["swing_highs"] else []
        recent_sl = swings["swing_lows"][-4:] if swings["swing_lows"] else []
        sh_str = ", ".join([f"${sh['price']:,.2f} ({sh['candles_ago']} nến trước)" for sh in reversed(recent_sh)]) if recent_sh else "N/A"
        sl_str = ", ".join([f"${sl['price']:,.2f} ({sl['candles_ago']} nến trước)" for sl in reversed(recent_sl)]) if recent_sl else "N/A"

        # Summarize recent candles (last 40 candles for LLM prompt context)
        recent_klines = klines[-40:] if len(klines) > 40 else klines
        klines_summary = []
        for k in recent_klines:
            o = k.get("open")
            h = k.get("high")
            l = k.get("low")
            c = k.get("close")
            t = k.get("timestamp")
            klines_summary.append(f"O:{o} H:{h} L:{l} C:{c} (t:{t})")
        klines_str = "; ".join(klines_summary)

        # Identify student drawing zone relative to wave (upper swing high or lower swing low)
        first_draw = drawings[0] if drawings else {}
        user_p_high = first_draw.get("priceHigh") or wave_max
        user_p_low = first_draw.get("priceLow") or wave_min
        user_mid = (user_p_high + user_p_low) / 2 if (user_p_high and user_p_low) else wave_max
        wave_mid = (wave_max + wave_min) / 2 if (wave_max and wave_min) else user_mid
        is_upper_zone = user_mid >= wave_mid

        if is_en:
            system_prompt = (
                "You are a Senior Quantitative & Technical Analyst Tutor specializing in Price Action, ICT, and Smart Money Concepts (SMC).\n"
                "Your objective is to inspect direct COORDINATE DRAWING DATA drawn by the trader on the chart against REAL OHLCV CANDLESTICK DATA.\n\n"
                "IMPORTANT INSTRUCTIONS:\n"
                "1. Be crisp, concise, pedagogical, and highly structured (about 300-450 words). DO NOT ramble to ensure all 5 sections and the concluding JSON block complete cleanly without truncation.\n"
                "2. Provide your feedback in clean Markdown using EXACTLY these 5 sections:\n\n"
                "### 1. Theoretical Accuracy Assessment\n"
                "- **Conclusion:** Clearly state if the drawing is **CORRECT**, **PARTIALLY CORRECT**, or **INCORRECT**.\n"
                "- **Drawing Analysis:** Explain what zone the trader marked (Order Block, FVG, or Supply/Demand) and compare their coordinates against actual candle wicks and bodies.\n\n"
                "### 2. Deep Practical Market Lens (Reliability & Probability)\n"
                "- **Zone classification:** Is this a Continuation or an Extreme Origin zone?\n"
                "- **Displacement & Traps:** Evaluate impulse displacement strength, liquidity sweep, and warn against Smart Money Traps (SMT) or Inducement.\n\n"
                "### 3. Optimal Smart Money Zone\n"
                "- Clearly identify the ideal institutional mitigation zone for this swing (high-low price range) and explain why.\n\n"
                "### 4. 💡 Core Trading Takeaway\n"
                "- 1-2 actionable practical execution rules to avoid stop hunts.\n\n"
                "### 5. Final Evaluation Score\n"
                "- **Evaluation Score: [X]/100** (objective score from 0 to 100).\n\n"
                "AT THE VERY END, YOU MUST OUTPUT THIS JSON BLOCK ENCLOSED IN ```json:zone ... ``` FOR THE SYSTEM TO PLOT THE OPTIMAL ZONE ON CHART:\n"
                "```json:zone\n"
                "{\n"
                '  "type": "Order Block (OB)",\n'
                '  "name": "Bearish Order Block",\n'
                '  "label": "AI: Bearish Order Block",\n'
                '  "priceHigh": 4440.0,\n'
                '  "priceLow": 4425.0,\n'
                '  "explanation": "Last up-candle before strong bearish displacement"\n'
                "}\n"
                "```"
            )
            user_prompt = (
                f"Asset: {symbol or 'N/A'}, Timeframe: {timeframe or 'N/A'}.\n"
                f"STUDENT CHART DRAWINGS DATA:\n{drawings_str}\n\n"
                f"REAL CANDLESTICK DATA (OHLCV):\n{klines_str}\n"
                f"Chart Highest High: {wave_max}, Chart Lowest Low: {wave_min}.\n"
                f"Recent Swing Highs: {sh_str}\n"
                f"Recent Swing Lows: {sl_str}\n"
            )
            if user_notes:
                user_prompt += f"\nTrader's notes: {user_notes}\n"
            user_prompt += "\nPlease evaluate and grade this drawing now in English."
        else:
            system_prompt = (
                "Bạn là Chuyên gia Cao cấp Đào tạo Phân tích Kỹ thuật và Huấn luyện viên Chiến lược Thực chiến "
                "(Price Action, ICT - Inner Circle Trader, SMC - Smart Money Concepts).\n"
                "Nhiệm vụ của bạn là kiểm tra trực tiếp DỮ LIỆU TỌA ĐỘ VÙNG VẼ HỌC VIÊN ĐÃ VẼ TRÊN BIỂU ĐỒ đối chiếu với DỮ LIỆU NẾN THẬT (OHLCV).\n\n"
                "YÊU CẦU QUAN TRỌNG ĐỂ KHÔNG BỊ CẮT CHỮ (TRUNCATION):\n"
                "1. Viết súc tích, sắc bén, chuẩn sư phạm (khoảng 300 - 450 từ). Tuyệt đối KHÔNG viết dông dài để đảm bảo hoàn thành trọn vẹn cả 5 mục và khối JSON cuối cùng.\n"
                "2. Trình bày bài chấm theo đúng 5 mục cấu trúc Markdown sau:\n\n"
                "### 1. Đánh giá sơ bộ về hình thức lý thuyết\n"
                "- **Kết luận:** Nêu rõ học viên vẽ **ĐÚNG**, **ĐÚNG MỘT PHẦN** hay **CHƯA ĐÚNG**?\n"
                "- **Nhận diện vùng vẽ:** Xác định học viên đang vẽ vùng gì (Order Block, FVG, hay Vùng Cung/Cầu). Tọa độ vùng vẽ của học viên so với râu nến và thân nến thực tế lệch hay chuẩn ở đâu?\n\n"
                "### 2. Lăng kính thực chiến chuyên sâu (Độ tin cậy & Xác suất)\n"
                "- **Phân loại vùng:** Vùng Tiếp diễn (Continuation) hay Cực trị (Extreme)?\n"
                "- **Chất lượng sóng đẩy & Bẫy giá:** Nhịp Displacement có đủ mạnh không? Có tạo FVG không? Cảnh báo nguy cơ Quét thanh khoản (Liquidity Sweep) và Bẫy Smart Money (SMT / Inducement).\n\n"
                "### 3. Vùng chuẩn xác nhất theo Smart Money\n"
                "- Chỉ rõ tên vùng chuẩn, khoảng giá nến chuẩn (từ giá thấp đến giá cao) và lý giải ngắn gọn vì sao vùng này mới là tối ưu.\n\n"
                "### 4. 💡 Bài học thực chiến cốt lõi\n"
                "- 1-2 lời khuyên đắt giá giúp học viên vào lệnh chuẩn, tránh bị quét Stop Loss oan uổng.\n\n"
                "### 5. Điểm số đánh giá\n"
                "- **Điểm đánh giá: [X]/100** (cho điểm khách quan từ 0 đến 100).\n\n"
                "Ở CUỐI CÙNG, BẮT BUỘC CUNG CẤP KHỐI DỮ LIỆU JSON ĐỂ HỆ THỐNG VẼ LẠI VÙNG CHUẨN LÊN BIỂU ĐỒ:\n"
                "```json:zone\n"
                "{\n"
                '  "type": "Order Block (OB)",\n'
                '  "name": "Order Block (OB) Kháng Cự",\n'
                '  "label": "AI: Bearish Order Block",\n'
                '  "priceHigh": 4440.0,\n'
                '  "priceLow": 4425.0,\n'
                '  "explanation": "Vùng nến tăng cuối cùng trước cú sập mạnh Displacement"\n'
                "}\n"
                "```"
            )
            user_prompt = (
                f"Mã tài sản: {symbol or 'N/A'}, Khung thời gian: {timeframe or 'N/A'}.\n"
                f"DỮ LIỆU HÌNH VẼ CỦA HỌC VIÊN TRÊN BIỂU ĐỒ:\n{drawings_str}\n\n"
                f"CHUỖI NẾN THỰC TẾ TRÊN BIỂU ĐỒ (OHLCV):\n{klines_str}\n\n"
                f"Đỉnh cao nhất trên biểu đồ: {wave_max}, Đáy thấp nhất: {wave_min}.\n"
                f"Các Đỉnh đảo chiều gần nhất (Recent Swing Highs): {sh_str}\n"
                f"Các Đáy đảo chiều gần nhất (Recent Swing Lows): {sl_str}\n"
            )
            if user_notes:
                user_prompt += f"\nGhi chú học viên: {user_notes}\n"

        analysis = llm_client.generate_inspection_text(system_prompt, user_prompt, max_tokens=4000)
        if not analysis:
            analysis = (
                "Unable to analyze data at this time. Please try again later."
                if is_en else
                "Không thể phân tích dữ liệu lúc này. Vui lòng thử lại sau."
            )

        # 1. Parse JSON zone block if generated by LLM
        suggested_zone = None
        zone_match = re.search(r'```(?:json:zone|json)?\s*(\{[\s\S]*?\})\s*```', analysis)
        if zone_match:
            try:
                raw_zone = json.loads(zone_match.group(1))
                if isinstance(raw_zone, dict) and "priceHigh" in raw_zone and "priceLow" in raw_zone:
                    z_high = float(raw_zone.get("priceHigh", 0))
                    z_low = float(raw_zone.get("priceLow", 0))
                    if z_high > 0 and z_low > 0 and z_high >= z_low:
                        suggested_zone = {
                            "type": raw_zone.get("type", "Order Block (OB)"),
                            "name": raw_zone.get("name", raw_zone.get("type", "Order Block")),
                            "label": raw_zone.get("label", f"AI: {raw_zone.get('name', 'Order Block')}"),
                            "priceHigh": round(z_high, 4),
                            "priceLow": round(z_low, 4),
                            "explanation": raw_zone.get("explanation", "")
                        }
                # Clean JSON block from analysis text so UI displays pure clean markdown
                analysis = analysis[:zone_match.start()].strip()
            except Exception as e:
                print(f"Error parsing AI suggested zone JSON: {e}")

        # 2. Intelligent candle-based algorithmic fallback if JSON was missing or malformed
        if not suggested_zone and wave_max > 0:
            if is_upper_zone:
                # Find swing high candle
                high_candle = next((k for k in reversed(recent_klines) if k.get("high") == wave_max), recent_klines[-1] if recent_klines else {})
                c_open = float(high_candle.get("open") or wave_max)
                c_close = float(high_candle.get("close") or wave_max)
                c_low = float(high_candle.get("low") or wave_max * 0.995)
                # Order block bottom: body low or high candle low
                ob_low = min(c_open, c_close)
                if ob_low >= wave_max or ob_low <= 0:
                    ob_low = wave_max * 0.993
                suggested_zone = {
                    "type": "Order Block (OB)",
                    "name": "Bearish Extreme Order Block" if is_en else "Order Block (OB) Giảm Giá - Cực Trị",
                    "label": "AI: Bearish Order Block" if is_en else "AI: Order Block (OB) Kháng Cự",
                    "priceHigh": round(wave_max, 4),
                    "priceLow": round(ob_low, 4),
                    "explanation": "Extreme institutional mitigation zone at wave high" if is_en else "Vùng nến đảo chiều cực trị tại đỉnh sóng có thanh khoản phe bán"
                }
            else:
                # Find swing low candle
                low_candle = next((k for k in reversed(recent_klines) if k.get("low") == wave_min), recent_klines[-1] if recent_klines else {})
                c_open = float(low_candle.get("open") or wave_min)
                c_close = float(low_candle.get("close") or wave_min)
                ob_high = max(c_open, c_close)
                if ob_high <= wave_min or ob_high <= 0:
                    ob_high = wave_min * 1.007
                suggested_zone = {
                    "type": "Order Block (OB)",
                    "name": "Bullish Extreme Order Block" if is_en else "Order Block (OB) Tăng Giá - Cực Trị",
                    "label": "AI: Bullish Order Block" if is_en else "AI: Order Block (OB) Hỗ Trợ",
                    "priceHigh": round(ob_high, 4),
                    "priceLow": round(wave_min, 4),
                    "explanation": "Extreme institutional mitigation zone at wave low" if is_en else "Vùng nến tích lũy cực trị tại đáy sóng có thanh khoản phe mua"
                }

        score = 80
        score_match = re.search(r'(?:Điểm\s*(?:đánh giá|số)?|Score)[:\s*]+(\d{1,3})\s*(?:/\s*100)?', analysis, re.IGNORECASE)
        if score_match:
            try:
                score = int(score_match.group(1))
            except:
                pass

        if is_en:
            verdict = "CORRECT" if ("CORRECT" in analysis.upper() and "INCORRECT" not in analysis[:300].upper()) else ("INCORRECT" if "INCORRECT" in analysis[:300].upper() else "PARTIALLY_CORRECT")
        else:
            verdict = "CORRECT" if "ĐÚNG" in analysis.upper() and "SAI" not in analysis[:300].upper() else "PARTIALLY_CORRECT"
        if "CHƯA ĐÚNG" in analysis[:300].upper() or "SAI" in analysis[:300].upper():
            verdict = "INCORRECT"

        return {
            "success": True,
            "symbol": symbol,
            "timeframe": timeframe,
            "score": score,
            "verdict": verdict,
            "analysis": analysis,
            "suggestedZone": suggested_zone,
            "drawingsCount": len(drawings),
            "provider": llm_client.active_provider or "gemini",
            "remainingToday": remaining_today,
            "isPremium": is_premium
        }

ai_tutor_service = AiTutorService()
