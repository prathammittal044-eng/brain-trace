"""
Care Space and Connected Care SQLAlchemy Models for DemenX

Supports:
- User Type A: Person living with dementia (Patient) - low cognitive load, daily routine, memories.
- User Type B: Primary Caregiver - coordination, task management, care logs, safety.
- User Type C: Additional Family Members - scoped, fine-grained permission-based access.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, Index
from sqlalchemy.orm import relationship
from database import Base


def _gen_uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class CareSpace(Base):
    """A connected care circle linking a patient with authorized caregivers and family."""
    __tablename__ = "care_spaces"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    name = Column(String(255), nullable=False, default="Family Care Circle")
    patient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    assistance_level = Column(String(50), default="guided", nullable=False)  # "independent", "guided", "assisted"
    preferences_json = Column(Text, default="{}", nullable=False)  # voice reminders, large text, simplified view
    safety_plan_json = Column(Text, default="{}", nullable=False)  # emergency contacts, wandering plan, safe zones
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    # Relationships
    patient = relationship("User", foreign_keys=[patient_id])
    members = relationship("CareSpaceMember", back_populates="care_space", cascade="all, delete-orphan")
    invitations = relationship("CareSpaceInvitation", back_populates="care_space", cascade="all, delete-orphan")
    routine_items = relationship("DailyRoutineItem", back_populates="care_space", cascade="all, delete-orphan")
    care_logs = relationship("CareActivityLog", back_populates="care_space", cascade="all, delete-orphan")
    memory_items = relationship("MemoryBookItem", back_populates="care_space", cascade="all, delete-orphan")
    audit_logs = relationship("CareSpaceAuditLog", back_populates="care_space", cascade="all, delete-orphan")


class CareSpaceMember(Base):
    """Represents a participant in a Care Space with explicit, scoped permissions."""
    __tablename__ = "care_space_members"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    care_space_id = Column(String(36), ForeignKey("care_spaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False)  # "patient", "primary_caregiver", "family_member", "trusted_contact"
    relationship_label = Column(String(100), nullable=False, default="Caregiver")  # e.g., "Daughter", "Husband", "Brother"
    permissions_json = Column(Text, default="{}", nullable=False)  # JSON dict of fine-grained boolean flags
    is_active = Column(Boolean, default=True, nullable=False)
    joined_at = Column(DateTime(timezone=True), default=_now, nullable=False)

    # Relationships
    care_space = relationship("CareSpace", back_populates="members")
    user = relationship("User", foreign_keys=[user_id])


class CareSpaceInvitation(Base):
    """Pending invitation to join a Care Space with specific pre-configured permissions."""
    __tablename__ = "care_space_invitations"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    care_space_id = Column(String(36), ForeignKey("care_spaces.id", ondelete="CASCADE"), nullable=False, index=True)
    invited_email = Column(String(255), nullable=False, index=True)
    invited_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), default="family_member", nullable=False)
    relationship_label = Column(String(100), default="Family Member", nullable=False)
    permissions_json = Column(Text, default="{}", nullable=False)
    invite_code = Column(String(32), unique=True, index=True, nullable=False)
    status = Column(String(50), default="pending", nullable=False)  # "pending", "accepted", "rejected", "revoked"
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)

    care_space = relationship("CareSpace", back_populates="invitations")


class DailyRoutineItem(Base):
    """Daily routine activities and reminders designed for low cognitive load."""
    __tablename__ = "daily_routine_items"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    care_space_id = Column(String(36), ForeignKey("care_spaces.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), default="routine", nullable=False)  # "routine", "medication", "activity", "reminder", "appointment"
    scheduled_time = Column(String(50), nullable=False)  # e.g., "09:00 AM"
    assigned_to_user_id = Column(String(36), nullable=True)  # user ID if assigned to specific caregiver/patient
    assigned_to_role = Column(String(50), default="patient", nullable=False)  # "patient", "caregiver", "all"
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    completed_by_user_id = Column(String(36), nullable=True)
    recurrence = Column(String(50), default="daily", nullable=False)  # "daily", "weekdays", "weekends", "once"
    difficulty_level = Column(String(50), default="easy", nullable=False)
    icon_hint = Column(String(50), default="sun", nullable=False)  # "sun", "pill", "walk", "cup", "book", "heart"
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)

    care_space = relationship("CareSpace", back_populates="routine_items")


class CareActivityLog(Base):
    """Caregiver activity log: vitals, meal/mood tracking, observation notes."""
    __tablename__ = "care_activity_logs"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    care_space_id = Column(String(36), ForeignKey("care_spaces.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    author_name = Column(String(255), nullable=False)
    log_type = Column(String(50), default="general_note", nullable=False)  # "vital_check", "mood", "meal", "sleep", "general_note", "safety_incident"
    title = Column(String(255), nullable=False)
    details_json = Column(Text, default="{}", nullable=False)  # {"blood_pressure": "120/80", "mood": "calm", "hours_slept": 7.5}
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)

    care_space = relationship("CareSpace", back_populates="care_logs")


class MemoryBookItem(Base):
    """Familiar people, life memories, and personal comfort items."""
    __tablename__ = "memory_book_items"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    care_space_id = Column(String(36), ForeignKey("care_spaces.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    item_type = Column(String(50), default="familiar_person", nullable=False)  # "familiar_person", "life_memory", "favorite_place", "comfort_item"
    name_or_title = Column(String(255), nullable=False)
    relationship_or_context = Column(String(255), nullable=True)  # e.g., "Your eldest daughter", "Our wedding in 1985"
    description = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)  # For familiar person quick dial
    avatar_or_photo_url = Column(String(500), nullable=True)
    audio_memo_url = Column(String(500), nullable=True)
    is_private_to_patient = Column(Boolean, default=False, nullable=False)  # Patient privacy flag
    is_favorite = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)

    care_space = relationship("CareSpace", back_populates="memory_items")


class CareSpaceAuditLog(Base):
    """Audit log for sensitive actions (invitations, permission updates, safety changes)."""
    __tablename__ = "care_space_audit_logs"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    care_space_id = Column(String(36), ForeignKey("care_spaces.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    actor_name = Column(String(255), nullable=False)
    action = Column(String(100), nullable=False)  # e.g., "INVITED_MEMBER", "UPDATED_PERMISSIONS", "MODIFIED_SAFETY_PLAN"
    target_user_id = Column(String(36), nullable=True)
    details_json = Column(Text, default="{}", nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)

    care_space = relationship("CareSpace", back_populates="audit_logs")


class CaregiverResource(Base):
    """Curated educational guides and clinical tips for caregivers."""
    __tablename__ = "caregiver_resources"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="communication", nullable=False)  # "communication", "sundowning", "safety", "self_care", "daily_care"
    summary = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    read_time_mins = Column(Integer, default=3, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
