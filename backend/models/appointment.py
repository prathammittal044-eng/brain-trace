"""
Appointments and Consultation Reports SQLAlchemy Models
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


class AppointmentModel(Base):
    __tablename__ = "appointments"

    id = Column(String(50), primary_key=True, default=_gen_uuid)
    patient_id = Column(String(100), index=True, nullable=False, default="patient-001")
    doctor_id = Column(String(100), index=True, nullable=False, default="dr-rajesh")
    patient_name = Column(String(255), nullable=False, default="Demo Patient (DX-4091)")
    doctor_name = Column(String(255), nullable=False, default="Dr. Rajesh Sharma")
    patient_age = Column(Integer, default=65, nullable=False)
    date_str = Column(String(100), nullable=False)
    time_str = Column(String(50), nullable=False)
    consultation_type = Column(String(100), default="In-Person Consultation", nullable=False)
    status = Column(String(50), default="Upcoming", nullable=False)  # "Upcoming", "Confirmed", "Completed", "Cancelled"
    reason_for_visit = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)

    report = relationship("ConsultationReportModel", back_populates="appointment", uselist=False, cascade="all, delete-orphan")


class ConsultationReportModel(Base):
    __tablename__ = "consultation_reports"

    id = Column(String(50), primary_key=True, default=_gen_uuid)
    appointment_id = Column(String(50), ForeignKey("appointments.id", ondelete="CASCADE"), unique=True, nullable=False)
    report_code = Column(String(50), default="REP-2026-081", nullable=False)
    date_str = Column(String(100), default="July 25, 2026", nullable=False)
    mri_summary = Column(Text, nullable=True)
    hippocampal_vol = Column(String(100), nullable=True)
    cognitive_score = Column(String(100), nullable=True)
    reaction_time = Column(String(100), nullable=True)
    memory_accuracy = Column(String(100), nullable=True)
    ai_risk_level = Column(String(100), nullable=True)
    doctor_notes = Column(Text, nullable=True)
    medications_json = Column(Text, default="[]", nullable=False)
    recommended_actions_json = Column(Text, default="[]", nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)

    appointment = relationship("AppointmentModel", back_populates="report")
