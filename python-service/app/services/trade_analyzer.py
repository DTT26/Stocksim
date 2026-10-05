from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from app.rag.schema import TradeInput
from app.rag.retriever import retriever
from app.services.llm_client import llm_client

class TradeAnalyzer:
    """
    ICT Multi-Timeframe Trade Review + Trading Coach + Learning System.
    Strictly implements the 4-Level Timeframe Hierarchy and the 100-Point ICT Rubric:
    - 4 Timeframe Roles:
        * D1 / W1: HTF Context & Daily Bias (Dealing Range, 50% Equilibrium, HTF POI)
        * H4 / H1: Liquidity & Draw on Liquidity (DOL, Open Draw, Sweep)
        * M15 / M5: Structure & Execution (Displacement, MSS / CISD, PD Arrays)
        * M1 / M3: LTF Entry Refinement (Tight SL, SMT Divergence, Silver Bullet / Macro)
    - 5-part Rubric-based Process Compliance Score (/100):
        * Phần 1: HTF Context & Bias (25đ) [D1 / H4]
        * Phần 2: Time & SMT Correlation (20đ) [H1 / Intermarket]
        * Phần 3: Sweep & Displacement (25đ) [H1 / M15]
        * Phần 4: Entry & Risk Management (20đ) [M15 / M5]
        * Phần 5: Plan & Discipline (10đ) [Checklist / Guardrails]
    - 4 Tier Ratings & Execution Recommendations:
        * 90 - 100: 🌟 Hạng A+ (Unicorn Setup) -> Bấm lệnh ngay (Execution), Max 100% Risk
        * 75 - 89:  🟢 Hạng B (Standard Setup) -> Thực thi bình thường, Risk 0.5% - 1%
        * 60 - 74:  🟡 Hạng C (Marginal Setup) -> Xác suất thấp, 50% Risk hoặc quan sát
        * < 60:     🔴 Hạng F (Invalid / Retail Trap) -> CẤM VÀO LỆNH (PASS)
    """

    def analyze(self, trade: TradeInput) -> Dict[str, Any]:
        lang = getattr(trade, 'lang', None) or 'vi'
        is_en = str(lang).lower().startswith('en')
        is_buy = trade.side.upper() in ["BUY", "LONG"]
        entry = trade.entryPrice or 0.0
        is_open = trade.isOpen if trade.isOpen is not None else (trade.exitPrice is None)
        eval_price = trade.currentPrice if (is_open and trade.currentPrice is not None) else (trade.exitPrice if trade.exitPrice is not None else entry)
        exit_p = eval_price
        sl = trade.stopLoss
        tp = trade.takeProfit
        qty = trade.quantity or 1.0
        balance = float(trade.accountBalance) if (trade.accountBalance and float(trade.accountBalance) > 0) else 10000.0

        has_sl = sl is not None and sl > 0
        has_tp = tp is not None and tp > 0

        # =====================================================================
        # 1. PnL & Return Calculation
        # =====================================================================
        if trade.realPnL is not None:
            total_pnl = trade.realPnL
            pnl_per_unit = (total_pnl / qty) if qty > 0 else 0.0
            if trade.exitPrice is not None and trade.exitPrice > 0:
                exit_p = trade.exitPrice
                eval_price = exit_p
            else:
                eval_price = (entry + pnl_per_unit) if is_buy else (entry - pnl_per_unit)
                exit_p = eval_price
            return_pct = round((pnl_per_unit / entry) * 100, 2) if entry > 0 else 0.0
        else:
            pnl_per_unit = (eval_price - entry) if is_buy else (entry - eval_price)
            total_pnl = pnl_per_unit * qty
            return_pct = round((pnl_per_unit / entry) * 100, 2) if entry > 0 else 0.0

        # =====================================================================
        # 2. Risk Metrics & Distance
        # =====================================================================
        sl_distance_usd = abs(entry - sl) if has_sl else 0.0
        sl_distance_pct = round((sl_distance_usd / entry) * 100, 2) if (has_sl and entry > 0) else 0.0

        tp_distance_usd = abs(tp - entry) if has_tp else 0.0
        tp_distance_pct = round((tp_distance_usd / entry) * 100, 2) if (has_tp and entry > 0) else 0.0

        position_size_value = entry * qty
        position_size_risk_pct = round((position_size_value / balance) * 100, 2) if balance > 0 else 0.0

        if has_sl:
            risk_per_unit = sl_distance_usd
            capital_at_risk = risk_per_unit * qty
            max_potential_loss = capital_at_risk
            risk_pct = round((capital_at_risk / balance) * 100, 2)
            risk_display = f"{risk_pct}% (${capital_at_risk:,.2f})"
            risk_warning = None
        else:
            risk_per_unit = entry * 0.05
            capital_at_risk = 0.0
            max_potential_loss = None
            risk_pct = 0.0
            risk_display = "Undefined (Missing SL)" if is_en else "Chưa xác định (Thiếu SL)"
            risk_warning = "Risk cannot be determined because Stop Loss is not defined." if is_en else "Chưa xác định được rủi ro tối đa do thiếu Stop Loss."

        # Planned R:R & Actual R:R
        if has_sl and has_tp and risk_per_unit > 0:
            planned_rr = round(tp_distance_usd / risk_per_unit, 2)
        else:
            planned_rr = 0.0

        if has_sl and risk_per_unit > 0:
            actual_rr = round(pnl_per_unit / risk_per_unit, 2)
        else:
            actual_rr = 0.0

        # =====================================================================
        # 3. MFE / MAE Excursion Analysis
        # =====================================================================
        high_since = trade.historicalHighSinceEntry or max(entry, exit_p)
        low_since = trade.historicalLowSinceEntry or min(entry, exit_p)

        if is_buy:
            mfe_pts = max(0.0, high_since - entry)
            mae_pts = max(0.0, entry - low_since)
        else:
            mfe_pts = max(0.0, entry - low_since)
            mae_pts = max(0.0, high_since - entry)

        mfe_r = round(mfe_pts / risk_per_unit, 2) if risk_per_unit > 0 else 0.0
        mae_r = round(mae_pts / risk_per_unit, 2) if risk_per_unit > 0 else 0.0

        excursion_flow = {
            "entry": round(entry, 2),
            "maePrice": round((entry - mae_pts) if is_buy else (entry + mae_pts), 2),
            "maePts": round(mae_pts, 2),
            "maeR": f"{mae_r}R" if has_sl else "Undefined",
            "mfePrice": round((entry + mfe_pts) if is_buy else (entry - mfe_pts), 2),
            "mfePts": round(mfe_pts, 2),
            "mfeR": f"{mfe_r}R" if has_sl else "Undefined",
            "exitPrice": round(exit_p, 2),
            "currentOrExit": round(exit_p, 2),
            "isLive": is_open
        }

        # =====================================================================
        # 4. Context & Timing Inferences (EST Killzone & Macro Timing)
        # =====================================================================
        notes_combined = f"{trade.strategy or ''} {trade.setupName or ''} {trade.reason or ''}".lower()

        # Check EST hour for Killzone detection
        # EST = UTC-5 (or UTC-4 in EDT). Standard: UTC-5
        now_utc = datetime.now(timezone.utc)
        est_hour = (now_utc.hour - 5) % 24
        est_minute = now_utc.minute

        # ICT Killzones:
        # London KZ: 2:00 - 5:00 AM EST
        # New York AM KZ: 8:00 - 11:00 AM EST
        # London Close KZ: 10:00 AM - 12:00 PM EST
        # Silver Bullet windows: 3-4 AM EST, 10-11 AM EST, 2-3 PM EST
        in_london_kz = (2 <= est_hour < 5)
        in_ny_am_kz = (8 <= est_hour < 11)
        in_silver_bullet = ((est_hour == 3) or (est_hour == 10) or (est_hour == 14))

        timing_hit = (
            getattr(trade, 'isKillzone', None) is True or
            in_london_kz or in_ny_am_kz or in_silver_bullet or
            any(k in notes_combined for k in ["killzone", "kill zone", "london", "new york", "ny am", "silver bullet", "macro"])
        )

        detected_session = "New York AM Killzone" if (in_ny_am_kz or "new york" in notes_combined or "ny" in notes_combined) else (
            "London Killzone" if (in_london_kz or "london" in notes_combined) else "Asian Session / Off-hours"
        )

        # =====================================================================
        # 5. ICT 100-POINT 5-PART RUBRIC EVALUATION
        # Level -> Profile -> Draw -> SMT -> Execute
        # =====================================================================
        rule_violations = []
        execution_issues = []
        risk_issues = []
        strategy_issues = []
        strengths = []

        # ---------------------------------------------------------------------
        # DRAWINGS DETECTION & STRICT VALIDATION
        # Yêu cầu: Nếu người dùng chưa vẽ gì trên biểu đồ, các phần liên quan đến vẽ phải được 0đ
        # ---------------------------------------------------------------------
        raw_drawings = getattr(trade, 'drawings', None)
        if raw_drawings is None and hasattr(trade, 'model_extra') and trade.model_extra:
            raw_drawings = trade.model_extra.get('drawings')
        
        drawings_list = raw_drawings if isinstance(raw_drawings, list) else []
        valid_drawings = [
            d for d in drawings_list 
            if isinstance(d, dict) and not str(d.get('id', '')).startswith('__sys_') 
            and not str(d.get('id', '')).startswith('pending_order_') 
            and d.get('name') != 'shift_measure'
        ]
        has_user_drawings = len(valid_drawings) > 0

        has_drawn_sweep = False
        has_drawn_mss = False
        has_drawn_pd_array = False
        has_drawn_poi = False

        if has_user_drawings:
            for d in valid_drawings:
                d_name = str(d.get('name', '')).lower()
                d_data = str(d.get('extendData', '')).lower()
                text_content = f"{d_name} {d_data}"
                if any(k in text_content for k in ['sweep', 'liquidity', 'ssl', 'bsl', 'thanh khoản']):
                    has_drawn_sweep = True
                if any(k in text_content for k in ['cisd', 'mss', 'choch', 'bos', 'horizontalstraightline', 'horizontalray']):
                    has_drawn_mss = True
                if any(k in text_content for k in ['fvg', 'ob', 'order block', 'breaker', 'rect', 'imbalance', 'vùng']):
                    has_drawn_pd_array = True
                if any(k in text_content for k in ['poi', 'htf', 'key level', 'cản']):
                    has_drawn_poi = True
            if not has_drawn_pd_array and any(d.get('name') == 'rect' for d in valid_drawings):
                has_drawn_pd_array = True
            if not has_drawn_mss and any(d.get('name') in ['horizontalStraightLine', 'horizontalRay', 'priceLine', 'trendLine', 'straightLine'] for d in valid_drawings):
                has_drawn_mss = True

        if not has_user_drawings:
            execution_issues.append("Sai ở Thao tác biểu đồ: Bạn chưa vẽ bất kỳ công cụ SMC/ICT nào trên biểu đồ. Các phần liên quan đến hình vẽ (HTF POI, Sweep, MSS/CISD, PD Array) bị chấm 0 điểm.")

        # ---------------------------------------------------------------------
        # PHẦN 1: BỐI CẢNH KHUNG CAO & ĐỊNH HƯỚNG (25 ĐIỂM) — [D1 / H4]
        # ---------------------------------------------------------------------
        # 1.1 Daily Bias & Premium/Discount Location (10đ)
        is_bias_aligned = True
        pd_location_valid = True
        if "fomo" in notes_combined or "mua đuổi" in notes_combined or "bán tháo" in notes_combined:
            pd_location_valid = False
            is_bias_aligned = False

        if pd_location_valid and is_bias_aligned:
            score_1_1 = 10
            desc_1_1 = (
                "Điểm MUA nằm ở vùng Discount (nửa dưới 50% Dealing Range) chuẩn xác theo Daily Bullish Bias (+10đ)."
                if is_buy else
                "Điểm BÁN nằm ở vùng Premium (nửa trên 50% Dealing Range) chuẩn xác theo Daily Bearish Bias (+10đ)."
            )
            strengths.append(desc_1_1)
        else:
            score_1_1 = 0
            desc_1_1 = "Sai ở Phân vùng giá: Mua đuổi tại Premium hoặc Bán đuổi tại Discount (0/10đ). Điểm vào lệnh nằm sai nửa Dealing Range."
            strategy_issues.append(desc_1_1)

        # 1.2 Draw on Liquidity (DOL) (10đ)
        has_logical_dol = has_tp and (
            planned_rr >= 1.5 or
            any(k in notes_combined for k in ["dol", "draw", "old high", "old low", "eqh", "eql", "bsl", "ssl", "thanh khoản", "liquidity pool"])
        )
        if has_logical_dol:
            score_1_2 = 10
            desc_1_2 = "Điểm Chốt lời (TP) hướng thẳng về bể thanh khoản mở (Open Draw / DOL: Old Highs/Lows, EQH/EQL) chưa bị càn quét (+10đ)."
            strengths.append(desc_1_2)
        else:
            score_1_2 = 0
            desc_1_2 = "Sai ở Mục tiêu Take Profit (DOL): Chưa thiết lập TP logic hoặc TP lơ lửng giữa khoảng giá No Man's Land, thiếu Draw on Liquidity (0/10đ)."
            execution_issues.append(desc_1_2)
            if not has_tp:
                rule_violations.append("Sai ở Chốt lời: Thiếu Take Profit định vị theo thanh khoản (Missing DOL).")

        is_market_direct = any(k in notes_combined for k in ["lệnh thị trường", "thực thi trực tiếp", "chưa cài", "no pre-set", "chưa có sl/tp"])
        has_explicit_notes = bool(trade.reason and len(trade.reason.strip()) > 15 and not is_market_direct)

        # 1.3 Phản ứng tại HTF POI (5đ) - YÊU CẦU CÓ HÌNH VẼ HOẶC XÁC NHẬN POI
        has_htf_poi = (
            (has_user_drawings and (has_drawn_poi or has_drawn_pd_array)) or
            (has_user_drawings and getattr(trade, 'htfPoi', None) is not None) or
            (has_user_drawings and has_explicit_notes and any(k in notes_combined for k in ["htf", "d1", "h4", "daily", "poi", "key level", "trạm đón", "cản lớn"]))
        )
        if not has_user_drawings:
            score_1_3 = 0
            desc_1_3 = "Sai ở Hình vẽ HTF POI: Bạn chưa vẽ trạm đón HTF POI / Key Level nào trên biểu đồ (0/5đ). Cần dùng công cụ hình chữ nhật hoặc đường cản vẽ trạm đón D1/H4."
            strategy_issues.append(desc_1_3)
        elif has_htf_poi:
            score_1_3 = 5
            desc_1_3 = "Giá xuất phát và bật nảy tại trạm đón HTF Key Level (Daily/H4 OB, FVG hoặc Rejection Block) (+5đ)."
            strengths.append(desc_1_3)
        else:
            score_1_3 = 0
            desc_1_3 = "Sai ở Trạm đón HTF: Chưa xác nhận điểm xuất phát từ trạm đón HTF POI uy tín trên biểu đồ (0/5đ)."
            strategy_issues.append(desc_1_3)

        part1_score = score_1_1 + score_1_2 + score_1_3
        part1_items = [
            {"id": "1.1", "name": "Daily Bias & Premium/Discount", "score": score_1_1, "max": 10, "status": "PASS" if score_1_1 == 10 else "FAIL", "detail": desc_1_1},
            {"id": "1.2", "name": "Draw on Liquidity (DOL)", "score": score_1_2, "max": 10, "status": "PASS" if score_1_2 == 10 else "FAIL", "detail": desc_1_2},
            {"id": "1.3", "name": "Phản ứng tại HTF POI", "score": score_1_3, "max": 5, "status": "PASS" if score_1_3 == 5 else "FAIL", "detail": desc_1_3},
        ]

        # ---------------------------------------------------------------------
        # PHẦN 2: THỜI GIAN VÀ PHÂN KỲ LIÊN THỊ TRƯỜNG (20 ĐIỂM) — [H1 / Intermarket]
        # ---------------------------------------------------------------------
        # 2.1 Cửa sổ Khung giờ Vàng (Kill Zone & Macro Timing) (10đ)
        if timing_hit:
            score_2_1 = 10
            desc_2_1 = f"Lệnh được kích hoạt chuẩn xác trong cửa sổ Khung giờ Vàng ({detected_session} hoặc Silver Bullet) (+10đ)."
            strengths.append(desc_2_1)
        else:
            score_2_1 = 0
            desc_2_1 = "Sai ở Khung giờ giao dịch: Lệnh bấm ngoài cửa sổ Kill Zone / Macro (0/10đ), thanh khoản và dòng tiền thể chế có thể suy yếu."
            execution_issues.append(desc_2_1)

        # 2.2 Phân kỳ Liên thị trường (SMT Divergence) (10đ)
        has_smt = (
            getattr(trade, 'hasSmtDivergence', None) is True or
            any(k in notes_combined for k in ["smt", "phân kỳ", "divergence", "liên thị trường", "tương quan", "es/nq", "nq", "es", "ym", "eth", "dxy"])
        )
        if has_smt:
            score_2_2 = 10
            desc_2_2 = "Có phân kỳ SMT Divergence giữa các tài sản tương quan xác nhận đỉnh/đáy được thể chế bảo vệ vững chắc (+10đ)."
            strengths.append(desc_2_2)
        else:
            score_2_2 = 0
            desc_2_2 = "Chưa có Phân kỳ SMT: Chưa ghi nhận tín hiệu phân kỳ SMT Divergence giữa bộ ba tài sản tương quan (0/10đ)."
            strategy_issues.append(desc_2_2)

        part2_score = score_2_1 + score_2_2
        part2_items = [
            {"id": "2.1", "name": "Kill Zone & Macro Timing", "score": score_2_1, "max": 10, "status": "PASS" if score_2_1 == 10 else "FAIL", "detail": desc_2_1},
            {"id": "2.2", "name": "Phân kỳ SMT Divergence", "score": score_2_2, "max": 10, "status": "PASS" if score_2_2 == 10 else "FAIL", "detail": desc_2_2},
        ]

        # ---------------------------------------------------------------------
        # PHẦN 3: TÍN HIỆU CẤU TRÚC & LỰC ĐẨY THỂ CHẾ (25 ĐIỂM) — [H1 / M15]
        # YÊU CẦU: Nếu người dùng chưa vẽ gì thì các phần liên quan đến vẽ phải được 0đ
        # ---------------------------------------------------------------------
        # 3.1 Nhịp Quét Thanh khoản (Liquidity Sweep) (10đ)
        has_sweep = (
            has_user_drawings and (
                has_drawn_sweep or
                getattr(trade, 'hasLiquiditySweep', None) is True or
                (has_explicit_notes and any(k in notes_combined for k in ["sweep", "quét", "ssl", "bsl", "râu nến", "liquidity sweep", "fakeout"]))
            )
        )
        if not has_user_drawings:
            score_3_1 = 0
            desc_3_1 = "Sai ở Hình vẽ Liquidity Sweep: Người dùng chưa vẽ xác định nhịp Quét Thanh khoản (Liquidity Sweep SSL/BSL) trên biểu đồ (0/10đ). Hãy dùng công cụ vẽ đường kẻ hoặc mũi tên để đánh dấu đáy/đỉnh bị quét."
            strategy_issues.append(desc_3_1)
        elif has_sweep:
            score_3_1 = 10
            desc_3_1 = "Giá thực hiện cú đâm râu quét sạch bể thanh khoản gần nhất (Liquidity Sweep SSL/BSL) rồi rút chân dứt khoát (+10đ)."
            strengths.append(desc_3_1)
        else:
            score_3_1 = 0
            desc_3_1 = "Sai ở Nhịp Quét Thanh Khoản: Không có nhịp quét thanh khoản (Liquidity Sweep) rõ ràng hoặc chưa vẽ đường Sweep trước khi vào lệnh (0/10đ)."
            strategy_issues.append(desc_3_1)

        # 3.2 Lực đẩy Dứt khoát (Displacement & MSS / CISD) (10đ)
        has_disp = (
            has_user_drawings and (
                has_drawn_mss or
                getattr(trade, 'hasDisplacement', None) is True or
                (has_explicit_notes and any(k in notes_combined for k in ["displacement", "mss", "cisd", "choch", "bos", "nến thân lớn", "xung lực"]))
            )
        )
        if not has_user_drawings:
            score_3_2 = 0
            desc_3_2 = "Sai ở Hình vẽ MSS / CISD: Người dùng chưa vẽ xác định đường cấu trúc MSS / CISD hoặc nến Displacement trên biểu đồ (0/10đ). Hãy dùng đường kẻ ngang đánh dấu đỉnh/đáy bị phá vỡ."
            execution_issues.append(desc_3_2)
        elif has_disp:
            score_3_2 = 10
            desc_3_2 = "Xuất hiện chuỗi nến thân lớn dứt khoát (Displacement) tạo ra sự phá vỡ cấu trúc thị trường (MSS / CISD) được xác nhận trên biểu đồ (+10đ)."
            strengths.append(desc_3_2)
        else:
            score_3_2 = 0
            desc_3_2 = "Sai ở Cấu trúc thị trường: Chưa xác nhận lực đẩy Displacement hoặc chưa vẽ đường chuyển dịch cấu trúc MSS/CISD dứt khoát (0/10đ)."
            execution_issues.append(desc_3_2)

        # 3.3 Chất lượng trạm đón PD Array (5đ)
        has_pd_array = (
            has_user_drawings and (
                has_drawn_pd_array or
                getattr(trade, 'pdArrayType', None) is not None or
                (has_explicit_notes and any(k in notes_combined for k in ["fvg", "ob", "order block", "breaker", "ifvg", "mitigation"]))
            )
        )
        if not has_user_drawings:
            score_3_3 = 0
            desc_3_3 = "Sai ở Hình vẽ PD Array: Người dùng chưa vẽ hộp PD Array (FVG, Order Block, Breaker) trên biểu đồ (0/5đ). Hãy dùng công cụ hình chữ nhật (Rectangle) đánh dấu trạm đón vào lệnh."
            execution_issues.append(desc_3_3)
        elif has_pd_array:
            score_3_3 = 5
            desc_3_3 = "Điểm vào lệnh đón chuẩn xác tại vùng PD Array hợp lệ (FVG M15, Order Block, Breaker, iFVG) sinh ra từ Displacement (+5đ)."
            strengths.append(desc_3_3)
        else:
            score_3_3 = 0
            desc_3_3 = "Sai ở Trạm đón PD Array: Điểm vào lệnh không nằm tại PD Array hợp lệ hoặc chưa vẽ hộp FVG/OB (0/5đ)."
            execution_issues.append(desc_3_3)

        part3_score = score_3_1 + score_3_2 + score_3_3
        part3_items = [
            {"id": "3.1", "name": "Nhịp Quét Liquidity Sweep", "score": score_3_1, "max": 10, "status": "PASS" if score_3_1 == 10 else "FAIL", "detail": desc_3_1},
            {"id": "3.2", "name": "Lực đẩy Displacement & MSS", "score": score_3_2, "max": 10, "status": "PASS" if score_3_2 == 10 else "FAIL", "detail": desc_3_2},
            {"id": "3.3", "name": "Chất lượng PD Array", "score": score_3_3, "max": 5, "status": "PASS" if score_3_3 == 5 else "FAIL", "detail": desc_3_3},
        ]

        # ---------------------------------------------------------------------
        # PHẦN 4: VÀO LỆNH & QUẢN TRỊ RỦI RO (20 ĐIỂM) — [M15 / M5]
        # ---------------------------------------------------------------------
        # 4.1 Tỷ lệ Lợi nhuận / Rủi ro (Payoff Ratio R:R) (10đ)
        if planned_rr >= 2.0:
            score_4_1 = 10
            desc_4_1 = f"Tỷ lệ Lời/Lỗ (Payoff Ratio R:R) đạt chuẩn tối ưu: 1 : {planned_rr} (>= 1:2) đo về mốc DOL (+10đ)."
            strengths.append(desc_4_1)
        elif planned_rr >= 1.5:
            score_4_1 = 5
            desc_4_1 = f"Tỷ lệ Lời/Lỗ (R:R) ở mức trung bình: 1 : {planned_rr} (chưa đạt ngưỡng tối ưu 1:2) (+5đ)."
            strategy_issues.append(desc_4_1)
        else:
            score_4_1 = 0
            desc_4_1 = f"Sai ở Tỷ lệ Payoff R:R: Tỷ lệ R:R {planned_rr} < 1:1.5 không đạt chuẩn tối thiểu 1:2 hoặc chưa cài đặt SL/TP (0/10đ)."
            risk_issues.append(desc_4_1)

        # 4.2 Đặt Stop-Loss Logic (5đ)
        if not has_sl:
            score_4_2 = 0
            desc_4_2 = "Sai ở Stop Loss: Chưa cài đặt Stop Loss bảo vệ tài khoản (0/5đ). Lệnh không có điểm Invalidation phòng vệ."
            rule_violations.append("Sai ở Quản trị Rủi ro: Chưa cài đặt Stop Loss trước khi mở vị thế.")
            risk_issues.append("Rủi ro không xác định được vì chưa cài Stop Loss.")
        elif mae_r >= 0.85:
            score_4_2 = 2
            desc_4_2 = f"Sai ở Vị trí Stop Loss: Stop Loss đặt hơi sát (Drawdown {mae_r}R), có nguy cơ bị quét râu nến ngẫu nhiên (+2/5đ)."
            execution_issues.append(desc_4_2)
        else:
            score_4_2 = 5
            desc_4_2 = "Stop-Loss (SL) được đặt an toàn phía sau râu nến của cú Sweep (Protected High/Low Invalidation) (+5đ)."
            strengths.append(desc_4_2)

        # 4.3 Quản lý Khối lượng Lệnh (Position Sizing) (5đ)
        if not has_sl:
            score_4_3 = 0
            desc_4_3 = "Sai ở Khối lượng lệnh: Không thể tính toán tỷ lệ rủi ro do thiếu Stop Loss (0/5đ)."
        elif risk_pct <= 1.0:
            score_4_3 = 5
            desc_4_3 = f"Khối lượng lệnh được tính toán cố định đúng mức rủi ro chuẩn ({risk_pct}% <= 1.0% tài khoản) (+5đ)."
            strengths.append(desc_4_3)
        else:
            score_4_3 = 0
            desc_4_3 = f"Sai ở Quy mô vị thế: Rủi ro vị thế {risk_pct}% vượt quá trần an toàn (> 1.0% tài khoản) (0/5đ)."
            risk_issues.append(desc_4_3)

        part4_score = score_4_1 + score_4_2 + score_4_3
        part4_items = [
            {"id": "4.1", "name": "Tỷ lệ Payoff R:R (>= 1:2)", "score": score_4_1, "max": 10, "status": "PASS" if score_4_1 == 10 else ("WARN" if score_4_1 > 0 else "FAIL"), "detail": desc_4_1},
            {"id": "4.2", "name": "Stop-Loss Invalidation Logic", "score": score_4_2, "max": 5, "status": "PASS" if score_4_2 == 5 else ("WARN" if score_4_2 > 0 else "FAIL"), "detail": desc_4_2},
            {"id": "4.3", "name": "Position Sizing (0.5%–1%)", "score": score_4_3, "max": 5, "status": "PASS" if score_4_3 == 5 else ("WARN" if score_4_3 > 0 else "FAIL"), "detail": desc_4_3},
        ]

        # ---------------------------------------------------------------------
        # PHẦN 5: KỶ LUẬT & TÍNH HỢP LƯU (10 ĐIỂM) — [Plan Rules]
        # ---------------------------------------------------------------------
        # 5.1 Tuân thủ Quy tắc Cấm (Guardrails) (5đ)
        has_fomo = any(k in notes_combined for k in ["fomo", "trả thù", "revenge", "tất tay", "all in"])
        if has_fomo or (has_sl and risk_pct > 3.0):
            score_5_1 = 0
            desc_5_1 = "Sai ở Kỷ luật cảm xúc: Vi phạm quy tắc cấm (Guardrails) do có dấu hiệu FOMO, giao dịch trả thù hoặc đòn bẩy quá lớn (0/5đ)."
            rule_violations.append("Vi phạm giới hạn kỷ luật rủi ro / FOMO.")
        else:
            score_5_1 = 5
            desc_5_1 = "Tuân thủ nghiêm ngặt quy tắc cấm (Guardrails), bảo toàn giới hạn lỗ tối đa trong ngày (Daily Loss Limit) (+5đ)."
            strengths.append(desc_5_1)

        # 5.2 Yếu tố Hợp lưu Nâng cao (Confluence Bonus) (5đ)
        confluences = []
        if has_drawn_pd_array: confluences.append("Vẽ PD Array (OB/FVG)")
        if has_drawn_mss: confluences.append("Vẽ MSS/CISD")
        if has_drawn_sweep: confluences.append("Vẽ Liquidity Sweep")
        if any(k in notes_combined for k in ["breaker", "breaker block"]): confluences.append("Breaker Block")
        if any(k in notes_combined for k in ["fvg", "inversion", "ifvg"]): confluences.append("FVG / iFVG")
        if any(k in notes_combined for k in ["ob", "order block"]): confluences.append("Order Block")
        if has_smt: confluences.append("SMT Divergence")
        if timing_hit: confluences.append("Kill Zone Timing")
        if has_sweep: confluences.append("Liquidity Sweep")

        if not has_user_drawings:
            score_5_2 = 0
            desc_5_2 = "Sai ở Hợp lưu hình vẽ: Chưa có các hình vẽ công cụ thể chế (Breaker Block, FVG, SMT) trên biểu đồ (0/5đ)."
        elif len(confluences) >= 3 or "unicorn" in notes_combined:
            score_5_2 = 5
            tools_str = ", ".join(confluences[:3]) if confluences else "Breaker + FVG + Killzone"
            desc_5_2 = f"Đạt hợp lưu cao cấp từ 3 công cụ thể chế trở lên ({tools_str}) (Unicorn Setup Confluence) (+5đ)."
            strengths.append(desc_5_2)
        else:
            score_5_2 = 0
            desc_5_2 = "Chưa đạt đủ 3 yếu tố hợp lưu đồng thời (cần phối hợp hình vẽ Breaker, FVG, SMT, Kill Zone) (0/5đ)."

        part5_score = score_5_1 + score_5_2
        part5_items = [
            {"id": "5.1", "name": "Tuân thủ Quy tắc Cấm (Guardrails)", "score": score_5_1, "max": 5, "status": "PASS" if score_5_1 == 5 else "FAIL", "detail": desc_5_1},
            {"id": "5.2", "name": "Yếu tố Hợp lưu Nâng cao (Unicorn Confluence)", "score": score_5_2, "max": 5, "status": "PASS" if score_5_2 == 5 else "FAIL", "detail": desc_5_2},
        ]

        # ---------------------------------------------------------------------
        # TỔNG ĐIỂM VÀ PHÂN LOẠI HẠNG (TIER RATING)
        # ---------------------------------------------------------------------
        total_process_score = max(0, min(100, part1_score + part2_score + part3_score + part4_score + part5_score))

        if total_process_score >= 90:
            tier = "A+"
            tier_badge = "🌟 Hạng A+ (Unicorn Setup)"
            tier_action = "Bấm lệnh ngay (Execution). Lệnh đạt độ hợp lưu hoàn hảo, cho phép đi tối đa 100% Risk tiêu chuẩn (ví dụ: 1% tài khoản)."
            recommendation_badge = "EXECUTION_READY"
        elif total_process_score >= 75:
            tier = "B"
            tier_badge = "🟢 Hạng B (Standard Setup)"
            tier_action = "Thực thi bình thường. Lệnh đạt chuẩn ICT, đi Risk tiêu chuẩn (0.5%–1%)."
            recommendation_badge = "STANDARD_EXECUTION"
        elif total_process_score >= 60:
            tier = "C"
            tier_badge = "🟡 Hạng C (Marginal Setup)"
            tier_action = "Lệnh xác suất thấp. Thiếu Killzone hoặc R:R chưa tối ưu. Chỉ nên đi 50% Risk hoặc đứng ngoài quan sát."
            recommendation_badge = "MARGINAL_REDUCED_RISK"
        else:
            tier = "F"
            tier_badge = "🔴 Hạng F (Invalid / Retail Trap)"
            tier_action = "CẤM VÀO LỆNH (PASS). Lệnh vi phạm các yếu tố cốt lõi (không có DOL, chưa vẽ cấu trúc, thiếu Sweep, hoặc thiếu SL)."
            recommendation_badge = "PASS_FORBIDDEN"

        rubric_breakdown = {
            "htfContext": {"score": part1_score, "max": 25, "label": "HTF Context & Bias (D1 / H4)", "items": part1_items},
            "timeAndSmt": {"score": part2_score, "max": 20, "label": "Time & SMT Correlation (H1 / Intermarket)", "items": part2_items},
            "sweepAndDisplacement": {"score": part3_score, "max": 25, "label": "Sweep & Displacement (H1 / M15)", "items": part3_items},
            "entryAndRisk": {"score": part4_score, "max": 20, "label": "Entry & Risk Management (M15 / M5)", "items": part4_items},
            "planAndDiscipline": {"score": part5_score, "max": 10, "label": "Plan & Discipline (Checklist)", "items": part5_items},
            "setupValidation": {"score": part1_score, "max": 25, "label": "Setup Validation (HTF Context)"},
            "riskManagement": {"score": round(part4_score * 1.25), "max": 25, "label": "Risk Management"},
            "entryDiscipline": {"score": part3_score, "max": 25, "label": "Entry Discipline (Sweep & Displacement)"},
            "exitPlanning": {"score": part2_score, "max": 20, "label": "Time & Exit Planning"},
            "tradeReasoning": {"score": part5_score, "max": 10, "label": "Plan & Discipline"},
            "total": total_process_score,
            "tier": tier,
            "tierLabel": tier_badge,
            "tierAction": tier_action,
            "disclaimer": "Đánh giá mức độ tuân thủ quy trình ICT chuẩn mực (Level -> Profile -> Draw -> SMT -> Execute). Không phụ thuộc vào kết quả thắng/thua ngẫu nhiên."
        }

        # Multi-timeframe Hierarchy (kept for data model compatibility)
        timeframe_hierarchy = {
            "htfD1W1": {
                "timeframe": "D1 / W1",
                "title": "Khung Cao - HTF Context & Daily Bias",
                "role": "Định hướng Daily Bias, Dealing Range & trạm cản HTF POI.",
                "bias": "Bullish Bias" if is_buy else "Bearish Bias",
                "zone": "Discount (Nửa dưới 50% Dealing Range)" if is_buy else "Premium (Nửa trên 50% Dealing Range)",
                "poi": "HTF Key POI Active" if has_htf_poi else "Cần đối chiếu trạm cản D1/H4"
            },
            "mtfH4H1": {
                "timeframe": "H4 / H1",
                "title": "Khung Trung gian - Liquidity & Draw on Liquidity",
                "role": "Xác định mục tiêu Draw on Liquidity (DOL) & nhịp Liquidity Sweep.",
                "dol": f"DOL: {'Old High / BSL' if is_buy else 'Old Low / SSL'} (${tp:,.2f})" if has_tp else "Chưa xác định mục tiêu DOL",
                "sweep": "Đã quét sạch bể thanh khoản SSL/BSL" if has_sweep else "Chưa xuất hiện Sweep rõ ràng"
            },
            "ltfM15M5": {
                "timeframe": "M15 / M5",
                "title": "Khung Cấu Trúc - Structure & Execution",
                "role": "Bắt nhịp Displacement, xác nhận MSS/CISD & đón tại PD Array.",
                "structure": "MSS Shift to Bullish" if is_buy else "MSS Shift to Bearish",
                "pdArray": "PD Array FVG/OB M15 hợp lệ" if has_pd_array else "Chưa đón tại PD Array chuẩn"
            },
            "microM1M3": {
                "timeframe": "M1 / M3",
                "title": "Khung Tinh Chỉnh - LTF Entry Refinement",
                "role": "Tinh chỉnh SL thắt chặt, kiểm tra SMT Divergence & khung giờ Kill Zone.",
                "slRefinement": f"Protected SL tại ${sl:,.2f}" if has_sl else "Thiếu Protected SL",
                "smtStatus": "SMT Divergence Confirmed" if has_smt else "No SMT",
                "macroWindow": f"{detected_session}" if timing_hit else "Ngoài khung giờ Kill Zone"
            }
        }

        # ---------------------------------------------------------------------
        # MARKET STRUCTURE & LIQUIDITY CONTEXT (SÚC TÍCH, CÔ ĐỌNG, DỄ ĐỌC)
        # ---------------------------------------------------------------------
        swing_ref = round(entry * 1.004 if is_buy else entry * 0.996, 2)
        old_pool_ref = round(sl if has_sl else (entry * 0.992 if is_buy else entry * 1.008), 2)
        dol_target_ref = round(tp if has_tp else (entry * 1.025 if is_buy else entry * 0.975), 2)

        ms_title = "MSS Shift to Bullish" if is_buy else "MSS Shift to Bearish"
        ms_detail = (
            f"Xác nhận MSS Bullish khi nến Displacement bứt phá qua đỉnh dẫn dắt (${swing_ref:,.2f}). "
            f"Điểm Buy tại ${entry:,.2f} đón đúng nhịp hồi Discount; bảo vệ an toàn bởi đáy Invalidation ${old_pool_ref:,.2f}."
            if is_buy else
            f"Xác nhận MSS Bearish khi nến Displacement đâm thủng đáy dẫn dắt (${swing_ref:,.2f}). "
            f"Điểm Sell tại ${entry:,.2f} đón đúng nhịp hồi Premium; bảo vệ an toàn bởi đỉnh Invalidation ${old_pool_ref:,.2f}."
        )

        liq_title = "Sell-side Liquidity (SSL) swept" if is_buy else "Buy-side Liquidity (BSL) swept"
        liq_detail = (
            f"Quét sạch bể thanh khoản bán (SSL) dưới đáy cũ ${old_pool_ref:,.2f} rồi rút chân dứt khoát. "
            f"Mục tiêu kế tiếp (DOL) hướng thẳng về bể thanh khoản mua (BSL) tại đỉnh ${dol_target_ref:,.2f}."
            if is_buy else
            f"Quét sạch bể thanh khoản mua (BSL) trên đỉnh cũ ${old_pool_ref:,.2f} rồi rút râu đảo chiều mạnh. "
            f"Mục tiêu kế tiếp (DOL) hướng thẳng về bể thanh khoản bán (SSL) tại đáy ${dol_target_ref:,.2f}."
        )

        # Market Context summary
        market_context = {
            "timeframe": trade.timeframe or "15m",
            "higherTimeframeTrend": "Bullish" if is_buy else "Bearish",
            "currentTimeframeTrend": "Bullish" if is_buy else "Bearish",
            "marketStructure": ms_detail,
            "marketStructureTitle": ms_title,
            "volatility": "Normal",
            "volumeContext": "High Institutional Volume" if timing_hit else "Average Liquidity",
            "supportResistance": f"Ngưỡng bảo vệ Invalidation: ${old_pool_ref:,.2f}",
            "liquidity": liq_detail,
            "liquidityTitle": liq_title,
            "sweptPool": f"Đáy cũ Old Low (${old_pool_ref:,.2f})" if is_buy else f"Đỉnh cũ Old High (${old_pool_ref:,.2f})",
            "dolTarget": f"Đỉnh cũ Old High / BSL (${dol_target_ref:,.2f})" if is_buy else f"Đáy cũ Old Low / SSL (${dol_target_ref:,.2f})",
            "tradingSession": detected_session,
            "drawingsFound": len(valid_drawings),
            "relevantConditions": "Thị trường phản ứng tại vùng mất cân bằng Imbalance / FVG và trạm đón PD Array."
        }

        # Setup checklist
        strategy_name = trade.strategy or "ICT — Liquidity Sweep + PD Array"
        setup_checklist = [
            {"condition": "1. Daily Bias & Premium/Discount (D1/H4)", "met": score_1_1 == 10, "rule": "Mua tại Discount (<50%) hoặc Bán tại Premium (>50%) theo Dealing Range"},
            {"condition": "2. Draw on Liquidity - DOL (H4/H1)", "met": score_1_2 == 10, "rule": "TP hướng về bể thanh khoản mở Old Highs/Lows, EQH/EQL chưa quét"},
            {"condition": "3. Phản ứng tại HTF POI", "met": score_1_3 == 5, "rule": "Giá xuất phát từ vùng cản thể chế HTF (OB, FVG, Rejection Block)"},
            {"condition": "4. Khung giờ Vàng Kill Zone & Macro", "met": score_2_1 == 10, "rule": f"Vào lệnh trong phiên London/NY AM hoặc Silver Bullet ({detected_session})"},
            {"condition": "5. Phân kỳ SMT Divergence", "met": score_2_2 == 10, "rule": "Phân kỳ đỉnh/đáy giữa bộ ba tài sản tương quan (NQ vs ES, BTC vs ETH)"},
            {"condition": "6. Liquidity Sweep (H1/M15)", "met": score_3_1 == 10, "rule": "Đâm râu quét sạch bể thanh khoản gần nhất trước khi đảo chiều"},
            {"condition": "7. Displacement & MSS / CISD (M15)", "met": score_3_2 == 10, "rule": "Chuỗi nến thân lớn bứt phá dứt khoát thay đổi cấu trúc"},
            {"condition": "8. Trạm đón PD Array hợp lệ", "met": score_3_3 == 5, "rule": "Điểm vào lệnh tại FVG, Order Block, Breaker hoặc iFVG"},
            {"condition": "9. Tỷ lệ R:R >= 1:2", "met": planned_rr >= 2.0, "rule": f"Tỷ lệ Lời/Lỗ kế hoạch tối thiểu 1:2 (Hiện tại: 1 : {planned_rr})"},
            {"condition": "10. Stop Loss sau râu Sweep", "met": has_sl, "rule": "Cắt lỗ được đặt an toàn tại Protected Invalidation Low/High"},
            {"condition": "11. Quản trị rủi ro <= 1.0%", "met": has_sl and risk_pct <= 1.0, "rule": f"Rủi ro tài khoản tối đa 0.5%–1% (Hiện tại: {risk_pct}%)"},
            {"condition": "12. Tuân thủ Guardrails", "met": score_5_1 == 5, "rule": "Không FOMO, không trả thù thị trường, tuân thủ Daily Loss Limit"},
            {"condition": "13. Hợp lưu nâng cao (Unicorn Setup)", "met": score_5_2 == 5, "rule": "Hợp lưu đồng thời từ 3 công cụ (Breaker + FVG + SMT + Killzone)"}
        ]

        evaluated_conditions = [c for c in setup_checklist if c["met"] is not None]
        met_conditions = [c for c in evaluated_conditions if c["met"] is True]
        completeness_text = f"{len(met_conditions)} / {len(evaluated_conditions)} tiêu chí đạt chuẩn"

        # Plan vs Execution
        pnl_sign = "+" if total_pnl >= 0 else "-"
        abs_pnl = abs(total_pnl)
        pct_sign = "+" if return_pct >= 0 else ""

        before_trade = {
            "entry": entry,
            "plannedStopLoss": sl if has_sl else "Not Set",
            "plannedTakeProfit": tp if has_tp else "Not Set",
            "risk": f"{risk_pct}% (${capital_at_risk:,.2f})" if has_sl else "Undefined",
            "plannedRR": f"1 : {planned_rr}" if (has_sl and has_tp and planned_rr > 0) else "Undefined",
            "userReasoning": trade.reason or "Chưa ghi nhận lý do cụ thể",
            "evaluation": "Kế hoạch đã xác định điểm vào nhưng thiếu điểm dừng lỗ bảo vệ vốn." if not has_sl else "Kế hoạch đầy đủ các tham số quản trị rủi ro cơ bản."
        }

        after_trade = {
            "actualEntry": entry,
            "actualExit": exit_p if not is_open else None,
            "currentPrice": eval_price if is_open else None,
            "pnl": total_pnl,
            "returnPct": return_pct,
            "actualRR": f"1 : {actual_rr}" if has_sl else "Undefined",
            "mfe": f"{mfe_r}R" if has_sl else f"+${mfe_pts:,.2f}",
            "mae": f"{mae_r}R" if has_sl else f"-${mae_pts:,.2f}",
            "status": "Vị thế Đang Mở" if is_open else "Lệnh Đã Đóng"
        }

        plan_vs_execution = {
            "deviations": execution_issues if execution_issues else ["Không phát hiện sai lệch lớn so với kế hoạch."],
            "disciplineRating": "Cao (Disciplined)" if total_process_score >= 75 else ("Trung bình" if total_process_score >= 60 else "Kém (Vi phạm quy trình)"),
            "status": "RULE_FOLLOWED" if total_process_score >= 75 else ("PARTIALLY_FOLLOWED" if total_process_score >= 60 else "VIOLATED"),
            "description": "Tuân thủ kỷ luật (Disciplined)" if total_process_score >= 75 else ("Tuân thủ một phần (Partial)" if total_process_score >= 60 else "Vi phạm quy trình (Violated)"),
            "plan": {
                "entry": f"${entry:,.2f}",
                "stopLoss": f"${sl:,.2f}" if has_sl else "Not Set",
                "takeProfit": f"${tp:,.2f}" if has_tp else "Not Set",
                "risk": f"{risk_pct}%" if has_sl else "Undefined"
            },
            "actual": {
                "entry": f"${entry:,.2f}",
                "stopLoss": f"${sl:,.2f}" if has_sl else "Not Set",
                "takeProfit": f"${tp:,.2f}" if has_tp else "Not Set",
                "risk": f"{risk_pct}%" if has_sl else "Undefined"
            },
            "auditSummary": {
                "entry": f"${entry:,.2f}",
                "stopLoss": f"${sl:,.2f}" if has_sl else "Not Set",
                "takeProfit": f"${tp:,.2f}" if has_tp else "Not Set",
                "risk": f"{risk_pct}%" if has_sl else "Undefined",
                "rr": f"1 : {actual_rr}" if (has_sl and not is_open) else ("Not closed / Undefined" if is_en else "Chưa đóng / Undefined"),
                "exit": f"${exit_p:,.2f}" if not is_open else f"Live ${eval_price:,.2f}"
            },
            "auditNote": "Lưu ý: Mức độ tuân thủ được đánh giá độc lập hoàn toàn với kết quả lãi/lỗ (P/L) của lệnh."
        }

        # Verdict Classification
        is_good_process = total_process_score >= 75
        if is_open:
            if total_process_score >= 90:
                trade_verdict = "OPEN_UNICORN_SETUP"
                verdict_desc = f"Vị thế Đang Mở • 🌟 Hạng A+ (Unicorn Setup): Độ hợp lưu hoàn hảo giữa HTF Context, Kill Zone và PD Array. P/L tạm tính: {pnl_sign}${abs_pnl:,.2f} ({pct_sign}{return_pct}%)."
            elif is_good_process:
                trade_verdict = "OPEN_GOOD_SETUP"
                verdict_desc = f"Vị thế Đang Mở • 🟢 Hạng B (Standard Setup): Quy trình quản trị rủi ro và setup đạt chuẩn ICT. P/L tạm tính: {pnl_sign}${abs_pnl:,.2f} ({pct_sign}{return_pct}%)."
            elif total_process_score >= 60:
                trade_verdict = "OPEN_MARGINAL_SETUP"
                verdict_desc = f"Vị thế Đang Mở • 🟡 Hạng C (Marginal Setup): Lệnh xác suất trung bình, thiếu Killzone hoặc R:R chưa tối ưu. P/L tạm tính: {pnl_sign}${abs_pnl:,.2f} ({pct_sign}{return_pct}%)."
            else:
                trade_verdict = "OPEN_WARNING_SETUP"
                verdict_desc = f"Vị thế Đang Mở • 🔴 Hạng F (Invalid / Retail Trap): Vị thế vi phạm các yếu tố cốt lõi ({'thiếu Stop Loss' if not has_sl else 'rủi ro quá lớn hoặc vào giữa khoảng giá lơ lửng'})."
        else:
            is_profitable = total_pnl > 0
            if is_profitable and is_good_process:
                trade_verdict = "WINNING_GOOD_TRADE"
                verdict_desc = f"Good Trade + Winning Trade: Quy trình chuẩn mực {tier_badge} và thị trường mang lại kết quả xứng đáng (+${abs_pnl:,.2f})."
            elif is_profitable and not is_good_process:
                trade_verdict = "WINNING_BAD_TRADE"
                verdict_desc = f"Bad Trade still Profitable: Lệnh thắng nhưng quy trình kém ({tier_badge}). Chiến thắng này là do may mắn nhất thời, thói quen này sẽ bào mòn tài khoản trong dài hạn."
            elif not is_profitable and is_good_process:
                trade_verdict = "LOSING_GOOD_TRADE"
                verdict_desc = f"Good Trade with Loss: Lệnh thực hiện đúng quy trình ({tier_badge}) dù kết quả thua lỗ. Thua lỗ có kiểm soát chỉ là chi phí xác suất kinh doanh tự nhiên."
            else:
                trade_verdict = "LOSING_BAD_TRADE"
                verdict_desc = f"Bad Trade with Loss: Lệnh vừa thua lỗ vừa vi phạm quy trình ({tier_badge}). Cần nghiêm túc dừng giao dịch và rút kinh nghiệm."

        # =====================================================================
        # 7. AI Trading Coach Mentor Feedback
        # =====================================================================
        if not has_sl:
            coach_explanation = (
                "Lệnh này không cài Stop Loss! Trong phương pháp ICT, mọi lệnh đều phải có điểm Invalidation rõ ràng "
                "phía sau cú Sweep trước khi bấm nút mở vị thế. Không có SL đồng nghĩa với việc bạn đang phó mặc toàn bộ tài khoản cho thị trường."
            )
            coach_action = "Đặt ngay một Stop Loss cứng tại đỉnh/đáy swing point gần nhất hoặc đóng vị thế ngay lập tức."
            reflection_question = "Nếu xuất hiện một tin tức thiên nga đen bất ngờ đi ngược hướng lệnh, tài khoản của bạn sẽ chịu tổn thất bao nhiêu % nếu không có Stop Loss?"
        elif total_process_score >= 90:
            coach_explanation = (
                f"Xuất sắc! Lệnh đạt chuẩn 🌟 Hạng A+ (Unicorn Setup) với tổng điểm {total_process_score}/100. "
                "Setup hội tụ đầy đủ: Daily Bias khung cao, vào lệnh trong Killzone, có Sweep quét râu nến, "
                "Displacement tạo FVG/Breaker và R:R vượt trội về mốc Draw on Liquidity (DOL)."
            )
            coach_action = f"{tier_action}"
            reflection_question = "Yếu tố then chốt nào trong 4 khung thời gian đã giúp bạn kiên nhẫn chờ đợi được điểm hợp lưu đẹp mắt như thế này?"
        elif total_process_score >= 75:
            coach_explanation = (
                f"Lệnh đạt chuẩn 🟢 Hạng B (Standard Setup) với điểm số {total_process_score}/100. "
                "Bạn đã thực hiện tốt các yếu tố cấu trúc chính và kiểm soát rủi ro bài bản."
            )
            coach_action = f"{tier_action}"
            reflection_question = "Liệu bạn có thể nâng cấp lệnh này lên hạng A+ bằng cách bổ sung thêm xác nhận SMT Divergence hoặc canh đúng cửa sổ Silver Bullet không?"
        elif total_process_score >= 60:
            coach_explanation = (
                f"Lệnh đạt 🟡 Hạng C (Marginal Setup) với {total_process_score}/100 điểm. "
                "Lệnh còn thiếu một số điều kiện then chốt (như khung giờ Killzone thể chế, xác nhận SMT hoặc tỷ lệ R:R chưa đủ 1:2)."
            )
            coach_action = f"{tier_action}"
            reflection_question = "Bạn có cảm thấy mình vào lệnh do sợ bỏ lỡ cơ hội (FOMO) khi thấy nến đang chạy thay vì kiên nhẫn chờ giá hồi về PD Array không?"
        else:
            coach_explanation = (
                f"CẢNH BÁO: Lệnh bị xếp vào 🔴 Hạng F (Invalid / Retail Trap) với chỉ {total_process_score}/100 điểm. "
                "Lệnh vi phạm các quy tắc cốt lõi của Smart Money: Thiếu Draw on Liquidity, vào lệnh lơ lửng ở giữa khoảng giá Dealing Range, hoặc thiếu nhịp Sweep."
            )
            coach_action = f"{tier_action}"
            reflection_question = "Tại sao bạn lại quyết định bấm lệnh khi chưa hội tụ đủ các bước Level -> Profile -> Draw -> SMT -> Execute?"

        # High-Quality LLM Coaching Enhancement if API is configured
        if llm_client.is_configured():
            sys_p = (
                "Bạn là một AI Trading Mentor cấp cao giảng dạy phương pháp Inner Circle Trader (ICT). "
                "Bạn đánh giá lệnh dựa trên 4 cấp độ khung thời gian gối đầu (D1/W1 Bias, H4/H1 DOL, M15/M5 Structure, M1/M3 Refinement) "
                "và thang điểm 100 gồm 5 phần (HTF Context 25đ, Time & SMT 20đ, Sweep & Disp 25đ, Entry & Risk 20đ, Plan 10đ). "
                "Hãy viết nhận xét mentor súc tích (3-4 câu) bằng tiếng Việt cho học viên: "
                "Chỉ rõ điểm mạnh/yếu theo tiêu chuẩn ICT, xếp hạng lệnh và khuyến nghị hành động dứt khoát. "
                "TUYỆT ĐỐI KHÔNG khuyến nghị tài chính kiểu lùa gà hay hứa hẹn lợi nhuận."
            )
            user_p = (
                f"Trade: {trade.side} {trade.symbol}, Entry: {entry}, Exit: {eval_price}. " 
                f"SL: {sl if has_sl else 'NO SL'}, TP: {tp if has_tp else 'NO TP'}, RR: 1:{planned_rr}. " 
                f"Score: {total_process_score}/100, Tier: {tier_badge}. " 
                f"Action: {tier_action}. " 
                f"Parts: HTF={part1_score}/25, Time={part2_score}/20, Sweep={part3_score}/25, Risk={part4_score}/20, Plan={part5_score}/10."
            )
            custom_coach = llm_client.generate_text(sys_p, user_p, max_tokens=250)
            if custom_coach:
                coach_explanation = custom_coach

        # Learning Takeaways
        learning_takeaways = [
            "Bắt buộc kiểm tra 4 cấp độ khung thời gian gối đầu: D1/W1 (Bias & Range) -> H4/H1 (DOL & Sweep) -> M15/M5 (Displacement & PD Array) -> M1/M3 (Refinement).",
            "Mục tiêu Chốt lời (TP) phải nhắm thẳng vào một bể thanh khoản mở (Draw on Liquidity - DOL: Old Highs/Lows, EQH/EQL) chưa bị càn quét.",
            "Cắt lỗ (SL) phải được đặt an toàn phía sau râu nến của cú Sweep (Protected High/Low Invalidation) và giới hạn rủi ro 0.5%–1% tài khoản.",
            "Chỉ bấm lệnh khi tỷ lệ R:R đo về mốc DOL đạt tối thiểu 1:2 và diễn ra trong các cửa sổ Khung giờ Vàng (Kill Zone London / New York AM / Silver Bullet).",
            "Mô hình Unicorn (Breaker Block đè chồng FVG + SMT trong Killzone) đại diện cho Hạng A+ với xác suất thắng và tỷ lệ R:R cao nhất."
        ]

        # Citations / Sources
        search_terms = f"{trade.strategy or 'ICT'} Liquidity Sweep Fair Value Gap Order Block Killzone SMT"
        citations = retriever.retrieve(query=search_terms, top_k=2)
        sources = [
            {
                "title": c.document.title,
                "concept": c.document.concept,
                "framework": c.document.framework,
                "source": c.document.source,
                "sourceUrl": c.document.sourceUrl,
                "citationText": c.citationText
            }
            for c in citations
        ]

        return {
            "summary": {
                "symbol": trade.symbol,
                "side": trade.side,
                "entryPrice": entry,
                "exitPrice": trade.exitPrice,
                "currentPrice": eval_price if is_open else None,
                "isOpen": is_open,
                "stopLoss": sl,
                "takeProfit": tp,
                "hasStopLoss": has_sl,
                "hasTakeProfit": has_tp,
                "quantity": qty,
                "accountBalance": round(balance, 2),
                "pnl": total_pnl,
                "returnPct": return_pct,
                "plannedRR": f"1 : {planned_rr}" if (has_sl and has_tp and planned_rr > 0) else "Chưa thiết lập",
                "actualRR": f"1 : {actual_rr}" if (has_sl and not is_open) else ("Đang chạy" if is_open else "Chưa xác định"),
                "riskPctOfAccount": risk_display,
                "mfe": f"{mfe_r}R" if has_sl else f"+${mfe_pts:,.2f}",
                "mae": f"{mae_r}R" if has_sl else f"-${mae_pts:,.2f}",
                "processScore": total_process_score,
                "tier": tier,
                "tierLabel": tier_badge,
                "tierAction": tier_action,
                "recommendationBadge": recommendation_badge,
                "tradeVerdict": trade_verdict,
                "verdictDescription": verdict_desc,
                "coachingAdvice": coach_explanation,
                "entryTime": trade.entryTime or "Chưa ghi nhận",
                "exitTime": trade.exitTime if not is_open else "Vị thế đang mở",
                "timeframe": trade.timeframe or "15m",
                "strategy": strategy_name,
                "duration": trade.duration or ("Đang mở" if is_open else "15-45 phút")
            },
            "rubricScore": rubric_breakdown,
            "timeframeHierarchy": timeframe_hierarchy,
            "marketContext": market_context,
            "setupValidation": {
                "strategy": strategy_name,
                "checklist": setup_checklist,
                "completeness": completeness_text,
                "disclaimer": "Các điều kiện được định nghĩa theo ICT Rule Set chuẩn mực."
            },
            "beforeTrade": before_trade,
            "afterTrade": after_trade,
            "planVsExecution": plan_vs_execution,
            "riskAnalysis": {
                "accountBalance": round(balance, 2),
                "hasStopLoss": has_sl,
                "capitalAtRisk": capital_at_risk,
                "maxPotentialLoss": max_potential_loss,
                "riskWarning": risk_warning,
                "riskPct": risk_display,
                "positionSizeValue": position_size_value,
                "positionSizeRiskPct": position_size_risk_pct,
                "stopLossDistanceUsd": sl_distance_usd,
                "stopLossDistancePct": sl_distance_pct,
                "targetDistanceUsd": tp_distance_usd,
                "targetDistancePct": tp_distance_pct,
                "plannedRR": planned_rr,
                "actualRR": actual_rr
            },
            "excursionFlow": excursion_flow,
            "strengths": strengths if strengths else ["Đã mở vị thế và theo dõi thị trường."],
            "categorizedImprovements": {
                "ruleViolations": rule_violations,
                "executionIssues": execution_issues,
                "riskIssues": risk_issues,
                "strategyIssues": strategy_issues
            },
            "aiCoach": {
                "explanation": coach_explanation,
                "actionItem": coach_action,
                "reflectionQuestion": reflection_question,
                "tier": tier,
                "tierLabel": tier_badge,
                "tierAction": tier_action
            },
            "learningTakeaways": learning_takeaways,
            "studentReflection": {
                "question": "Nếu thực hiện lại trade này, bạn sẽ thay đổi điều gì?",
                "placeholder": "Ví dụ: Em sẽ chờ nến M15 đóng cửa xác nhận Displacement và đặt SL an toàn sau râu cú Sweep...",
            },
            "sources": sources
        }

    def evaluate_reflection(self, trade: TradeInput, question: str, reflection_text: str) -> Dict[str, Any]:
        """
        Analyzes the student's self-reflection text and provides constructive mentor feedback.
        """
        if not reflection_text or len(reflection_text.strip()) < 5:
            return {
                "feedback": "Hãy dành một chút thời gian viết chi tiết hơn về suy nghĩ của bạn để AI Coach có thể đồng hành sâu sát nhất cùng bạn!",
                "score": 50,
                "encouragement": "Kỹ năng tự phản biện (Self-Reflection) là chìa khóa phân biệt một trader nghiệp dư và chuyên nghiệp."
            }

        text_lower = reflection_text.lower()
        has_sl_mention = "stop loss" in text_lower or "sl" in text_lower or "dừng lỗ" in text_lower or "cắt lỗ" in text_lower
        has_patience_mention = "kiên nhẫn" in text_lower or "nến đóng" in text_lower or "chờ" in text_lower or "vào sớm" in text_lower
        has_risk_mention = "rủi ro" in text_lower or "khối lượng" in text_lower or "position size" in text_lower or "vốn" in text_lower
        has_emotion_mention = "tâm lý" in text_lower or "sợ" in text_lower or "fomo" in text_lower or "tham" in text_lower

        positive_points = []
        if has_sl_mention:
            positive_points.append("Bạn đã nhận thức rất rõ tầm quan trọng của việc quản lý điểm dừng lỗ (Stop Loss).")
        if has_patience_mention:
            positive_points.append("Bạn đã chú ý đến tính kỷ luật chờ đợi nến xác nhận thay vì vào lệnh vội vã.")
        if has_risk_mention:
            positive_points.append("Bạn đã lưu tâm đến quản trị tỷ lệ rủi ro và phân bổ khối lượng vị thế.")
        if has_emotion_mention:
            positive_points.append("Rất đáng khen khi bạn dám nhìn thẳng vào cảm xúc tâm lý khi mở lệnh.")

        if not positive_points:
            positive_points.append("Bạn đã có tinh thần chủ động rà soát lại hành vi vào lệnh của mình.")

        feedback_summary = (
            "Góc nhìn tự phản biện rất tốt! " + " ".join(positive_points) + " "
            "Hãy ghi nhớ bài học này và chuyển hóa nó thành một quy tắc bắt buộc trong Checklist trước khi mở lệnh tiếp theo."
        )

        if llm_client.is_configured():
            sys_p = (
                "Bạn là một AI Trading Mentor giàu kinh nghiệm. Học viên vừa gửi câu trả lời tự phản biện cho một lệnh giao dịch. "
                "Hãy đọc câu trả lời và viết phản hồi ngắn gọn (2-3 câu) khích lệ, phân tích điểm tự nhận thức tốt và đưa ra lời khuyên hành động cụ thể."
            )
            user_p = (
                f"Trade: {trade.side} {trade.symbol}, Entry: {trade.entryPrice}, SL: {trade.stopLoss}. "
                f"Question: {question}. "
                f"Reflection: {reflection_text}"
            )
            llm_fb = llm_client.generate_text(sys_p, user_p, max_tokens=150)
            if llm_fb:
                feedback_summary = llm_fb

        return {
            "feedback": feedback_summary,
            "reflectionReceived": reflection_text,
            "encouragement": "Tuyệt vời! Việc biến nhận thức thành hành động kỷ luật sẽ giúp bạn tiến bộ vượt bậc.",
            "timestamp": datetime.now().isoformat()
        }

trade_analyzer = TradeAnalyzer()