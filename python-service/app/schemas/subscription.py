from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class SubscriptionResponse(BaseModel):
    success: bool = True
    plan: str
    dailyAiLimit: int
    dailyAiUsed: int
    remainingToday: int
    chatLimit: int = 10
    chatUsed: int = 0
    remainingChat: int = 10
    inspectLimit: int = 2
    inspectUsed: int = 0
    remainingInspect: int = 2
    isUnlimited: bool = False
    premiumExpiresAt: Optional[datetime] = None
    isPremium: bool = False
    lastActiveDate: str = ""
