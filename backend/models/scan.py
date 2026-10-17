"""
MRI Scan and Analysis SQLAlchemy Model
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


class MriScan(Base):
    __tablename__ = "mri_scans"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    view_type = Column(String(50), default="axial", nullable=False)  # "axial", "sagittal", "coronal"
    status = Column(String(50), default="Completed", nullable=False)  # "Completed", "Processing", "Failed"
    is_mri = Column(Boolean, default=False, nullable=False)
    m1_prediction = Column(String(100), nullable=True)
    m1_confidence = Column(Float, nullable=True)
    m2_prediction = Column(String(100), nullable=True)
    m2_confidence = Column(Float, nullable=True)
    probabilities_json = Column(Text, nullable=True)
    report_preview = Column(Text, nullable=True)
    gradcam_path = Column(String(500), nullable=True)
    gradcam_url = Column(String(500), nullable=True)
    model_pipeline = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)

    user = relationship("User", back_populates="scans")
