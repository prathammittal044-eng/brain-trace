"""
Cognitive Assessment Sessions and History Router — with authentication and ownership enforcement
"""

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import get_db
from models.cognitive import AssessmentSessionModel, AssessmentResponseModel
from models.user import User
from schemas.cognitive import (
    AssessmentStartRequest,
    AssessmentStepSaveRequest,
    AssessmentCompleteRequest,
    PatientResponseDTO
)
from services.cognitive_service import calculate_cognitive_score
from dependencies import get_current_user

logger = logging.getLogger("demenx.router.cognitive")
router = APIRouter(prefix="/api/v1/cognitive", tags=["Cognitive Assessment"])


def _api_response(success: bool, message: str, data=None, status_code: int = 200):
    return JSONResponse(
        status_code=status_code,
        content={"success": success, "message": message, "data": data}
    )


def _serialize_session(sess: AssessmentSessionModel) -> dict:
    """Format AssessmentSessionModel into the exact shape expected by the frontend AssessmentSession interface."""
    resp_map = {}
    for r in sess.responses:
        raw = None
        if r.raw_details_json:
            try:
                raw = json.loads(r.raw_details_json)
            except Exception:
                raw = {}
        ans = r.user_answer
        if ans and (ans.startswith("{") or ans.startswith("[")):
            try:
                ans = json.loads(ans)
            except Exception:
                pass

        resp_map[r.question_id] = {
            "questionId": r.question_id,
            "domain": r.domain,
            "activityKind": r.activity_kind,
            "userAnswer": ans,
            "isCorrect": r.is_correct,
            "scoreEarned": r.score_earned,
            "rawDetails": raw or {},
            "answeredAt": r.answered_at.isoformat() if r.answered_at else datetime.now(timezone.utc).isoformat()
        }

    score_obj = None
    if sess.score_breakdown_json:
        try:
            score_obj = json.loads(sess.score_breakdown_json)
        except Exception:
            score_obj = None

    return {
        "id": sess.id,
        "patientId": sess.patient_id,
        "patientName": sess.patient_name,
        "version": sess.version,
        "startedAt": sess.started_at.isoformat() if sess.started_at else datetime.now(timezone.utc).isoformat(),
        "completedAt": sess.completed_at.isoformat() if sess.completed_at else None,
        "status": sess.status,
        "currentStepIndex": sess.current_step_index,
        "responses": resp_map,
        "score": score_obj,
        "durationSeconds": sess.duration_seconds or 0,
    }


def _owns_session(sess: AssessmentSessionModel, user: User) -> bool:
    """Check ownership: patients only own sessions where patient_id exactly matches their user.id.
    
    The shared demo patient-001 sessions are accessible only to the demo patient-001 account itself.
    A newly registered patient must NOT be able to access demo sessions just because they are a 'patient'.
    Doctors and caretakers can access all sessions.
    """
    role = (user.role or "").lower()
    if role in ("doctor", "caretaker"):
        return True
    if role == "patient":
        return sess.patient_id == user.id
    return False


