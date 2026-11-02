import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI
from app.api.routes import market, replay, simulation, ai
from app.api.v1 import payment as payment_v1
from app.api.v1 import subscription as subscription_v1
from app.api.v1 import ai_tutor as ai_tutor_v1

app = FastAPI(title="StockSim Python Service")

# V1 Public & Integration API Routers
app.include_router(payment_v1.router, prefix="/api/v1/payment", tags=["Payment & PayOS"])
app.include_router(subscription_v1.router, prefix="/api/v1/subscription", tags=["Subscription"])
app.include_router(ai_tutor_v1.router, prefix="/api/v1/ai-tutor", tags=["AI Tutor v1"])

# Internal Microservice Routers
app.include_router(market.router, prefix="/internal/market", tags=["Market"])
app.include_router(replay.router, prefix="/internal/replay", tags=["Replay"])
app.include_router(simulation.router, prefix="/internal/simulation", tags=["Simulation"])
app.include_router(ai.router, prefix="/internal/ai", tags=["AI Tutor & Trade Analysis"])

@app.get("/")
@app.head("/")
def root():
    return {"status": "ok", "service": "stocksim-python", "message": "StockSim Python Service is running"}

@app.get("/health")
@app.head("/health")
def health_check():
    return {"status": "ok", "service": "stocksim-python"}


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", os.getenv("PYTHON_PORT", "8000")))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
