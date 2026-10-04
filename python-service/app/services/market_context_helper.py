import re
from typing import Dict, Any, List, Optional, Tuple

# ==========================================
# 1. BẢNG MÃ & TỪ KHÓA ĐỒNG NGHĨA (SYMBOL ALIASES)
# ==========================================
SYMBOL_ALIASES: Dict[str, List[str]] = {
    "XAUUSD": ["XAUUSD", "VÀNG", "GOLD", " XAU "],
    "XAGUSD": ["XAGUSD", "BẠC", "SILVER"],
    "USOIL": ["USOIL", "DẦU", " OIL ", "WTI", "DẦU THÔ"],
    "BRENT": ["BRENT", "DẦU BRENT", "BRENT OIL"],
    "NGAS": ["NGAS", "KHÍ TỰ NHIÊN", "NATURAL GAS", " GAS "],
    "COPPER": ["COPPER", "ĐỒNG"],
    "PLATINUM": ["PLATINUM", "BẠCH KIM"],
    "DXY": ["DXY", "DOLLAR INDEX", "SỨC MẠNH USD", "CHỈ SỐ USD"],
    "BTCUSDT": ["BTCUSDT", " BTC ", "BITCOIN"],
    "ETHUSDT": ["ETHUSDT", " ETH ", "ETHEREUM"],
    "BNBUSDT": ["BNBUSDT", " BNB "],
    "SOLUSDT": ["SOLUSDT", " SOL ", "SOLANA"],
    "XRPUSDT": ["XRPUSDT", " XRP ", "RIPPLE"],
    "DOGEUSDT": ["DOGEUSDT", " DOGE ", "DOGECOIN"],
    "SUIUSDT": ["SUIUSDT", " SUI "],
    "NEARUSDT": ["NEARUSDT", " NEAR "],
    "AVAXUSDT": ["AVAXUSDT", " AVAX "],
    "APTUSDT": ["APTUSDT", " APT "],
    "ARBUSDT": ["ARBUSDT", " ARB ", "ARBITRUM"],
    "OPUSDT": ["OPUSDT", " OP ", "OPTIMISM"],
    "TIAUSDT": ["TIAUSDT", " TIA ", "CELESTIA"],
    "TONUSDT": ["TONUSDT", " TON ", "TONCOIN"],
    "INJUSDT": ["INJUSDT", " INJ ", "INJECTIVE"],
    "EURUSD": ["EURUSD", "EUR/USD", "EURO"],
    "GBPUSD": ["GBPUSD", "GBP/USD", "BẢNG ANH"],
    "USDJPY": ["USDJPY", "USD/JPY", "YEN NHẬT"],
    "GBPJPY": ["GBPJPY", "GBP/JPY", "GUPPY"],
    "EURJPY": ["EURJPY", "EUR/JPY"],
    "AUDUSD": ["AUDUSD", "AUD/USD", "ĐÔ LA ÚC"],
    "USDCAD": ["USDCAD", "USD/CAD"],
    "USDCHF": ["USDCHF", "USD/CHF"],
    "AAPL": ["AAPL", "APPLE"],
    "MSFT": ["MSFT", "MICROSOFT"],
    "TSLA": ["TSLA", "TESLA"],
    "NVDA": ["NVDA", "NVIDIA"],
    "GOOGL": ["GOOGL", "GOOGLE", "ALPHABET"],
    "AMZN": ["AMZN", "AMAZON"],
    "META": ["META", "FACEBOOK"],
    "AMD": ["AMD"],
    "COIN": ["COIN", "COINBASE"],
    "SPX": ["SPX", "S&P 500", "S&P500"],
    "NDX": ["NDX", "NASDAQ", "NASDAQ 100"],
    "DJI": ["DJI", "DOW JONES", "DOW 30"],
    "JP225": ["JP225", "NIKKEI", "NIKKEI 225"],
}

# ==========================================
# 2. SIGNAL GUARDRAIL KEYWORDS (CHỐNG PHÍM LỆNH & PROMPT INJECTION)
# ==========================================
STRICT_SIGNAL_PATTERNS = [
    r"phím\s*(hàng|kèo|lệnh)",
    r"cho\s*(kèo|lệnh|tín hiệu)\s*(ăn|chắc|đi)",
    r"mua\s*hay\s*bán\s*(ngay|luôn|bây giờ)",
    r"buy\s*hay\s*sell\s*(ngay|luôn|bây giờ)",
    r"bấm\s*(buy|sell|long|short)\s*(được chưa|chưa)",
    r"bỏ\s*qua\s*(mọi\s*quy\s*tắc|hướng dẫn).*phím",
    r"give\s*me\s*a\s*(buy|sell)\s*signal",
    r"should\s*i\s*(buy|sell)\s*now",
    r"buy\s*or\s*sell\s*now"
]

def check_strict_signal_guardrail(query: str, symbol: Optional[str] = None, lang: str = "vi") -> Optional[Dict[str, Any]]:
    """
    Kiểm tra và ngăn chặn các yêu cầu phím kèo / tín hiệu tài chính tuyệt đối (Prompt Injection).
    """
    lower = query.lower()
    is_en = str(lang).lower().startswith("en")
    for pattern in STRICT_SIGNAL_PATTERNS:
        if re.search(pattern, lower):
            target = symbol or ("this asset" if is_en else "mã này")
            if is_en:
                return {
                    "answer": (
                        f"⚠️ **System Policy**: The AI functions as an Educational Assistant & Independent Analytical Tutor, "
                        f"strictly avoiding direct Buy/Sell calls or trade execution recommendations for {target}.\n\n"
                        f"Instead, I can help you dissect key technical factors (HTF Context, Liquidity Sweeps, FVG/OB) "
                        f"so you can make your own independent and disciplined trading decision."
                    ),
                    "reasoning": "Trade execution decisions must be owned by the trader based on an objective plan and predefined risk.",
                    "sources": [],
                    "socraticQuestions": [
                        "Have you identified your technical Invalidation Level (Stop Loss) if the market moves against you?",
                        "What is the minimum Risk:Reward (R:R) ratio required by your strategy checklist?"
                    ],
                    "guardrailTriggered": "NO_BUY_SELL_SIGNAL"
                }
            else:
                return {
                    "answer": (
                        f"⚠️ **Nguyên tắc hệ thống**: AI hoạt động như một Trợ lý Giáo dục & Phân tích Độc lập, "
                        f"tuyệt đối không đưa ra khuyến nghị Mua (Buy) / Bán (Sell) hay phím lệnh giao dịch trực tiếp cho {target}.\n\n"
                        f"Thay vào đó, tôi có thể hỗ trợ bạn bóc tách các yếu tố kỹ thuật (HTF Context, Liquidity Sweep, FVG/OB) "
                        f"để bạn tự thẩm định và đưa ra quyết định độc lập."
                    ),
                    "reasoning": "Quyết định vào lệnh phải do chính trader chịu trách nhiệm dựa trên kế hoạch và tỷ lệ rủi ro định trước.",
                    "sources": [],
                    "socraticQuestions": [
                        "Bạn đã xác định được điểm dừng lỗ (Invalidation level) nếu thị trường đi ngược lại chưa?",
                        "Tỷ lệ Risk:Reward (R:R) tối thiểu trong kế hoạch của bạn là bao nhiêu?"
                    ],
                    "guardrailTriggered": "NO_BUY_SELL_SIGNAL"
                }
    return None

