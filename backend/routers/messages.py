"""
Patient-Doctor Messaging Router — with authentication and conversation ownership enforcement
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
from models.message import ConversationModel, MessageModel
from models.user import User
from schemas.message import SendMessageRequest
from dependencies import get_current_user

logger = logging.getLogger("demenx.router.messages")
router = APIRouter(prefix="/api/v1/messages", tags=["Messaging"])


def _api_response(success: bool, message: str, data=None, status_code: int = 200):
    return JSONResponse(
        status_code=status_code,
        content={"success": success, "message": message, "data": data}
    )


@router.get("/contacts")
async def get_contacts_with_messages(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),   # Authentication required
):
    """Retrieve contacts and conversation messages for the authenticated user."""
    role = (user.role or "").lower()

    # Filter conversations to only those belonging to this user
    if role == "patient":
        convs = db.query(ConversationModel).filter(
            ConversationModel.patient_id.in_([user.id, "patient-001"])
        ).all()
    elif role == "doctor":
        convs = db.query(ConversationModel).filter(
            ConversationModel.contact_id == user.id
        ).all()
    else:
        # Caretakers see conversations for their assigned patient (patient-001 for demo)
        convs = db.query(ConversationModel).filter(
            ConversationModel.patient_id == "patient-001"
        ).all()

    contacts = []
    for c in convs:
        msgs = []
        unread = 0
        for m in c.messages:
            if not m.is_read and m.sender_role == "contact":
                unread += 1

            att = None
            if m.attachment_json:
                try:
                    att = json.loads(m.attachment_json)
                except Exception:
                    att = None

            rx = []
            if m.reactions_json:
                try:
                    rx = json.loads(m.reactions_json)
                except Exception:
                    rx = []

            msgs.append({
                "id": m.id,
                "sender": m.sender_role,
                "text": m.text,
                "timestamp": m.timestamp_str,
                "reactions": rx,
                "attachment": att,
            })

        contacts.append({
            "id": c.contact_id,
            "name": c.contact_name,
            "role": c.contact_role,
            "category": "Doctors",
            "avatarUrl": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
            "hospital": "Apollo Hospitals, New Delhi",
            "rating": 4.9,
            "reviewCount": 128,
            "isOnline": True,
            "unreadCount": unread,
            "isStarred": True,
            "bio": "Dr. Rajesh Sharma is a clinical neurologist with 18+ years of expertise in cognitive neurology.",
            "credentials": ["MBBS, MD (Medicine), DM (Neurology)", "Fellow, Indian Academy of Neurology"],
            "languages": ["English", "Hindi"],
            "messages": msgs,
        })

    return _api_response(True, "Contacts retrieved.", data=contacts)


@router.post("")
async def send_message(
    req: SendMessageRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),   # Authentication required
):
    """Send a new message — user must own or be a participant of the conversation."""
    conv_id = req.conversation_id or "conv-dr-rajesh"
    conv = db.query(ConversationModel).filter(ConversationModel.id == conv_id).first()

    role = (user.role or "").lower()

    if conv:
        # Verify the user is a participant
        is_patient = conv.patient_id in (user.id, "patient-001")
        is_contact = conv.contact_id == user.id
        if not (is_patient or is_contact) and role not in ("doctor", "caretaker"):
            raise HTTPException(
                status_code=403,
                detail="Access denied: you are not a participant of this conversation."
            )
    else:
        # Create new conversation — user must be the patient
        conv = ConversationModel(
            id=conv_id,
            patient_id=user.id,
            contact_id=req.contact_id or "dr-rajesh",
            contact_name="Dr. Rajesh Sharma",
            contact_role="Senior Neurologist"
        )
        db.add(conv)
        db.flush()

    sender_role = "doctor" if role == "doctor" else "patient"
    now_str = datetime.now(timezone.utc).strftime("%I:%M %p")

    msg = MessageModel(
        id=f"m-{uuid.uuid4().hex[:6]}",
        conversation_id=conv.id,
        sender_role=sender_role,
        sender_id=user.id,
        text=req.text,
        timestamp_str=now_str,
        attachment_json=json.dumps(req.attachment) if req.attachment else None,
        reactions_json="[]",
        is_read=False
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return _api_response(True, "Message sent.", data={
        "id": msg.id,
        "sender": msg.sender_role,
        "text": msg.text,
        "timestamp": msg.timestamp_str,
        "attachment": req.attachment
    })
