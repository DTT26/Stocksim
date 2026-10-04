from datetime import datetime, date, timezone, timedelta
from typing import Dict, Any, Optional, Tuple
from pymongo import ReturnDocument
import logging
from app.core.database import get_subscriptions_collection
from app.core.config import (
    FREE_DAILY_LIMIT,
    INSPECT_FREE_DAILY_LIMIT,
    PLAN_PLUS_PRICE,
    PLAN_PLUS_DAYS,
    PLAN_PLUS_MONTHLY_CHAT_LIMIT,
    PLAN_PLUS_MONTHLY_INSPECT_LIMIT,
    PLAN_PRO_PRICE,
    PLAN_PRO_DAYS,
    PLAN_PRO_MONTHLY_CHAT_LIMIT,
    PLAN_PRO_MONTHLY_INSPECT_LIMIT,
    PREMIUM_DAILY_LIMIT,
    PREMIUM_MONTHLY_DAYS
)

logger = logging.getLogger("subscription_service")

class SubscriptionService:
    def __init__(self):
        pass

    def get_or_create_subscription(self, user_id: str) -> Dict[str, Any]:
        """
        Retrieves user subscription or creates a default FREE subscription.
        Automatically checks and resets daily quota and subscription expiration.
        """
        col = get_subscriptions_collection()
        sub = col.find_one({"user_id": str(user_id)})

        today_str = date.today().isoformat()
        now_utc = datetime.now(timezone.utc)

        if not sub:
            default_sub = {
                "user_id": str(user_id),
                "plan": "FREE",
                "daily_ai_limit": FREE_DAILY_LIMIT,
                "daily_ai_used": 0,
                "daily_inspect_limit": INSPECT_FREE_DAILY_LIMIT,
                "daily_inspect_used": 0,
                "monthly_chat_limit": FREE_DAILY_LIMIT,
                "monthly_chat_used": 0,
                "monthly_inspect_limit": INSPECT_FREE_DAILY_LIMIT,
                "monthly_inspect_used": 0,
                "last_active_date": today_str,
                "premium_expires_at": None,
                "payos_order_id": None,
                "created_at": now_utc,
                "updated_at": now_utc
            }
            try:
                col.insert_one(default_sub)
                sub = default_sub
            except Exception as e:
                # Concurrent creation edge-case
                sub = col.find_one({"user_id": str(user_id)})
                if not sub:
                    raise e

        # Check and apply daily reset and plan expiration
        sub = self.check_and_reset_daily(sub)
        return sub

    def check_and_reset_daily(self, sub: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enforces daily quota reset when last_active_date < today.
        Downgrades expired PLUS / PRO / PREMIUM plans to FREE plan.
        """
        col = get_subscriptions_collection()
        user_id = sub["user_id"]
        today_str = date.today().isoformat()
        now_utc = datetime.now(timezone.utc)

        needs_update = False
        updates: Dict[str, Any] = {}

        # 1. Reset daily count if date has rolled over
        last_active = sub.get("last_active_date", "")
        if str(last_active) < today_str:
            updates["daily_ai_used"] = 0
            updates["daily_inspect_used"] = 0
            updates["last_active_date"] = today_str
            sub["daily_ai_used"] = 0
            sub["daily_inspect_used"] = 0
            sub["last_active_date"] = today_str
            needs_update = True

        # 2. Check Plan expiration for paid tiers
        plan = sub.get("plan", "FREE")
        prem_exp = sub.get("premium_expires_at")

        if plan in ["PLUS", "PRO", "PREMIUM"] and prem_exp is not None:
            # Ensure prem_exp is timezone-aware
            if isinstance(prem_exp, datetime):
                if prem_exp.tzinfo is None:
                    prem_exp = prem_exp.replace(tzinfo=timezone.utc)
                if now_utc > prem_exp:
                    logger.info(f"Subscription {plan} for user {user_id} expired at {prem_exp}. Reverting to FREE.")
                    updates["plan"] = "FREE"
                    updates["daily_ai_limit"] = FREE_DAILY_LIMIT
                    updates["daily_inspect_limit"] = INSPECT_FREE_DAILY_LIMIT
                    updates["monthly_chat_limit"] = FREE_DAILY_LIMIT
                    updates["monthly_inspect_limit"] = INSPECT_FREE_DAILY_LIMIT
                    updates["premium_expires_at"] = None
                    sub["plan"] = "FREE"
                    sub["daily_ai_limit"] = FREE_DAILY_LIMIT
                    sub["daily_inspect_limit"] = INSPECT_FREE_DAILY_LIMIT
                    sub["monthly_chat_limit"] = FREE_DAILY_LIMIT
                    sub["monthly_inspect_limit"] = INSPECT_FREE_DAILY_LIMIT
                    sub["premium_expires_at"] = None
                    needs_update = True

        if needs_update:
            updates["updated_at"] = now_utc
            col.update_one({"user_id": user_id}, {"$set": updates})

        return sub

    def reserve_quota_slot(self, user_id: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Concurrency-safe atomic reservation of 1 AI Chat slot.
        - PRO: Unlimited (no cap, increments monthly_chat_used for auditing)
        - PLUS: 300 chats / 30-day cycle
        - FREE: 10 chats / day
        Returns: (success, updated_subscription_or_current)
        """
        col = get_subscriptions_collection()
        sub = self.get_or_create_subscription(user_id)
        plan = sub.get("plan", "FREE")
        now_utc = datetime.now(timezone.utc)

        # 1. Gói PRO: Không giới hạn toàn bộ
        if plan == "PRO":
            updated_sub = col.find_one_and_update(
                {"user_id": str(user_id)},
                {
                    "$inc": {"monthly_chat_used": 1, "daily_ai_used": 1},
                    "$set": {"updated_at": now_utc}
                },
                return_document=ReturnDocument.AFTER
            )
            return True, (updated_sub or sub)

        # 2. Gói PLUS: 300 lượt chat / 30 ngày
        if plan in ["PLUS", "PREMIUM"]:
            limit = sub.get("monthly_chat_limit", PLAN_PLUS_MONTHLY_CHAT_LIMIT)
            used = sub.get("monthly_chat_used", 0)
            if used >= limit:
                return False, sub

            updated_sub = col.find_one_and_update(
                {
                    "user_id": str(user_id),
                    "monthly_chat_used": {"$lt": limit}
                },
                {
                    "$inc": {"monthly_chat_used": 1, "daily_ai_used": 1},
                    "$set": {"updated_at": now_utc}
                },
                return_document=ReturnDocument.AFTER
            )
            if updated_sub is None:
                current_sub = col.find_one({"user_id": str(user_id)}) or sub
                return False, current_sub
            return True, updated_sub

        # 3. Gói FREE: 10 lượt chat / ngày
        limit = sub.get("daily_ai_limit", FREE_DAILY_LIMIT)
        used = sub.get("daily_ai_used", 0)
        if used >= limit:
            return False, sub

        updated_sub = col.find_one_and_update(
            {
                "user_id": str(user_id),
                "daily_ai_used": {"$lt": limit}
            },
            {
                "$inc": {"daily_ai_used": 1, "monthly_chat_used": 1},
                "$set": {"updated_at": now_utc}
            },
            return_document=ReturnDocument.AFTER
        )
        if updated_sub is None:
            current_sub = col.find_one({"user_id": str(user_id)}) or sub
            return False, current_sub
        return True, updated_sub

    def rollback_quota_slot(self, user_id: str):
        """
        Rolls back 1 reserved chat quota slot if the LLM request failed.
        """
        col = get_subscriptions_collection()
        try:
            col.update_one(
                {
                    "user_id": str(user_id),
                    "daily_ai_used": {"$gt": 0}
                },
                {
                    "$inc": {"daily_ai_used": -1, "monthly_chat_used": -1},
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                }
            )
            logger.info(f"Rolled back chat quota slot for user {user_id} after LLM failure.")
        except Exception as e:
            logger.error(f"Failed to rollback chat quota for user {user_id}: {e}")

    def reserve_inspect_slot(self, user_id: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Concurrency-safe atomic reservation of 1 Chart Drawing Inspection slot.
        - PRO: Unlimited (no cap, increments monthly_inspect_used for auditing)
        - PLUS: 150 inspections / 30-day cycle
        - FREE: 2 inspections / day
        Returns: (success, updated_subscription_or_current)
        """
        col = get_subscriptions_collection()
        sub = self.get_or_create_subscription(user_id)
        plan = sub.get("plan", "FREE")
        now_utc = datetime.now(timezone.utc)

        # 1. Gói PRO: Không giới hạn
        if plan == "PRO":
            updated_sub = col.find_one_and_update(
                {"user_id": str(user_id)},
                {
                    "$inc": {"monthly_inspect_used": 1, "daily_inspect_used": 1},
                    "$set": {"updated_at": now_utc}
                },
                return_document=ReturnDocument.AFTER
            )
            return True, (updated_sub or sub)

        # 2. Gói PLUS: 150 lượt chấm / 30 ngày
        if plan in ["PLUS", "PREMIUM"]:
            limit = sub.get("monthly_inspect_limit", PLAN_PLUS_MONTHLY_INSPECT_LIMIT)
            used = sub.get("monthly_inspect_used", 0)
            if used >= limit:
                return False, sub

            updated_sub = col.find_one_and_update(
                {
                    "user_id": str(user_id),
                    "monthly_inspect_used": {"$lt": limit}
                },
                {
                    "$inc": {"monthly_inspect_used": 1, "daily_inspect_used": 1},
                    "$set": {"updated_at": now_utc}
                },
                return_document=ReturnDocument.AFTER
            )
            if updated_sub is None:
                current_sub = col.find_one({"user_id": str(user_id)}) or sub
                return False, current_sub
            return True, updated_sub

        # 3. Gói FREE: 2 lượt chấm / ngày
        limit = sub.get("daily_inspect_limit", INSPECT_FREE_DAILY_LIMIT)
        used = sub.get("daily_inspect_used", 0)
        if used >= limit:
            return False, sub

        updated_sub = col.find_one_and_update(
            {
                "user_id": str(user_id),
                "daily_inspect_used": {"$lt": limit}
            },
            {
                "$inc": {"daily_inspect_used": 1, "monthly_inspect_used": 1},
                "$set": {"updated_at": now_utc}
            },
            return_document=ReturnDocument.AFTER
        )
        if updated_sub is None:
            current_sub = col.find_one({"user_id": str(user_id)}) or sub
            return False, current_sub
        return True, updated_sub

    def rollback_inspect_slot(self, user_id: str):
        """
        Rolls back 1 reserved chart inspect quota slot if request failed.
        """
        col = get_subscriptions_collection()
        try:
            col.update_one(
                {
                    "user_id": str(user_id),
                    "daily_inspect_used": {"$gt": 0}
                },
                {
                    "$inc": {"daily_inspect_used": -1, "monthly_inspect_used": -1},
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                }
            )
            logger.info(f"Rolled back inspect quota slot for user {user_id}.")
        except Exception as e:
            logger.error(f"Failed to rollback inspect quota for user {user_id}: {e}")

    def upgrade_to_plan(self, user_id: str, order_code: int, plan: str = "PLUS") -> Dict[str, Any]:
        """
        Upgrades or extends user to PLUS or PRO plan upon verified payment.
        - Gói PLUS: 129.000₫ / 30 ngày (300 Chat, 150 Chấm bài)
        - Gói PRO: 299.000₫ / 30 ngày (Không giới hạn Chat & Chấm bài)
        If user currently has an active plan that hasn't expired:
            new_expiry = premium_expires_at + 30 days
        Else:
            new_expiry = now + 30 days
        """
        col = get_subscriptions_collection()
        sub = self.get_or_create_subscription(user_id)
        now_utc = datetime.now(timezone.utc)

        plan_str = str(plan).upper()
        norm_plan = "PRO" if "PRO" in plan_str else "PLUS"

        current_exp = sub.get("premium_expires_at")
        if current_exp is not None and isinstance(current_exp, datetime):
            if current_exp.tzinfo is None:
                current_exp = current_exp.replace(tzinfo=timezone.utc)
            if current_exp > now_utc:
                new_expiry = current_exp + timedelta(days=PLAN_PLUS_DAYS)
            else:
                new_expiry = now_utc + timedelta(days=PLAN_PLUS_DAYS)
        else:
            new_expiry = now_utc + timedelta(days=PLAN_PLUS_DAYS)

        if norm_plan == "PRO":
            chat_limit = PLAN_PRO_MONTHLY_CHAT_LIMIT
            inspect_limit = PLAN_PRO_MONTHLY_INSPECT_LIMIT
            daily_limit = 999999
            daily_inspect_limit = 999999
        else:
            chat_limit = PLAN_PLUS_MONTHLY_CHAT_LIMIT
            inspect_limit = PLAN_PLUS_MONTHLY_INSPECT_LIMIT
            daily_limit = chat_limit
            daily_inspect_limit = inspect_limit

        updates = {
            "plan": norm_plan,
            "daily_ai_limit": daily_limit,
            "daily_inspect_limit": daily_inspect_limit,
            "monthly_chat_limit": chat_limit,
            "monthly_chat_used": 0,
            "monthly_inspect_limit": inspect_limit,
            "monthly_inspect_used": 0,
            "daily_ai_used": 0,
            "daily_inspect_used": 0,
            "premium_expires_at": new_expiry,
            "payos_order_id": order_code,
            "last_active_date": date.today().isoformat(),
            "updated_at": now_utc
        }

        col.update_one({"user_id": str(user_id)}, {"$set": updates})
        logger.info(f"User {user_id} upgraded to {norm_plan} until {new_expiry}. Order code: {order_code}")
        sub.update(updates)
        return sub

    def upgrade_to_premium(self, user_id: str, order_code: int) -> Dict[str, Any]:
        """Backward compatible alias: defaults to PLUS plan."""
        return self.upgrade_to_plan(user_id, order_code, plan="PLUS")

subscription_service = SubscriptionService()