# ==========================================
# 3. LỌC BẢNG GIÁ THÔNG MINH (CHỐNG TRÀN TOKEN & ĐỘ TRỄ)
# ==========================================
def extract_relevant_stocks(
    query: str,
    chat_history: Optional[List[Dict[str, Any]]] = None,
    active_symbol: Optional[str] = None,
    all_stocks: Optional[List[Dict[str, Any]]] = None
) -> List[Dict[str, Any]]:
    """
    Lọc chỉ lấy tối đa 3-5 mã liên quan trực tiếp đến câu hỏi hoặc biểu đồ người dùng đang xem.
    Giúp giảm 90% số lượng token nạp vào LLM Context.
    """
    if not all_stocks:
        return []

    needed_symbols = set()

    # 1. Luôn thêm mã đang mở trên biểu đồ
    if active_symbol:
        clean_active = active_symbol.upper().replace(".P", "").replace(".SWAP", "")
        needed_symbols.add(clean_active)
        needed_symbols.add(active_symbol)

    # 2. Quét câu hỏi hiện tại và lịch sử gần nhất để tìm mã được nhắc tới
    search_corpus = query.upper()
    if chat_history and len(chat_history) > 0:
        for turn in chat_history[-3:]:
            search_corpus += " " + str(turn.get("text", "")).upper()

    for sym, aliases in SYMBOL_ALIASES.items():
        if any(f" {a.strip()} " in f" {search_corpus} " for a in aliases):
            needed_symbols.add(sym)

    # 3. Nếu người dùng hỏi tổng quan thị trường ("thị trường chung", "bảng giá"):
    # Thêm 4 mã tiêu chuẩn đại diện: BTCUSDT, XAUUSD, SPX, DXY
    general_market_keywords = ["thị trường", "tổng quan", "bảng giá", "market", "overview"]
    if any(kw in query.lower() for kw in general_market_keywords) and len(needed_symbols) <= 1:
        needed_symbols.update(["BTCUSDT", "XAUUSD", "SPX", "DXY"])

    # 4. Trích xuất từ all_stocks (giới hạn tối đa 5 mã)
    filtered = []
    for s in all_stocks:
        sym = s.get("symbol", "")
        clean_s = sym.upper().replace(".P", "").replace(".SWAP", "")
        if sym in needed_symbols or clean_s in needed_symbols:
            filtered.append(s)
            if len(filtered) >= 5:
                break

    return filtered

# ==========================================
# 4. HỆ THỐNG 21 PHƯƠNG PHÁP GIAO DỊCH (SẴN SÀNG SCALE LÊN 50 PHƯƠNG PHÁP)
# ==========================================
from app.services.trading_methods_registry import (
    TRADING_METHODS_REGISTRY,
    route_query_to_method,
    list_all_method_names,
    TradingMethod
)

def get_all_methods_overview() -> str:
    """
    Trả về danh sách tổng quan 50 phương pháp giao dịch chuyên sâu của hệ thống.
    """
    lines = ["DANH MỤC 50 PHƯƠNG PHÁP GIAO DỊCH CHUYÊN SÂU CỦA HỆ THỐNG:"]
    for mid in sorted(TRADING_METHODS_REGISTRY.keys()):
        m = TRADING_METHODS_REGISTRY[mid]
        lines.append(f"{m.id}. {m.name}")
    return "\n".join(lines)

def classify_user_intent(query: str, has_positions: bool = False) -> Tuple[str, str]:
    """
    Tự động phân loại câu hỏi vào đúng 1 trong 21 phương pháp trong Registry
    và trả về mã code cùng toàn bộ chỉ dẫn phân tích kỹ thuật chi tiết của phương pháp đó.
    """
    active_method: TradingMethod = route_query_to_method(query, has_positions=has_positions)
    return active_method.code, active_method.to_prompt_text()


