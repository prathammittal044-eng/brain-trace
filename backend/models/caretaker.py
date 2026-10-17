"""
Caretaker Notes and Medication Records SQLAlchemy Models
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from database import Base


def _gen_uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class CaretakerNoteModel(Base):
    __tablename__ = "caretaker_notes"

    id = Column(String(100), primary_key=True, default=_gen_uuid)
    patient_id = Column(String(100), index=True, nullable=False, default="patient-001")
    author_name = Column(String(255), nullable=False, default="Rahul Caregiver")
    date_str = Column(String(100), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)


class MedicationRecordModel(Base):
    __tablename__ = "medication_records"

    id = Column(String(100), primary_key=True, default=_gen_uuid)
    patient_id = Column(String(100), index=True, nullable=False, default="patient-001")
    name = Column(String(255), nullable=False)
    time_str = Column(String(50), nullable=False)
    dosage = Column(String(255), nullable=False)
    status = Column(String(50), default="pending", nullable=False)  # "taken" or "pending"
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
