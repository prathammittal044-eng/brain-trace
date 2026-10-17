"""
Appointments and Doctor Directory Router
"""

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import get_db
from models.appointment import AppointmentModel, ConsultationReportModel
from models.user import User, DoctorProfile
from schemas.appointment import AppointmentCreateRequest
from dependencies import get_current_user

logger = logging.getLogger("demenx.router.appointments")
router = APIRouter(prefix="/api/v1/appointments", tags=["Appointments"])


def _api_response(success: bool, message: str, data=None, status_code: int = 200):
    return JSONResponse(
        status_code=status_code,
        content={"success": success, "message": message, "data": data}
    )


def _serialize_appointment(apt: AppointmentModel) -> dict:
    rep_obj = None
    if apt.report:
        r = apt.report
        meds = []
        if r.medications_json:
            try:
                meds = json.loads(r.medications_json)
            except Exception:
                meds = []
        actions = []
        if r.recommended_actions_json:
            try:
                actions = json.loads(r.recommended_actions_json)
            except Exception:
                actions = []

        rep_obj = {
            "reportId": r.report_code,
            "date": r.date_str,
            "mriSummary": r.mri_summary or "",
            "hippocampalVol": r.hippocampal_vol or "",
            "cognitiveScore": r.cognitive_score or "",
            "reactionTime": r.reaction_time or "",
            "memoryAccuracy": r.memory_accuracy or "",
            "aiRiskLevel": r.ai_risk_level or "",
            "doctorNotes": r.doctor_notes or "",
            "medications": meds,
            "recommendedActions": actions
        }

    return {
        "id": apt.id,
        "patient": apt.patient_name,
        "doctor": apt.doctor_name,
        "age": apt.patient_age,
        "time": apt.time_str,
        "date": apt.date_str,
        "type": apt.consultation_type,
        "status": apt.status,
        "issue": apt.reason_for_visit or "",
        "report": rep_obj
    }


@router.get("")
async def list_appointments(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),   # Authentication required
):
    """Retrieve all appointments for current user or doctor."""
    query = db.query(AppointmentModel)
    role = (user.role or "").lower()
    if role == "doctor":
        query = query.filter(AppointmentModel.doctor_id == user.id)
    elif role == "patient":
        # Patients see their own + shared demo patient appointments
        query = query.filter(AppointmentModel.patient_id.in_([user.id, "patient-001"]))

    apts = query.order_by(AppointmentModel.created_at.desc()).all()
    return _api_response(True, "Appointments retrieved.", data=[_serialize_appointment(a) for a in apts])


@router.post("")
async def create_appointment(
    req: AppointmentCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),   # Authentication required
):
    """Book a new consultation appointment."""
    # Prevent conflict on exact same date/time/doctor
    conflict = db.query(AppointmentModel).filter(
        AppointmentModel.doctor_id == (req.doctor_id or "dr-rajesh"),
        AppointmentModel.date_str == req.date_str,
        AppointmentModel.time_str == req.time_str,
        AppointmentModel.status.in_(["Upcoming", "Confirmed"])
    ).first()

    if conflict:
        return _api_response(False, "This time slot has already been booked. Please select another slot.", status_code=409)

    apt = AppointmentModel(
        id=f"apt-{int(datetime.now(timezone.utc).timestamp())}-{uuid.uuid4().hex[:4]}",
        patient_id=user.id,
        doctor_id=req.doctor_id or "dr-rajesh",
        patient_name=user.full_name or user.email,
        doctor_name=req.doctor_name or "Dr. Rajesh Sharma",
        patient_age=65,
        date_str=req.date_str,
        time_str=req.time_str,
        consultation_type=req.consultation_type or "In-Person Consultation",
        status="Confirmed",
        reason_for_visit=req.reason_for_visit or "Cognitive screening & MRI review",
    )
    db.add(apt)
    db.commit()
    db.refresh(apt)

    logger.info("Appointment %s created for %s with %s", apt.id, apt.patient_name, apt.doctor_name)
    return _api_response(True, "Appointment confirmed successfully.", data=_serialize_appointment(apt))


@router.get("/doctors")
async def list_doctors(db: Session = Depends(get_db)):
    """Retrieve list of available neurologists."""
    docs = db.query(DoctorProfile).all()
    result = []
    for d in docs:
        user = d.user
        creds = json.loads(d.credentials_json) if d.credentials_json else []
        langs = json.loads(d.languages_json) if d.languages_json else ["English"]
        result.append({
            "id": user.id,
            "name": user.full_name or "Dr. Rajesh Sharma",
            "role": d.specialty,
            "hospital": d.hospital,
            "rating": d.rating,
            "reviewCount": d.review_count,
            "bio": d.bio,
            "credentials": creds,
            "languages": langs,
            "avatarUrl": d.avatar_url,
            "isOnline": d.is_online,
        })
    return _api_response(True, "Doctors retrieved.", data=result)
