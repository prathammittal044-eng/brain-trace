"""
User and Profile SQLAlchemy Models
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


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="patient", nullable=False)  # "patient", "doctor", "caretaker"
    full_name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    patient_profile = relationship("PatientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    doctor_profile = relationship("DoctorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    scans = relationship("MriScan", back_populates="user", cascade="all, delete-orphan")


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    patient_code = Column(String(50), default="DX-4091", index=True, nullable=False)
    dob = Column(String(100), default="01 Jan 1960", nullable=True)
    gender = Column(String(50), default="Unspecified", nullable=True)
    blood_group = Column(String(20), default="O+", nullable=True)
    emergency_contact = Column(String(100), default="+1 (555) 010-0000", nullable=True)
    two_factor_enabled = Column(Boolean, default=True, nullable=False)
    preferences_json = Column(Text, default="{}", nullable=False)

    user = relationship("User", back_populates="patient_profile")


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    hospital = Column(String(255), default="Apollo Hospitals, New Delhi", nullable=False)
    specialty = Column(String(255), default="Senior Neurologist", nullable=False)
    rating = Column(Float, default=4.9, nullable=False)
    review_count = Column(Integer, default=128, nullable=False)
    bio = Column(Text, default="Senior clinical neurologist specializing in cognitive disorders.", nullable=False)
    credentials_json = Column(Text, default="[]", nullable=False)
    languages_json = Column(Text, default='["English", "Hindi"]', nullable=False)
    avatar_url = Column(String(500), nullable=True)
    is_online = Column(Boolean, default=True, nullable=False)

    user = relationship("User", back_populates="doctor_profile")
