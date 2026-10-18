"""
Care Space Router for DemenX

Provides role-specific endpoints and backend authorization enforcement for:
- User Type A: Person living with dementia (Patient) - low cognitive load, daily routine, memories.
- User Type B: Primary Caregiver - coordination, task management, care logs, safety.
- User Type C: Additional Family Members - scoped, fine-grained permission-based access.
"""

import json
import logging
import uuid
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.care_space import (
    CareSpace,
    CareSpaceMember,
    CareSpaceInvitation,
    DailyRoutineItem,
    CareActivityLog,
    MemoryBookItem,
    CareSpaceAuditLog,
    CaregiverResource,
)
from dependencies import get_current_user_optional
from services.care_space_service import (
    get_user_care_space_membership,
    check_permission,
    parse_permissions,
    build_patient_home_view,
    build_caregiver_dashboard_view,
    build_family_dashboard_view,
    log_audit_action,
)
from schemas.care_space import (
    CareSpaceCreateRequest,
    InviteMemberRequest,
    AcceptInvitationRequest,
    UpdateMemberPermissionsRequest,
    RoutineItemCreateRequest,
    CareActivityLogCreateRequest,
    MemoryBookItemCreateRequest,
    SafetyPlanUpdateRequest,
    CareSpaceContextDTO,
)

logger = logging.getLogger("demenx.router.care_space")
router = APIRouter(prefix="/api/v1/care-space", tags=["Care Space & Connected Care"])


def get_care_user(
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    """Use the seeded patient for anonymous Connected Care demo access."""
    if user:
        return user
    demo_user = db.query(User).filter(User.id == "patient-001", User.is_active == True).first()
    if demo_user:
        return demo_user
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Connected Care demo patient is unavailable.",
    )


def _api_response(success: bool, message: str, data=None, status_code: int = 200):
    return JSONResponse(
        status_code=status_code,
        content={"success": success, "message": message, "data": data}
    )


def _require_care_space(db: Session, user: User) -> tuple[CareSpace, CareSpaceMember]:
    """Helper to resolve the user's active care space or raise 404/403."""
    space, member = get_user_care_space_membership(db, user)
    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active Care Space found for your account. Please create or join a Care Circle first."
        )
    return space, member


# ---------------------------------------------------------------------------
# Context & Onboarding
# ---------------------------------------------------------------------------

