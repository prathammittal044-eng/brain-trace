"""
MRI Scan and Analysis Router — with authentication and per-record ownership enforcement
"""

import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Depends, File, UploadFile, Request, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import get_db
from models.scan import MriScan
from models.user import User
from dependencies import get_current_user_optional, get_current_user
from services import model1 as model1_service
from services import model2 as model2_service
from services import gradcam as gradcam_service
from utils.image import validate_extension, validate_size, load_and_validate_image, ImageValidationError
import config

logger = logging.getLogger("demenx.router.mri")
router = APIRouter(prefix="/api/v1/mri", tags=["MRI Analysis"])


def _api_response(success: bool, message: str, data=None, status_code: int = 200):
    return JSONResponse(
        status_code=status_code,
        content={"success": success, "message": message, "data": data}
    )


def _generate_report_preview(model1_result: dict, model2_result: dict | None) -> str:
    """Produce a clinical summary preview."""
    if not model1_result["is_mri"]:
        return (
            "The uploaded image was not identified as a brain MRI scan. "
            "Please upload a valid axial, sagittal, or coronal brain MRI image."
        )

    if model2_result is None:
        return "MRI validated, but dementia classification could not be completed."

    pred = model2_result["prediction"]
    conf = model2_result["confidence"]
    pct = f"{conf * 100:.1f}%"

    summaries = {
        "Non Demented": (
            f"The AI analysis indicates no significant signs of dementia (confidence: {pct}). "
            f"Cortical structures appear within normal parameters. Routine monitoring is recommended."
        ),
        "Very Mild Demented": (
            f"The AI analysis suggests very mild indicators of neurocognitive change (confidence: {pct}). "
            f"Consider clinical consultation and baseline neuropsychological tracking."
        ),
        "Mild Demented": (
            f"The AI analysis indicates mild indicators of dementia patterns (confidence: {pct}). "
            f"A comprehensive neurological assessment is strongly advised."
        ),
    }
    return summaries.get(
        pred,
        f"Prediction: {pred} (confidence: {pct}). Please consult a neurologist for comprehensive evaluation."
    )


def _can_read_scan(scan: MriScan, user: User) -> bool:
    """Return True if user is permitted to read this scan record."""
    role = (user.role or "").lower()
    if role in ("doctor", "caretaker"):
        return True
    if role == "patient":
        # Demo patient-001 scans are accessible to all patients to show baseline data
        return scan.user_id == user.id or scan.user_id == "patient-001"
    return False


@router.get("")
async def list_scans(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),   # Requires authentication
):
    """
    List scans for the authenticated user.
    - Patients: see their own scans + the shared demo baseline scans.
    - Doctors/Caretakers: see all scans.
    """
    query = db.query(MriScan)
    role = (user.role or "").lower()
    if role == "patient":
        query = query.filter(MriScan.user_id.in_([user.id, "patient-001"]))
    # doctors and caretakers see all

    scans = query.order_by(MriScan.created_at.desc()).all()

    items = []
    for s in scans:
        dt = s.created_at or datetime.now(timezone.utc)
        conf_str = f"{s.m2_confidence * 100:.1f}%" if s.m2_confidence else (
            f"{s.m1_confidence * 100:.1f}%" if s.m1_confidence else None
        )
        items.append({
            "id": s.id,
            "date": dt.strftime("%d %b %Y"),
            "time": dt.strftime("%I:%M %p"),
            "type": "Brain MRI",
            "uploader": "Uploaded by you",
            "status": s.status,
            "prediction": s.m2_prediction or s.m1_prediction,
            "confidence": conf_str,
            "progress": 100 if s.status == "Completed" else 65,
            "viewType": s.view_type or "axial",
            "verified": s.is_mri,
            "analyzedOn": f"{dt.strftime('%d %b %Y')} • {dt.strftime('%I:%M %p')}",
            "gradcam_url": s.gradcam_url,
            "report_preview": s.report_preview,
            "model_pipeline": s.model_pipeline,
        })

    return _api_response(True, "Scans retrieved successfully.", data=items)


@router.get("/{scan_id}")
async def get_scan(
    scan_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),   # Requires authentication
):
    """Retrieve single scan detail — enforces per-record ownership."""
    s = db.query(MriScan).filter(MriScan.id == scan_id).first()
    if not s:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found.")

    if not _can_read_scan(s, user):
        raise HTTPException(status_code=403, detail="Access denied: this scan does not belong to your account.")

    dt = s.created_at or datetime.now(timezone.utc)
    conf_str = f"{s.m2_confidence * 100:.1f}%" if s.m2_confidence else None
    return _api_response(True, "Scan retrieved.", data={
        "id": s.id,
        "date": dt.strftime("%d %b %Y"),
        "time": dt.strftime("%I:%M %p"),
        "type": "Brain MRI",
        "status": s.status,
        "prediction": s.m2_prediction,
        "confidence": conf_str,
        "viewType": s.view_type,
        "verified": s.is_mri,
        "analyzedOn": f"{dt.strftime('%d %b %Y')} • {dt.strftime('%I:%M %p')}",
        "gradcam_url": s.gradcam_url,
        "report_preview": s.report_preview,
        "model_pipeline": s.model_pipeline,
    })