@router.post("/sessions")
async def create_session(
    req: AssessmentStartRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Start a brand new cognitive assessment session."""
    p_id = user.id
    p_name = user.full_name or user.email

    sess_id = f"session-{int(datetime.now(timezone.utc).timestamp())}-{uuid.uuid4().hex[:4]}"
    now = datetime.now(timezone.utc)

    sess = AssessmentSessionModel(
        id=sess_id,
        patient_id=p_id,
        patient_name=p_name,
        version=req.version or "v1.2.0-daily",
        started_at=now,
        status="in_progress",
        current_step_index=0,
        duration_seconds=0
    )
    db.add(sess)
    db.commit()
    db.refresh(sess)

    logger.info("Created new assessment session %s for %s", sess_id, p_name)
    return _api_response(True, "Session created.", data=_serialize_session(sess))


@router.get("/sessions/active")
async def get_active_session(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Retrieve the current in-progress session for the authenticated user."""
    sess = db.query(AssessmentSessionModel).filter(
        AssessmentSessionModel.patient_id == user.id,
        AssessmentSessionModel.status == "in_progress"
    ).order_by(AssessmentSessionModel.started_at.desc()).first()

    if not sess:
        return _api_response(True, "No active in-progress session.", data=None)

    return _api_response(True, "Active session retrieved.", data=_serialize_session(sess))


@router.put("/sessions/{session_id}/step")
async def save_session_step(
    session_id: str,
    req: AssessmentStepSaveRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Save step progress and patient answer — requires ownership."""
    sess = db.query(AssessmentSessionModel).filter(AssessmentSessionModel.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found.")

    if not _owns_session(sess, user):
        raise HTTPException(status_code=403, detail="Access denied: this session does not belong to your account.")

    sess.current_step_index = req.currentStepIndex
    if req.durationSeconds is not None:
        sess.duration_seconds = req.durationSeconds

    if req.response:
        r = req.response
        ans_str = json.dumps(r.userAnswer) if isinstance(r.userAnswer, (dict, list)) else str(r.userAnswer)
        raw_str = json.dumps(r.rawDetails) if r.rawDetails else "{}"

        # Check existing response for question_id
        existing_resp = db.query(AssessmentResponseModel).filter(
            AssessmentResponseModel.session_id == session_id,
            AssessmentResponseModel.question_id == r.questionId
        ).first()

        if existing_resp:
            existing_resp.user_answer = ans_str
            existing_resp.is_correct = r.isCorrect
            existing_resp.score_earned = r.scoreEarned
            existing_resp.raw_details_json = raw_str
        else:
            new_resp = AssessmentResponseModel(
                session_id=session_id,
                question_id=r.questionId,
                domain=r.domain,
                activity_kind=r.activityKind,
                user_answer=ans_str,
                is_correct=r.isCorrect,
                score_earned=r.scoreEarned,
                raw_details_json=raw_str,
            )
            db.add(new_resp)

    db.commit()
    db.refresh(sess)
    return _api_response(True, "Progress saved.", data=_serialize_session(sess))


@router.post("/sessions/{session_id}/complete")
async def complete_session(
    session_id: str,
    req: AssessmentCompleteRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Complete assessment and compute authoritative score — requires ownership.
    
    Idempotent: already-completed sessions return 409 to prevent duplicate scoring.
    """
    sess = db.query(AssessmentSessionModel).filter(AssessmentSessionModel.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found.")

    if not _owns_session(sess, user):
        raise HTTPException(status_code=403, detail="Access denied: this session does not belong to your account.")

    # Idempotency guard: prevent duplicate completion
    if sess.status == "completed":
        raise HTTPException(
            status_code=409,
            detail="This assessment session has already been completed and scored. Retrieve existing results from history."
        )

    # Save all responses
    for q_id, r in req.responses.items():
        ans_str = json.dumps(r.userAnswer) if isinstance(r.userAnswer, (dict, list)) else str(r.userAnswer)
        raw_str = json.dumps(r.rawDetails) if r.rawDetails else "{}"

        existing = db.query(AssessmentResponseModel).filter(
            AssessmentResponseModel.session_id == session_id,
            AssessmentResponseModel.question_id == q_id
        ).first()

        if existing:
            existing.user_answer = ans_str
            existing.is_correct = r.isCorrect
            existing.score_earned = r.scoreEarned
            existing.raw_details_json = raw_str
        else:
            new_r = AssessmentResponseModel(
                session_id=session_id,
                question_id=q_id,
                domain=r.domain,
                activity_kind=r.activityKind,
                user_answer=ans_str,
                is_correct=r.isCorrect,
                score_earned=r.scoreEarned,
                raw_details_json=raw_str,
            )
            db.add(new_r)

    # Authoritative server-side scoring
    resp_list = list(req.responses.values())
    calculated_score = calculate_cognitive_score(resp_list, req.durationSeconds)

    now = datetime.now(timezone.utc)
    sess.status = "completed"
    sess.completed_at = now
    sess.duration_seconds = req.durationSeconds
    sess.overall_score = calculated_score.overallScore
    sess.score_breakdown_json = json.dumps(calculated_score.model_dump())

    db.commit()
    db.refresh(sess)

    logger.info("Assessment completed: session %s scored %.1f", session_id, calculated_score.overallScore)
    return _api_response(True, "Assessment successfully scored and completed.", data=_serialize_session(sess))


@router.delete("/sessions/{session_id}")
async def discard_session(
    session_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Discard or abandon an active session — requires ownership."""
    sess = db.query(AssessmentSessionModel).filter(AssessmentSessionModel.id == session_id).first()
    if sess:
        if not _owns_session(sess, user):
            raise HTTPException(status_code=403, detail="Access denied: this session does not belong to your account.")
        db.delete(sess)
        db.commit()
    return _api_response(True, "Session discarded.")


@router.get("/history")
async def get_history(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Retrieve history of completed cognitive sessions for the authenticated user.
    
    - Patients: only see their own completed sessions.
    - The demo patient (patient-001) sees their own seeded sessions.
    - Doctors/caretakers: see all completed sessions.
    """
    role = (user.role or "").lower()
    query = db.query(AssessmentSessionModel).filter(
        AssessmentSessionModel.status == "completed"
    )

    if role == "patient":
        # Strict ownership: only this patient's own sessions
        query = query.filter(AssessmentSessionModel.patient_id == user.id)
    # doctors and caretakers see all

    sessions = query.order_by(AssessmentSessionModel.started_at.desc()).all()
    history = [_serialize_session(s) for s in sessions]
    return _api_response(True, "Assessment history retrieved.", data=history)


@router.get("/history/{session_id}")
async def get_historical_session(
    session_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get specific completed session — enforces per-record ownership."""
    sess = db.query(AssessmentSessionModel).filter(AssessmentSessionModel.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail=f"Assessment {session_id} not found.")

    if not _owns_session(sess, user):
        raise HTTPException(status_code=403, detail="Access denied: this assessment does not belong to your account.")

    return _api_response(True, "Session retrieved.", data=_serialize_session(sess))
