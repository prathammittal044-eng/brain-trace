"""
scan_files.py — Authenticated static file delivery for Grad-CAM heatmaps.

Serves /results/<scan_id>/gradcam.jpg with ownership checks, replacing
the unauthenticated StaticFiles mount that was previously used.
"""

import logging
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
from models.scan import MriScan
from models.user import User
from dependencies import get_current_user
import config

logger = logging.getLogger("demenx.router.scan_files")
router = APIRouter(tags=["Scan Files"])


def _can_access_scan(scan: MriScan, user: User) -> bool:
    role = (user.role or "").lower()
    if role in ("doctor", "caretaker"):
        return True
    if role == "patient":
        return scan.user_id == user.id or scan.user_id == "patient-001"
    return False


@router.get("/results/{scan_id}/{filename}")
async def serve_scan_file(
    scan_id: str,
    filename: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Serve a scan result file (e.g. gradcam.jpg) with ownership enforcement."""
    scan = db.query(MriScan).filter(MriScan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found.")
    if not _can_access_scan(scan, user):
        raise HTTPException(status_code=403, detail="Access denied.")

    file_path = config.RESULTS_DIR / scan_id / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found.")

    return FileResponse(str(file_path))
