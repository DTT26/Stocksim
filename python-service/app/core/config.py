import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB
MONGO_URI = os.getenv(
    "MONGO_URI", 
    "mongodb+srv://de180115tranvandong_db_user:WM96L8H6biEenBJa@cluster0.yappw0s.mongodb.net/stocksim?retryWrites=true&w=majority&appName=Cluster0"
)
DB_NAME = os.getenv("DB_NAME", "stocksim")

# JWT
JWT_ACCESS_SECRET = os.getenv("JWT_ACCESS_SECRET", "your_jwt_access_secret")

# PayOS Configuration
PAYOS_CLIENT_ID = os.getenv("PAYOS_CLIENT_ID", "")
PAYOS_API_KEY = os.getenv("PAYOS_API_KEY", "")
PAYOS_CHECKSUM_KEY = os.getenv("PAYOS_CHECKSUM_KEY", "")
PAYOS_RETURN_URL = os.getenv("PAYOS_RETURN_URL", "http://localhost:5173/payment/success")
PAYOS_CANCEL_URL = os.getenv("PAYOS_CANCEL_URL", "http://localhost:5173/payment/cancel")

# Centralized Subscription Constants
# 1. Gói FREE (Miễn phí)
FREE_DAILY_LIMIT = 10
INSPECT_FREE_DAILY_LIMIT = 1

# 2. Gói PLUS (129.000₫ / 30 ngày)
PLAN_PLUS_PRICE = 129000
PLAN_PLUS_DAYS = 30
PLAN_PLUS_MONTHLY_CHAT_LIMIT = 300
PLAN_PLUS_MONTHLY_INSPECT_LIMIT = 150

# 3. Gói PRO (299.000₫ / 30 ngày - Không giới hạn toàn bộ)
PLAN_PRO_PRICE = 299000
PLAN_PRO_DAYS = 30
PLAN_PRO_MONTHLY_CHAT_LIMIT = 999999      # Không giới hạn (Unlimited)
PLAN_PRO_MONTHLY_INSPECT_LIMIT = 999999   # Không giới hạn (Unlimited)

# Backward-compatible aliases
PREMIUM_MONTHLY_PRICE = PLAN_PLUS_PRICE
PRO_MONTHLY_PRICE = PLAN_PRO_PRICE
PREMIUM_MONTHLY_DAYS = 30
PREMIUM_DAILY_LIMIT = 500
INSPECT_PREMIUM_DAILY_LIMIT = 20
