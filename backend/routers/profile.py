"""
Profile, Caretaker Notes, and Medication Management Router — with authentication and ownership enforcement
"""

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, PatientProfile
from models.caretaker import CaretakerNoteModel, MedicationRecordModel
from schemas.auth import UserProfileUpdateRequest
from dependencies import get_current_user, require_role

logger = logging.getLogger("demenx.router.profile")
router = APIRouter(prefix="/api/v1", tags=["Profile & Caretaker"])


def _api_response(success: bool, message: str, data=None, status_code: int = 200):
    return JSONResponse(
        status_code=status_code,
        content={"success": success, "message": message, "data": data}
    )


@router.get("/profile")
async def get_profile(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),  # Authentication required; no demo fallback
):
    """Get current authenticated user's profile and settings."""
    prof = user.patient_profile if user else None
    prefs = {}
    if prof and prof.preferences_json:
        try:
            prefs = json.loads(prof.preferences_json)
        except Exception:
            prefs = {}

    return _api_response(True, "Profile retrieved.", data={
        "fullName": user.full_name,
        "email": user.email,
        "phone": user.phone or "",
        "dob": prof.dob if prof else "",
        "gender": prof.gender if prof else "",
        "bloodGroup": prof.blood_group if prof else "",
        "emergencyContact": prof.emergency_contact if prof else "",
        "twoFactor": prof.two_factor_enabled if prof else False,
        "preferences": prefs or {
            "language": "English",
            "theme": "system",
            "dateFormat": "DD MMM YYYY",
            "timeFormat": "12-Hour (AM/PM)",
            "units": "Metric (kg, cm)"
        }
    })


@router.put("/profile")
async def update_profile(
    req: UserProfileUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),  # Authentication required; no demo fallback
):
    """Update own profile and settings."""
    if req.full_name:
        user.full_name = req.full_name
    if req.phone:
        user.phone = req.phone

    prof = user.patient_profile
    if not prof:
        prof = PatientProfile(user_id=user.id, patient_code=f"DX-{user.id[:4].upper()}")
        db.add(prof)

    if req.dob:
        prof.dob = req.dob
    if req.gender:
        prof.gender = req.gender
    if req.blood_group:
        prof.blood_group = req.blood_group
    if req.emergency_contact:
        prof.emergency_contact = req.emergency_contact
    if req.two_factor_enabled is not None:
        prof.two_factor_enabled = req.two_factor_enabled
    if req.preferences:
        prof.preferences_json = json.dumps(req.preferences)

    db.commit()
    return _api_response(True, "Profile updated successfully.")


# --- Caretaker Workflows ---

def _get_patient_id_for_caretaker(user: User) -> str:
    """
    For caretaker/doctor roles, return the patient ID they are authorised to work on.
    Currently hardcoded to the demo patient; in a full deployment this would be resolved
    from a caretaker-patient assignment table.
    """
    role = (user.role or "").lower()
    if role in ("caretaker", "doctor"):
        return "patient-001"
    return user.id


@router.get("/caretaker/notes")
async def get_caretaker_notes(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("caretaker", "doctor", "patient")),
):
    """Retrieve notes for the patient the authenticated user is responsible for."""
    patient_id = _get_patient_id_for_caretaker(user)
    notes = (
        db.query(CaretakerNoteModel)
        .filter(CaretakerNoteModel.patient_id == patient_id)
        .order_by(CaretakerNoteModel.created_at.desc())
        .all()
    )
    return _api_response(True, "Notes retrieved.", data=[{
        "id": n.id,
        "date": n.date_str,
        "author": n.author_name,
        "text": n.text
    } for n in notes])


@router.post("/caretaker/notes")
async def add_caretaker_note(
    body: Dict[str, Any],
    db: Session = Depends(get_db),
    user: User = Depends(require_role("caretaker", "doctor", "patient")),
):
    """Add a new caretaker note for the assigned patient."""
    text = body.get("text", "").strip()
    if not text:
        return _api_response(False, "Note text is required.", status_code=400)

    patient_id = _get_patient_id_for_caretaker(user)
    author = user.full_name or body.get("author") or "Caregiver"

    note = CaretakerNoteModel(
        id=f"note-{uuid.uuid4().hex[:6]}",
        patient_id=patient_id,
        author_name=author,
        date_str=f"Today, {datetime.now(timezone.utc).strftime('%I:%M %p')}",
        text=text
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    return _api_response(True, "Note added.", data={
        "id": note.id,
        "date": note.date_str,
        "author": note.author_name,
        "text": note.text
    })


@router.get("/caretaker/medications")
async def get_medications(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("caretaker", "doctor", "patient")),
):
    """Retrieve medication tracking checklist for the assigned patient."""
    patient_id = _get_patient_id_for_caretaker(user)
    meds = (
        db.query(MedicationRecordModel)
        .filter(MedicationRecordModel.patient_id == patient_id)
        .all()
    )
    return _api_response(True, "Medications retrieved.", data=[{
        "id": m.id,
        "name": m.name,
        "time": m.time_str,
        "dosage": m.dosage,
        "status": m.status
    } for m in meds])


@router.put("/caretaker/medications/{med_id}/toggle")
async def toggle_medication_status(
    med_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("caretaker", "doctor", "patient")),
):
    """Toggle medication taken/pending status — verifies the record belongs to the patient."""
    patient_id = _get_patient_id_for_caretaker(user)
    med = db.query(MedicationRecordModel).filter(
        MedicationRecordModel.id == med_id,
        MedicationRecordModel.patient_id == patient_id,
    ).first()
    if not med:
        return _api_response(False, "Medication not found.", status_code=404)

    med.status = "pending" if med.status == "taken" else "taken"
    db.commit()
    return _api_response(True, f"Medication marked as {med.status}.", data={"id": med.id, "status": med.status})