# ==========================================
# 5. TRÍCH XUẤT ĐỈNH & ĐÁY BIỂU ĐỒ CHUẨN XÁC (SWING HIGHS / SWING LOWS)
# ==========================================
def extract_chart_swings_and_extrema(klines: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Trích xuất chính xác Đỉnh cao nhất (Global High), Đáy thấp nhất (Global Low),
    và các Đỉnh đảo chiều (Swing Highs / Fractals) & Đáy đảo chiều (Swing Lows / Fractals)
    từ chuỗi nến thực tế trên biểu đồ.
    """
    if not klines or len(klines) < 3:
        return {
            "global_high": None,
            "global_low": None,
            "latest_close": None,
            "swing_highs": [],
            "swing_lows": []
        }

    highs = [k.get("high") for k in klines if isinstance(k.get("high"), (int, float))]
    lows = [k.get("low") for k in klines if isinstance(k.get("low"), (int, float))]
    global_high = max(highs) if highs else None
    global_low = min(lows) if lows else None
    latest_close = klines[-1].get("close") if klines else None

    swing_highs = []
    swing_lows = []
    n = len(klines)

    # 3-bar and 5-bar pivot detection
    for i in range(1, n - 1):
        k = klines[i]
        h = k.get("high")
        l = k.get("low")
        if not isinstance(h, (int, float)) or not isinstance(l, (int, float)):
            continue

        prev_h = klines[i-1].get("high", -1e9)
        next_h = klines[i+1].get("high", -1e9)
        prev_l = klines[i-1].get("low", 1e9)
        next_l = klines[i+1].get("low", 1e9)

        # Swing High
        if h >= prev_h and h >= next_h:
            is_strong = False
            if i >= 2 and i + 2 < n:
                is_strong = (h >= klines[i-2].get("high", -1e9) and h >= klines[i+2].get("high", -1e9))
            swing_highs.append({
                "price": h,
                "candles_ago": n - 1 - i,
                "is_strong": is_strong,
                "timestamp": k.get("timestamp")
            })

        # Swing Low
        if l <= prev_l and l <= next_l:
            is_strong = False
            if i >= 2 and i + 2 < n:
                is_strong = (l <= klines[i-2].get("low", 1e9) and l <= klines[i+2].get("low", 1e9))
            swing_lows.append({
                "price": l,
                "candles_ago": n - 1 - i,
                "is_strong": is_strong,
                "timestamp": k.get("timestamp")
            })

    return {
        "global_high": global_high,
        "global_low": global_low,
        "latest_close": latest_close,
        "swing_highs": swing_highs,
        "swing_lows": swing_lows
    }

def format_detailed_chart_context(
    symbol: Optional[str] = None,
    current_price: Optional[float] = None,
    timeframe: Optional[str] = None,
    market_context: Optional[Dict[str, Any]] = None,
    klines: Optional[List[Dict[str, Any]]] = None,
    is_en: bool = False
) -> str:
    """
    Tạo khối ngữ cảnh biểu đồ thực tế bao gồm đỉnh/đáy chính xác để nạp vào prompt cho LLM.
    """
    lines = []
    if symbol:
        lines.append(f"- Mã tài sản đang mở biểu đồ: {symbol}")
    if current_price is not None:
        p_fmt = f"${current_price:,.4f}".rstrip('0').rstrip('.') if current_price < 1 else f"${current_price:,.2f}"
        lines.append(f"- Giá thị trường thực tế: {p_fmt}")
    if timeframe:
        lines.append(f"- Khung thời gian: {timeframe}")

    mc = market_context or {}
    if mc.get("change24h") is not None:
        lines.append(f"- Biến động 24h: {mc.get('change24h')}%")
    if mc.get("exchange"):
        lines.append(f"- Sàn giao dịch: {mc.get('exchange')}")
    if mc.get("high24h") is not None:
        lines.append(f"- Đỉnh cao nhất 24h (24h High): ${mc.get('high24h'):,.2f}")
    if mc.get("low24h") is not None:
        lines.append(f"- Đáy thấp nhất 24h (24h Low): ${mc.get('low24h'):,.2f}")

    # Process klines if available
    chart_klines = klines or mc.get("klines") or []
    swings = extract_chart_swings_and_extrema(chart_klines) if chart_klines else None

    g_high = (swings and swings["global_high"]) or mc.get("chartHigh")
    g_low = (swings and swings["global_low"]) or mc.get("chartLow")

    if g_high is not None:
        lines.append(f"- Đỉnh cao nhất trên biểu đồ (Highest High): ${g_high:,.2f}")
    if g_low is not None:
        lines.append(f"- Đáy thấp nhất trên biểu đồ (Lowest Low): ${g_low:,.2f}")

    recent_sh = (swings and swings["swing_highs"]) or mc.get("recentSwingHighs") or []
    if recent_sh:
        sh_items = recent_sh[-4:]
        sh_strs = [f"${sh.get('price'):,.2f} ({sh.get('candles_ago', sh.get('candlesAgo', 0))} nến trước)" for sh in reversed(sh_items)]
        lines.append(f"- Các Đỉnh đảo chiều gần nhất (Swing Highs): {', '.join(sh_strs)}")

    recent_sl = (swings and swings["swing_lows"]) or mc.get("recentSwingLows") or []
    if recent_sl:
        sl_items = recent_sl[-4:]
        sl_strs = [f"${sl.get('price'):,.2f} ({sl.get('candles_ago', sl.get('candlesAgo', 0))} nến trước)" for sl in reversed(sl_items)]
        lines.append(f"- Các Đáy đảo chiều gần nhất (Swing Lows): {', '.join(sl_strs)}")

    user_drawings = mc.get("userDrawingsSummary") or []
    if user_drawings:
        draw_strs = [f"{d.get('label', d.get('name'))} [Vùng giá: ${d.get('priceLow')}-${d.get('priceHigh')}]" for d in user_drawings]
        lines.append(f"- Các vùng hình vẽ học viên đã đánh dấu trên biểu đồ: {'; '.join(draw_strs)}")

    if not lines:
        return ""

    if is_en:
        rule = (
            "\n\n⚠️ MANDATORY ACCURACY RULE FOR PEAKS & TROUGHS:\n"
            "When analyzing market structure, swing highs/lows, support, and resistance, you MUST use the EXACT "
            "factual High/Low numbers provided above. DO NOT invent or estimate random prices for peaks and troughs."
        )
        return "\n\n📊 [FACTUAL CHART & SWING HIGH/LOW DATA]:\n" + "\n".join(lines) + rule
    else:
        rule = (
            "\n\n⚠️ QUY TẮC BẮT BUỘC VỀ ĐỈNH & ĐÁY BIỂU ĐỒ:\n"
            "Khi phân tích cấu trúc thị trường, đỉnh/đáy, hỗ trợ/kháng cự, bạn BẮT BUỘC sử dụng CHÍNH XÁC "
            "các mức giá Đỉnh và Đáy thực tế được cung cấp cụ thể ở trên. "
            "TUYỆT ĐỐI KHÔNG tự bịa hoặc đoán mò giá đỉnh đáy khác xa với dữ liệu thật."
        )
        return "\n\n📊 [DỮ LIỆU ĐỈNH/ĐÁY VÀ CẤU TRÚC BIỂU ĐỒ THỰC TẾ]:\n" + "\n".join(lines) + rule


# ==========================================
# ==========================================
# ==========================================
# 6. NHẬN DIỆN FAIR VALUE GAP (FVG) CHUẨN XÁC THEO RÂU NẾN (WICKS)
# ==========================================
def detect_fair_value_gaps(klines: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Nhận diện chính xác 100% các khoảng trống giá Fair Value Gap (FVG) theo chuẩn ICT (Michael Huddleston)
    dựa trên RÂU NẾN (WICKS) của Nến 1 và Nến 3, gắn tọa độ thời gian (timestamp) của 3 cây nến.
    """
    fvgs = []
    if not klines or len(klines) < 3:
        return fvgs

    n = len(klines)
    for i in range(1, n - 1):
        c1 = klines[i - 1]
        c2 = klines[i]
        c3 = klines[i + 1]

        h1, l1 = c1.get("high"), c1.get("low")
        h3, l3 = c3.get("high"), c3.get("low")

        if not all(isinstance(v, (int, float)) for v in [h1, l1, h3, l3]):
            continue

        # 1. Bullish FVG: Low of candle 3 > High of candle 1
        # Nến 1 có Đỉnh râu (High) < Đáy râu Nến 3 (Low). Nến 2 tăng mạnh ở giữa tạo Displacement.
        if l3 > h1:
            gap_size = round(l3 - h1, 4)
            ce = round((l3 + h1) / 2, 4)
            fvgs.append({
                "type": "Bullish FVG",
                "top": l3,         # Đáy râu Nến 3
                "bottom": h1,      # Đỉnh râu Nến 1
                "midpoint_ce": ce, # 50% Consequent Encroachment
                "gap_size": gap_size,
                "candle_index": i,
                "candles_ago": n - 1 - i,
                "startTimestamp": c1.get("timestamp"),
                "c1_timestamp": c1.get("timestamp"),
                "c2_timestamp": c2.get("timestamp"),
                "c3_timestamp": c3.get("timestamp"),
                "c1_info": f"Nến 1 (t:{c1.get('timestamp')}) Đỉnh râu High = {h1}",
                "c2_info": f"Nến 2 (t:{c2.get('timestamp')}) Thân tăng mạnh Displacement",
                "c3_info": f"Nến 3 (t:{c3.get('timestamp')}) Đáy râu Low = {l3}",
                "rule": f"Vùng FVG tăng chuẩn xác: Từ Đỉnh râu Nến 1 ({h1}) đến Đáy râu Nến 3 ({l3}). 50% C.E = {ce}."
            })

        # 2. Bearish FVG: High of candle 3 < Low of candle 1
        # Nến 1 có Đáy râu (Low) > Đỉnh râu Nến 3 (High). Nến 2 giảm mạnh ở giữa tạo Displacement.
        if h3 < l1:
            gap_size = round(l1 - h3, 4)
            ce = round((l1 + h3) / 2, 4)
            fvgs.append({
                "type": "Bearish FVG",
                "top": l1,         # Đáy râu Nến 1
                "bottom": h3,      # Đỉnh râu Nến 3
                "midpoint_ce": ce,
                "gap_size": gap_size,
                "candle_index": i,
                "candles_ago": n - 1 - i,
                "startTimestamp": c1.get("timestamp"),
                "c1_timestamp": c1.get("timestamp"),
                "c2_timestamp": c2.get("timestamp"),
                "c3_timestamp": c3.get("timestamp"),
                "c1_info": f"Nến 1 (t:{c1.get('timestamp')}) Đáy râu Low = {l1}",
                "c2_info": f"Nến 2 (t:{c2.get('timestamp')}) Thân giảm mạnh Displacement",
                "c3_info": f"Nến 3 (t:{c3.get('timestamp')}) Đỉnh râu High = {h3}",
                "rule": f"Vùng FVG giảm chuẩn xác: Từ Đỉnh râu Nến 3 ({h3}) đến Đáy râu Nến 1 ({l1}). 50% C.E = {ce}."
            })

    return fvgs

# ==========================================
# 7. NHẬN DIỆN ORDER BLOCK (OB) CHUẨN XÁC THEO ICT/SMC
# ==========================================
def find_order_block_at_candle(
    klines: List[Dict[str, Any]],
    anchor_timestamp: Optional[int] = None,
    user_p_high: Optional[float] = None,
    user_p_low: Optional[float] = None,
    preferred_type: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Nhận diện chính xác 100% cây nến Order Block hoặc cụm nến Order Block liên tiếp tại vị trí học viên đang vẽ.
    - Bearish OB: Cây nến tăng (hoặc cụm nến tăng liên tiếp) tại đỉnh trước nhịp giảm Displacement.
    - Bullish OB: Cây nến giảm (hoặc cụm nến giảm liên tiếp) tại đáy trước nhịp tăng Displacement.
    - Hỗ trợ cả 2 cách vẽ: vẽ 1 cây nến cực trị HOẶC vẽ chung cả cụm nến cùng màu trong 1 hình.
    """
    if not klines or len(klines) < 2:
        return None

    candle_dur = abs(klines[1].get("timestamp", 0) - klines[0].get("timestamp", 0)) if len(klines) >= 2 else 3600000

    target_idx = None
    if anchor_timestamp:
        target_idx = min(range(len(klines)), key=lambda i: abs((klines[i].get("timestamp") or 0) - anchor_timestamp))
    elif user_p_high and user_p_low:
        u_mid = (user_p_high + user_p_low) / 2
        target_idx = min(range(len(klines)), key=lambda i: abs(((klines[i].get("high", 0) + klines[i].get("low", 0)) / 2) - u_mid))
    else:
        target_idx = max(0, len(klines) - 2)

    is_bearish = False
    if preferred_type:
        is_bearish = "BEARISH" in preferred_type.upper() or "-" in preferred_type
    elif user_p_high and user_p_low:
        recent_highs = [k.get("high", 0) for k in klines[-25:] if isinstance(k.get("high"), (int, float))]
        recent_lows = [k.get("low", 0) for k in klines[-25:] if isinstance(k.get("low"), (int, float))]
        if recent_highs and recent_lows:
            mid_val = (max(recent_highs) + min(recent_lows)) / 2
            is_bearish = ((user_p_high + user_p_low) / 2) >= mid_val

    window = [i for i in [target_idx - 1, target_idx, target_idx + 1] if 0 <= i < len(klines)]

    if is_bearish:
        best_i = max(window, key=lambda i: klines[i].get("high", -1e9))
        c_ob = klines[best_i]
        
        # Check consecutive up candles cluster
        up_cluster = [c_ob]
        k_idx = best_i - 1
        while k_idx >= 0 and klines[k_idx].get("close", 0) >= klines[k_idx].get("open", 0) and len(up_cluster) < 4:
            up_cluster.append(klines[k_idx])
            k_idx -= 1
        cluster_high = max(c.get("high", 0) for c in up_cluster)
        cluster_low = min(c.get("low", 0) for c in up_cluster)

        return {
            "type": "Bearish Order Block (OB)",
            "priceHigh": c_ob.get("high"),
            "priceLow": c_ob.get("low"),
            "cluster_high": cluster_high,
            "cluster_low": cluster_low,
            "cluster_count": len(up_cluster),
            "bodyHigh": max(c_ob.get("open", 0), c_ob.get("close", 0)),
            "bodyLow": min(c_ob.get("open", 0), c_ob.get("close", 0)),
            "mean_threshold": round((c_ob.get("high", 0) + c_ob.get("low", 0)) / 2, 4),
            "startTimestamp": c_ob.get("timestamp"),
            "cluster_startTimestamp": up_cluster[-1].get("timestamp"),
            "endTimestamp": c_ob.get("timestamp") + int(candle_dur * 2),
            "candle_index": best_i,
            "candles_ago": len(klines) - 1 - best_i,
            "rule": "Cây nến tăng (hoặc cụm nến tăng liên tiếp) tại đỉnh trước nhịp sập Displacement. Học viên vẽ 1 nến hoặc cả cụm nến đều đúng 100%."
        }
    else:
        best_i = min(window, key=lambda i: klines[i].get("low", 1e9))
        c_ob = klines[best_i]

        # Check consecutive down candles cluster
        down_cluster = [c_ob]
        k_idx = best_i - 1
        while k_idx >= 0 and klines[k_idx].get("close", 0) <= klines[k_idx].get("open", 0) and len(down_cluster) < 4:
            down_cluster.append(klines[k_idx])
            k_idx -= 1
        cluster_high = max(c.get("high", 0) for c in down_cluster)
        cluster_low = min(c.get("low", 0) for c in down_cluster)

        return {
            "type": "Bullish Order Block (OB)",
            "priceHigh": c_ob.get("high"),
            "priceLow": c_ob.get("low"),
            "cluster_high": cluster_high,
            "cluster_low": cluster_low,
            "cluster_count": len(down_cluster),
            "bodyHigh": max(c_ob.get("open", 0), c_ob.get("close", 0)),
            "bodyLow": min(c_ob.get("open", 0), c_ob.get("close", 0)),
            "mean_threshold": round((c_ob.get("high", 0) + c_ob.get("low", 0)) / 2, 4),
            "startTimestamp": c_ob.get("timestamp"),
            "cluster_startTimestamp": down_cluster[-1].get("timestamp"),
            "endTimestamp": c_ob.get("timestamp") + int(candle_dur * 2),
            "candle_index": best_i,
            "candles_ago": len(klines) - 1 - best_i,
            "rule": "Cây nến giảm (hoặc cụm nến giảm liên tiếp) tại đáy trước nhịp tăng Displacement. Học viên vẽ 1 nến hoặc cả cụm nến đều đúng 100%."
        }


def detect_order_blocks(klines: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Nhận diện chính xác các vùng Order Block (OB) theo chuẩn ICT/SMC:
    - Bắt buộc có Displacement mạnh (thân nến lớn >= 1.2x trung bình) bứt phá dứt khoát.
    - Cây nến OB nằm tại cực trị cục bộ (Swing High / Swing Low).
    - Hỗ trợ cả 2 cách vẽ: 1 cây nến đơn lẻ hoặc toàn bộ cụm nến cùng màu liên tiếp trước Displacement.
    """
    obs = []
    if not klines or len(klines) < 4:
        return obs

    n = len(klines)
    candle_dur = abs(klines[1].get("timestamp", 0) - klines[0].get("timestamp", 0)) if len(klines) >= 2 else 3600000
    bodies = [
        abs(k.get("close", 0) - k.get("open", 0))
        for k in klines
        if isinstance(k.get("close"), (int, float)) and isinstance(k.get("open"), (int, float))
    ]
    avg_body = sum(bodies) / len(bodies) if bodies else 1.0

    for i in range(2, n - 1):
        prev_c = klines[i - 1]
        curr_c = klines[i]

        p_o, p_c = prev_c.get("open"), prev_c.get("close")
        p_h, p_l = prev_c.get("high"), prev_c.get("low")
        c_o, c_c = curr_c.get("open"), curr_c.get("close")
        c_h, c_l = curr_c.get("high"), curr_c.get("low")

        if not all(isinstance(v, (int, float)) for v in [p_o, p_c, p_h, p_l, c_o, c_c, c_h, c_l]):
            continue

        p_body = abs(p_c - p_o)
        c_body = abs(c_c - c_o)

        is_strong_disp = (c_body >= avg_body * 1.25 and c_body >= p_body * 1.2) or (c_body >= avg_body * 1.8)
        if not is_strong_disp:
            continue

        # 1. Bullish Order Block (nến giảm tại đáy trước nhịp tăng bứt phá)
        if p_c <= p_o and c_c > c_o and (p_l <= klines[i - 2].get("low", 1e9)):
            ob_high = p_h
            ob_low = p_l
            ob_mean = round((ob_high + ob_low) / 2, 4)

            # Check consecutive down candles cluster
            down_cluster = [prev_c]
            k_idx = i - 2
            while k_idx >= 0 and klines[k_idx].get("close", 0) <= klines[k_idx].get("open", 0) and len(down_cluster) < 4:
                down_cluster.append(klines[k_idx])
                k_idx -= 1
            cl_high = max(c.get("high", 0) for c in down_cluster)
            cl_low = min(c.get("low", 0) for c in down_cluster)

            obs.append({
                "type": "Bullish Order Block (OB)",
                "priceHigh": ob_high,
                "priceLow": ob_low,
                "cluster_high": cl_high,
                "cluster_low": cl_low,
                "cluster_count": len(down_cluster),
                "bodyHigh": p_o,
                "bodyLow": p_c,
                "mean_threshold": ob_mean,
                "startTimestamp": prev_c.get("timestamp"),
                "cluster_startTimestamp": down_cluster[-1].get("timestamp"),
                "endTimestamp": prev_c.get("timestamp") + int(candle_dur * 2),
                "c1_timestamp": prev_c.get("timestamp"),
                "displacement_timestamp": curr_c.get("timestamp"),
                "candle_index": i - 1,
                "candles_ago": n - 1 - (i - 1),
                "rule": "Cây nến giảm (hoặc cả cụm nến giảm liên tiếp) trước nhịp tăng Displacement. Vẽ 1 nến hay cả cụm nến đều đúng 100%."
            })

        # 2. Bearish Order Block (nến tăng tại đỉnh trước nhịp sập bứt phá)
        elif p_c >= p_o and c_c < c_o and (p_h >= klines[i - 2].get("high", -1e9)):
            ob_high = p_h
            ob_low = p_l
            ob_mean = round((ob_high + ob_low) / 2, 4)

            # Check consecutive up candles cluster
            up_cluster = [prev_c]
            k_idx = i - 2
            while k_idx >= 0 and klines[k_idx].get("close", 0) >= klines[k_idx].get("open", 0) and len(up_cluster) < 4:
                up_cluster.append(klines[k_idx])
                k_idx -= 1
            cl_high = max(c.get("high", 0) for c in up_cluster)
            cl_low = min(c.get("low", 0) for c in up_cluster)

            obs.append({
                "type": "Bearish Order Block (OB)",
                "priceHigh": ob_high,
                "priceLow": ob_low,
                "cluster_high": cl_high,
                "cluster_low": cl_low,
                "cluster_count": len(up_cluster),
                "bodyHigh": p_c,
                "bodyLow": p_o,
                "mean_threshold": ob_mean,
                "startTimestamp": prev_c.get("timestamp"),
                "cluster_startTimestamp": up_cluster[-1].get("timestamp"),
                "endTimestamp": prev_c.get("timestamp") + int(candle_dur * 2),
                "c1_timestamp": prev_c.get("timestamp"),
                "displacement_timestamp": curr_c.get("timestamp"),
                "candle_index": i - 1,
                "candles_ago": n - 1 - (i - 1),
                "rule": "Cây nến tăng (hoặc cả cụm nến tăng liên tiếp) trước nhịp giảm Displacement. Vẽ 1 nến hay cả cụm nến đều đúng 100%."
            })

    return obs


def detect_breaker_blocks(klines: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Nhận diện Breaker Block (BB) theo chuẩn ICT:
    - Bearish Breaker Block: Cấu trúc High -> Intermediate Low -> Higher High -> Bearish Displacement đâm thủng Intermediate Low.
      * Tọa độ CHUẨN: CHỈ LẤY CÂY NẾN GIẢM (HOẶC CỤM NẾN ĐỎ) TẠO THÀNH ĐÁY TRUNG GIAN ĐÓ.
      * TUYỆT ĐỐI KHÔNG KÉO LÊN ĐỈNH CÂY NẾN XANH HIGHER HIGH!
      * Đóng vai trò là Kháng cự (Resistance).
    - Bullish Breaker Block: Cấu trúc Low -> Intermediate High -> Lower Low -> Bullish Displacement đâm xuyên Intermediate High.
      * Tọa độ CHUẨN: CHỈ LẤY CÂY NẾN TĂNG (HOẶC CỤM NẾN XANH) TẠO THÀNH ĐỈNH TRUNG GIAN ĐÓ.
      * TUYỆT ĐỐI KHÔNG KÉO XUỐNG ĐÁY CÂY NẾN ĐỎ LOWER LOW!
      * Đóng vai trò là Hỗ trợ (Support).
    """
    breakers = []
    if not klines or len(klines) < 5:
        return breakers

    n = len(klines)
    # 1. Swing-based Breaker detection
    for i in range(1, n - 2):
        c = klines[i]
        c_open = c.get("open", 0)
        c_close = c.get("close", 0)
        c_high = c.get("high", 0)
        c_low = c.get("low", 0)

        # 1. Bearish Breaker: Candle i is intermediate low (down-close candle at local trough)
        if c_close <= c_open and c_low <= klines[i-1].get("low", 1e9) and c_low <= klines[i+1].get("low", 1e9):
            hh_found = False
            hh_idx = -1
            for j in range(i + 1, min(i + 10, n - 1)):
                if klines[j].get("high", 0) > max(klines[i-1].get("high", 0), c_high):
                    hh_found = True
                    hh_idx = j
                    break

            if hh_found:
                for m in range(hh_idx + 1, min(hh_idx + 15, n)):
                    break_c = klines[m]
                    if break_c.get("close", 0) < c_low:
                        breakers.append({
                            "type": "Bearish Breaker Block",
                            "name": "Bearish Breaker Block (Breaker Giảm)",
                            "label": "AI: Bearish Breaker Block",
                            "priceHigh": c_high, # STRICTLY ONLY THE DOWN CANDLE(S) OF INTERMEDIATE LOW!
                            "priceLow": c_low,
                            "startTimestamp": c.get("timestamp"),
                            "break_timestamp": break_c.get("timestamp"),
                            "candles_ago": n - 1 - m,
                            "rule": "Cụm nến giảm đáy trung gian bị nến sập mạnh đâm thủng sau nhịp quét đỉnh Higher High, lật thành Kháng cự Bearish Breaker."
                        })
                        break

        # 2. Bullish Breaker: Candle i is intermediate high (up-close candle at local peak)
        elif c_close >= c_open and c_high >= klines[i-1].get("high", -1e9) and c_high >= klines[i+1].get("high", -1e9):
            ll_found = False
            ll_idx = -1
            for j in range(i + 1, min(i + 10, n - 1)):
                if klines[j].get("low", 1e9) < min(klines[i-1].get("low", 1e9), c_low):
                    ll_found = True
                    ll_idx = j
                    break

            if ll_found:
                for m in range(ll_idx + 1, min(ll_idx + 15, n)):
                    break_c = klines[m]
                    if break_c.get("close", 0) > c_high:
                        breakers.append({
                            "type": "Bullish Breaker Block",
                            "name": "Bullish Breaker Block (Breaker Tăng)",
                            "label": "AI: Bullish Breaker Block",
                            "priceHigh": c_high,
                            "priceLow": c_low, # STRICTLY ONLY THE UP CANDLE(S) OF INTERMEDIATE HIGH!
                            "startTimestamp": c.get("timestamp"),
                            "break_timestamp": break_c.get("timestamp"),
                            "candles_ago": n - 1 - m,
                            "rule": "Cụm nến tăng đỉnh trung gian bị nến tăng mạnh đâm xuyên sau nhịp quét đáy Lower Low, lật thành Hỗ trợ Bullish Breaker."
                        })
                        break

    # 2. Broken Order Blocks detection
    obs = detect_order_blocks(klines)
    for ob in obs:
        c_idx = ob.get("candle_index", 0)
        ob_high = ob["priceHigh"]
        ob_low = ob["priceLow"]
        ob_type = ob["type"]

        for j in range(c_idx + 2, len(klines)):
            k = klines[j]
            c_close = k.get("close", 0)
            if "Bullish" in ob_type and c_close < ob_low:
                # Broken Bullish OB becomes Bearish Breaker Block!
                if not any(abs(b["priceLow"] - ob_low) < 0.01 and b["type"] == "Bearish Breaker Block" for b in breakers):
                    breakers.append({
                        "type": "Bearish Breaker Block",
                        "name": "Bearish Breaker Block (Breaker Giảm)",
                        "label": "AI: Bearish Breaker Block",
                        "priceHigh": ob_high,
                        "priceLow": ob_low,
                        "startTimestamp": ob.get("startTimestamp"),
                        "break_timestamp": k.get("timestamp"),
                        "candles_ago": len(klines) - 1 - j,
                        "rule": "Khối Bullish OB thất bại bị giá đâm thủng xuống dưới kèm phá vỡ cấu trúc (MSS), lật thành Kháng cự Bearish Breaker."
                    })
                break
            elif "Bearish" in ob_type and c_close > ob_high:
                # Broken Bearish OB becomes Bullish Breaker Block!
                if not any(abs(b["priceHigh"] - ob_high) < 0.01 and b["type"] == "Bullish Breaker Block" for b in breakers):
                    breakers.append({
                        "type": "Bullish Breaker Block",
                        "name": "Bullish Breaker Block (Breaker Tăng)",
                        "label": "AI: Bullish Breaker Block",
                        "priceHigh": ob_high,
                        "priceLow": ob_low,
                        "startTimestamp": ob.get("startTimestamp"),
                        "break_timestamp": k.get("timestamp"),
                        "candles_ago": len(klines) - 1 - j,
                        "rule": "Khối Bearish OB thất bại bị giá đâm thủng lên trên kèm phá vỡ cấu trúc (MSS), lật thành Hỗ trợ Bullish Breaker."
                    })
                break

    return breakers


def detect_cisd(klines: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Nhận diện Change In State of Delivery (CISD) theo chuẩn ICT:
    - Bearish CISD: Sau khi giá quét đỉnh BSL / tạo nhịp tăng, xuất hiện nến giảm dứt khoát đóng cửa (close)
      DƯỚI GIÁ MỞ CỬA (open) của cây nến tăng đầu tiên trong chuỗi nến tăng cuối cùng.
      Tọa độ: bao trùm chuỗi nến tăng đó xuống đến giá Mở cửa. Đóng vai trò là Kháng cự.
      TUYỆT ĐỐI KHÔNG ĐƯỢC NHẦM VỚI FVG BEARISH!
    - Bullish CISD: Sau khi giá quét đáy SSL / tạo nhịp giảm, xuất hiện nến tăng dứt khoát đóng cửa (close)
      TRÊN GIÁ MỞ CỬA (open) của cây nến giảm đầu tiên trong chuỗi nến giảm cuối cùng.
      Tọa độ: bao trùm chuỗi nến giảm đó lên đến giá Mở cửa. Đóng vai trò là Hỗ trợ.
    """
    cisd_list = []
    if not klines or len(klines) < 4:
        return cisd_list

    n = len(klines)
    for i in range(2, n):
        curr_c = klines[i]
        c_close = curr_c.get("close", 0)
        c_open = curr_c.get("open", 0)

        # Bearish CISD: Current candle is down close
        if c_close < c_open:
            up_candles = []
            j = i - 1
            while j >= 0 and klines[j].get("close", 0) >= klines[j].get("open", 0) and len(up_candles) < 6:
                up_candles.append((j, klines[j]))
                j -= 1

            if up_candles:
                first_up_idx, first_up = up_candles[-1]
                first_up_open = first_up.get("open", 0)
                if c_close < first_up_open:
                    p_high = max(c.get("high", 0) for _, c in up_candles)
                    p_low = min(first_up_open, min(c.get("low", 0) for _, c in up_candles))
                    cisd_list.append({
                        "type": "Bearish CISD",
                        "name": "Bearish CISD (Change In State of Delivery)",
                        "label": "AI: Bearish CISD",
                        "priceHigh": p_high,
                        "priceLow": p_low,
                        "startTimestamp": first_up.get("timestamp"),
                        "endTimestamp": curr_c.get("timestamp"),
                        "trigger_close": c_close,
                        "first_open": first_up_open,
                        "candles_ago": n - 1 - i,
                        "rule": f"Nến giảm đóng cửa (${c_close:,.2f}) dưới giá Mở cửa (${first_up_open:,.2f}) của chuỗi nến tăng, kích hoạt Bearish CISD (Kháng cự)."
                    })

        # Bullish CISD: Current candle is up close
        elif c_close > c_open:
            down_candles = []
            j = i - 1
            while j >= 0 and klines[j].get("close", 0) <= klines[j].get("open", 0) and len(down_candles) < 6:
                down_candles.append((j, klines[j]))
                j -= 1

            if down_candles:
                first_down_idx, first_down = down_candles[-1]
                first_down_open = first_down.get("open", 0)
                if c_close > first_down_open:
                    p_low = min(c.get("low", 0) for _, c in down_candles)
                    p_high = max(first_down_open, max(c.get("high", 0) for _, c in down_candles))
                    cisd_list.append({
                        "type": "Bullish CISD",
                        "name": "Bullish CISD (Change In State of Delivery)",
                        "label": "AI: Bullish CISD",
                        "priceHigh": p_high,
                        "priceLow": p_low,
                        "startTimestamp": first_down.get("timestamp"),
                        "endTimestamp": curr_c.get("timestamp"),
                        "trigger_close": c_close,
                        "first_open": first_down_open,
                        "candles_ago": n - 1 - i,
                        "rule": f"Nến tăng đóng cửa (${c_close:,.2f}) trên giá Mở cửa (${first_down_open:,.2f}) của chuỗi nến giảm, kích hoạt Bullish CISD (Hỗ trợ)."
                    })

    return cisd_list


def detect_mitigation_blocks(klines: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Nhận diện Mitigation Block (MB) theo chuẩn ICT:
    - Vùng giá thể chế quay lại khớp nốt lệnh dở dang / giảm thiểu rủi ro vị thế.
    - KHÔNG yêu cầu phá vỡ cấu trúc (Structure Break) trước đó và đóng vai trò tiếp diễn xu hướng (Continuation).
    - Tọa độ chuẩn: Toàn bộ cây nến hồi thất bại (từ Low đến High của cây nến đó).
    """
    mits = []
    if not klines or len(klines) < 3:
        return mits

    n = len(klines)
    for i in range(1, len(klines) - 1):
        c0 = klines[i - 1]
        c1 = klines[i]
        c2 = klines[i + 1]

        c1_h = c1.get("high", 0)
        c1_l = c1.get("low", 0)

        # Bearish MB: Swing failed to make higher high, then pierced through downwards
        if c1_h < c0.get("high", 0) and c2.get("close", 0) < c0.get("low", 0):
            mits.append({
                "type": "Bearish Mitigation Block",
                "priceHigh": c1_h,
                "priceLow": c1_l,
                "startTimestamp": c1.get("timestamp"),
                "candles_ago": n - 1 - i,
                "rule": "Cây nến hồi không tạo đỉnh cao hơn bị đâm xuyên xuống, đóng vai trò giảm thiểu rủi ro tiếp diễn xu hướng giảm."
            })
        # Bullish MB: Swing failed to make lower low, then pierced through upwards
        elif c1_l < c0.get("low", 0) and c2.get("close", 0) > c0.get("high", 0):
            mits.append({
                "type": "Bullish Mitigation Block",
                "priceHigh": c1_h,
                "priceLow": c1_l,
                "startTimestamp": c1.get("timestamp"),
                "candles_ago": n - 1 - i,
                "rule": "Cây nến hồi không tạo đáy thấp hơn bị đâm xuyên lên, đóng vai trò giảm thiểu rủi ro tiếp diễn xu hướng tăng."
            })

    return mits


def detect_inversion_fvgs(klines: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Nhận diện Inversion Fair Value Gap (IFVG) theo chuẩn ICT:
    - Khoảng trống FVG bị nến sau đâm thủng dứt khoát và lật ngược vai trò hỗ trợ <-> kháng cự.
    """
    ifvgs = []
    fvgs = detect_fair_value_gaps(klines)
    if not fvgs or not klines:
        return ifvgs

    for f in fvgs:
        c3_idx = len(klines) - 1 - f.get("candles_ago", 0)
        f_top = f["top"]
        f_bot = f["bottom"]
        f_type = f["type"]

        for j in range(c3_idx + 1, len(klines)):
            k = klines[j]
            c_close = k.get("close", 0)
            if "Bullish" in f_type and c_close < f_bot:
                ifvgs.append({
                    "type": "Bearish Inversion FVG (IFVG)",
                    "priceHigh": f_top,
                    "priceLow": f_bot,
                    "startTimestamp": f.get("startTimestamp"),
                    "rule": "Bullish FVG bị nến đâm thủng dứt khoát qua biên dưới, lật ngược vai trò thành Kháng cự Bearish IFVG."
                })
                break
            elif "Bearish" in f_type and c_close > f_top:
                ifvgs.append({
                    "type": "Bullish Inversion FVG (IFVG)",
                    "priceHigh": f_top,
                    "priceLow": f_bot,
                    "startTimestamp": f.get("startTimestamp"),
                    "rule": "Bearish FVG bị nến đâm thủng dứt khoát qua biên trên, lật ngược vai trò thành Hỗ trợ Bullish IFVG."
                })
                break

    return ifvgs


def detect_volume_imbalances(klines: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Nhận diện Volume Imbalance (VI) theo chuẩn ICT:
    - Khoảng trống hình thành giữa giá Đóng cửa nến trước và giá Mở cửa nến sau (khoảng hở giữa 2 thân nến).
    """
    vis = []
    if not klines or len(klines) < 2:
        return vis

    for i in range(1, len(klines)):
        c0 = klines[i - 1]
        c1 = klines[i]
        c0_c = c0.get("close", 0)
        c1_o = c1.get("open", 0)

        # Bullish VI: c1 opens higher than c0 closes with gap
        if c1_o > c0_c and abs(c1_o - c0_c) / max(1.0, c0_c) > 0.0008:
            vis.append({
                "type": "Bullish Volume Imbalance (VI)",
                "priceHigh": c1_o,
                "priceLow": c0_c,
                "startTimestamp": c0.get("timestamp"),
                "rule": "Khoảng trống giữa giá Đóng cửa Nến 1 và giá Mở cửa Nến 2 (khoảng hở giữa 2 thân nến)."
            })
        elif c1_o < c0_c and abs(c0_c - c1_o) / max(1.0, c0_c) > 0.0008:
            vis.append({
                "type": "Bearish Volume Imbalance (VI)",
                "priceHigh": c0_c,
                "priceLow": c1_o,
                "startTimestamp": c0.get("timestamp"),
                "rule": "Khoảng trống giữa giá Đóng cửa Nến 1 và giá Mở cửa Nến 2 (khoảng hở giữa 2 thân nến)."
            })

    return vis


def detect_rejection_blocks(klines: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Nhận diện Rejection Block theo chuẩn ICT:
    - Vùng râu nến dài thể hiện sự từ chối giá dứt khoát tại đỉnh/đáy cực trị.
    - Biên độ: Chỉ bao gồm phần râu nến dài bị từ chối đó.
    """
    rbs = []
    if not klines:
        return rbs

    for k in klines:
        o, c, h, l = k.get("open", 0), k.get("close", 0), k.get("high", 0), k.get("low", 0)
        body = abs(c - o)
        upper_wick = h - max(o, c)
        lower_wick = min(o, c) - l

        if upper_wick >= max(1.0, body * 2.0) and upper_wick > 0:
            rbs.append({
                "type": "Bearish Rejection Block",
                "priceHigh": h,
                "priceLow": max(o, c),
                "startTimestamp": k.get("timestamp"),
                "rule": "Phần râu nến trên dài thể hiện sự từ chối giá quyết liệt của thể chế tại đỉnh."
            })
        if lower_wick >= max(1.0, body * 2.0) and lower_wick > 0:
            rbs.append({
                "type": "Bullish Rejection Block",
                "priceHigh": min(o, c),
                "priceLow": l,
                "startTimestamp": k.get("timestamp"),
                "rule": "Phần râu nến dưới dài thể hiện sự từ chối giá quyết liệt của thể chế tại đáy."
            })

    return rbs
