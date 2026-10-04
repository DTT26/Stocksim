"""
TIME & TRADING SESSION HELPER
Cung cấp thời gian thực tế chuẩn xác (Giờ Việt Nam UTC+7, Giờ UTC, Giờ New York)
và trạng thái các phiên giao dịch (Asian, London, New York) cùng ICT Killzones.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Any

WEEKDAYS_VI = [
    "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"
]

def get_current_time_context() -> Dict[str, Any]:
    """Tính toán thời gian thực tế và phiên giao dịch chuẩn xác."""
    # UTC Time
    utc_now = datetime.now(timezone.utc)
    
    # Vietnam Time (UTC+7)
    vn_tz = timezone(timedelta(hours=7))
    vn_now = utc_now.astimezone(vn_tz)
    
    # US Eastern Time (EDT is UTC-4 from second Sunday in March to first Sunday in November)
    # Simple check for US Daylight Saving Time (March to November)
    is_dst = (utc_now.month > 3 and utc_now.month < 11) or \
             (utc_now.month == 3 and utc_now.day >= 8) or \
             (utc_now.month == 11 and utc_now.day < 7)
    ny_offset = -4 if is_dst else -5
    ny_tz_name = "EDT" if is_dst else "EST"
    ny_now = utc_now.astimezone(timezone(timedelta(hours=ny_offset)))
    
    # Formatting
    weekday_vn = WEEKDAYS_VI[vn_now.weekday()]
    vn_str = f"{vn_now.strftime('%H:%M:%S')}, {weekday_vn}, ngày {vn_now.strftime('%d/%m/%Y')} (Giờ Việt Nam, UTC+7)"
    utc_str = f"{utc_now.strftime('%H:%M:%S')} UTC, ngày {utc_now.strftime('%d/%m/%Y')}"
    ny_str = f"{ny_now.strftime('%H:%M:%S')} {ny_tz_name} (New York, UTC{ny_offset}), ngày {ny_now.strftime('%d/%m/%Y')}"
    
    # Session & Killzone detection (based on UTC hour & minute)
    utc_hour = utc_now.hour
    utc_minute = utc_now.minute
    utc_time_val = utc_hour + utc_minute / 60.0
    
    active_sessions = []
    active_killzones = []
    
    # Asian Session: 00:00 - 09:00 UTC (07:00 - 16:00 VN)
    if 0.0 <= utc_time_val < 9.0:
        active_sessions.append("Phiên Á (Asian Session - Tokyo/Sydney)")
    if 0.0 <= utc_time_val <= 4.0:
        active_killzones.append("Asian Killzone (00:00 - 04:00 UTC)")
        
    # London Session: 07:00 - 16:00 UTC (14:00 - 23:00 VN)
    if 7.0 <= utc_time_val < 16.0:
        active_sessions.append("Phiên London (European Session)")
    if 7.0 <= utc_time_val <= 10.0:
        active_killzones.append("London Open Killzone (07:00 - 10:00 UTC)")
        
    # New York Session: 12:00 - 21:00 UTC (19:00 - 04:00 VN)
    if 12.0 <= utc_time_val < 21.0:
        active_sessions.append("Phiên New York (US Session - Wall Street)")
    if 13.0 <= utc_time_val <= 16.0:
        active_killzones.append("New York AM Killzone (13:00 - 16:00 UTC)")
    if 15.0 <= utc_time_val <= 17.0:
        active_killzones.append("London Close Killzone (15:00 - 17:00 UTC)")
        
    if not active_sessions:
        active_sessions.append("Giao phiên yên ắng / Ngoài giờ cao điểm (Off-peak)")
        
    session_text = ", ".join(active_sessions)
    killzone_text = ", ".join(active_killzones) if active_killzones else "Không trong Killzone ICT trọng điểm"
    
    return {
        "vn_time": vn_str,
        "vn_short": vn_now.strftime('%H:%M:%S'),
        "vn_date": f"{weekday_vn}, ngày {vn_now.strftime('%d/%m/%Y')}",
        "utc_time": utc_str,
        "utc_short": utc_now.strftime('%H:%M:%S UTC'),
        "ny_time": ny_str,
        "active_session": session_text,
        "active_killzone": killzone_text,
        "is_weekend": vn_now.weekday() >= 5
    }

def is_time_query(query: str) -> bool:
    """Kiểm tra câu hỏi có đang hỏi về thời gian/giờ giấc/ngày tháng không."""
    lower = query.lower()
    time_keywords = [
        "hôm nay", "hom nay", "bây giờ", "bay gio", "ngày mấy", "ngay may", "thứ mấy", "thu may",
        "ngày bao nhiêu", "ngay bao nhieu", "năm nay", "nam nay", "năm bao nhiêu", "mấy giờ", "may gio",
        "thời gian", "thoi gian", "giờ hiện tại", "gio hien tai", "phiên", "phien", "killzone",
        "mở cửa", "mo cua", "đóng cửa", "dong cua", "what time", "what day", "what date", "today"
    ]
    return any(kw in lower for kw in time_keywords)
