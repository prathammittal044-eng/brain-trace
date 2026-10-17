"""
Cognitive Assessment Session and Response SQLAlchemy Models
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Float, Integer
from sqlalchemy.orm import relationship
from database import Base


def _gen_uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class AssessmentSessionModel(Base):
    __tablename__ = "assessment_sessions"

    id = Column(String(100), primary_key=True, default=_gen_uuid)
    patient_id = Column(String(100), index=True, nullable=False, default="patient-001")
    patient_name = Column(String(255), nullable=False, default="Demo Patient (DX-4091)")
    version = Column(String(50), default="v1.2.0-daily", nullable=False)
    started_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="in_progress", nullable=False)  # "in_progress", "completed", "abandoned"
    current_step_index = Column(Integer, default=0, nullable=False)
    duration_seconds = Column(Integer, default=0, nullable=False)
    overall_score = Column(Float, nullable=True)
    score_breakdown_json = Column(Text, nullable=True)  # JSON for AssessmentScore (domainScores, metrics, notes)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)

    responses = relationship("AssessmentResponseModel", back_populates="session", cascade="all, delete-orphan")


class AssessmentResponseModel(Base):
    __tablename__ = "assessment_responses"

    id = Column(String(100), primary_key=True, default=_gen_uuid)
    session_id = Column(String(100), ForeignKey("assessment_sessions.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String(100), nullable=False)
    domain = Column(String(50), nullable=False)
    activity_kind = Column(String(100), nullable=False)
    user_answer = Column(Text, nullable=True)
    is_correct = Column(Boolean, default=False, nullable=False)
    score_earned = Column(Float, default=0.0, nullable=False)
    raw_details_json = Column(Text, nullable=True)
    answered_at = Column(DateTime(timezone=True), default=_now, nullable=False)

    session = relationship("AssessmentSessionModel", back_populates="responses")
