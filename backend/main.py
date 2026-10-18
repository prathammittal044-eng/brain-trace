"""
DemenX — AI-Powered Brain Health Screening and Cognitive Monitoring Backend
"""

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
import torch
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import config
from database_init import init_db
from database import engine
from services import model1 as model1_service
from services import model2 as model2_service
from services import gradcam as gradcam_service
from routers import auth, mri, cognitive, appointments, messages, companion, profile, scan_files, care_space

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger("demenx")

# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Startup Security Checks
# ---------------------------------------------------------------------------
_DEFAULT_JWT_SECRET = "demenx-secure-dev-secret-key-32chars-min-change-in-prod"

_ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()

# Guard: reject weak JWT secret in production
if _ENVIRONMENT not in ("development", "dev", "test", "demo") and config.JWT_SECRET_KEY == _DEFAULT_JWT_SECRET:
    raise RuntimeError(
        "[SECURITY] JWT_SECRET_KEY is the insecure default value. "
        "Set a strong, unique JWT_SECRET_KEY environment variable before running in production."
    )

# ---------------------------------------------------------------------------
# Global model references (for backward compatibility with tests & lifespan)
# ---------------------------------------------------------------------------
_model1 = None
_model2 = None
_device = None


def _resolve_device() -> torch.device:
    """Pick CUDA if available and requested, otherwise CPU."""
    setting = config.DEVICE_SETTING.lower()
    if setting == "cuda":
        if torch.cuda.is_available():
            return torch.device("cuda")
        logger.warning("CUDA requested but not available — falling back to CPU")
        return torch.device("cpu")
    if setting == "cpu":
        return torch.device("cpu")
    # auto
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DB and load ML models once at startup."""
    global _model1, _model2, _device

    # 1. Initialize and seed database
    # Seeding only runs when SEED_DEMO_DATA=true (default true for dev/demo).
    # In production, set SEED_DEMO_DATA=false to prevent fabricated records.
    _seed = os.getenv("SEED_DEMO_DATA", "true").lower() in ("true", "1", "yes")
    try:
        init_db(seed=_seed)
    except Exception:
        logger.exception("Failed to initialize database during startup")

    # 2. Resolve Torch Device
    _device = _resolve_device()
    app.state.device = _device
    logger.info("Deep learning compute device: %s", _device)

    # 3. Load Model 1 (MRI Validator) — from HF Hub, local fallback
    try:
        _model1 = model1_service.load_model(
            hf_repo=config.HF_MODEL1_REPO,
            hf_filename=config.HF_MODEL1_FILENAME,
            local_path=config.MODEL1_PATH,
            device=_device,
            hf_token=config.HF_TOKEN,
        )
        app.state.model1 = _model1
        logger.info("✓ Model 1 (MRI vs Non-MRI) ready on %s", _device)
    except Exception:
        logger.exception("Failed to load Model 1 (tried HF Hub + local fallback)")
        _model1 = None
        app.state.model1 = None

    # 4. Load Model 2 (Dementia Classifier) — from HF Hub, local fallback
    try:
        _model2 = model2_service.load_model(
            hf_repo=config.HF_MODEL2_REPO,
            hf_filename=config.HF_MODEL2_FILENAME,
            local_path=config.MODEL2_PATH,
            device=_device,
            hf_token=config.HF_TOKEN,
        )
        app.state.model2 = _model2
        logger.info("✓ Model 2 (Dementia Classifier) ready on %s", _device)
    except Exception:
        logger.exception("Failed to load Model 2 (tried HF Hub + local fallback)")
        _model2 = None
        app.state.model2 = None

    yield  # Application running

    logger.info("DemenX Backend shutting down.")


# ---------------------------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="DemenX API",
    description="AI-Powered Brain Health Screening and Cognitive Monitoring Platform API",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NOTE: /results files are served via the authenticated scan_files router below.
# Do NOT re-add StaticFiles here — that would bypass ownership checks.

# Include Routers
app.include_router(auth.router)
app.include_router(mri.router)
app.include_router(cognitive.router)
app.include_router(appointments.router)
app.include_router(messages.router)
app.include_router(companion.router)
app.include_router(profile.router)
app.include_router(scan_files.router)  # Authenticated scan file delivery
app.include_router(care_space.router)  # Care Space & Connected Care


# ---------------------------------------------------------------------------
# Health and Readiness Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "demenx-backend"}


@app.get("/api/ready")
async def readiness():
    """Verify database and model availability."""
    db_ok = False
    try:
        with engine.connect() as conn:
            db_ok = True
    except Exception:
        db_ok = False

    m1_ok = _model1 is not None
    m2_ok = _model2 is not None

    status_code = 200 if (db_ok and m1_ok) else 503
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ready" if status_code == 200 else "degraded",
            "database": "connected" if db_ok else "unavailable",
            "model1_loaded": m1_ok,
            "model2_loaded": m2_ok,
            "device": str(_device),
        }
    )
