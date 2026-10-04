from fastapi import APIRouter, Depends
import logging
from app.schemas.subscription import SubscriptionResponse
from app.services.subscription_service import subscription_service
from app.api.v1.auth_deps import get_current_user_id
from app.core.config import (
    FREE_DAILY_LIMIT,
    INSPECT_FREE_DAILY_LIMIT,
    PLAN_PLUS_MONTHLY_CHAT_LIMIT,
    PLAN_PLUS_MONTHLY_INSPECT_LIMIT,
    PLAN_PRO_MONTHLY_CHAT_LIMIT,
    PLAN_PRO_MONTHLY_INSPECT_LIMIT
)

logger = logging.getLogger("subscription_router")
router = APIRouter()

@router.get("/me", response_model=SubscriptionResponse)
def get_my_subscription(user_id: str = Depends(get_current_user_id)):
    """
    GET /api/v1/subscription/me
    Retrieves current user's subscription and remaining quota for both Chat and Chart Inspection.
    Syncs with PayOS if user has recent pending orders.
    """
    try:
        from app.core.database import get_payments_collection
        from app.services.payos_service import payos_service
        col_pay = get_payments_collection()
        pending_list = list(col_pay.find({"user_id": str(user_id), "status": "PENDING"}).sort("created_at", -1).limit(3))
        for p in pending_list:
            oc = p.get("order_code")
            if oc:
                v_res = payos_service.verify_order_payment(int(oc))
                if v_res.get("status") == "PAID":
                    break
    except Exception as e:
        logger.warning(f"Error checking pending payments during get_my_subscription: {e}")

    sub = subscription_service.get_or_create_subscription(user_id)
    plan = sub.get("plan", "FREE")
    is_premium = plan in ["PLUS", "PRO", "PREMIUM"]
    is_unlimited = plan == "PRO"

    if plan == "PRO":
        chat_limit = PLAN_PRO_MONTHLY_CHAT_LIMIT
        chat_used = sub.get("monthly_chat_used", 0)
        remaining_chat = 999999

        inspect_limit = PLAN_PRO_MONTHLY_INSPECT_LIMIT
        inspect_used = sub.get("monthly_inspect_used", 0)
        remaining_inspect = 999999

        daily_limit = 999999
        daily_used = sub.get("daily_ai_used", 0)
        remaining_today = 999999
    elif plan in ["PLUS", "PREMIUM"]:
        chat_limit = sub.get("monthly_chat_limit", PLAN_PLUS_MONTHLY_CHAT_LIMIT)
        chat_used = sub.get("monthly_chat_used", 0)
        remaining_chat = max(0, chat_limit - chat_used)

        inspect_limit = sub.get("monthly_inspect_limit", PLAN_PLUS_MONTHLY_INSPECT_LIMIT)
        inspect_used = sub.get("monthly_inspect_used", 0)
        remaining_inspect = max(0, inspect_limit - inspect_used)

        daily_limit = chat_limit
        daily_used = chat_used
        remaining_today = remaining_chat
    else:
        # FREE Plan
        chat_limit = FREE_DAILY_LIMIT
        chat_used = sub.get("daily_ai_used", 0)
        remaining_chat = max(0, chat_limit - chat_used)

        inspect_limit = INSPECT_FREE_DAILY_LIMIT
        inspect_used = sub.get("daily_inspect_used", 0)
        remaining_inspect = max(0, inspect_limit - inspect_used)

        daily_limit = chat_limit
        daily_used = chat_used
        remaining_today = remaining_chat

    expires_at = sub.get("premium_expires_at")

    return SubscriptionResponse(
        success=True,
        plan=plan,
        dailyAiLimit=daily_limit,
        dailyAiUsed=daily_used,
        remainingToday=remaining_today,
        chatLimit=chat_limit,
        chatUsed=chat_used,
        remainingChat=remaining_chat,
        inspectLimit=inspect_limit,
        inspectUsed=inspect_used,
        remainingInspect=remaining_inspect,
        isUnlimited=is_unlimited,
        premiumExpiresAt=expires_at,
        isPremium=is_premium,
        lastActiveDate=sub.get("last_active_date", "")
    )
