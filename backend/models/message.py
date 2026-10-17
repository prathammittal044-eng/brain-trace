"""
Conversations and Messages SQLAlchemy Models
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship
from database import Base


def _gen_uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class ConversationModel(Base):
    __tablename__ = "conversations"

    id = Column(String(100), primary_key=True, default=_gen_uuid)
    patient_id = Column(String(100), index=True, nullable=False, default="patient-001")
    contact_id = Column(String(100), index=True, nullable=False, default="dr-rajesh")
    contact_name = Column(String(255), nullable=False, default="Dr. Rajesh Sharma")
    contact_role = Column(String(100), default="Senior Neurologist", nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    messages = relationship("MessageModel", back_populates="conversation", cascade="all, delete-orphan", order_by="MessageModel.created_at")


class MessageModel(Base):
    __tablename__ = "messages"

    id = Column(String(100), primary_key=True, default=_gen_uuid)
    conversation_id = Column(String(100), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    sender_role = Column(String(50), nullable=False)  # "patient" or "contact"
    sender_id = Column(String(100), nullable=True)
    text = Column(Text, nullable=False)
    timestamp_str = Column(String(50), nullable=False)
    attachment_json = Column(Text, nullable=True)
    reactions_json = Column(Text, default="[]", nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)

    conversation = relationship("ConversationModel", back_populates="messages")
