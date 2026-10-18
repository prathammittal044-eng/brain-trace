"""
care_space.py â€” Care Space & Connected Care router.

Provides endpoints for the caretaker notes and medications features
referenced in the frontend's profileApi.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.caretaker import CaretakerNoteModel, MedicationRecordModel
from models.user import User
from dependencies import get_current_user_optional

logger = logging.getLogger("demenx.router.care_space")
router = APIRouter(prefix="/api/v1", tags=["Care Space"])


def _ok(message: str, data=None):
    return JSONResponse(content={"success": True, "message": message, "data": data})


def get_care_user(user: Optional[User] = Depends(get_current_user_optional)) -> User:
    """Use a stable demo identity when Connected Care is opened anonymously."""
    if user:
        return user
    return User(
        id="anonymous-care-user",
        email="anonymous@local.demo",
        password_hash="",
        role="patient",
        full_name="Demo Patient",
        phone="+1 (555) 010-0000",
        is_active=True,
    )


# Connected Care is intentionally lightweight for the local demo. The state is
# keyed by user and can later be moved to dedicated Care Space tables.
_care_spaces: dict[str, dict[str, Any]] = {}


def _space_for(user: User) -> dict[str, Any]:
    space = _care_spaces.setdefault(user.id, {
        "name": "Alex's Care Circle",
        "assistance_level": "guided",
        "routine": [
            {
                "id": "routine-morning",
                "title": "Morning medication",
                "description": "Take medication after breakfast",
                "category": "medication",
                "scheduled_time": "08:00 AM",
                "is_completed": False,
                "difficulty_level": "easy",
                "icon_hint": "sun",
            },
            {
                "id": "routine-walk",
                "title": "Gentle morning walk",
                "description": "A short walk with a family member",
                "category": "activity",
                "scheduled_time": "10:00 AM",
                "is_completed": False,
                "difficulty_level": "easy",
                "icon_hint": "walk",
            },
        ],
        "care_logs": [],
        "familiar_people": [
            {
                "id": "person-priya",
                "name_or_title": "Priya Sharma (Daughter)",
                "relationship_or_context": "Your eldest daughter",
                "description": "Priya is a software architect living in New Delhi. She visits every weekend and loves drinking ginger chai with you.",
                "phone": "+91 98765 43210",
                "avatar_or_photo_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
            },
            {
                "id": "person-rahul",
                "name_or_title": "Rahul Caregiver",
                "relationship_or_context": "Your primary day caregiver",
                "description": "Rahul helps you with morning exercises, reminders, and daily garden walks. Always brings your morning tea at 8:00 AM.",
                "phone": "+91 98765 43211",
                "avatar_or_photo_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
            },
            {
                "id": "person-doctor",
                "name_or_title": "Dr. Rajesh Sharma",
                "relationship_or_context": "Your neurologist at Apollo Hospital",
                "description": "Senior clinical neurologist reviewing your memory tests and brain scans. Consultations happen every 3 months.",
                "phone": "+91 98765 43212",
                "avatar_or_photo_url": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150",
            },
        ],
        "memory_book": [
            {
                "id": "memory-shimla",
                "item_type": "life_memory",
                "name_or_title": "Family Holiday to Shimla (1995)",
                "relationship_or_context": "Memorable winter family trip",
                "description": "You, Sunita, and Priya took the toy train through Kalka. We stayed near the ridge and watched snowfall together.",
                "avatar_or_photo_url": "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&q=80&w=300",
                "is_favorite": True,
            },
            {
                "id": "memory-mango-tree",
                "item_type": "favorite_place",
                "name_or_title": "Our First Green Park Mango Tree",
                "relationship_or_context": "Planted in 1988",
                "description": "You planted this Alphonso tree in the back garden. Every summer it yields sweet mangoes for the family.",
                "avatar_or_photo_url": "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=300",
                "is_favorite": True,
            },
            {
                "id": "memory-reflection",
                "item_type": "comfort_item",
                "name_or_title": "Personal Private Reflection",
                "relationship_or_context": "Personal Journal Entry",
                "description": "Thoughts on my morning walk and feeling peaceful today.",
                "is_private_to_patient": True,
            },
        ],
        "safety_plan": {
            "safe_zones": [],
            "wandering_risk_level": "moderate",
            "calming_strategies": [],
        },
        "members": [],
        "audit_logs": [],
    })
    return space


def _patient_view(user: User, space: dict[str, Any]) -> dict[str, Any]:
    return {
        "patient_name": user.full_name or "Alex Johnson",
        "greeting": "Good morning",
        "date_display": datetime.now(timezone.utc).strftime("%A, %d %B %Y"),
        "today_routine": space["routine"],
        "familiar_people": space["familiar_people"],
        "comfort_memories": space["memory_book"],
        "primary_caregiver_contact": {
            "name": "Your Care Team",
            "relationship": "Primary caregiver",
            "phone": user.phone or "+1 (555) 010-0000",
        },
        "emergency_help": {
            "label": "Need immediate help?",
            "primary_contact_name": "Emergency services",
            "phone": "112",
            "home_address": "Your saved emergency contact",
        },
    }


class CareSpaceCreate(BaseModel):
    name: str
    assistance_level: Optional[str] = "guided"
    preferences: Optional[dict[str, Any]] = None
    safety_plan: Optional[dict[str, Any]] = None


class RoutineCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    scheduled_time: str
    assigned_to_role: Optional[str] = None
    recurrence: Optional[str] = "daily"
    difficulty_level: Optional[str] = "easy"
    icon_hint: Optional[str] = None


class CareLogCreate(BaseModel):
    log_type: str
    title: str
    details: Optional[Any] = None
    notes: Optional[str] = None


class MemoryCreate(BaseModel):
    item_type: str
    name_or_title: str
    relationship_or_context: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    avatar_or_photo_url: Optional[str] = None
    is_private_to_patient: Optional[bool] = False
    is_favorite: Optional[bool] = False


class InvitationCreate(BaseModel):
    email: str
    role: str
    relationship_label: str
    permissions: Optional[dict[str, Any]] = None


@router.get("/care-space/context")
async def care_space_context(user: User = Depends(get_care_user)):
    space = _space_for(user)
    return _ok("Care Space context retrieved.", {
        "care_space_name": space["name"],
        "assistance_level": space["assistance_level"],
        "has_care_space": True,
    })


@router.post("/care-space")
async def create_care_space(payload: CareSpaceCreate, user: User = Depends(get_care_user)):
    space = _space_for(user)
    space["name"] = payload.name.strip() or space["name"]
    space["assistance_level"] = payload.assistance_level or "guided"
    if payload.safety_plan:
        space["safety_plan"].update(payload.safety_plan)
    return _ok("Care Space created successfully.", {"care_space_name": space["name"]})


@router.get("/care-space/patient-view")
async def patient_care_view(user: User = Depends(get_care_user)):
    return _ok("Patient Care Space retrieved.", _patient_view(user, _space_for(user)))


@router.get("/care-space/caregiver-view")
async def caregiver_care_view(user: User = Depends(get_care_user)):
    space = _space_for(user)
    completed = sum(item["is_completed"] for item in space["routine"])
    return _ok("Caregiver Care Space retrieved.", {
        "care_space_name": space["name"],
        "patient_name": user.full_name or "Alex Johnson",
        "patient_code": getattr(user.patient_profile, "patient_code", "DX-4091"),
        "completed_tasks_count": completed,
        "pending_tasks_count": len(space["routine"]) - completed,
        "safety_summary": space["safety_plan"],
        "family_members": space["members"],
        "daily_routine_overview": space["routine"],
        "recent_care_logs": space["care_logs"],
        "curated_tips": [],
    })


@router.get("/care-space/family-view")
async def family_care_view(user: User = Depends(get_care_user)):
    space = _space_for(user)
    return _ok("Family Care Space retrieved.", {
        "care_space_name": space["name"],
        "patient_name": user.full_name or "Alex Johnson",
        "my_role": "family_member",
        "my_permissions": {
            "can_view_memory_book": True,
            "can_edit_memory_book": True,
        },
        "assigned_tasks": space["routine"],
        "upcoming_appointments": [],
        "memory_book": space["memory_book"],
        "safety_contacts": space["members"],
    })


@router.get("/care-space/routine")
async def get_routine(user: User = Depends(get_care_user)):
    return _ok("Routine retrieved.", _space_for(user)["routine"])


@router.post("/care-space/routine")
async def add_routine(payload: RoutineCreate, user: User = Depends(get_care_user)):
    item = payload.model_dump()
    item.update({"id": str(uuid.uuid4()), "is_completed": False})
    _space_for(user)["routine"].append(item)
    return _ok("Routine item added.", item)


@router.put("/care-space/routine/{item_id}/toggle")
async def toggle_routine(item_id: str, user: User = Depends(get_care_user)):
    for item in _space_for(user)["routine"]:
        if item["id"] == item_id:
            item["is_completed"] = not item["is_completed"]
            return _ok("Routine item updated.", item)
    raise HTTPException(status_code=404, detail="Routine item not found.")


@router.get("/care-space/care-logs")
async def get_care_logs(user: User = Depends(get_care_user)):
    return _ok("Care logs retrieved.", _space_for(user)["care_logs"])


@router.post("/care-space/care-logs")
async def add_care_log(payload: CareLogCreate, user: User = Depends(get_care_user)):
    log = payload.model_dump()
    log.update({"id": str(uuid.uuid4()), "created_at": datetime.now(timezone.utc).isoformat()})
    _space_for(user)["care_logs"].insert(0, log)
    return _ok("Care log added.", log)


@router.get("/care-space/memory-book")
async def get_memory_book(user: User = Depends(get_care_user)):
    return _ok("Memory book retrieved.", _space_for(user)["memory_book"])


@router.post("/care-space/memory-book")
async def add_memory(payload: MemoryCreate, user: User = Depends(get_care_user)):
    memory = payload.model_dump()
    memory["id"] = str(uuid.uuid4())
    _space_for(user)["memory_book"].append(memory)
    return _ok("Memory added.", memory)


@router.get("/care-space/safety-plan")
async def get_safety_plan(user: User = Depends(get_care_user)):
    return _ok("Safety plan retrieved.", _space_for(user)["safety_plan"])


@router.put("/care-space/safety-plan")
async def update_safety_plan(payload: dict[str, Any], user: User = Depends(get_care_user)):
    _space_for(user)["safety_plan"].update(payload)
    return _ok("Safety plan updated.", _space_for(user)["safety_plan"])


@router.get("/care-space/members")
async def get_members(user: User = Depends(get_care_user)):
    return _ok("Members retrieved.", _space_for(user)["members"])


@router.post("/care-space/invitations")
async def invite_member(payload: InvitationCreate, user: User = Depends(get_care_user)):
    code = f"CARE-{uuid.uuid4().hex[:6].upper()}"
    member = {
        "id": str(uuid.uuid4()),
        "email": payload.email,
        "role": payload.role,
        "relationship_label": payload.relationship_label,
        "invite_code": code,
        "permissions": payload.permissions or {},
    }
    _space_for(user)["members"].append(member)
    return _ok("Invitation created.", {"invite_code": code, "member": member})


@router.post("/care-space/invitations/accept")
async def accept_invitation(payload: dict[str, str], user: User = Depends(get_care_user)):
    code = payload.get("invite_code", "").upper()
    for space in _care_spaces.values():
        for member in space["members"]:
            if member["invite_code"] == code:
                member["user_id"] = user.id
                _space_for(user)["members"].append(member)
                return _ok("Invitation accepted.", member)
    raise HTTPException(status_code=404, detail="Invitation code not found.")


@router.put("/care-space/members/{member_id}/permissions")
async def update_permissions(member_id: str, payload: dict[str, Any], user: User = Depends(get_care_user)):
    for member in _space_for(user)["members"]:
        if member["id"] == member_id:
            member["permissions"] = payload.get("permissions", {})
            return _ok("Permissions updated.", member)
    raise HTTPException(status_code=404, detail="Member not found.")


@router.get("/care-space/education")
async def get_education(user: User = Depends(get_care_user)):
    return _ok("Education resources retrieved.", [])


@router.get("/care-space/audit-logs")
async def get_audit_logs(user: User = Depends(get_care_user)):
    return _ok("Audit logs retrieved.", _space_for(user)["audit_logs"])


# ---------------------------------------------------------------------------
# Caretaker Notes
# ---------------------------------------------------------------------------

class NoteCreate(BaseModel):
    text: str
    author: Optional[str] = None


@router.get("/caretaker/notes")
async def list_notes(
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    notes = (
        db.query(CaretakerNoteModel)
        .filter(CaretakerNoteModel.patient_id == user.id)
        .order_by(CaretakerNoteModel.created_at.desc())
        .all()
    )
    data = [
        {
            "id": n.id,
            "text": n.text,
            "author": n.author_name,
            "date": n.date_str,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notes
    ]
    return _ok("Notes retrieved.", data)


@router.post("/caretaker/notes")
async def add_note(
    payload: NoteCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    now = datetime.now(timezone.utc)
    note = CaretakerNoteModel(
        id=str(uuid.uuid4()),
        patient_id=user.id,
        author_name=payload.author or user.full_name or "Caretaker",
        date_str=now.strftime("%d %b %Y"),
        text=payload.text,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return _ok("Note added.", data={"id": note.id, "text": note.text, "author": note.author_name})


# ---------------------------------------------------------------------------
# Medications
# ---------------------------------------------------------------------------

@router.get("/caretaker/medications")
async def list_medications(
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    meds = (
        db.query(MedicationRecordModel)
        .filter(MedicationRecordModel.patient_id == user.id)
        .all()
    )
    data = [
        {
            "id": m.id,
            "name": m.name,
            "dosage": m.dosage,
            "time": m.time_str,
            "status": m.status,
            "taken_today": m.status == "taken",
        }
        for m in meds
    ]
    return _ok("Medications retrieved.", data)


@router.put("/caretaker/medications/{med_id}/toggle")
async def toggle_medication(
    med_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    from fastapi import HTTPException
    med = (
        db.query(MedicationRecordModel)
        .filter(MedicationRecordModel.id == med_id, MedicationRecordModel.patient_id == user.id)
        .first()
    )
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found.")
    med.status = "pending" if med.status == "taken" else "taken"
    db.commit()
    return _ok("Medication toggled.", data={"id": med.id, "status": med.status, "taken_today": med.status == "taken"})
