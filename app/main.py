from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import asyncio
import os
import json
from dotenv import load_dotenv
try:
    from prometheus_fastapi_instrumentator import Instrumentator
except ImportError:
    Instrumentator = None

load_dotenv()

from app.core.database import engine
from app.models.base import Base
import app.models  # registers all models with Base

# API Routers
from app.api.auth import router as auth_router
from app.api.mood import router as mood_router
from app.api.journal import router as journal_router
from app.api.appointments import router as appointments_router
from app.api.risk import router as risk_router
from app.api.chat import router as chat_router
from app.api.psychologist import router as psychologist_router
from app.api.emergency import router as emergency_router
from app.api.community import router as community_router
from app.api.sleep import router as sleep_router
from app.api.storage import router as storage_router
from app.api.habits import router as habits_router
from app.api.admin import router as admin_router
from app.api.privacy import router as privacy_router
from app.api.plan import router as plan_router
from app.api.notifications import router as notifications_router
from app.api.clinical import router as clinical_router
from app.api.call_signaling import router as call_signaling_router
from app.api.flashcards import router as flashcards_router

# ── Create all tables, ensure upload storage directory exists, & seed demo users ─
Base.metadata.create_all(bind=engine)
os.makedirs("uploads", exist_ok=True)
try:
    from migrate_db import migrate
    migrate()
except Exception as e:
    print(f"Schema migration note: {e}")

try:
    from app.core.seed import seed_demo_accounts
    seed_demo_accounts()
except Exception as e:
    print(f"Failed to seed demo accounts: {e}")

app = FastAPI(
    title="MindBridge AI — VIT Institutional API",
    description="Privacy-first AI mental health mobile application for Vishnu Institute of Technology. Three user levels: Student · Psychologist · Admin.",
    version="1.0.0",
)

# ── Rate Limiter ───────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ───────────────────────────────────────────────────────────────────────
origins_env = os.getenv("CORS_ORIGINS", "")
custom_origins = [origin.strip() for origin in origins_env.split(",") if origin.strip() and origin.strip() != "*"]

default_origins = [
    "capacitor://localhost",
    "http://localhost",
    "https://localhost",
    "http://127.0.0.1",
    "https://127.0.0.1",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://localhost:8080",
]
origins = list(set(default_origins + custom_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^(https?|capacitor)://(localhost|127\.0\.0\.1)(:\d+)?$|^https?://.*\.vercel\.app$|^https?://.*\.onrender\.com$|^https?://.*\.vishnu\.edu\.in$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Security Headers ───────────────────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# ── Mount Static Storage ───────────────────────────────────────────────────────
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── Register API Routers ───────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(mood_router)
app.include_router(journal_router)
app.include_router(appointments_router)
app.include_router(risk_router)
app.include_router(chat_router)
app.include_router(psychologist_router)
app.include_router(emergency_router)
app.include_router(community_router)
app.include_router(sleep_router)
app.include_router(storage_router)
app.include_router(habits_router)
app.include_router(admin_router)
app.include_router(privacy_router)
app.include_router(plan_router, prefix="/api/plans")
app.include_router(plan_router, prefix="/api/plan")
app.include_router(notifications_router)
app.include_router(clinical_router)
app.include_router(call_signaling_router)
app.include_router(flashcards_router)

# ── Metrics ────────────────────────────────────────────────────────────────────
if Instrumentator:
    Instrumentator().instrument(app).expose(app)

# ── Health Check ───────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["system"])
async def health_check():
    return {
        "status": "ok",
        "service": "MindBridge AI — Vishnu Institute of Technology",
        "version": "1.0.0",
        "platform": "institutional-mobile-app",
        "user_levels": ["student", "psychologist", "admin"],
    }

# ── Legacy mock analytics (psychologist dashboard fallback) ────────────────────
@app.get("/api/analytics/pulse", tags=["analytics"])
async def get_clinical_pulse():
    """Quick clinical pulse endpoint — real data sourced from /api/risk/analytics."""
    return {
        "active_students": 1402,
        "high_risk_alerts": 3,
        "avg_resolution_mins": 14,
        "sentiment_trend": "-12%",
    }

# ── Direct App Download Endpoints ──────────────────────────────────────────────
@app.get("/download", tags=["downloads"])
@app.get("/download-apk", tags=["downloads"])
async def download_apk():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(
        url="https://github.com/yochitcheedella/mind_bridge/releases/download/v1.2/MindBridge-VIT.apk",
        status_code=302
    )

# ── Static SPA Frontend Serving (Full Production Deployment Ready) ─────────────
if os.path.exists("dist"):
    from fastapi.responses import FileResponse
    if os.path.exists("dist/assets"):
        app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Allow API and websocket routes to bypass
        if full_path.startswith("api/") or full_path.startswith("ws/"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Not found")
        file_path = os.path.join("dist", full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse("dist/index.html")