@router.get("/context")
async def get_care_space_context(
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    """
    Returns current user's Care Space onboarding and role status.
    If user has not established a Care Space, returns setup_flow_available=True
    instead of 404, allowing the frontend to present a clean setup wizard.
    """
    space, member = get_user_care_space_membership(db, user)

    if not space:
        return _api_response(True, "No active care space.", data={
            "has_care_space": False,
            "setup_flow_available": True,
            "recommended_flow": "create_care_space" if (user.role or "").lower() in ("patient", "caretaker") else "request_invitation",
        })

    patient = space.patient or db.query(User).filter(User.id == space.patient_id).first()
    perms = parse_permissions(member.permissions_json, member.role) if member else None

    return _api_response(True, "Care space context retrieved.", data={
        "has_care_space": True,
        "care_space_id": space.id,
        "care_space_name": space.name,
        "patient_name": patient.full_name if patient else "Patient",
        "user_role_in_space": member.role if member else "none",
        "relationship_label": member.relationship_label if member else "Self",
        "permissions": perms.model_dump() if perms else None,
        "assistance_level": space.assistance_level,
        "setup_flow_available": True,
    })


@router.post("")
async def create_care_space(
    req: CareSpaceCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    """
    Create a new Care Space.
    - If called by a patient: patient becomes owner and primary participant.
    - If called by a caregiver: patient_id can be specified or current demo patient.
    """
    role = (user.role or "").lower()

    # Determine patient
    if role == "patient":
        target_patient_id = user.id
        my_role = "patient"
        my_label = "Self"
    else:
        target_patient_id = req.patient_id or "patient-001"
        my_role = "primary_caregiver"
        my_label = "Primary Caregiver"

    # Check if patient already has a space
    existing = db.query(CareSpace).filter(CareSpace.patient_id == target_patient_id).first()
    if existing:
        return _api_response(False, "A Care Space already exists for this patient.", status_code=409)

    space_id = str(uuid.uuid4())
    space = CareSpace(
        id=space_id,
        name=req.name or f"Care Circle for {user.full_name}",
        patient_id=target_patient_id,
        assistance_level=req.assistance_level or "guided",
        preferences_json=json.dumps(req.preferences or {
            "large_text": True,
            "voice_prompts": True,
            "simplified_icons": True,
        }),
        safety_plan_json=json.dumps(req.safety_plan or {
            "emergency_contacts": [
                {"name": user.full_name or "Primary Contact", "phone": user.phone or "+91 9876543212", "role": "Primary Caregiver"}
            ],
            "home_address": "14 Green Park, New Delhi",
            "safe_zones": ["Home", "Society Garden", "Community Center"],
            "wandering_risk_level": "low",
            "calming_strategies": ["Play classical instrumental music", "Show family photo album"],
        })
    )
    db.add(space)
    db.flush()

    # Add creator as primary member
    member = CareSpaceMember(
        care_space_id=space.id,
        user_id=user.id,
        role=my_role,
        relationship_label=my_label,
        permissions_json=json.dumps({
            "can_manage_routine": True,
            "can_manage_appointments": True,
            "can_view_memory_book": True,
            "can_edit_memory_book": True,
            "can_log_care": True,
            "can_view_vitals": True,
            "can_view_reports": True,
            "can_receive_safety_alerts": True,
            "can_manage_members": True,
        }),
        is_active=True
    )
    db.add(member)

    # If creator was not the patient, also add patient as a member
    if target_patient_id != user.id:
        p_user = db.query(User).filter(User.id == target_patient_id).first()
        if p_user:
            p_member = CareSpaceMember(
                care_space_id=space.id,
                user_id=p_user.id,
                role="patient",
                relationship_label="Self",
                permissions_json=json.dumps({
                    "can_manage_routine": True,
                    "can_manage_appointments": True,
                    "can_view_memory_book": True,
                    "can_edit_memory_book": True,
                    "can_log_care": True,
                    "can_view_vitals": True,
                    "can_view_reports": True,
                    "can_receive_safety_alerts": True,
                    "can_manage_members": True,
                }),
                is_active=True
            )
            db.add(p_member)

    db.commit()
    logger.info("Created new Care Space %s for patient %s", space.id, target_patient_id)
    return _api_response(True, "Care Space created successfully.", data={"id": space.id, "name": space.name})


# ---------------------------------------------------------------------------
# Role-Specific Interface Endpoints (4.1, 4.2, 4.3, 4.5)
# ---------------------------------------------------------------------------

@router.get("/patient-view")
async def get_patient_view(
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    """
    User Type A: Clean, low-cognitive-load home view for person living with dementia.
    Avoids clinical graphs, complex forms, or overwhelming numbers.
    """
    space, member = _require_care_space(db, user)
    patient = space.patient or db.query(User).filter(User.id == space.patient_id).first()
    view = build_patient_home_view(db, space, patient or user)
    return _api_response(True, "Patient home view retrieved.", data=view.model_dump())


@router.get("/caregiver-view")
async def get_caregiver_view(
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    """
    User Type B: Comprehensive coordination dashboard for Primary Caregiver.
    Includes routine overview, care activity logs, safety summary, appointments, and education tips.
    """
    space, member = _require_care_space(db, user)

    # Authorization guard: must be primary caregiver or doctor or patient
    if member and member.role not in ("primary_caregiver", "patient") and (user.role or "").lower() not in ("caretaker", "doctor"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Caregiver Coordination Dashboard requires Primary Caregiver privileges."
        )

    view = build_caregiver_dashboard_view(db, space, user)
    return _api_response(True, "Caregiver coordination dashboard retrieved.", data=view.model_dump())


@router.get("/family-view")
async def get_family_view(
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    """
    User Type C: Scoped view for additional trusted family members.
    Strictly filters displayed modules by granted permissions.
    """
    space, member = _require_care_space(db, user)
    view = build_family_dashboard_view(db, space, user, member)
    return _api_response(True, "Family view retrieved.", data=view.model_dump())


# ---------------------------------------------------------------------------
# Family Coordination & Permission Workflows (4.3, 4.4)
# ---------------------------------------------------------------------------

@router.get("/members")
async def list_members(
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    """List all authorized participants in the Care Space with their scoped roles."""
    space, member = _require_care_space(db, user)

    members = db.query(CareSpaceMember).filter(
        CareSpaceMember.care_space_id == space.id,
        CareSpaceMember.is_active == True
    ).all()

    result = []
    for m in members:
        u = m.user
        perms = parse_permissions(m.permissions_json, m.role)
        result.append({
            "id": m.id,
            "user_id": m.user_id,
            "name": u.full_name or u.email if u else "Participant",
            "email": u.email if u else "",
            "role": m.role,
            "relationship_label": m.relationship_label,
            "permissions": perms.model_dump(),
            "joined_at": m.joined_at.strftime("%d %b %Y"),
        })

    return _api_response(True, "Care space members retrieved.", data=result)


@router.post("/invitations")
async def invite_member(
    req: InviteMemberRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    """
    Invite an additional family member or trusted contact with scoped permissions.
    Enforces authorization: only primary caregiver or patient can invite participants.
    """
    space, member = _require_care_space(db, user)

    if not check_permission(member, "can_manage_members"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not have permission to invite participants to this Care Circle."
        )

    # Clean email
    email_clean = req.email.strip().lower()

    # Generate secure invite code
    code = f"CARE-{secrets.token_hex(4).upper()}"
    expires = datetime.now(timezone.utc) + timedelta(days=7)

    perms_dict = req.permissions.model_dump() if req.permissions else {
        "can_manage_routine": True,
        "can_manage_appointments": False,
        "can_view_memory_book": True,
        "can_edit_memory_book": False,
        "can_log_care": True,
        "can_view_vitals": True,
        "can_view_reports": False,
        "can_receive_safety_alerts": True,
        "can_manage_members": False,
    }

    invitation = CareSpaceInvitation(
        care_space_id=space.id,
        invited_email=email_clean,
        invited_by_user_id=user.id,
        role=req.role,
        relationship_label=req.relationship_label,
        permissions_json=json.dumps(perms_dict),
        invite_code=code,
        status="pending",
        expires_at=expires
    )
    db.add(invitation)
    db.commit()

    log_audit_action(
        db, space.id, user.id, user.full_name or user.email,
        "INVITED_PARTICIPANT", details={"email": email_clean, "role": req.role, "code": code}
    )

    logger.info("Created CareSpace invite %s for %s", code, email_clean)
    return _api_response(True, f"Invitation created for {email_clean}.", data={
        "invite_code": code,
        "invited_email": email_clean,
        "role": req.role,
        "relationship_label": req.relationship_label,
        "expires_at": expires.isoformat(),
    })


@router.post("/invitations/accept")
async def accept_invitation(
    req: AcceptInvitationRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    """Accept an invitation to join a Care Space via invite code."""
    inv = db.query(CareSpaceInvitation).filter(
        CareSpaceInvitation.invite_code == req.invite_code.strip().upper(),
        CareSpaceInvitation.status == "pending"
    ).first()

    if not inv:
        return _api_response(False, "Invalid or expired invitation code.", status_code=404)

    if inv.expires_at < datetime.now(timezone.utc):
        inv.status = "expired"
        db.commit()
        return _api_response(False, "This invitation code has expired.", status_code=410)

    # Check if already a member
    existing = db.query(CareSpaceMember).filter(
        CareSpaceMember.care_space_id == inv.care_space_id,
        CareSpaceMember.user_id == user.id
    ).first()

    if existing:
        inv.status = "accepted"
        db.commit()
        return _api_response(True, "You are already a member of this Care Space.")

    member = CareSpaceMember(
        care_space_id=inv.care_space_id,
        user_id=user.id,
        role=inv.role,
        relationship_label=inv.relationship_label,
        permissions_json=inv.permissions_json,
        is_active=True
    )
    db.add(member)
    inv.status = "accepted"
    db.commit()

    log_audit_action(
        db, inv.care_space_id, user.id, user.full_name or user.email,
        "JOINED_CARE_SPACE", details={"role": inv.role, "label": inv.relationship_label}
    )

    return _api_response(True, "Successfully joined the Care Space!")


@router.put("/members/{member_id}/permissions")
async def update_member_permissions(
    member_id: str,
    req: UpdateMemberPermissionsRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    """Update permissions for an existing member. Restricted to primary caregiver or patient."""
    space, caller_member = _require_care_space(db, user)

    if not check_permission(caller_member, "can_manage_members"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not have permission to modify member permissions."
        )

    target = db.query(CareSpaceMember).filter(
        CareSpaceMember.id == member_id,
        CareSpaceMember.care_space_id == space.id
    ).first()

    if not target:
        raise HTTPException(status_code=404, detail="Member not found.")

    target.permissions_json = json.dumps(req.permissions.model_dump())
    db.commit()

    log_audit_action(
        db, space.id, user.id, user.full_name or user.email,
        "UPDATED_PERMISSIONS", target_user_id=target.user_id, details=req.permissions.model_dump()
    )

    return _api_response(True, "Member permissions updated successfully.")


# ---------------------------------------------------------------------------
# Daily Routines & Tasks (4.1, 4.2)
# ---------------------------------------------------------------------------

@router.get("/routine")
async def list_routine_items(
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    """Retrieve daily routine items and tasks."""
    space, member = _require_care_space(db, user)

    items = db.query(DailyRoutineItem).filter(
        DailyRoutineItem.care_space_id == space.id
    ).order_by(DailyRoutineItem.scheduled_time.asc()).all()

    return _api_response(True, "Routine retrieved.", data=[{
        "id": i.id,
        "title": i.title,
        "description": i.description,
        "category": i.category,
        "scheduled_time": i.scheduled_time,
        "assigned_to_role": i.assigned_to_role,
        "is_completed": i.is_completed,
        "completed_at": i.completed_at.isoformat() if i.completed_at else None,
        "recurrence": i.recurrence,
        "difficulty_level": i.difficulty_level,
        "icon_hint": i.icon_hint,
    } for i in items])


@router.post("/routine")
async def add_routine_item(
    req: RoutineItemCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    """Add a new daily routine item or task (checks can_manage_routine)."""
    space, member = _require_care_space(db, user)

    if not check_permission(member, "can_manage_routine"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not authorized to add routine tasks."
        )

    item = DailyRoutineItem(
        care_space_id=space.id,
        title=req.title,
        description=req.description,
        category=req.category,
        scheduled_time=req.scheduled_time,
        assigned_to_user_id=req.assigned_to_user_id,
        assigned_to_role=req.assigned_to_role or "patient",
        recurrence=req.recurrence or "daily",
        difficulty_level=req.difficulty_level or "easy",
        icon_hint=req.icon_hint or "sun",
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return _api_response(True, "Routine item added.", data={"id": item.id, "title": item.title})


@router.put("/routine/{item_id}/toggle")
async def toggle_routine_item(
    item_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    """Mark a routine task as completed or incomplete."""
    space, member = _require_care_space(db, user)

    item = db.query(DailyRoutineItem).filter(
        DailyRoutineItem.id == item_id,
        DailyRoutineItem.care_space_id == space.id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Routine item not found.")

    item.is_completed = not item.is_completed
    item.completed_at = datetime.now(timezone.utc) if item.is_completed else None
    item.completed_by_user_id = user.id if item.is_completed else None
    db.commit()

    return _api_response(True, f"Task marked as {'completed' if item.is_completed else 'pending'}.", data={
        "id": item.id,
        "is_completed": item.is_completed,
        "completed_at": item.completed_at.isoformat() if item.completed_at else None,
    })


# ---------------------------------------------------------------------------
# Care Activity Logs & Vitals (4.2)
# ---------------------------------------------------------------------------

@router.get("/care-logs")
async def list_care_logs(
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    """Retrieve care logs and health observations (checks can_view_vitals or can_log_care)."""
    space, member = _require_care_space(db, user)

    if not (check_permission(member, "can_view_vitals") or check_permission(member, "can_log_care")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not authorized to view care activity logs."
        )

    logs = db.query(CareActivityLog).filter(
        CareActivityLog.care_space_id == space.id
    ).order_by(CareActivityLog.created_at.desc()).all()

    result = []
    for l in logs:
        det = {}
        if l.details_json:
            try:
                det = json.loads(l.details_json)
            except Exception:
                det = {}
        result.append({
            "id": l.id,
            "author_id": l.author_id,
            "author_name": l.author_name,
            "log_type": l.log_type,
            "title": l.title,
            "details": det,
            "notes": l.notes,
            "created_at": l.created_at.strftime("%d %b, %I:%M %p"),
        })

    return _api_response(True, "Care logs retrieved.", data=result)


@router.post("/care-logs")
async def create_care_log(
    req: CareActivityLogCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    """Record a care activity log, vital sign, mood, or observation (checks can_log_care)."""
    space, member = _require_care_space(db, user)

    if not check_permission(member, "can_log_care"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not authorized to log care activities."
        )

    log = CareActivityLog(
        care_space_id=space.id,
        author_id=user.id,
        author_name=user.full_name or user.email,
        log_type=req.log_type,
        title=req.title,
        details_json=json.dumps(req.details or {}),
        notes=req.notes
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return _api_response(True, "Care activity recorded.", data={"id": log.id, "title": log.title})


# ---------------------------------------------------------------------------
# Memory Book & Familiar People (4.1, 4.3, 4.4)
# ---------------------------------------------------------------------------

@router.get("/memory-book")
async def list_memory_items(
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    """
    Retrieve familiar people and memories.
    Enforces privacy: if caller is not the patient, items flagged with
    is_private_to_patient are strictly hidden!
    """
    space, member = _require_care_space(db, user)

    if not check_permission(member, "can_view_memory_book"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not have permission to view the Memory Book."
        )

    is_patient = user.id == space.patient_id

    query = db.query(MemoryBookItem).filter(MemoryBookItem.care_space_id == space.id)
    if not is_patient:
        # Strict privacy enforcement
        query = query.filter(MemoryBookItem.is_private_to_patient == False)

    items = query.order_by(MemoryBookItem.is_favorite.desc(), MemoryBookItem.created_at.desc()).all()

    return _api_response(True, "Memory Book retrieved.", data=[{
        "id": m.id,
        "item_type": m.item_type,
        "name_or_title": m.name_or_title,
        "relationship_or_context": m.relationship_or_context,
        "description": m.description,
        "phone": m.phone,
        "avatar_or_photo_url": m.avatar_or_photo_url,
        "is_private_to_patient": m.is_private_to_patient,
        "is_favorite": m.is_favorite,
        "created_at": m.created_at.strftime("%d %b %Y"),
    } for m in items])


@router.post("/memory-book")
async def create_memory_item(
    req: MemoryBookItemCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    """Add a familiar person, memory card, or favorite place (checks can_edit_memory_book)."""
    space, member = _require_care_space(db, user)

    is_patient = user.id == space.patient_id
    if not (is_patient or check_permission(member, "can_edit_memory_book")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not have permission to add or edit Memory Book entries."
        )

    item = MemoryBookItem(
        care_space_id=space.id,
        created_by_user_id=user.id,
        item_type=req.item_type,
        name_or_title=req.name_or_title,
        relationship_or_context=req.relationship_or_context,
        description=req.description,
        phone=req.phone,
        avatar_or_photo_url=req.avatar_or_photo_url,
        audio_memo_url=req.audio_memo_url,
        is_private_to_patient=req.is_private_to_patient if is_patient else False,
        is_favorite=req.is_favorite or False
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return _api_response(True, "Memory Book item created.", data={"id": item.id, "title": item.name_or_title})


# ---------------------------------------------------------------------------
# Safety & Emergency Planning (4.2, 4.4)
# ---------------------------------------------------------------------------

@router.get("/safety-plan")
async def get_safety_plan(
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    """Retrieve safety plan: emergency contacts, safe zones, wandering plan."""
    space, member = _require_care_space(db, user)

    safety = {}
    if space.safety_plan_json:
        try:
            safety = json.loads(space.safety_plan_json)
        except Exception:
            safety = {}

    return _api_response(True, "Safety plan retrieved.", data=safety)


@router.put("/safety-plan")
async def update_safety_plan(
    req: SafetyPlanUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    """Update safety plan (restricted to primary caregiver or patient)."""
    space, member = _require_care_space(db, user)

    if member and member.role not in ("primary_caregiver", "patient") and (user.role or "").lower() not in ("caretaker", "doctor"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only Primary Caregiver or Patient can update the Safety Plan."
        )

    curr = {}
    if space.safety_plan_json:
        try:
            curr = json.loads(space.safety_plan_json)
        except Exception:
            curr = {}

    if req.emergency_contacts is not None:
        curr["emergency_contacts"] = req.emergency_contacts
    if req.home_address is not None:
        curr["home_address"] = req.home_address
    if req.safe_zones is not None:
        curr["safe_zones"] = req.safe_zones
    if req.wandering_risk_level is not None:
        curr["wandering_risk_level"] = req.wandering_risk_level
    if req.calming_strategies is not None:
        curr["calming_strategies"] = req.calming_strategies
    if req.preferred_hospital is not None:
        curr["preferred_hospital"] = req.preferred_hospital
    if req.primary_doctor_name is not None:
        curr["primary_doctor_name"] = req.primary_doctor_name
    if req.primary_doctor_phone is not None:
        curr["primary_doctor_phone"] = req.primary_doctor_phone

    curr["last_updated"] = datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p")
    space.safety_plan_json = json.dumps(curr)
    db.commit()

    log_audit_action(
        db, space.id, user.id, user.full_name or user.email,
        "UPDATED_SAFETY_PLAN", details={"risk": req.wandering_risk_level}
    )

    return _api_response(True, "Safety plan updated successfully.", data=curr)


# ---------------------------------------------------------------------------
# Caregiver Education Resources & Audit Logs
# ---------------------------------------------------------------------------

@router.get("/education")
async def get_education_resources(
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    """Retrieve educational articles and tips for family and caregivers."""
    resources = db.query(CaregiverResource).all()

    return _api_response(True, "Education resources retrieved.", data=[{
        "id": r.id,
        "title": r.title,
        "category": r.category,
        "summary": r.summary,
        "content": r.content,
        "read_time_mins": r.read_time_mins,
    } for r in resources])


@router.get("/audit-logs")
async def get_audit_logs(
    db: Session = Depends(get_db),
    user: User = Depends(get_care_user),
):
    """View sensitive audit history. Restricted to Primary Caregiver or Patient."""
    space, member = _require_care_space(db, user)

    if member and member.role not in ("primary_caregiver", "patient"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Audit logs can only be viewed by Primary Caregivers."
        )

    logs = db.query(CareSpaceAuditLog).filter(
        CareSpaceAuditLog.care_space_id == space.id
    ).order_by(CareSpaceAuditLog.created_at.desc()).limit(30).all()

    result = []
    for l in logs:
        det = {}
        if l.details_json:
            try:
                det = json.loads(l.details_json)
            except Exception:
                det = {}
        result.append({
            "id": l.id,
            "actor_id": l.actor_id,
            "actor_name": l.actor_name,
            "action": l.action,
            "details": det,
            "created_at": l.created_at.strftime("%d %b %Y, %I:%M %p"),
        })

    return _api_response(True, "Audit logs retrieved.", data=result)

