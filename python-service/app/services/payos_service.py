import time
import random
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from app.core.config import (
    PAYOS_CLIENT_ID,
    PAYOS_API_KEY,
    PAYOS_CHECKSUM_KEY,
    PAYOS_RETURN_URL,
    PAYOS_CANCEL_URL,
    PLAN_PLUS_PRICE,
    PLAN_PRO_PRICE,
    PREMIUM_MONTHLY_PRICE
)
from app.core.database import get_payments_collection
from app.services.subscription_service import subscription_service

logger = logging.getLogger("payos_service")

class PayOSService:
    def __init__(self):
        self.client_id = PAYOS_CLIENT_ID
        self.api_key = PAYOS_API_KEY
        self.checksum_key = PAYOS_CHECKSUM_KEY
        self.return_url = PAYOS_RETURN_URL
        self.cancel_url = PAYOS_CANCEL_URL
        self._payos_client = None

    def _get_client(self):
        if self._payos_client is None:
            if not (self.client_id and self.api_key and self.checksum_key):
                raise ValueError("PayOS credentials (PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY) are missing in environment.")
            try:
                from payos import PayOS
                self._payos_client = PayOS(
                    client_id=self.client_id,
                    api_key=self.api_key,
                    checksum_key=self.checksum_key
                )
            except Exception as e:
                logger.error(f"Failed to initialize PayOS SDK client: {e}")
                raise
        return self._payos_client

    def generate_unique_order_code(self) -> int:
        """
        Generates a unique numeric order code (6 to 9 digits).
        Checks the database for collisions and regenerates if a collision occurs.
        """
        col = get_payments_collection()
        max_attempts = 10
        for _ in range(max_attempts):
            # Numeric order code within 1..999,999,999
            now_ms = int(time.time() * 1000)
            rand_suffix = random.randint(10, 99)
            code = (now_ms + rand_suffix) % 900000000 + 100000000  # 9-digit number
            existing = col.find_one({"order_code": code})
            if not existing:
                return code
        # Fallback timestamp code
        return int(time.time()) % 1000000000

    def create_payment_link(
        self, 
        user_id: str, 
        plan: str = "PLUS",
        return_url: Optional[str] = None,
        cancel_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Creates a PayOS payment link for the authenticated user.
        Supports:
        - Gói PLUS: 129.000₫ / 30 ngày (300 Chat, 150 Chấm bài)
        - Gói PRO: 299.000₫ / 30 ngày (Không giới hạn toàn bộ)
        Stores the pending payment in the database.
        """
        if not (self.client_id and self.api_key and self.checksum_key):
            return {
                "success": False,
                "message": "Cổng thanh toán PayOS chưa được cấu hình (thiếu API Keys trong .env).",
                "orderCode": 0,
                "checkoutUrl": ""
            }

        effective_return_url = return_url or self.return_url
        effective_cancel_url = cancel_url or self.cancel_url

        order_code = self.generate_unique_order_code()
        short_uid = str(user_id)[-8:]

        # Multi-tier plan recognition
        is_pro = "PRO" in str(plan).upper()
        norm_plan = "PRO" if is_pro else "PLUS"

        if is_pro:
            amount = PLAN_PRO_PRICE  # 299.000₫
            item_name = "AI Tutor PRO"
            description = f"PRO {short_uid}"[:25]
        else:
            amount = PLAN_PLUS_PRICE # 129.000₫
            item_name = "AI Tutor PLUS"
            description = f"PLUS {short_uid}"[:25]

        expire_minutes = 10
        expire_timestamp = int(time.time()) + (expire_minutes * 60)
        expired_at_dt = datetime.fromtimestamp(expire_timestamp, tz=timezone.utc)

        try:
            client = self._get_client()
            
            # Using PayOS v1.1.0 payment_requests or legacy createPaymentLink
            try:
                from payos.type import PaymentData, ItemData
                item = ItemData(name=item_name, quantity=1, price=amount)
                payment_data = PaymentData(
                    orderCode=order_code,
                    amount=amount,
                    description=description,
                    items=[item],
                    cancelUrl=effective_cancel_url,
                    returnUrl=effective_return_url,
                    expiredAt=expire_timestamp
                )
                res = client.createPaymentLink(payment_data)
                checkout_url = getattr(res, "checkoutUrl", None) or getattr(res, "checkout_url", "")
                qr_code = getattr(res, "qrCode", None) or getattr(res, "qr_code", None)
            except Exception as legacy_err:
                logger.warning(f"Legacy createPaymentLink failed, attempting payment_requests.create: {legacy_err}")
                from payos.types import CreatePaymentLinkRequest, ItemData
                item = ItemData(name=item_name, quantity=1, price=amount)
                req_obj = CreatePaymentLinkRequest(
                    order_code=order_code,
                    amount=amount,
                    description=description,
                    items=[item],
                    cancel_url=effective_cancel_url,
                    return_url=effective_return_url,
                    expired_at=expire_timestamp
                )
                res = client.payment_requests.create(req_obj)
                checkout_url = res.checkout_url
                qr_code = getattr(res, "qr_code", None)

            # Store pending payment in database
            col = get_payments_collection()
            now_utc = datetime.now(timezone.utc)
            payment_record = {
                "user_id": str(user_id),
                "order_code": order_code,
                "plan": norm_plan,
                "amount": amount,
                "status": "PENDING",
                "payment_provider": "PAYOS",
                "checkout_url": checkout_url,
                "qr_code": qr_code,
                "created_at": now_utc,
                "paid_at": None,
                "expired_at": expired_at_dt
            }
            col.insert_one(payment_record)

            logger.info(f"Created PayOS payment link for user {user_id}, plan {norm_plan} ({amount} VND), order {order_code}")
            return {
                "success": True,
                "orderCode": order_code,
                "checkoutUrl": checkout_url,
                "qrCode": qr_code
            }

        except Exception as e:
            logger.error(f"PayOS createPaymentLink error: {e}", exc_info=True)
            return {
                "success": False,
                "message": f"Không thể tạo liên kết thanh toán: {str(e)}",
                "orderCode": order_code,
                "checkoutUrl": ""
            }

    def verify_and_process_webhook(self, webhook_body: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verifies PayOS webhook signature/checksum and activates Premium subscription idempotently.
        """
        if not (self.client_id and self.api_key and self.checksum_key):
            logger.error("Webhook received but PayOS credentials are not set.")
            return {"success": False, "message": "PayOS credentials not configured"}

        try:
            client = self._get_client()
            
            # Verify signature using PayOS SDK
            verified_data = None
            try:
                verified_data = client.verifyPaymentWebhookData(webhook_body)
            except Exception as v_err:
                logger.warning(f"client.verifyPaymentWebhookData exception: {v_err}. Checking webhooks.verify...")
                try:
                    verified_data = client.webhooks.verify(webhook_body)
                except Exception as w_err:
                    logger.error(f"Webhook signature verification failed: {w_err}")
                    return {"success": False, "message": "Invalid webhook signature or data integrity failed"}

            # Extract webhook attributes
            data_dict = verified_data if isinstance(verified_data, dict) else (
                verified_data.__dict__ if hasattr(verified_data, "__dict__") else webhook_body.get("data", {})
            )
            order_code = data_dict.get("orderCode") or data_dict.get("order_code")
            code = webhook_body.get("code")

            if not order_code:
                logger.error("No orderCode found in verified webhook data.")
                return {"success": False, "message": "Missing orderCode in webhook"}

            # Find payment in DB
            col = get_payments_collection()
            payment = col.find_one({"order_code": int(order_code)})
            if not payment:
                logger.error(f"Payment with orderCode {order_code} not found in database.")
                return {"success": False, "message": f"Order {order_code} not found"}

            # Check Idempotency: If already marked as PAID, do not extend again
            if payment.get("status") == "PAID":
                logger.info(f"Payment {order_code} was already marked as PAID. Returning success without duplicating.")
                return {"success": True, "message": "Payment already processed"}

            # Verify if payment was successful (code == '00')
            success_codes = ["00", 0, "0"]
            if code in success_codes or data_dict.get("code") in success_codes:
                now_utc = datetime.now(timezone.utc)
                # Mark payment as PAID
                col.update_one(
                    {"order_code": int(order_code)},
                    {"$set": {"status": "PAID", "paid_at": now_utc}}
                )

                # Upgrade subscription to specific plan (PLUS or PRO)
                user_id = payment["user_id"]
                target_plan = payment.get("plan", "PLUS")
                subscription_service.upgrade_to_plan(user_id, int(order_code), plan=target_plan)
                logger.info(f"Successfully processed webhook for order {order_code}. Upgraded user {user_id} to {target_plan}.")
                return {"success": True}
            else:
                logger.warning(f"PayOS webhook reported non-success code: {code}")
                col.update_one(
                    {"order_code": int(order_code)},
                    {"$set": {"status": "FAILED"}}
                )
                return {"success": False, "message": f"Payment reported failure code: {code}"}

        except Exception as e:
            logger.error(f"Webhook processing error: {e}", exc_info=True)
            return {"success": False, "message": f"Server webhook error: {str(e)}"}

    def verify_order_payment(self, order_code: int) -> Dict[str, Any]:
        """
        Directly checks order status from PayOS API and upgrades user if PAID.
        Ensures immediate activation even when webhooks cannot reach localhost.
        """
        if not (self.client_id and self.api_key and self.checksum_key):
            return {"success": False, "message": "PayOS credentials not configured"}

        try:
            col = get_payments_collection()
            payment = col.find_one({"order_code": int(order_code)})
            if not payment:
                return {"success": False, "message": f"Order {order_code} not found in database"}

            # If already verified as PAID in database
            if payment.get("status") == "PAID":
                user_id = payment["user_id"]
                sub = subscription_service.get_or_create_subscription(user_id)
                return {
                    "success": True,
                    "status": "PAID",
                    "is_premium": True,
                    "orderCode": order_code,
                    "subscription": sub,
                    "message": "Giao dịch đã được xác nhận thanh toán."
                }

            client = self._get_client()
            order_info = None
            try:
                order_info = client.payment_requests.get(int(order_code))
            except Exception:
                try:
                    order_info = client.getPaymentLinkInformation(int(order_code))
                except Exception as e:
                    logger.error(f"Failed to fetch order info from PayOS for {order_code}: {e}")
                    return {"success": False, "message": f"Cannot query PayOS: {str(e)}"}

            status = getattr(order_info, "status", None)
            if status is None and isinstance(order_info, dict):
                status = order_info.get("status")

            logger.info(f"PayOS API check for order {order_code}: status={status}")

            if status == "PAID":
                now_utc = datetime.now(timezone.utc)
                col.update_one(
                    {"order_code": int(order_code)},
                    {"$set": {"status": "PAID", "paid_at": now_utc}}
                )
                user_id = payment["user_id"]
                target_plan = payment.get("plan", "PLUS")
                sub = subscription_service.upgrade_to_plan(user_id, int(order_code), plan=target_plan)
                logger.info(f"Verified order {order_code} as PAID. Upgraded user {user_id} to {target_plan}.")
                return {
                    "success": True,
                    "status": "PAID",
                    "is_premium": True,
                    "plan": target_plan,
                    "orderCode": order_code,
                    "subscription": sub,
                    "message": f"Giao dịch đã thanh toán thành công. Kích hoạt tài khoản {target_plan} thành công!"
                }
            elif status in ["CANCELLED", "EXPIRED"]:
                col.update_one(
                    {"order_code": int(order_code)},
                    {"$set": {"status": status}}
                )
                return {
                    "success": False,
                    "status": status,
                    "is_premium": False,
                    "orderCode": order_code,
                    "message": f"Giao dịch đã kết thúc với trạng thái: {status}"
                }
            else:
                return {
                    "success": True,
                    "status": status or "PENDING",
                    "is_premium": False,
                    "orderCode": order_code,
                    "message": "Giao dịch đang chờ thanh toán"
                }

        except Exception as e:
            logger.error(f"Error verifying order {order_code}: {e}", exc_info=True)
            return {"success": False, "message": f"Lỗi khi xác minh giao dịch: {str(e)}"}

payos_service = PayOSService()

