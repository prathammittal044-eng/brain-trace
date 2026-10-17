"""
DemenX Backend — Configuration

All settings are loaded from environment variables with sensible defaults.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Resolve paths relative to backend/ directory
BACKEND_DIR = Path(__file__).resolve().parent

# Load .env file from backend or root directory if present
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(BACKEND_DIR.parent / ".env")

# --- Database ---
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{BACKEND_DIR / 'demenx.db'}"
)

# --- Security / JWT ---
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "demenx-secure-dev-secret-key-32chars-min-change-in-prod")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_SECONDS = int(os.getenv("JWT_EXPIRATION_SECONDS", 86400))  # 24 hours
SESSION_COOKIE_NAME = "demenx_session"

# --- Gemini API ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# --- Model paths ---
def _resolve_backend_path(raw_val: str, default_path: Path) -> str:
    if not raw_val:
        return str(default_path)
    p = Path(raw_val)
    if not p.is_absolute():
        p = (BACKEND_DIR / p).resolve()
    return str(p)

MODEL1_PATH = _resolve_backend_path(
    os.getenv("MODEL1_PATH", ""),
    BACKEND_DIR.parent / "model1_things" / "checkpoints" / "best_model1.pth"
)
MODEL2_PATH = _resolve_backend_path(
    os.getenv("MODEL2_PATH", ""),
    BACKEND_DIR.parent / "model2_things" / "checkpoints" / "best_model2.pth"
)

# --- Directories ---
_upload_raw = os.getenv("UPLOAD_DIR", "uploads")
_results_raw = os.getenv("RESULTS_DIR", "results")

UPLOAD_DIR = Path(_resolve_backend_path(_upload_raw, BACKEND_DIR / "uploads"))
RESULTS_DIR = Path(_resolve_backend_path(_results_raw, BACKEND_DIR / "results"))


# Create directories on import so they always exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

# --- Upload limits ---
MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE", 50 * 1024 * 1024))  # 50 MB

# --- CORS ---
_cors_raw = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173")
CORS_ORIGINS: list[str] = [origin.strip() for origin in _cors_raw.split(",") if origin.strip()]

# --- Device ---
DEVICE_SETTING = os.getenv("DEVICE", "auto")  # "cuda", "cpu", or "auto"

# --- Supported image extensions ---
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".dcm"}
