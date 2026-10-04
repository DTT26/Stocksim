"""
TRADING METHODS REGISTRY (HỆ THỐNG QUẢN TRỊ 50 PHƯƠNG PHÁP GIAO DỊCH CHUYÊN SÂU)
Bao quát toàn diện: ICT/SMC, Price Action, Order Flow, Volume Profile, Macro, Prop Firm, Psychology, Execution.
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
import re

@dataclass
class TradingMethod:
    id: int
    code: str
    name: str
    description: str
    typical_questions: List[str]
    required_analysis: List[str]
    output_guidelines: str
    classification_tags: List[str] = field(default_factory=list)

    def to_prompt_text(self) -> str:
        questions_str = "\n".join([f'  • "{q}"' for q in self.typical_questions])
        analysis_str = "\n".join([f"  - {item}" for item in self.required_analysis])
        return (
            f"🎯 **PHƯƠNG PHÁP {self.id}: {self.name}**\n"
            f"📝 *Mô tả*: {self.description}\n"
            f"❓ *Câu hỏi thường gặp*:\n{questions_str}\n"
            f"🔍 *Các yếu tố bắt buộc phân tích*:\n{analysis_str}\n"
            f"📋 *Quy chuẩn phản hồi*:\n{self.output_guidelines}"
        )


# ==============================================================================
# BẢNG 50 PHƯƠNG PHÁP GIAO DỊCH CHUYÊN SÂU TOÀN DIỆN
# ==============================================================================
TRADING_METHODS_REGISTRY: Dict[int, TradingMethod] = {
    # ------------------ 1-10: CỐT LÕI ICT, SMC & CẤU TRÚC THỊ TRƯỜNG ------------------
    1: TradingMethod(
        id=1,
        code="MARKET_ANALYSIS",
        name="MARKET ANALYSIS (Phân tích bối cảnh thị trường)",
        description="Đánh giá bối cảnh vĩ mô, cấu trúc đa khung, dòng tiền và xác định thiên hướng thị trường (Bias).",
        typical_questions=[
            "Phân tích BTC hiện tại.",
            "Thị trường đang như thế nào?",
            "BTC đang bullish hay bearish?",
            "Market structure hiện tại là gì?",
            "Vùng nào đang quan trọng?",
            "Liquidity nằm ở đâu?",
            "Giá đang hướng tới liquidity nào?",
            "Có nên chờ setup không?"
        ],
        required_analysis=[
            "Current market data & Real-time price",
            "Timeframe đang xét (H4/H1/M15)",
            "HTF context (Bối cảnh khung thời gian cao)",
            "Market structure (BOS / MSS / Trend)",
            "Liquidity (BSL / SSL / EQH / EQL)",
            "Displacement (Nến bứt phá có xung lực mạnh)",
            "Important POIs (Point of Interest)",
            "Current price location (Đang ở Discount hay Premium)",
            "Conflicting evidence (Yếu tố mâu thuẫn)",
            "Possible scenarios (Các kịch bản khả dĩ)"
        ],
        output_guidelines="• Tuyệt đối KHÔNG BAO GIỜ chỉ phán 'Bullish' hoặc 'Bearish'. Luôn giải thích rõ TẠI SAO.\n• Phải chỉ rõ vùng POI quan trọng và mốc giá Invalidation làm vô hiệu hóa nhận định.",
        classification_tags=["phân tích", "nhận định", "xu hướng", "bullish", "bearish", "hôm nay", "thị trường", "market analysis", "phan tich", "nhan dinh", "xu huong"]
    ),

    2: TradingMethod(
        id=2,
        code="TRADE_IDEA_ANALYSIS",
        name="TRADE IDEA ANALYSIS (Thẩm định ý tưởng & Kèo giao dịch)",
        description="Bóc tách và thẩm định độ tin cậy của một ý tưởng vào lệnh theo 12 tiêu chí chặt chẽ.",
        typical_questions=[
            "Setup này có hợp lý không?",
            "Kèo này có đẹp không?",
            "Tôi đang xem xét Long ở đây.",
            "Nếu giá về vùng này thì có thể vào không?",
            "Setup ICT này có hợp lệ không?"
        ],
        required_analysis=[
            "1. HTF Context",
            "2. Liquidity target (Mục tiêu thanh khoản)",
            "3. Liquidity event (Đã sweep đỉnh/đáy nào chưa)",
            "4. Structure (Cấu trúc có thuận xu hướng không)",
            "5. Displacement (Có nến đẩy mạnh xác nhận không)",
            "6. POI (Vùng cung cầu quan trọng)",
            "7. FVG / OB (Khoảng mất cân bằng hoặc Order Block)",
            "8. Entry trigger (Điều kiện kích hoạt lệnh)",
            "9. Invalidation (Mốc Stop Loss vô hiệu hóa luận điểm)",
            "10. Target (Điểm chốt lời dự kiến)",
            "11. Risk/Reward (Tỷ lệ R:R có tối thiểu 1:2 không)",
            "12. Counter-thesis (Yếu tố phản biện, rủi ro tiềm ẩn)"
        ],
        output_guidelines="Phân loại kết luận rõ ràng thành một trong các mức: [CONFIRMED] | [PARTIALLY CONFIRMED] | [INCONCLUSIVE] | [INVALIDATED] | [NO-TRADE].",
        classification_tags=["setup", "kèo", "ý tưởng", "xem xét long", "xem xét short", "đánh lên", "đánh xuống", "vào lệnh được không", "trade idea", "keo", "y tuong"]
    ),

    3: TradingMethod(
        id=3,
        code="EXISTING_POSITION_REVIEW",
        name="EXISTING POSITION REVIEW (Đánh giá vị thế đang mở / Nhật ký lệnh)",
        description="Đọc dữ liệu lệnh thật trong database và review khách quan quy trình giao dịch (Process).",
        typical_questions=[
            "Xem giúp tôi lệnh này.",
            "Nhận xét lệnh tôi vừa đánh.",
            "Lệnh này tôi sai ở đâu?",
            "Tôi đang Long, đánh giá giúp.",
            "Tôi đang giữ lệnh này có vấn đề gì?",
            "Lệnh tôi vừa dính SL, phân tích lý do."
        ],
        required_analysis=[
            "Entry, Direction (LONG/SHORT), Quantity, Position Value",
            "Leverage (Đòn bẩy), Margin (Ký quỹ)",
            "Stop Loss (SL), Take Profit (TP), Current PnL",
            "Entry Context, HTF Context, Liquidity Sweep",
            "Entry Trigger, Trade Management, MFE, MAE"
        ],
        output_guidelines="Tách biệt rõ ràng 5 phần:\n1. WHAT WAS DONE WELL (Điểm làm tốt)\n2. WHAT WAS WRONG (Điểm sai sót kỹ thuật)\n3. WHAT WAS MISSING (Yếu tố còn thiếu sót)\n4. WHAT CHANGED AFTER ENTRY (Bối cảnh thay đổi sau khi vào lệnh)\n5. WHAT SHOULD HAVE INVALIDATED THE TRADE\n⚠️ Phán xét quy trình giao dịch (Process), tuyệt đối không phán xét cá nhân trader.",
        classification_tags=[
            "xem lệnh", "lệnh của tôi", "lệnh của em", "lệnh của mình",
            "vị thế của tôi", "vị thế đang mở", "lệnh đang mở", "lệnh này",
            "đang gồng", "đang lỗ", "đang lãi", "đang âm", "đang dương",
            "dính sl", "cắt lỗ không", "sai ở đâu", "đánh giá lệnh", "review lệnh",
            "lenh cua toi", "lenh nay", "dang gong", "dang lo", "dang lai",
            "dang am", "dang duong", "dinh sl", "sai o dau", "danh gia lenh"
        ]
    ),

    4: TradingMethod(
        id=4,
        code="ICT_SMC_CONCEPT",
        name="ICT / SMC CONCEPT QUESTION (Giải thích khái niệm chuyên sâu)",
        description="Giải thích các khái niệm Smart Money Concepts theo cấu trúc sư phạm chuẩn mực.",
        typical_questions=[
            "MSS là gì?",
            "FVG này có hợp lệ không?",
            "Liquidity sweep là gì?",
            "Order Block này có valid không?",
            "Breaker khác Order Block thế nào?",
            "Khi nào FVG được coi là valid?",
            "Sweep và breakout khác nhau thế nào?"
        ],
        required_analysis=[
            "Định nghĩa kỹ thuật chính xác",
            "Điều kiện cấu thành hợp lệ",
            "Dấu hiệu xác nhận trên thị trường thực tế",
            "Mối tương quan với dòng tiền lớn (Smart Money)"
        ],
        output_guidelines="Tuân thủ cấu trúc chuẩn:\nCONCEPT → DEFINITION → CONDITIONS → MARKET EVIDENCE → EXAMPLE → COUNTER-EXAMPLE → COMMON MISTAKE.\n⚠️ Tuyệt đối không coi một concept là chân lý tuyệt đối 100% của thị trường.",
        classification_tags=[
            "giải thích khái niệm", "giai thich khai niem",
            "khái niệm ict", "khái niệm smc", "định nghĩa ict", "định nghĩa smc",
            "khái niệm fvg", "khai niem fvg", "khái niệm fair value gap",
            "fvg là gì", "fvg la gi", "fair value gap là gì",
            "order block là gì", "ob là gì", "breaker block là gì",
            "mss là gì", "bos là gì", "choch là gì", "liquidity sweep là gì",
            "khác nhau thế nào", "khac nhau the nao",
            "fvg", "order block", "ob", "breaker block", "breaker",
            "mss", "bos", "choch", "bsl", "ssl", "bpr", "ifvg", "liquidity sweep",
            "khai niem ict", "khai niem smc"
        ]
    ),

    5: TradingMethod(
        id=5,
        code="PRICE_ACTION_QUESTION",
        name="PRICE ACTION QUESTION (Hành động giá truyền thống & Nến)",
        description="Phân tích tương tác giữa người mua và người bán qua nến, khối lượng và mô hình giá.",
        typical_questions=[
            "Nến Pin bar này có đảo chiều không?",
            "Inside bar trade thế nào?",
            "Fakeout đỉnh nhận biết sao?",
            "Volume tăng mà giá không chạy (Absorption) nghĩa là gì?"
        ],
        required_analysis=[
            "Cấu tạo nến (Thân nến vs Râu nến)",
            "Vị trí xuất hiện của nến (Tại cản hay lưng chừng sóng)",
            "Khối lượng giao dịch (Volume xác nhận)",
            "Động lượng giá (Momentum)"
        ],
        output_guidelines="• Phân tích hành vi cung cầu ẩn sau hình dáng cây nến.\n• Chỉ ra cạm bẫy bẫy giá (Trap/Absorption) thường gặp.",
        classification_tags=[
            "nến pinbar", "nen pinbar", "pinbar", "pin bar", "inside bar",
            "cây nến", "râu nến", "thân nến", "nến đảo chiều", "mô hình nến",
            "nến rút chân", "nến nhấn chìm", "nến hammer", "đảo chiều tại cản",
            "dao chieu tai can", "kháng cự", "hỗ trợ", "hỗ trợ kháng cự",
            "hành động giá", "price action", "cay nen", "rau nen", "than nen",
            "nen dao chieu", "mo hinh nen", "nen rut chan", "candlestick", "nen nhat"
        ]
    ),

    6: TradingMethod(
        id=6,
        code="ENTRY_ANALYSIS",
        name="ENTRY ANALYSIS (Đánh giá điểm vào lệnh)",
        description="Thẩm định vị trí và thời điểm bấm nút vào lệnh, xác định xem có bị FOMO hay sớm quá không.",
        typical_questions=[
            "Entry này có đẹp không?",
            "Tại sao vào ở đây?",
            "Entry của tôi có quá sớm không?",
            "Có nên chờ confirmation không?",
            "Nên vào Limit ở FVG hay vào Market khi có MSS?"
        ],
        required_analysis=[
            "Liquidity, POI, Displacement, MSS, FVG",
            "Entry trigger (Tín hiệu kích hoạt)",
            "Vị trí Premium / Discount",
            "HTF alignment (Độ đồng thuận khung lớn)",
            "Distance to invalidation (Khoảng cách tới SL)",
            "Distance to target (Khoảng cách tới TP)"
        ],
        output_guidelines="Xác định rõ loại Entry:\n• [EARLY ENTRY] - Vào quá sớm khi chưa có nến xác nhận.\n• [CONFIRMED ENTRY] - Điểm vào chuẩn bài có đầy đủ tín hiệu.\n• [LATE ENTRY] - Vào trễ, giá đã đi xa POI.\n• [CHASE ENTRY] - Đuổi giá vì FOMO.\n• [NO VALID ENTRY] - Chưa có điểm vào hợp lệ.",
        classification_tags=["entry", "vào ở đâu", "vào giá nào", "vào sớm", "limit hay market", "điểm vào", "chờ confirmation", "diem vao", "vao som"]
    ),

    7: TradingMethod(
        id=7,
        code="EXIT_ANALYSIS",
        name="EXIT ANALYSIS (Điểm thoát lệnh & Take Profit)",
        description="Xác định vùng chốt lời tối ưu dựa trên thanh khoản đối ứng và cơ cấu thị trường.",
        typical_questions=[
            "TP này đặt được không?",
            "Tôi nên thoát ở đâu?",
            "Tại sao lệnh đang lời lại quay về SL?",
            "Tôi chốt lời quá sớm không?",
            "Nên chốt một phần (Partial TP) ở đâu?"
        ],
        required_analysis=[
            "Target liquidity (BSL/SSL đối ứng)",
            "Opposing liquidity & POI cản đường",
            "Market structure trên đường đi",
            "MFE (Maximum Favorable Excursion) & MAE",
            "Tỷ lệ Risk:Reward thực tế",
            "Exit timing (Thời điểm thoát lệnh)"
        ],
        output_guidelines="• Không khuyến nghị TP cố định nếu thiếu dữ liệu cản thanh khoản.\n• Khuyến khích chiến lược bảo toàn vốn: Chốt 50% tại cản đầu tiên và dời SL về BE.",
        classification_tags=["tp", "take profit", "chốt lời", "chốt ở đâu", "thoát lệnh", "chốt non", "đặt tp", "chot loi", "thoat lenh", "chot non"]
    ),

    8: TradingMethod(
        id=8,
        code="LIQUIDITY_ANALYSIS",
        name="LIQUIDITY ANALYSIS (Phân tích thanh khoản thị trường)",
        description="Định vị các bể thanh khoản (Liquidity Pools), xác định vùng săn thanh khoản của Smart Money.",
        typical_questions=[
            "Liquidity nằm ở đâu?",
            "Giá sẽ sweep vùng nào?",
            "Đây có phải liquidity sweep không?",
            "BSL và SSL nằm ở đâu?",
            "Equal Highs (EQH) này có bị quét không?"
        ],
        required_analysis=[
            "Previous Day High (PDH) / Previous Day Low (PDL)",
            "Previous Week High (PWH) / Previous Week Low (PWL)",
            "Equal Highs (EQH) / Equal Lows (EQL)",
            "Swing Highs / Swing Lows",
            "Session High / Low (Phiên Á, Âu, Mỹ)",
            "Internal Liquidity vs External Liquidity"
        ],
        output_guidelines="Với mỗi mốc thanh khoản quan trọng, làm rõ:\n- TẠI SAO NÓ LÀ THANH KHOẢN (Why it qualifies)\n- TRẠNG THÁI HIỆN TẠI: Đã bị sweep chưa? Bị từ chối (Rejected) hay đục thủng tiếp diễn (Continuation)?",
        classification_tags=["liquidity", "thanh khoản", "sweep", "quét đáy", "quét đỉnh", "bsl", "ssl", "eqh", "eql", "pdh", "pdl", "thanh khoan", "quet day"]
    ),

    9: TradingMethod(
        id=9,
        code="MARKET_STRUCTURE_ANALYSIS",
        name="MARKET STRUCTURE ANALYSIS (Cấu trúc thị trường & Chuyển pha)",
        description="Nhận diện cấu trúc Swing, cấu trúc nội bộ (Internal) và các bước chuyển đổi pha thị trường.",
        typical_questions=[
            "Market structure hiện tại là gì?",
            "Đây có phải BOS không?",
            "Đây có phải MSS không?",
            "Trend đã đảo chiều chưa?",
            "Cần thân nến đóng qua cản hay chỉ cần râu nến là tính MSS?"
        ],
        required_analysis=[
            "Swing High / Swing Low",
            "Higher Highs (HH), Higher Lows (HL), Lower Highs (LH), Lower Lows (LL)",
            "Break of Structure (BOS - Tiếp diễn)",
            "Market Structure Shift (MSS - Đảo chiều) / CHOCH",
            "Displacement (Nến bứt phá có thân dài, dứt khoát)"
        ],
        output_guidelines="• Tuyệt đối không kết luận đảo chiều cấu trúc chỉ dựa vào một cây nến đơn lẻ khi thiếu ngữ cảnh tổng thể.\n• Yêu cầu nến đóng cửa (Body close) qua swing point để xác nhận độ tin cậy của BOS/MSS.",
        classification_tags=["cấu trúc", "market structure", "bos", "mss", "choch", "hh", "hl", "lh", "ll", "đảo chiều xu hướng", "cau truc", "chuyen pha"]
    ),

    10: TradingMethod(
        id=10,
        code="FVG_ORDER_BLOCK_ANALYSIS",
        name="FVG / ORDER BLOCK ANALYSIS (Bóc tách khối nến & Vùng mất cân bằng)",
        description="Đánh giá chất lượng và độ fresh của Fair Value Gap và Order Block để làm căn cứ vào lệnh.",
        typical_questions=[
            "FVG này có valid không?",
            "FVG này còn dùng được không?",
            "Order Block này có đáng tin không?",
            "Giá đã mitigate FVG chưa?",
            "IFVG (Inversion FVG) dùng khi nào?"
        ],
        required_analysis=[
            "FVG: Khung thời gian, chuỗi 3 cây nến, biên trên/dưới, nến Displacement, bối cảnh thanh khoản trước đó, tình trạng Mitigation.",
            "Order Block: Nguồn gốc hình thành, cú Displacement sau đó, sự kiện quét thanh khoản trước đó, tương quan cấu trúc, mốc vô hiệu hóa."
        ],
        output_guidelines="• Không bao giờ nhận định một FVG hoặc OB là hợp lệ chỉ vì mắt thường nhìn thấy mô hình nến.\n• Phải chứng minh nó có sự tham gia của Smart Money (Displacement + Quét thanh khoản).",
        classification_tags=["fvg", "fair value gap", "order block", "ob", "breaker block", "mitigate", "ifvg", "mất cân bằng", "mat can bang"]
    ),

    # ------------------ 11-20: ĐA KHUNG, QUẢN TRỊ VỐN & THẨM ĐỊNH LỆNH ------------------
    11: TradingMethod(
        id=11,
        code="MULTI_TIMEFRAME_ANALYSIS",
        name="MULTI-TIMEFRAME ANALYSIS (Phân tích đa khung thời gian)",
        description="Phối hợp nhịp nhàng giữa khung lớn (HTF), khung trung (MTF) và khung nhỏ (LTF).",
        typical_questions=[
            "1H bullish nhưng 5m bearish thì sao?",
            "HTF và LTF đang ngược nhau thì theo khung nào?",
            "Khung nào nên ưu tiên?",
            "Khung D1 đang giảm nhưng H1 đang tăng mạnh thì đánh sao?"
        ],
        required_analysis=[
            "HTF (Daily / H4) → Xác định Bối cảnh (Context) & Thiên hướng chính (Bias)",
            "MTF (H1) → Xác định Cấu trúc thị trường & Vùng POI giá trị",
            "LTF (M15 / M5 / M1) → Xác định Điểm kích hoạt vào lệnh (Execution) & Bóp SL"
        ],
        output_guidelines="• Giải thích rõ xung đột giữa các khung: LTF chỉ là sóng hồi (Retracement) về vùng Discount của HTF hay là đảo chiều thực sự.\n• Không tự ý ưu tiên một khung mà không giải thích lý do logic.",
        classification_tags=["đa khung", "htf", "ltf", "khung h1", "khung h4", "khung 5m", "ngược khung", "multi-timeframe", "da khung"]
    ),

    12: TradingMethod(
        id=12,
        code="RISK_MANAGEMENT",
        name="RISK MANAGEMENT (Quản trị rủi ro & Luật thi Quỹ Prop Firm)",
        description="Bảo vệ vốn tài khoản, kiểm soát mức drawdown và quản trị tỷ lệ Risk:Reward nghiêm ngặt.",
        typical_questions=[
            "Tôi nên risk bao nhiêu?",
            "SL đặt thế nào cho an toàn?",
            "Lệnh này risk bao nhiêu là hợp lý?",
            "RR có ổn không?",
            "Đòn bẩy 20x có nguy hiểm không?",
            "Đang thi quỹ drawdown ngày còn 1.5% thì làm sao?"
        ],
        required_analysis=[
            "Account Equity / Balance (Vốn tài khoản)",
            "Risk % (Mức chịu lỗ tối đa 1% - 2%)",
            "Risk Amount ($ chịu rủi ro)",
            "Entry & Stop Loss khoảng cách",
            "Position Size & Position Value",
            "Margin & Leverage",
            "Tỷ lệ Risk:Reward (R:R)"
        ],
        output_guidelines="Luôn phân biệt rạch ròi 4 khái niệm:\n1. KÝ QUỸ (Margin)\n2. GIÁ TRỊ VỊ THẾ (Position Value)\n3. SỐ TIỀN CHỊU RỦI RO THỰC TẾ (Capital at Risk)\n4. ĐÒN BẨY (Leverage)\n⚠️ Nghiêm cấm gồng lỗ vượt quá kế hoạch ban đầu.",
        classification_tags=["risk", "rủi ro", "quản trị vốn", "quỹ", "drawdown", "đòn bẩy", "sl đặt", "cháy tài khoản", "bảo toàn vốn", "rui ro", "quan tri von"]
    ),

    13: TradingMethod(
        id=13,
        code="POSITION_SIZING",
        name="POSITION SIZING (Tính toán khối lượng vào lệnh chuẩn xác)",
        description="Tính toán số lot hoặc số lượng token/cổ phiếu chính xác dựa trên khoảng dừng lỗ (SL).",
        typical_questions=[
            "Tôi có $5,000 thì đánh bao nhiêu?",
            "Muốn risk 1% thì vào bao nhiêu?",
            "Dùng 100% vốn thì position bao nhiêu?",
            "10x leverage thì quantity bao nhiêu?",
            "SL 25 pip vàng thì đi bao nhiêu Lot?"
        ],
        required_analysis=[
            "Account Balance (Số dư)",
            "Risk Percentage (Thường 1% hoặc 2%)",
            "Khoảng cách giá: |Entry - Stop Loss|",
            "Contract / Asset Specification (Tick value, Lot size)"
        ],
        output_guidelines="Áp dụng công thức chuẩn mực:\n• Risk Amount ($) = Balance * Risk%\n• Position Size = Risk Amount / |Entry - SL|\n⚠️ Không bao giờ tính khối lượng vào lệnh chỉ dựa trên mỗi tỷ lệ đòn bẩy.",
        classification_tags=["position size", "khối lượng", "bao nhiêu lot", "vào bao nhiêu", "tính volume", "lot size", "khoi luong", "bao nhieu lot"]
    ),

    14: TradingMethod(
        id=14,
        code="TRADE_MANAGEMENT",
        name="TRADE MANAGEMENT (Quản lý lệnh trong lúc lệnh đang chạy)",
        description="Xử lý lệnh đang mở: Dời Stop Loss về hòa vốn (BE), trailing stop, chốt lời từng phần.",
        typical_questions=[
            "Đang lời thì làm gì?",
            "Có nên dời SL về BE không?",
            "Có nên trailing stop không?",
            "Giá chưa tới TP nhưng structure đổi thì sao?",
            "Tin tức sắp ra có nên đóng lệnh trước không?"
        ],
        required_analysis=[
            "Luận điểm vào lệnh ban đầu (Original thesis)",
            "Cấu trúc giá hiện tại (Current structure)",
            "Thanh khoản trên đường đi",
            "MFE (Lợi nhuận cao nhất đạt được)",
            "Remaining target (Khoảng cách còn lại tới TP)",
            "Mốc vô hiệu hóa mới"
        ],
        output_guidelines="Tách bạch rõ ràng:\n• KẾ HOẠCH TRƯỚC ENTRY (Plan before entry)\nvới\n• QUYẾT ĐỊNH SAU KHI VÀO LỆNH (Decision after entry)\nChỉ dời SL về BE khi giá đã tạo đỉnh/đáy mới thuận chiều và bứt phá qua cấu trúc.",
        classification_tags=["quản lý lệnh", "đang lời", "dời sl", "về be", "trailing stop", "tin tức", "gần tp", "đóng lệnh sớm", "quan ly lenh", "dang loi", "doi sl"]
    ),

    15: TradingMethod(
        id=15,
        code="TRADE_JOURNAL_REVIEW",
        name="TRADE JOURNAL REVIEW (Đánh giá nhật ký & Hành vi giao dịch)",
        description="Phân tích lịch sử giao dịch tổng thể để tìm ra thói quen xấu, điểm mù tâm lý và thế mạnh của trader.",
        typical_questions=[
            "Tổng hợp các lệnh của tôi.",
            "Tôi thường sai ở đâu?",
            "Tôi có pattern gì xấu?",
            "Tại sao tôi thua nhiều?",
            "Tôi có vào lệnh quá sớm không?",
            "Thống kê hiệu quả theo phiên giao dịch của tôi."
        ],
        required_analysis=[
            "Entry timing (Thời điểm vào)",
            "Setup type (Loại mô hình)",
            "Direction (Tỷ lệ Long vs Short)",
            "HTF alignment (Đánh thuận hay ngược trend)",
            "Hành vi dời SL / cắn SL / gồng lỗ",
            "Win rate & Tỷ lệ R trung bình theo phiên (Á, Âu, Mỹ)"
        ],
        output_guidelines="• Chỉ chỉ ra khuôn mẫu hành vi (Pattern) khi có đủ mẫu lệnh trong lịch sử (từ 5-10 lệnh trở lên).\n• Không quy kết thói quen chỉ từ 1 hoặc 2 lệnh ngẫu nhiên.",
        classification_tags=["nhật ký", "tổng hợp lệnh", "thường sai", "thói quen xấu", "thua nhiều", "review lệnh lịch sử", "báo cáo tài khoản", "nhat ky", "tong hop lenh"]
    ),

    16: TradingMethod(
        id=16,
        code="BACKTEST_ANALYSIS",
        name="BACKTEST / HISTORICAL ANALYSIS (Dữ liệu thống kê & Lợi thế chiến lược Edge)",
        description="Đánh giá tính hiệu quả của một chiến lược dựa trên dữ liệu quá khứ thực tế.",
        typical_questions=[
            "Setup này win rate bao nhiêu?",
            "ICT setup này có hiệu quả không?",
            "Backtest 100 lệnh cho tôi.",
            "Strategy này có edge không?",
            "Đánh FVG khung M15 tỷ lệ thắng thế nào?"
        ],
        required_analysis=[
            "Sample Size (Cỡ mẫu dữ liệu)",
            "Period (Khoảng thời gian kiểm thử)",
            "Setup definition (Quy chuẩn định nghĩa setup cụ thể)",
            "Wins, Losses, Win rate %",
            "Average R, Median R",
            "Max Drawdown (Độ sụt giảm tài khoản lớn nhất)",
            "Phí giao dịch (Fees) & Slippage"
        ],
        output_guidelines="• Đòi hỏi mẫu dữ liệu thực tế được ghi nhận.\n• TUYỆT ĐỐI KHÔNG BAO GIỜ bịa đặt số liệu thống kê hoặc cam kết tỷ lệ thắng ảo tưởng.",
        classification_tags=["backtest", "win rate", "tỷ lệ thắng", "hiệu quả không", "edge", "thống kê lịch sử", "ty le thang"]
    ),

    17: TradingMethod(
        id=17,
        code="BAR_REPLAY_ANALYSIS",
        name="BAR REPLAY ANALYSIS (Tái hiện nến lịch sử & Ra quyết định theo thời gian thực)",
        description="Phân tích tình huống tại một cây nến cụ thể mà không sử dụng thông tin của tương lai.",
        typical_questions=[
            "Ở cây nến này tôi nên làm gì?",
            "Nếu quay lại thời điểm này thì setup có hợp lệ không?",
            "Tại thời điểm đó có đủ confirmation chưa?"
        ],
        required_analysis=[
            "Chỉ dùng dữ liệu có sẵn TRƯỚC cây nến được chọn",
            "Loại bỏ hoàn toàn thiên kiến tương lai (No Hindsight Bias)",
            "Xác định xem tại thời điểm đó có đủ điều kiện vào lệnh không"
        ],
        output_guidelines="Tách bạch rạch ròi 2 phần:\n1. INFORMATION AVAILABLE THEN (Thông tin có sẵn tại thời điểm đó)\n2. OUTCOME KNOWN NOW (Kết quả thị trường đã chạy sau đó)\nĐánh giá xem quyết định lúc đó có đúng quy trình không, bất kể kết quả thắng hay thua.",
        classification_tags=["bar replay", "cây nến này", "lúc đó", "thời điểm đó", "replay", "tua lại", "cay nen nay", "luc do"]
    ),

    18: TradingMethod(
        id=18,
        code="SETUP_COMPARISON",
        name="SETUP COMPARISON (So sánh các trường phái & Setup đối nghịch)",
        description="So sánh khách quan ưu - nhược điểm giữa các phong cách (ICT vs Price Action, Breakout vs Sweep, v.v.).",
        typical_questions=[
            "Setup A hay B hợp lý hơn?",
            "ICT và Price Action nhìn đoạn này thế nào?",
            "Hai entry này khác nhau ở đâu?",
            "Wyckoff và SMC khác nhau chỗ nào?",
            "Nên đánh Breakout hay đánh Sweep?"
        ],
        required_analysis=[
            "So sánh: Context, Liquidity, Structure, Confirmation, Risk, Invalidation, Target, Execution quality"
        ],
        output_guidelines="• Không tuyên bố một trường phái nào là kẻ chiến thắng tuyệt đối.\n• Phân tích sự đánh đổi (Trade-offs): Tỷ lệ thắng (Win rate) vs Tỷ lệ Risk:Reward (R:R) vs Tần suất xuất hiện setup.",
        classification_tags=["so sánh", "khác nhau", "ict hay price action", "setup nào hơn", "breakout hay sweep", "wyckoff", "so sanh", "khac nhau"]
    ),

    19: TradingMethod(
        id=19,
        code="LEARNING_EDUCATIONAL",
        name="LEARNING / EDUCATIONAL QUESTION (Đào tạo & Hướng dẫn phương pháp)",
        description="Giáo trình hướng dẫn cho học viên từ cơ bản đến nâng cao với ví dụ minh họa và bài tập thực hành.",
        typical_questions=[
            "Giải thích FVG cho người mới.",
            "Dạy tôi MSS.",
            "Tại sao cần liquidity?",
            "ICT khác Price Action thế nào?",
            "Lộ trình học trading cho người mới bắt đầu."
        ],
        required_analysis=[
            "Khái niệm dễ hiểu",
            "Định nghĩa kỹ thuật",
            "Điều kiện hình thành",
            "Ví dụ minh họa cụ thể",
            "Phản ví dụ & Sai lầm phổ biến",
            "Bài tập thực hành củng cố"
        ],
        output_guidelines="Trình bày mạch lạc, dễ hiểu, dùng ngôn từ sư phạm trực quan, khích lệ tư duy phản biện độc lập của học viên.",
        classification_tags=["dạy tôi", "hướng dẫn", "người mới", "học trading", "lộ trình", "giải thích cho", "bài tập", "day toi", "huong dan", "nguoi moi"]
    ),

    20: TradingMethod(
        id=20,
        code="NO_TRADE_ANALYSIS",
        name="NO-TRADE ANALYSIS (Khuyến nghị KHÔNG vào lệnh / Chờ xác nhận)",
        description="Bảo vệ vốn bằng cách kiên quyết đứng ngoài thị trường khi các điều kiện kỹ thuật chưa hội tụ đủ.",
        typical_questions=[
            "Có nên vào lệnh không?",
            "Long hay Short?",
            "Setup này đánh được không?",
            "Bây giờ bấm Buy hay Sell?"
        ],
        required_analysis=[
            "Kiểm tra xem dữ kiện thị trường có bị thiếu không:",
            "- Khung HTF chưa rõ ràng",
            "- Chưa có sự kiện quét thanh khoản (Liquidity sweep)",
            "- Thiếu tín hiệu chuyển pha cấu trúc (MSS)",
            "- Nến Displacement yếu ớt",
            "- Mốc dừng lỗ Invalidation không rõ ràng",
            "- Tỷ lệ Risk:Reward kém (< 1:1.5)",
            "- Tín hiệu đa khung mâu thuẫn"
        ],
        output_guidelines="KẾT LUẬN RÕ RÀNG:\n👉 **[NO-TRADE / WAIT FOR CONFIRMATION (ĐỨNG NGOÀI CHỜ XÁC NHẬN)]**\nSau đó liệt kê chính xác các điều kiện đang thiếu mà thị trường cần cung cấp thêm trước khi có thể cân nhắc mở vị thế.",
        classification_tags=[
            "có nên vào lệnh", "co nen vao lenh",
            "có nên vào", "co nen vao",
            "long hay short", "buy hay sell",
            "bấm buy hay sell", "bam buy hay sell",
            "đánh được không", "danh duoc khong",
            "vào được chưa", "vao duoc chua",
            "vào lệnh bây giờ", "vao lenh bay gio",
            "có nên mua", "co nen mua",
            "có nên bán", "co nen ban",
            "đứng ngoài", "dung ngoai",
            "đứng ngó", "dung ngo",
            "đứng ngó được chưa", "dung ngo duoc chua",
            "ghê tay", "ghe tay",
            "chờ xác nhận", "cho xac nhan",
            "wait for confirmation", "chưa rõ ràng", "chua ro rang",
            "có nên mở vị thế", "co nen mo vi the",
            "đứng nhìn", "dung nhin"
        ]
    ),

    # ------------------ 21-30: TÂM LÝ, ORDER FLOW, PROFILE & VĨ MÔ ------------------
    21: TradingMethod(
        id=21,
        code="GENERAL_TRADING_PSYCHOLOGY",
        name="GENERAL TRADING QUESTION & PSYCHOLOGY (Tâm lý giao dịch & Kỷ luật)",
        description="Kiểm soát cảm xúc, xử lý tâm lý sợ bỏ lỡ cơ hội (FOMO), giao dịch trả thù (Revenge Trading) và rèn luyện tính kỷ luật.",
        typical_questions=[
            "Tôi bị FOMO thì làm sao?",
            "Sau chuỗi thua tôi muốn gỡ lệnh thì xử lý thế nào?",
            "Làm sao để giữ kỷ luật tuân thủ Stop Loss?",
            "Tâm lý gồng lỗ nhưng chốt non xử lý sao?"
        ],
        required_analysis=[
            "Nguồn gốc cảm xúc (Sợ mất tiền, sợ bỏ lỡ, cái tôi muốn chứng minh mình đúng)",
            "Nguyên tắc Cool-down (Nghỉ ngơi bắt buộc sau 2 lệnh thua liên tiếp)",
            "Tư duy xác suất (Mỗi lệnh chỉ là 1 biến cố ngẫu nhiên trong chuỗi lệnh lớn)",
            "Kế hoạch giao dịch bằng văn bản"
        ],
        output_guidelines="• Nhắc nhở học viên: Một trader thành công không phải là người không bao giờ thua, mà là người không để một lệnh thua phá hủy toàn bộ tài khoản.\n• Hướng dẫn quy trình hạ nhiệt cảm xúc (Cool-down rule).",
        classification_tags=["tâm lý", "fomo", "gỡ gạc", "revenge trading", "kỷ luật", "gồng lỗ chốt non", "chuỗi thua", "sợ hãi", "tham lam", "tam ly", "ky luat"]
    ),

    22: TradingMethod(
        id=22,
        code="ORDER_FLOW_FOOTPRINT",
        name="ORDER FLOW & FOOTPRINT (Dòng lệnh & Biểu đồ Footprint)",
        description="Quan sát lệnh chủ động (Market Orders) tương tác với thanh khoản thụ động (Limit Orders) qua Delta và CVD.",
        typical_questions=[
            "CVD đang phân kỳ thế nào?",
            "Cây nến này có dấu hiệu Delta Absorption không?",
            "Footprint cho thấy ai đang kiểm soát: Buyer hay Seller?",
            "Imbalance mua/bán ở vùng đỉnh này có uy tín không?"
        ],
        required_analysis=[
            "Cumulative Volume Delta (CVD)",
            "Delta Absorption tại các mốc đỉnh/đáy",
            "Imbalance tỷ lệ 3:1 hoặc 4:1 trên Footprint",
            "Trapped Buyers (Người mua kẹt đỉnh) / Trapped Sellers"
        ],
        output_guidelines="Chỉ ra người mua/bán chủ động (Aggressive) vs thụ động (Passive Limit Orders). Không phán đoán nếu thiếu dữ liệu Delta thực tế.",
        classification_tags=[
            "delta cvd", "cumulative volume delta", "delta absorption",
            "khái niệm delta", "khái niệm cvd", "delta cvd là gì",
            "order flow", "footprint", "cvd", "delta", "absorption",
            "imbalance", "dòng lệnh", "trapped traders", "dong lenh"
        ]
    ),

    23: TradingMethod(
        id=23,
        code="VOLUME_PROFILE_AUCTION",
        name="VOLUME PROFILE & AUCTION THEORY (Hồ sơ Khối lượng & Đấu giá Thị trường)",
        description="Định vị vùng chấp nhận giá trị (Value Area) và các mốc thanh khoản tĩnh then chốt.",
        typical_questions=[
            "Vùng POC nằm ở đâu?",
            "Giá đang giao dịch ngoài Value Area (VAH/VAL) thì chiến lược là gì?",
            "Naked POC này có bị hút giá về không?",
            "Vùng LVN (Low Volume Node) có gây trượt giá nhanh không?"
        ],
        required_analysis=[
            "Point of Control (POC) & Naked POC",
            "Value Area High (VAH) / Value Area Low (VAL)",
            "High Volume Node (HVN) vs Low Volume Node (LVN)",
            "Nguyên lý Đấu giá Thị trường (Auction Market Theory)"
        ],
        output_guidelines="Áp dụng quy tắc Đấu giá: Giá di chuyển qua LVN cực nhanh và chững lại tạo tích lũy tại HVN/POC. Đánh giá tính Chấp nhận (Acceptance) hay Từ chối (Rejection).",
        classification_tags=["volume profile", "poc", "vah", "val", "naked poc", "npoc", "market profile", "hvn", "lvn", "value area", "đấu giá", "dau gia"]
    ),

    24: TradingMethod(
        id=24,
        code="SESSION_TIMING_KILLZONES",
        name="SESSION TIMING & KILLZONES (Khung giờ Giao dịch & ICT Killzones)",
        description="Khai thác đặc tính biến động theo phiên: Phiên Á (Range), Phiên Âu (Manipulation), Phiên Mỹ (Expansion).",
        typical_questions=[
            "Bây giờ là mấy giờ rồi em?",
            "Hiện tại là mấy giờ và đang là phiên giao dịch nào?",
            "Phiên London Killzone mở lúc mấy giờ và thường quét đáy Á ra sao?",
            "Cú Judas Swing xảy ra vào thời điểm nào?",
            "New York AM Killzone có đảo chiều không?",
            "Phiên Á đi ngang (Asian Range) hẹp thì phiên Âu sẽ thế nào?"
        ],
        required_analysis=[
            "Real-time clock (Giờ Việt Nam UTC+7, UTC, New York)",
            "Asian Range (00:00 - 06:00 UTC)",
            "London Open Killzone (07:00 - 10:00 UTC)",
            "New York AM Killzone (13:00 - 16:00 UTC) & London Close",
            "Mô hình tích lũy - thao túng - phân phối: AMD (Accumulation - Manipulation - Distribution)"
        ],
        output_guidelines="Nếu học viên hỏi thời gian/giờ giấc, BẮT BUỘC trả lời chuẩn xác theo Giờ Việt Nam (UTC+7), đối chiếu với giờ UTC và phiên giao dịch hiện tại. Khẳng định nguyên lý ICT: 'Time dictates Price' (Thời gian chi phối Giá). KHÔNG tự ý ép quay lại phân tích biểu đồ nếu học viên không hỏi mã cụ thể.",
        classification_tags=[
            "killzone", "phiên á", "phiên âu", "phiên mỹ", "asian range", "london open", "judas swing", 
            "new york open", "amd", "phien a", "phien au", "phien my",
            "mấy giờ", "may gio", "mấy giờ rồi", "may gio roi", "mấy giờ rồi em", "may gio roi em",
            "bây giờ là mấy giờ", "bay gio la may gio", "mấy giờ vậy", "may gio vay", "giờ mấy giờ", "gio may gio",
            "thời gian", "thoi gian", "giờ hiện tại", "gio hien tai", "phiên nào", "phien nao",
            "hôm nay ngày mấy", "hom nay ngay may", "hôm nay thứ mấy", "hom nay thu may",
            "giờ mở cửa", "gio mo cua", "giờ đóng cửa", "gio dong cua", "giờ giao dịch", "gio giao dich"
        ]
    ),

    25: TradingMethod(
        id=25,
        code="NEWS_MACRO_FUNDAMENTALS",
        name="NEWS & MACRO FUNDAMENTALS (Giao dịch Tin tức & Phân tích Vĩ mô)",
        description="Đánh giá tác động của dữ liệu kinh tế vĩ mô đến thanh khoản, tỷ giá và khẩu vị rủi ro toàn cầu.",
        typical_questions=[
            "Tin CPI tối nay công bố thì nên xử lý lệnh thế nào?",
            "NFP tăng mạnh tác động gì đến Vàng và DXY?",
            "FOMC tăng/giảm lãi suất ảnh hưởng ra sao?",
            "Có nên giữ lệnh qua tin tức đỏ (High impact news) không?"
        ],
        required_analysis=[
            "Sự kiện kinh tế trọng điểm (CPI, NFP, FOMC Rate Decision, Core PCE)",
            "Độ lệch giữa Thực tế (Actual) vs Dự báo (Forecast) vs Kỳ trước (Previous)",
            "Tác động liên đới tới Chỉ số DXY và Lợi suất Trái phiếu Mỹ US10Y",
            "Khẩu vị rủi ro toàn cầu: Risk-On vs Risk-Off"
        ],
        output_guidelines="Tuyệt đối ưu tiên bảo toàn vốn: Không khuyến nghị đánh bạc đoán tin; nên đóng hoặc dời SL về BE trước tin đỏ, chờ nến quét 2 đầu ổn định rồi mới giao dịch theo cấu trúc sau tin.",
        classification_tags=["tin tức", "cpi", "nfp", "fomc", "lãi suất", "fed", "bản tin", "non farm", "vĩ mô", "kinh tế", "high impact", "tin tuc", "lai suat", "vi mo"]
    ),

    26: TradingMethod(
        id=26,
        code="WYCKOFF_METHODOLOGY",
        name="WYCKOFF METHODOLOGY (Phương pháp Wyckoff Cổ điển)",
        description="Giải mã chu kỳ Tích lũy (Accumulation) và Phân phối (Distribution) của dòng tiền thông minh Composite Man.",
        typical_questions=[
            "Đoạn này đang là Tích lũy (Accumulation) hay Phân phối (Distribution)?",
            "Cú Spring ở Phase C này có đáng tin không?",
            "Upthrust After Distribution (UTAD) nhận biết sao?",
            "Sign of Strength (SOS) đã xuất hiện chưa?"
        ],
        required_analysis=[
            "5 Pha Wyckoff (Phase A đến Phase E)",
            "Các sự kiện cơ bản: SC (Selling Climax), AR, ST, Spring / Shakeout, UTAD",
            "Dấu hiệu SOS (Sign of Strength) / SOW (Sign of Weakness)",
            "Quy luật Nỗ lực vs Kết quả (Volume vs Spread nến)"
        ],
        output_guidelines="Định vị giai đoạn cụ thể của pha thị trường; chỉ khuyến nghị mở vị thế sau khi đã có cú Spring (Phase C) hoặc cú Breakout kèm theo LPS/BU xác nhận (Phase D).",
        classification_tags=["wyckoff", "tích lũy", "phân phối", "accumulation", "distribution", "spring", "utad", "selling climax", "sos", "sow", "tich luy", "phan phoi"]
    ),

    27: TradingMethod(
        id=27,
        code="CORRELATION_INTERMARKET",
        name="CORRELATION & INTERMARKET (Tương quan Liên thị trường)",
        description="Phân tích dòng luân chuyển vốn giữa Tiền tệ (DXY), Trái phiếu (US10Y), Hàng hóa (Vàng/Dầu) và Chứng khoán/Crypto.",
        typical_questions=[
            "DXY tăng thì Vàng và EURUSD giảm đúng không?",
            "Tại sao BTC lại chạy theo chỉ số Nasdaq (NDX)?",
            "Lợi suất trái phiếu US10Y tăng mạnh ảnh hưởng gì đến cổ phiếu?",
            "Mối tương quan nghịch giữa Dầu và các cặp tiền tệ."
        ],
        required_analysis=[
            "Chỉ số Sức mạnh Đồng USD (DXY)",
            "Lợi suất Trái phiếu Chính phủ Mỹ 10 năm (US10Y)",
            "Hệ số tương quan thuận/nghịch (+1 đến -1)",
            "Hiện tượng phân kỳ tương quan (Decoupling) khi có thiên nga đen"
        ],
        output_guidelines="Sử dụng DXY và US10Y làm la bàn định hướng cho các tài sản định giá bằng USD (Vàng, Crypto, Ngoại hối).",
        classification_tags=["tương quan", "liên thị trường", "dxy", "us10y", "trái phiếu", "nasdaq", "sp500", "vàng và usd", "correlation", "decoupling", "tuong quan"]
    ),

    28: TradingMethod(
        id=28,
        code="FIBONACCI_OTE",
        name="FIBONACCI & OPTIMAL TRADE ENTRY (Fibonacci & Vùng OTE)",
        description="Đo lường nhịp sóng hồi (Discount) và xác định mục tiêu mở rộng dựa trên các tỷ lệ vàng Fibonacci.",
        typical_questions=[
            "Vùng OTE 0.62 - 0.79 của con sóng này nằm ở mốc giá nào?",
            "Mức Fibonacci 0.5 (Equilibrium) có giữ được giá không?",
            "Target mở rộng Fib -0.27 và -0.62 đặt ở đâu?",
            "Kéo Fibonacci từ đỉnh râu hay thân nến?"
        ],
        required_analysis=[
            "Dealing Range (Khoảng giá từ Swing Low đến Swing High)",
            "Mốc cân bằng Equilibrium (0.5)",
            "Vùng OTE (0.618 - 0.705 - 0.786)",
            "Các mốc Extension chốt lời (-0.27, -0.62)"
        ],
        output_guidelines="Không sử dụng Fibonacci độc lập; bắt buộc vùng OTE phải hợp lưu (Confluence) với một POI cụ thể (FVG, Order Block hoặc Breaker Block).",
        classification_tags=["fibonacci", "fibo", "ote", "optimal trade entry", "0.618", "0.786", "0.705", "equilibrium", "dealing range", "fib thoai lui"]
    ),

    29: TradingMethod(
        id=29,
        code="DIVERGENCE_MOMENTUM",
        name="DIVERGENCE & MOMENTUM (Phân kỳ Động lượng RSI / MACD)",
        description="Phát hiện sự đuối sức của xu hướng và cảnh báo sớm khả năng đảo chiều qua phân kỳ chỉ báo.",
        typical_questions=[
            "RSI đang phân kỳ đỉnh (Bearish Divergence) thì có nên Short không?",
            "Phân kỳ ẩn (Hidden Divergence) tiếp diễn xu hướng nhận biết sao?",
            "MACD Histogram cạn kiệt báo hiệu điều gì?",
            "Phân kỳ nhiều đoạn có bị bẻ không?"
        ],
        required_analysis=[
            "Phân kỳ thường (Regular Divergence - Báo hiệu đảo chiều)",
            "Phân kỳ ẩn (Hidden Divergence - Báo hiệu tiếp diễn xu hướng)",
            "Chỉ báo RSI / MACD / Stochastic Oscillator",
            "Cấu trúc nến và bối cảnh cản thanh khoản tại thời điểm phân kỳ"
        ],
        output_guidelines="Cảnh báo: Phân kỳ chỉ báo không phải là lý do để vào lệnh ngay; bắt buộc phải chờ nến đảo chiều hoặc quét thanh khoản xác nhận.",
        classification_tags=["phân kỳ", "divergence", "rsi", "macd", "động lượng", "momentum", "phân kỳ ẩn", "hidden divergence", "bearish divergence", "phan ky"]
    ),

    30: TradingMethod(
        id=30,
        code="CHART_PATTERNS",
        name="CHART PATTERNS & QUASIMODO (Mô hình Giá Cổ điển & Quasimodo)",
        description="Bóc tách hành vi thị trường ẩn sau các mô hình giá kinh điển và mô hình Smart Money Quasimodo (QM).",
        typical_questions=[
            "Mô hình Vai Đầu Vai (Head & Shoulders) này có chuẩn không?",
            "Quasimodo (QM Level) khác Vai Đầu Vai ở chỗ nào?",
            "Mô hình 2 đỉnh 2 đáy (Double Top/Bottom) hay bị bẫy quét thanh khoản ra sao?",
            "Cờ tăng (Bull Flag) đánh thế nào?"
        ],
        required_analysis=[
            "Cấu tạo mô hình, Đường viền cổ (Neckline)",
            "Quasimodo Level (QML - Đỉnh cũ bị quét thanh khoản tạo MSS)",
            "Vùng thanh khoản bẫy (Liquidity trap) của mô hình 2 đỉnh/đáy",
            "Tỷ lệ đo lường mục tiêu (Measured Move Target)"
        ],
        output_guidelines="Giải thích bản chất thanh khoản: 2 đỉnh/2 đáy thường là bẫy thanh khoản (EQH/EQL) được tạo ra để dụ trader vào lệnh rồi Smart Money quét sạch.",
        classification_tags=["mô hình giá", "vai đầu vai", "head and shoulders", "quasimodo", "qml", "2 đỉnh", "2 đáy", "double top", "cờ tăng", "tam giác", "mo hinh gia", "vai dau vai"]
    ),

    # ------------------ 31-40: PHÁI SINH, SMT, THI QUỸ, BREAKOUT & SCALPING ------------------
    31: TradingMethod(
        id=31,
        code="SMT_DIVERGENCE",
        name="SMT DIVERGENCE (Smart Money Technique - Phân kỳ Liên tài sản)",
        description="So sánh hành vi tạo đỉnh/đáy giữa 2 tài sản tương quan mật thiết để tìm dấu vết của Dòng tiền lớn.",
        typical_questions=[
            "SMT Divergence giữa ES và NQ nhận biết sao?",
            "BTC vượt đỉnh nhưng ETH không vượt đỉnh thì báo hiệu điều gì?",
            "EURUSD tạo đáy mới nhưng GBPUSD từ chối tạo đáy mới có phải SMT không?"
        ],
        required_analysis=[
            "Cặp tài sản liên kết: ES (S&P500) vs NQ (Nasdaq), BTC vs ETH, EURUSD vs GBPUSD",
            "Sự kiện Failure Swing: Một tài sản sweep đỉnh/đáy trong khi tài sản kia từ chối tạo đỉnh/đáy mới",
            "Xác định tài sản dẫn dắt (Sponsorship)"
        ],
        output_guidelines="Đánh giá SMT là một trong những tín hiệu xác nhận đảo chiều có xác suất cao nhất trong hệ thống ICT.",
        classification_tags=["smt", "smt divergence", "smart money technique", "es nq", "btc eth", "eur gbp", "phân kỳ tương quan", "failure swing"]
    ),

    32: TradingMethod(
        id=32,
        code="PROP_FIRM_EVALUATION",
        name="PROP FIRM EVALUATION (Chiến lược Vượt qua Thử thách Quỹ)",
        description="Quy chuẩn quản lý vốn và nhịp độ giao dịch để vượt qua vòng đánh giá quỹ (FTMO, MFF, Topstep).",
        typical_questions=[
            "Đang thi Quỹ Phase 1 còn thiếu 3% profit thì nên đánh volume bao nhiêu?",
            "Luật Max Daily Loss 5% tính theo Balance hay Equity?",
            "Làm sao tránh dính Trailing Drawdown của quỹ?",
            "Chiến lược giữ lệnh qua đêm/qua tuần khi thi quỹ."
        ],
        required_analysis=[
            "Mục tiêu lợi nhuận (Profit Target: 8% Phase 1, 5% Phase 2)",
            "Mức sụt giảm tối đa trong ngày (Daily Drawdown) & Tổng sụt giảm (Max Drawdown)",
            "Quy tắc nhất quán (Consistency Rule)",
            "Chế độ bảo toàn số dư (Capital preservation mode)"
        ],
        output_guidelines="Đặt ưu tiên Sống sót (Survival) lên hàng đầu: Giới hạn rủi ro 0.5% - 1% mỗi lệnh; dừng giao dịch ngay khi lỗ 2% trong ngày.",
        classification_tags=["thi quỹ", "prop firm", "ftmo", "thử thách quỹ", "pass quỹ", "daily loss", "max drawdown", "mff", "topstep", "funded account", "thi quy"]
    ),

    33: TradingMethod(
        id=33,
        code="FUNDING_RATE_OPEN_INTEREST",
        name="FUNDING RATE & OPEN INTEREST (Thị trường Phái sinh Crypto)",
        description="Đọc vị tâm lý đám đông và nguy cơ thanh lý hàng loạt qua dữ liệu phái sinh trên sàn.",
        typical_questions=[
            "Funding Rate dương cao (+0.05%) nghĩa là Long đang áp đảo phải không?",
            "Open Interest (OI) tăng đột biến cùng với giá giảm nghĩa là gì?",
            "Thanh lý hàng loạt (Liquidation Cascade / Long Squeeze) xảy ra ở vùng giá nào?",
            "Long/Short ratio trên Binance nói lên điều gì?"
        ],
        required_analysis=[
            "Funding Rate (Phí tài trợ phái sinh)",
            "Open Interest (OI - Tổng hợp đồng mở)",
            "Bản đồ thanh lý (Liquidation Heatmap)",
            "Khả năng xảy ra Short Squeeze hoặc Long Squeeze"
        ],
        output_guidelines="Tư duy ngược số đông: Khi Funding Rate quá cao và OI đạt đỉnh, thị trường dễ có cú quét ngược cực mạnh (Flush out) để thanh lý phe đông đảo.",
        classification_tags=["funding rate", "open interest", "oi", "thanh lý", "liquidation", "long squeeze", "short squeeze", "phái sinh crypto", "thanh ly", "phai sinh"]
    ),

    34: TradingMethod(
        id=34,
        code="HEDGING_PORTFOLIO",
        name="HEDGING & PORTFOLIO PROTECTION (Phòng hộ Danh mục & Hedging)",
        description="Bảo hiểm rủi ro danh mục giao dịch khi thị trường xuất hiện biến động bất lợi lớn.",
        typical_questions=[
            "Tôi đang giữ Spot BTC, có nên mở lệnh Short Futures để Hedging khi thị trường xấu không?",
            "Delta Neutral trading là gì?",
            "Chiến lược Pair Trading giữa 2 đồng coin cùng hệ sinh thái.",
            "Cách bảo hiểm vị thế khi có sự kiện rủi ro cao."
        ],
        required_analysis=[
            "Danh mục Spot hiện hữu vs Vị thế Futures phòng vệ",
            "Tỷ lệ Hedging (Full Hedge vs Partial Hedge)",
            "Chi phí cơ hội và phí Funding",
            "Mốc giá mở khóa phòng hộ (Unhedging)"
        ],
        output_guidelines="Đánh giá tính hai mặt: Hedging giúp giảm biến động nhưng đòi hỏi kỹ năng gỡ lệnh ở cả 2 đầu.",
        classification_tags=["hedging", "phòng hộ", "delta neutral", "bảo hiểm vị thế", "pair trading", "short futures spot", "danh mục", "phong ho"]
    ),

    35: TradingMethod(
        id=35,
        code="BREAKOUT_MOMENTUM",
        name="BREAKOUT & MOMENTUM (Giao dịch Phá vỡ & Đà tăng trưởng)",
        description="Đánh giá sức mạnh của cú bứt phá khỏi vùng tích lũy và phòng tránh bẫy phá vỡ giả (Fakeout).",
        typical_questions=[
            "Cú Breakout này là thật hay Fakeout?",
            "Khối lượng nến bứt phá thế nào là hợp lệ?",
            "Nên mua đuổi ngay khi phá vỡ cản hay chờ retest?",
            "Khoảng cách nến đóng cửa qua cản bao nhiêu thì an toàn?"
        ],
        required_analysis=[
            "Độ nén của giá trước khi phá vỡ (Volatility contraction)",
            "Khối lượng bứt phá (Volume Expansion)",
            "Thân nến đóng dứt khoát ngoài vùng cản",
            "Dấu hiệu phá vỡ giả (Fakeout / Bull trap / Bear trap)"
        ],
        output_guidelines="Phân biệt True Breakout (Volume lớn, nến thân dài) vs Fakeout (rút râu, volume thấp); khuyến nghị chờ retest thành công.",
        classification_tags=["breakout", "phá vỡ", "fakeout", "phá vỡ giả", "vượt đỉnh", "thủng đáy", "momentum", "pha vo", "pha vo gia"]
    ),

    36: TradingMethod(
        id=36,
        code="PULLBACK_RETEST",
        name="PULLBACK & RETEST (Giao dịch Sóng hồi & Kiểm tra Cản)",
        description="Bắt nhịp sóng hồi chất lượng cao khi kháng cự cũ chuyển hóa thành hỗ trợ mới.",
        typical_questions=[
            "Giá retest lại đỉnh cũ có tạo hỗ trợ vững không?",
            "Đặc điểm của một nhịp Pullback chất lượng cao là gì?",
            "Change of Polarity (Kháng cự cũ đổi thành Hỗ trợ mới) hoạt động ra sao?",
            "Tại sao nhiều cú retest lại bị thủng luôn?"
        ],
        required_analysis=[
            "Sóng đẩy trước đó (Impulsive Move)",
            "Đặc tính sóng hồi: Volume giảm dần, nến nhỏ, thoái lui chậm (Corrective Pullback)",
            "Hiện tượng hoán đổi vai trò cản (Change of Polarity)",
            "Nến xác nhận từ chối tại điểm retest"
        ],
        output_guidelines="Chỉ vào lệnh khi sóng hồi diễn ra chậm chạp cạn kiệt thanh khoản; nếu giá lao dốc mạnh thẳng đứng vào cản thì không được bắt dao rơi.",
        classification_tags=["pullback", "retest", "kiểm tra lại", "kháng cự thành hỗ trợ", "hồi quy", "test cản", "change of polarity", "kiem tra lai"]
    ),

    37: TradingMethod(
        id=37,
        code="GAP_ANALYSIS",
        name="GAP ANALYSIS (Phân tích Khoảng trống giá & CME Gap)",
        description="Đọc vị khoảng trống giá trên sàn CME Futures, sàn chứng khoán và các phiên mở cửa tuần Forex.",
        typical_questions=[
            "CME Gap BTC ở vùng 78k có được lấp (Fill Gap) không?",
            "Phân biệt Common Gap, Breakaway Gap và Exhaustion Gap.",
            "Fair Value Gap (FVG) khác Gap thông thường thế nào?",
            "Tại sao mở phiên thứ Hai Forex hay có Gap lớn?"
        ],
        required_analysis=[
            "Phân loại Gap: Common Gap, Breakaway Gap, Runaway Gap, Exhaustion Gap",
            "CME Futures Gap trên biểu đồ Bitcoin",
            "Trạng thái lấp Gap (Filled vs Unfilled)",
            "Hành vi giá khi tiếp cận vùng biên của Gap"
        ],
        output_guidelines="Làm rõ: Gap hoạt động như một nam châm hút giá nhưng không bắt buộc phải lấp ngay; quan trọng là cấu trúc xu hướng hiện hành.",
        classification_tags=["gap", "cme gap", "khoảng trống giá", "lấp gap", "fill gap", "breakaway gap", "exhaustion gap", "khoang trong gia", "lap gap"]
    ),

    38: TradingMethod(
        id=38,
        code="TREND_FOLLOWING_PULLBACK",
        name="TREND FOLLOWING & MOVING AVERAGES (Giao dịch Theo Xu hướng Dài hạn)",
        description="Khai thác sức mạnh của xu hướng chủ đạo qua các đường trung bình động (EMA 20/50/200).",
        typical_questions=[
            "Đường EMA 50 và EMA 200 cắt nhau (Golden Cross) thì mua được chưa?",
            "Cách gồng lãi theo xu hướng lớn mà không bị rũ hàng sớm.",
            "Hồi về đường trung bình động (MA Pullback) đánh thế nào?",
            "Làm sao biết khi nào một con sóng tăng sắp kết thúc?"
        ],
        required_analysis=[
            "Cụm đường trung bình động: EMA 20, EMA 50, EMA 200",
            "Độ dốc và khoảng cách giữa các đường MA (Fanning out)",
            "Hiện tượng Golden Cross / Death Cross",
            "Quy tắc trailing stop theo cấu trúc Swing Low trong xu hướng tăng"
        ],
        output_guidelines="Nhắc nhở nguyên tắc vàng: 'Trend is your friend' - Tuyệt đối không cố gắng đoán đỉnh một xu hướng đang tăng mạnh chỉ vì cảm thấy giá quá cao.",
        classification_tags=["trend following", "xu hướng", "ema", "ma200", "golden cross", "death cross", "gồng lãi", "thuận xu hướng", "duong trung binh", "xu huong"]
    ),

    39: TradingMethod(
        id=39,
        code="SCALPING_EXECUTION",
        name="SCALPING & ULTRA-FAST EXECUTION (Chiến thuật Scalping Siêu ngắn)",
        description="Khai thác các dao động nhỏ trong vài phút trên khung M1/M5 với sự tối ưu hóa chi phí phí giao dịch.",
        typical_questions=[
            "Scalping khung M1/M5 cần lưu ý gì về Spread và Com?",
            "Tốc độ khớp lệnh ảnh hưởng thế nào đến kết quả scalping?",
            "Setup scalping quét râu phiên Mỹ có rủi ro gì?",
            "Cách đặt SL siêu ngắn (3-5 pip/tick) mà không bị quét ngẫu nhiên."
        ],
        required_analysis=[
            "Khung thời gian siêu ngắn: M1, M3, M5",
            "Tỷ lệ Chi phí phí giao dịch (Spread + Commission) trên tổng biên độ lãi",
            "Độ trễ khớp lệnh (Latency) & Trượt giá (Slippage)",
            "Kỷ luật cắt lỗ chớp nhoáng không do dự"
        ],
        output_guidelines="Cảnh báo nguy cơ kiệt sức tâm lý (Mental Fatigue) và chi phí phí giao dịch bào mòn tài khoản; giới hạn số lệnh scalping mỗi ngày.",
        classification_tags=["scalping", "lướt sóng", "m1", "m5", "khung nhỏ", "spread", "slippage", "khớp lệnh nhanh", "ăn ngắn", "luot song", "an ngan"]
    ),

    40: TradingMethod(
        id=40,
        code="SWING_POSITION_TRADING",
        name="SWING & POSITION TRADING (Giao dịch Swing & Nắm giữ Trung hạn)",
        description="Nắm giữ vị thế từ vài ngày đến vài tuần trên khung H4/D1/W1 để ăn trọn vẹn những con sóng lớn.",
        typical_questions=[
            "Lệnh Swing này nên giữ bao nhiêu tuần?",
            "Cách tính phí qua đêm (Swap / Overnight Fee) khi gồng lệnh dài?",
            "Làm sao giữ vững tâm lý khi vị thế bị sóng hồi rung lắc 100-200 pip?",
            "Điểm chốt lời theo cấu trúc khung Tuần (Weekly)."
        ],
        required_analysis=[
            "Khung thời gian H4, Daily (D1), Weekly (W1)",
            "Dealing Range vĩ mô và mục tiêu thanh khoản lớn",
            "Phí qua đêm (Swap rate âm/dương)",
            "Tỷ lệ Risk:Reward vượt trội (1:5 đến 1:10+)"
        ],
        output_guidelines="Rèn luyện tính kiên nhẫn: Giảm khối lượng vào lệnh xuống mức nhỏ để có thể chịu đựng biên độ rung lắc của khung lớn mà không bị tâm lý can thiệp đóng non.",
        classification_tags=["swing trade", "swing trading", "nắm giữ dài", "khung d1", "khung tuần", "weekly", "swap", "phí qua đêm", "nam giu dai", "phi qua dem"]
    ),

    # ------------------ 41-50: ĐẢO CHIỀU, RANGE, ALGO, PROFILE & ĐẶC TÍNH SÀN ------------------
    41: TradingMethod(
        id=41,
        code="REVERSAL_EXHAUSTION",
        name="REVERSAL & EXHAUSTION (Nhận diện Đảo chiều & Cạn kiệt Xung lực)",
        description="Nhận diện dấu hiệu kiệt sức của sóng đẩy (Climax Run) và mô hình bẫy thất bại Swing Failure Pattern (SFP).",
        typical_questions=[
            "Cú chạy nước rút (Climax Run) này đã cạn kiệt lực mua chưa?",
            "Swing Failure Pattern (SFP) nhận biết thế nào?",
            "Nến doji râu dài tại đỉnh có phải là đỉnh sóng không?",
            "Volume tăng kỷ lục nhưng thân nến cực nhỏ báo hiệu điều gì?"
        ],
        required_analysis=[
            "Buying Climax / Selling Climax",
            "Mô hình Swing Failure Pattern (SFP: Quét râu qua đỉnh/đáy rồi đóng nến ngược vào trong)",
            "Nến kiệt sức (Exhaustion Candle) có volume đột biến",
            "Sự dịch chuyển pha cấu trúc LTF"
        ],
        output_guidelines="Không bắt dao rơi hay chặn đầu xe lửa; chỉ mở vị thế đảo chiều khi nến SFP đóng cửa hoàn tất hoặc có nến Displacement phá vỡ cấu trúc nhỏ.",
        classification_tags=[
            "cạn kiệt xung lực", "can kiet", "sfp", "swing failure pattern",
            "climax", "buying climax", "selling climax", "exhaustion",
            "bắt đỉnh", "bắt đáy", "bat dinh", "bat day", "kiệt sức", "kiet suc", "reversal climax"
        ]
    ),

    42: TradingMethod(
        id=42,
        code="RANGE_BOUND_SIDEWAY",
        name="RANGE BOUND & SIDEWAY (Giao dịch Thị trường Đi ngang & Tích lũy)",
        description="Chiến lược khai thác vùng giá đi ngang trong hộp tích lũy và cú lệch biên (Deviation).",
        typical_questions=[
            "Thị trường đi ngang trong Range thì nên trade biên hay đứng ngoài?",
            "Cách xác định Range High và Range Low chuẩn xác.",
            "Cú lệch biên (Deviation / Look above/below the range) giao dịch thế nào?",
            "Khi nào Range sắp bị phá vỡ để vào trend mới?"
        ],
        required_analysis=[
            "Range High (Biên trên) & Range Low (Biên dưới)",
            "Đường trung tâm Equilibrium (Eq 50%)",
            "Cú Deviation (Quét ngoài biên rồi nhanh chóng quay trở lại bên trong)",
            "Khối lượng nén hẹp (Volume contraction)"
        ],
        output_guidelines="Chiến lược mẫu mực: Mua khi có Deviation quét đáy Range Low; Bán khi có Deviation quét đỉnh Range High; Chốt lời từng phần tại Equilibrium 50%.",
        classification_tags=["range", "sideway", "đi ngang", "hộp tích lũy", "range high", "range low", "deviation", "mean reversion", "đánh biên", "di ngang", "hop tich luy"]
    ),

    43: TradingMethod(
        id=43,
        code="IPDA_CENTRAL_BANK",
        name="IPDA & CENTRAL BANK ALGORITHM (Thuật toán IPDA & Ngân hàng Trung ương)",
        description="Nguyên lý phân phối giá của Thuật toán Liên ngân hàng IPDA qua các chu kỳ Lookback 20/40/60 ngày.",
        typical_questions=[
            "IPDA (Interbank Price Delivery Algorithm) hoạt động theo nguyên lý nào?",
            "Chu kỳ Lookback 20, 40, 60 ngày của IPDA áp dụng ra sao?",
            "Ngân hàng Trung ương phân phối giá về vùng thanh khoản nào?",
            "True Day / True Week open là gì?"
        ],
        required_analysis=[
            "Thuật toán Phân phối Giá Liên ngân hàng (IPDA)",
            "Chu kỳ tham chiếu dữ liệu quá khứ 20, 40, 60 ngày (Lookback data)",
            "Nguyên lý Tái định giá (Repricing) của Smart Money",
            "Mốc mở cửa chuẩn xác: True Day Open (00:00 NY Time)"
        ],
        output_guidelines="Nhìn nhận thị trường là hệ thống được phân phối giá có chủ đích nhằm tìm kiếm thanh khoản đối ứng chứ không phải dao động ngẫu nhiên.",
        classification_tags=["ipda", "interbank", "thuật toán ngân hàng", "lookback 20 40 60", "true day open", "repricing", "thuat toan gia", "ngan hang trung uong"]
    ),

    44: TradingMethod(
        id=44,
        code="ALGO_HFT_BEHAVIOR",
        name="ALGO & HFT BEHAVIOR (Hành vi Thuật toán HFT & Săn Thanh khoản)",
        description="Giải mã các bẫy quét Stop Loss tinh vi và lệnh tàng hình Iceberg của các bot giao dịch tần suất cao.",
        typical_questions=[
            "Các quỹ HFT săn Stop Loss của retail trader như thế nào?",
            "Lệnh tàng hình (Iceberg Order) nhận biết sao trên biểu đồ?",
            "Hiện tượng giật râu quét SL 1 pip (Stop Hunting) xử lý thế nào?",
            "Các lệnh thăm dò (Ping orders) của bot trading."
        ],
        required_analysis=[
            "Hoạt động của các thuật toán HFT (High-Frequency Trading)",
            "Cơ chế lệnh ẩn (Iceberg Orders)",
            "Hiện tượng săn Stop Loss (Stop Hunting) tại các mốc cản tròn số tâm lý",
            "Thời điểm thanh khoản mỏng (Off-peak hours) dễ bị giật nến"
        ],
        output_guidelines="Khuyến nghị: Luôn cộng thêm vùng đệm (Buffer 2-5 pip/tick) phía sau mốc cản kỹ thuật để tránh bị quét râu ngẫu nhiên bởi bot HFT.",
        classification_tags=["algo", "hft", "săn stop loss", "stop hunting", "iceberg order", "bot trading", "thao túng giá", "lệnh ẩn", "san stop loss", "bot"]
    ),

    45: TradingMethod(
        id=45,
        code="TIME_PRICE_OPPORTUNITY",
        name="TIME PRICE OPPORTUNITY (TPO Chart & Market Profile Chuyên sâu)",
        description="Đọc cấu trúc thị trường qua phân bố chữ cái TPO, Initial Balance (IB) và vùng Single Prints.",
        typical_questions=[
            "Biểu đồ TPO Profile đọc các chữ cái (Letters) thế nào?",
            "Initial Balance (IB) giờ đầu tiên quyết định ngày giao dịch ra sao?",
            "Single Prints (Dấu ấn đơn) có vai trò như FVG không?",
            "Poor High / Poor Low trên TPO báo hiệu điều gì?"
        ],
        required_analysis=[
            "Khung Initial Balance (IB - 1 giờ đầu tiên mở phiên)",
            "Phân bố các khối chữ cái TPO theo chu kỳ 30 phút",
            "Vùng Single Prints (Dấu ấn đẩy giá nhanh chưa có thanh khoản)",
            "Poor Highs / Poor Lows (Đỉnh/đáy yếu chưa được kiểm định)"
        ],
        output_guidelines="Xác định Poor High/Low và Single Prints là những vùng thanh khoản chưa hoàn thành mà thị trường gần như sẽ quay trở lại kiểm tra.",
        classification_tags=["tpo", "tpo profile", "initial balance", "ib", "single prints", "poor high", "poor low", "market profile chữ cái"]
    ),

    46: TradingMethod(
        id=46,
        code="SYSTEMATIC_RULE_CREATION",
        name="SYSTEMATIC RULE CREATION (Xây dựng Quy tắc & Trading Checklist)",
        description="Chuẩn hóa phương pháp giao dịch thành bộ quy tắc rõ ràng 'Nếu - Thì' (If-Then) để loại bỏ cảm tính.",
        typical_questions=[
            "Làm sao để chuẩn hóa setup thành một Checklist rõ ràng?",
            "Nguyên tắc Nếu - Thì (If-Then rules) trong kế hoạch giao dịch.",
            "Cách loại bỏ yếu tố cảm tính khi ra quyết định.",
            "Thế nào là một Hệ thống giao dịch hoàn chỉnh có lợi thế thống kê (Edge)?"
        ],
        required_analysis=[
            "4 Trụ cột Hệ thống: 1. Setup, 2. Trigger, 3. Risk Sizing, 4. Exit Management",
            "Bộ quy tắc Nếu - Thì bằng văn bản (If-Then logic)",
            "Checklist chấm điểm chất lượng lệnh (Setup Quality Scoring A/B/C)",
            "Quy trình đánh giá lại sau mỗi tuần"
        ],
        output_guidelines="Hướng dẫn xây dựng Checklist chấm điểm: Chỉ mở vị thế khi thỏa mãn tối thiểu 4/5 tiêu chí kỹ thuật đã đề ra.",
        classification_tags=["checklist", "quy tắc giao dịch", "hệ thống giao dịch", "systematic", "if then", "kế hoạch giao dịch", "trading rules", "quy tac", "he thong"]
    ),

    47: TradingMethod(
        id=47,
        code="TRADINGVIEW_CHART_SETUP",
        name="TRADINGVIEW & CHART SETUP (Thiết lập Biểu đồ & Công cụ Phân tích)",
        description="Tối ưu hóa giao diện TradingView, quản lý cảnh báo giá Alert và giữ biểu đồ sạch (Clean Chart).",
        typical_questions=[
            "Cách cài đặt layout biểu đồ TradingView hiệu quả nhất.",
            "Nên dùng những chỉ báo nào để không bị rối mắt (Chart Clutter)?",
            "Cách đặt Cảnh báo giá (Price Alerts) để không phải dán mắt vào màn hình.",
            "Phím tắt và công cụ vẽ FVG/OB chuẩn trên TradingView."
        ],
        required_analysis=[
            "Bố cục màn hình đa khung thời gian (Workspace Layout)",
            "Triết lý Biểu đồ Sạch (Clean Chart Philosophy - Less is more)",
            "Hệ thống Cảnh báo Giá (Alerts) tại các POI then chốt",
            "Công cụ đo lường R:R và phím tắt thao tác nhanh"
        ],
        output_guidelines="Khuyến khích tối giản: Biểu đồ càng ít chỉ báo thừa, tâm trí trader càng tập trung vào hành động giá và ra quyết định chính xác hơn.",
        classification_tags=["tradingview", "biểu đồ", "cài đặt biểu đồ", "alert", "cảnh báo giá", "layout", "chart setup", "chỉ báo", "vẽ chart", "bieu do", "canh bao"]
    ),

    48: TradingMethod(
        id=48,
        code="OVERTRADING_PREVENTION",
        name="OVERTRADING & CIRCUIT BREAKER (Kiểm soát Giao dịch Quá mức & Ngắt mạch)",
        description="Ngăn ngừa tình trạng nghiện vào lệnh liên tục và kích hoạt cơ chế ngắt mạch tự động khi gặp chuỗi thua.",
        typical_questions=[
            "Tôi bị nghiện vào lệnh liên tục (Overtrading) thì cai thế nào?",
            "Một ngày nên đánh tối đa bao nhiêu lệnh?",
            "Circuit Breaker (Cầu chì ngắt mạch giao dịch) hoạt động ra sao?",
            "Cảm giác bồn chồn khi không có lệnh mở xử lý thế nào?"
        ],
        required_analysis=[
            "Hiện tượng giao dịch cưỡng bức (Compulsive / Boredom Trading)",
            "Cơ chế Cầu chì Ngắt mạch (Circuit Breaker sau 2 lệnh thua liên tiếp)",
            "Giới hạn số lệnh tối đa mỗi ngày (Max Daily Trades: 2-3 lệnh)",
            "Quy trình tách biệt khỏi màn hình (Mandatory Cool-down period)"
        ],
        output_guidelines="Thiết lập nguyên tắc sắt đá: Sau 2 lệnh thua liên tiếp trong ngày, bắt buộc tắt màn hình và không được mở thêm bất kỳ vị thế nào cho đến ngày hôm sau.",
        classification_tags=["overtrading", "vào lệnh nhiều", "nghiện trade", "cháy tài khoản", "circuit breaker", "cầu chì", "nghỉ ngơi", "kỷ luật dừng lỗ", "vao lenh nhieu", "chay tai khoan"]
    ),

    49: TradingMethod(
        id=49,
        code="CURRENCY_STRENGTH_FOREX",
        name="CURRENCY STRENGTH & FOREX (Sức mạnh Đồng tiền & Ngoại hối)",
        description="Đo lường sức mạnh tương đối của các đồng tiền và ghép cặp Mạnh nhất vs Yếu nhất để tối ưu hóa đà sóng.",
        typical_questions=[
            "Currency Heatmap cho thấy đồng JPY đang mạnh nhất thì ghép cặp thế nào?",
            "Cặp chéo (Cross pairs) EURJPY, GBPJPY giao dịch khác cặp chính (Majors) ra sao?",
            "Khẩu vị rủi ro Risk-on / Risk-off ảnh hưởng gì đến AUD, NZD và CHF?",
            "Quy tắc ghép đồng mạnh nhất với đồng yếu nhất."
        ],
        required_analysis=[
            "Bản đồ Sức mạnh Tiền tệ (Currency Heatmap / CSM)",
            "Phân loại: Đồng tiền Hàng hóa (AUD, NZD, CAD) vs Đồng tiền Trú ẩn (USD, JPY, CHF)",
            "Cặp tiền tệ chính (Majors) vs Cặp tiền tệ chéo (Crosses)",
            "Chiến lược ghép cặp tối ưu (Strongest vs Weakest pair)"
        ],
        output_guidelines="Áp dụng công thức Forex kinh điển: Mua đồng tiền đang mạnh nhất thị trường và bán đồng tiền đang yếu nhất để bắt được những con sóng bứt phá dài nhất.",
        classification_tags=["currency strength", "sức mạnh đồng tiền", "forex", "cặp chéo", "gbpjpy", "eurjpy", "risk on", "risk off", "jpy", "chf", "ngoại hối", "ngoai hoi"]
    ),

    50: TradingMethod(
        id=50,
        code="COMMODITY_INDEX_DYNAMICS",
        name="COMMODITY & INDEX DYNAMICS (Đặc tính Hàng hóa & Chỉ số Chứng khoán)",
        description="Khai thác đặc tính riêng biệt của Vàng (XAUUSD), Dầu (USOIL) và các chỉ số chứng khoán hàng đầu (SPX, NDX, VN-Index).",
        typical_questions=[
            "Vàng XAUUSD có đặc tính quét râu thanh khoản khác gì Crypto?",
            "Dầu USOIL phản ứng thế nào với tin dự trữ dầu thô EIA thứ Tư?",
            "Chỉ số SPX và Nasdaq (NDX) mở phiên 20:30 (giờ VN) thường chạy sóng ra sao?",
            "VN-Index có áp dụng được ICT và Smart Money không?"
        ],
        required_analysis=[
            "Đặc tính biên độ giao động (ATR) cực mạnh của Vàng XAUUSD",
            "Báo cáo tồn kho Dầu thô EIA và các sự kiện địa chính trị tác động đến Dầu USOIL",
            "Giờ mở cửa thị trường chứng khoán Mỹ (NYSE/NASDAQ Open: 09:30 AM EST)",
            "Đặc thù thị trường chứng khoán Việt Nam (VN-Index, T+2.5, Khối ngoại, Tự doanh)"
        ],
        output_guidelines="Chỉ ra bản chất riêng: Vàng có các cú quét râu săn SL tàn khốc nhất; Dầu chịu tác động trực tiếp từ chính trị; Chỉ số chứng khoán Mỹ có thiên hướng tăng trưởng theo thời gian (Bullish bias).",
        classification_tags=["vàng", "xauusd", "dầu", "usoil", "spx", "ndx", "vnindex", "hàng hóa", "chỉ số", "đặc tính hàng hóa", "bản chất tài sản", "vang", "dau", "hang hoa", "chi so"]
    )
}

# ==============================================================================
# HÀM TRA CỨU & ROUTING ĐỘNG THEO DANH MỤC 50 PHƯƠNG PHÁP
# ==============================================================================
def get_method_by_id(method_id: int) -> Optional[TradingMethod]:
    return TRADING_METHODS_REGISTRY.get(method_id)

def list_all_method_names() -> List[str]:
    return [f"{m.id}. {m.name}" for m in TRADING_METHODS_REGISTRY.values()]

def strip_accents(text: str) -> str:
    patterns = {
        '[àáảãạăằắẳẵặâầấẩẫậ]': 'a',
        '[èéẻẽẹêềếểễệ]': 'e',
        '[ìíỉĩị]': 'i',
        '[òóỏõọôồốổỗộơờớởỡợ]': 'o',
        '[ùúủũụưừứửữự]': 'u',
        '[ỳýỷỹỵ]': 'y',
        '[đ]': 'd'
    }
    res = text.lower()
    for p, r in patterns.items():
        res = re.sub(p, r, res)
    return res

def route_query_to_method(query: str, has_positions: bool = False) -> TradingMethod:
    """
    Routing thông minh dựa trên khớp trọng số (Match Weight Scoring):
    - Khớp cụm từ dài (như 'co nen vao lenh') nhận điểm cao hơn từ ngắn ('lenh').
    - Dùng word-boundary để tránh nhận diện nhầm từ ghép/từ con.
    - Loại bỏ hoàn toàn 50 khối if-else tuần tự gây lỗi nuốt từ khóa (shadowing).
    """
    lower = query.lower()
    norm = strip_accents(lower)

    # 1. Ưu tiên đặc biệt: Đánh giá lệnh đang mở nếu tài khoản có vị thế thật VÀ người dùng hỏi về vị thế/lệnh của mình
    if has_positions and any(w in norm for w in [
        "lenh cua toi", "lenh cua em", "lenh cua minh", "lenh nay", "dang gong", "dang lo", "dang lai",
        "dang am", "dang duong", "dinh sl", "vi the cua toi", "lenh dang mo", "review lenh", "sai o dau"
    ]):
        return TRADING_METHODS_REGISTRY[3]

    # 1.5. Ưu tiên câu hỏi về thời gian thực/giờ giấc/phiên giao dịch -> Method 24 (SESSION TIMING & KILLZONES)
    if any(w in norm for w in [
        "may gio", "gio may gio", "bay gio la may gio", "hom nay ngay may", 
        "hom nay thu may", "dang la phien nao", "phien nao dang mo", "may gio phien"
    ]):
        return TRADING_METHODS_REGISTRY[24]

    best_method_id = 1
    max_score = 0.0

    # 2. Quét qua toàn bộ 50 Methods trong Registry và tính điểm tích lũy
    for method_id, method in TRADING_METHODS_REGISTRY.items():
        score = 0.0
        for tag in method.classification_tags:
            tag_lower = tag.lower().strip()
            tag_norm = strip_accents(tag_lower)
            if not tag_norm:
                continue

            # Kiểm tra cụm từ nguyên vẹn với ranh giới từ (word boundary)
            pattern_norm = rf"(?:\b|^){re.escape(tag_norm)}(?:\b|$)"
            pattern_lower = rf"(?:\b|^){re.escape(tag_lower)}(?:\b|$)"

            matched = False
            if re.search(pattern_lower, lower):
                matched = True
            elif re.search(pattern_norm, norm):
                matched = True

            if matched:
                # Cụm từ càng dài và chi tiết thì trọng số càng cao (chiều dài^1.5)
                score += len(tag_norm) ** 1.5

        if score > max_score:
            max_score = score
            best_method_id = method_id

    # 3. Nếu không có từ khóa nào khớp (score == 0), fallback về Market Analysis (Method 1)
    return TRADING_METHODS_REGISTRY[best_method_id]