@router.post("/analyze")
async def analyze_mri(
    file: UploadFile = File(...),
    request: Request = None,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Sequential Brain MRI Analysis:
      1. Validate uploaded image format & bytes
      2. Model 1 (ResNet-18) — Validates Brain MRI vs Non-MRI
      3. If Brain MRI → Model 2 (ResNet-18) — Classifies Dementia Stage
      4. If Brain MRI → Grad-CAM Heatmap Generation
      5. Persist record in database
      6. Return structured prediction and report preview

    Authentication is optional for analysis so the local screening flow can
    be used before account setup. Authenticated uploads retain their owner.

    NOTE: model confidence values represent AI screening output,
    NOT clinically calibrated probability. Always confirm with a neurologist.
    """
    # 1. Validation
    try:
        validate_extension(file.filename or "unknown")
        content = await file.read()
        validate_size(content)
        image = load_and_validate_image(content)
    except ImageValidationError as exc:
        return _api_response(False, str(exc), status_code=400)
    except Exception:
        logger.exception("Unexpected error during image validation")
        return _api_response(False, "Failed to process the uploaded file.", status_code=400)

    # 2. Check model availability from app state
    app = request.app if request else None
    model1 = getattr(app.state, "model1", None) if app else None
    model2 = getattr(app.state, "model2", None) if app else None
    device = getattr(app.state, "device", None) if app else None

    # Fallback import if not on state
    if model1 is None:
        import main
        model1 = getattr(main, "_model1", None)
        model2 = getattr(main, "_model2", None)
        device = getattr(main, "_device", None)

    if model1 is None:
        return _api_response(
            False,
            "Model 1 (MRI validation) is not loaded. Check server logs.",
            status_code=503
        )

    analysis_id = str(uuid.uuid4())
    result_dir = config.RESULTS_DIR / analysis_id
    result_dir.mkdir(parents=True, exist_ok=True)
    original_path = result_dir / "original.jpg"
    image.convert("RGB").save(str(original_path), "JPEG")

    # 3. Model 1 — MRI Validation
    try:
        m1_result = model1_service.predict(model1, image, device)
    except Exception:
        logger.exception("Model 1 inference failed")
        return _api_response(
            False,
            "MRI validation model encountered an error. Please try again.",
            status_code=500
        )

    # If NOT an MRI, reject early
    if not m1_result["is_mri"]:
        report_preview = _generate_report_preview(m1_result, None)
        pipeline_desc = f"Model 1: {m1_result['prediction']} ({m1_result['confidence']*100:.1f}%)"

        scan_record = MriScan(
            id=analysis_id,
            user_id=user.id if user else None,
            filename=file.filename or "uploaded_scan.jpg",
            file_path=str(original_path),
            view_type="axial",
            status="Failed",
            is_mri=False,
            m1_prediction=m1_result["prediction"],
            m1_confidence=m1_result["confidence"],
            report_preview=report_preview,
            model_pipeline=pipeline_desc,
        )
        db.add(scan_record)
        db.commit()

        return _api_response(
            True,
            "Image was not classified as an MRI scan.",
            data={
                "mri_scan_id": analysis_id,
                "filename": file.filename or "unknown",
                "prediction": "Invalid Scan – Not an MRI",
                "confidence": m1_result["confidence"],
                "report_preview": report_preview,
                "model_pipeline": pipeline_desc,
            }
        )

    # 4. Model 2 — Dementia Classification
    if model2 is None:
        report_preview = _generate_report_preview(m1_result, None)
        return _api_response(
            True,
            "MRI validated but dementia classification model is unavailable.",
            data={
                "mri_scan_id": analysis_id,
                "filename": file.filename or "unknown",
                "prediction": "MRI Validated – Classification Unavailable",
                "confidence": m1_result["confidence"],
                "report_preview": report_preview,
                "model_pipeline": f"Model 1: {m1_result['prediction']} ({m1_result['confidence']*100:.1f}%)",
            }
        )

    try:
        m2_result = model2_service.predict(model2, image, device)
    except Exception:
        logger.exception("Model 2 inference failed")
        return _api_response(
            False,
            "Dementia classification model encountered an error.",
            status_code=500
        )

    # 5. Grad-CAM Generation
    gradcam_url = None
    gradcam_path = result_dir / "gradcam.jpg"
    gradcam_ok = gradcam_service.generate(
        model=model2,
        image=image,
        predicted_class_index=m2_result["class_index"],
        device=device,
        output_path=gradcam_path
    )
    if gradcam_ok:
        gradcam_url = f"/results/{analysis_id}/gradcam.jpg"

    # 6. Build response & persist
    report_preview = _generate_report_preview(m1_result, m2_result)
    pipeline_desc = (
        f"Model 1: {m1_result['prediction']} ({m1_result['confidence']*100:.1f}%) → "
        f"Model 2: {m2_result['prediction']} ({m2_result['confidence']*100:.1f}%)"
    )

    scan_record = MriScan(
        id=analysis_id,
        user_id=user.id if user else None,
        filename=file.filename or "uploaded_scan.jpg",
        file_path=str(original_path),
        view_type="axial",
        status="Completed",
        is_mri=True,
        m1_prediction=m1_result["prediction"],
        m1_confidence=m1_result["confidence"],
        m2_prediction=m2_result["prediction"],
        m2_confidence=m2_result["confidence"],
        probabilities_json=json.dumps(m2_result.get("probabilities", {})),
        report_preview=report_preview,
        gradcam_path=str(gradcam_path) if gradcam_ok else None,
        gradcam_url=gradcam_url,
        model_pipeline=pipeline_desc,
    )
    db.add(scan_record)
    db.commit()

    logger.info("Persisted MRI scan %s for user %s", analysis_id, scan_record.user_id)

    return _api_response(
        True,
        "MRI analysis completed successfully.",
        data={
            "mri_scan_id": analysis_id,
            "filename": file.filename or "unknown",
            "prediction": m2_result["prediction"],
            "confidence": m2_result["confidence"],
            "report_preview": report_preview,
            "model_pipeline": pipeline_desc,
            "gradcam_url": gradcam_url,
            "probabilities": m2_result["probabilities"],
            "model1": {
                "prediction": m1_result["prediction"],
                "confidence": m1_result["confidence"],
            },
        }
    )
