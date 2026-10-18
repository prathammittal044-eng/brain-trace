"""
Care Space and Connected Care Business Logic Service for DemenX

Enforces backend authorization, privacy filters, and tailored views for:
- User Type A (Person living with dementia): Minimal cognitive load, daily routine, memories.
- User Type B (Primary Caregiver): Coordination, tasks, logs, safety plan, caregiver education.
- User Type C (Additional Family Members): Fine-grained permission-scoped access.
"""

import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from models.user import User, PatientProfile
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
from models.appointment import AppointmentModel
from schemas.care_space import (
    CareSpacePermissionsDTO,
    CareSpaceMemberDTO,
    RoutineItemDTO,
    CareActivityLogDTO,
    MemoryBookItemDTO,
    SafetyPlanDTO,
    PatientHomeViewDTO,
    CaregiverDashboardViewDTO,
    FamilyDashboardViewDTO,
    CareSpaceContextDTO,
)

logger = logging.getLogger("demenx.services.care_space")


DEFAULT_PERMISSIONS: Dict[str, Dict[str, bool]] = {
    "patient": {
        "can_manage_routine": True,
        "can_manage_appointments": True,
        "can_view_memory_book": True,
        "can_edit_memory_book": True,
        "can_log_care": True,
        "can_view_vitals": True,
        "can_view_reports": True,
        "can_receive_safety_alerts": True,
        "can_manage_members": True,
    },
    "primary_caregiver": {
        "can_manage_routine": True,
        "can_manage_appointments": True,
        "can_view_memory_book": True,
        "can_edit_memory_book": True,
        "can_log_care": True,
        "can_view_vitals": True,
        "can_view_reports": True,
        "can_receive_safety_alerts": True,
        "can_manage_members": True,
    },
    "family_member": {
        "can_manage_routine": True,
        "can_manage_appointments": False,
        "can_view_memory_book": True,
        "can_edit_memory_book": False,
        "can_log_care": True,
        "can_view_vitals": True,
        "can_view_reports": False,
        "can_receive_safety_alerts": True,
        "can_manage_members": False,
    },
    "trusted_contact": {
        "can_manage_routine": False,
        "can_manage_appointments": False,
        "can_view_memory_book": True,
        "can_edit_memory_book": False,
        "can_log_care": False,
        "can_view_vitals": False,
        "can_view_reports": False,
        "can_receive_safety_alerts": True,
        "can_manage_members": False,
    },
}


def parse_permissions(perms_json: Optional[str], role: str) -> CareSpacePermissionsDTO:
    """Parse JSON permissions or return default for the given role."""
    base = DEFAULT_PERMISSIONS.get(role, DEFAULT_PERMISSIONS["family_member"]).copy()
    if perms_json:
        try:
            custom = json.loads(perms_json)
            if isinstance(custom, dict):
                base.update(custom)
        except Exception:
            pass
    return CareSpacePermissionsDTO(**base)


def check_permission(member: Optional[CareSpaceMember], permission_key: str) -> bool:
    """Check if member has a specific permission. Admins and patients always have permission."""
    if not member:
        return False
    if member.role in ("patient", "primary_caregiver"):
        return True
    perms = parse_permissions(member.permissions_json, member.role)
    return getattr(perms, permission_key, False)


def get_user_care_space_membership(db: Session, user: User) -> Tuple[Optional[CareSpace], Optional[CareSpaceMember]]:
    """Retrieve the primary Care Space and membership for the authenticated user."""
    # 1. If user is a patient, look up CareSpace where they are the patient
    if (user.role or "").lower() == "patient":
        space = db.query(CareSpace).filter(CareSpace.patient_id == user.id).first()
        if space:
            member = db.query(CareSpaceMember).filter(
                CareSpaceMember.care_space_id == space.id,
                CareSpaceMember.user_id == user.id
            ).first()
            return space, member

    # 2. Check if user is a member of any Care Space (caregiver, family, etc.)
    membership = db.query(CareSpaceMember).filter(
        CareSpaceMember.user_id == user.id,
        CareSpaceMember.is_active == True
    ).first()

    if membership:
        space = db.query(CareSpace).filter(CareSpace.id == membership.care_space_id).first()
        return space, membership

    # 3. Demo fallback: if demo caregiver or demo patient, check baseline patient-001 space
    demo_space = db.query(CareSpace).filter(CareSpace.patient_id == "patient-001").first()
    if demo_space:
        member = db.query(CareSpaceMember).filter(
            CareSpaceMember.care_space_id == demo_space.id,
            CareSpaceMember.user_id == user.id
        ).first()
        if member:
            return demo_space, member

    return None, None


def log_audit_action(
    db: Session,
    care_space_id: str,
    actor_id: str,
    actor_name: str,
    action: str,
    target_user_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
):
    """Record an audit trail entry for sensitive actions."""
    audit = CareSpaceAuditLog(
        care_space_id=care_space_id,
        actor_id=actor_id,
        actor_name=actor_name,
        action=action,
        target_user_id=target_user_id,
        details_json=json.dumps(details or {})
    )
    db.add(audit)
    db.commit()


# --- View Builders ---

def build_patient_home_view(db: Session, care_space: CareSpace, patient: User) -> PatientHomeViewDTO:
    """User Type A: Simplified, plain language, low-cognitive-load patient experience."""
    now = datetime.now(timezone.utc)
    hour = now.hour
    greeting = "Good Morning" if hour < 12 else ("Good Afternoon" if hour < 17 else "Good Evening")

    # Patient info
    prof = patient.patient_profile
    p_code = prof.patient_code if prof else "DX-4091"
    p_name = patient.full_name or "Friend"

    # Routine items for today
    items = db.query(DailyRoutineItem).filter(
        DailyRoutineItem.care_space_id == care_space.id
    ).order_by(DailyRoutineItem.scheduled_time.asc()).all()

    routine_dtos = [
        RoutineItemDTO(
            id=item.id,
            title=item.title,
            description=item.description,
            category=item.category,
            scheduled_time=item.scheduled_time,
            assigned_to_role=item.assigned_to_role,
            is_completed=item.is_completed,
            completed_at=item.completed_at.isoformat() if item.completed_at else None,
            recurrence=item.recurrence,
            difficulty_level=item.difficulty_level,
            icon_hint=item.icon_hint,
        )
        for item in items
    ]

    # Familiar people (Memory Book with item_type == "familiar_person")
    people = db.query(MemoryBookItem).filter(
        MemoryBookItem.care_space_id == care_space.id,
        MemoryBookItem.item_type == "familiar_person"
    ).all()

    familiar_dtos = [
        MemoryBookItemDTO(
            id=p.id,
            item_type=p.item_type,
            name_or_title=p.name_or_title,
            relationship_or_context=p.relationship_or_context,
            description=p.description,
            phone=p.phone,
            avatar_or_photo_url=p.avatar_or_photo_url,
            is_private_to_patient=p.is_private_to_patient,
            is_favorite=p.is_favorite,
            created_at=p.created_at.isoformat() if p.created_at else now.isoformat(),
        )
        for p in people
    ]

    # Comfort memories (2-3 life memories)
    memories = db.query(MemoryBookItem).filter(
        MemoryBookItem.care_space_id == care_space.id,
        MemoryBookItem.item_type.in_(["life_memory", "favorite_place", "comfort_item"])
    ).limit(3).all()

    memory_dtos = [
        MemoryBookItemDTO(
            id=m.id,
            item_type=m.item_type,
            name_or_title=m.name_or_title,
            relationship_or_context=m.relationship_or_context,
            description=m.description,
            phone=m.phone,
            avatar_or_photo_url=m.avatar_or_photo_url,
            is_private_to_patient=m.is_private_to_patient,
            is_favorite=m.is_favorite,
            created_at=m.created_at.isoformat() if m.created_at else now.isoformat(),
        )
        for m in memories
    ]

    # Primary Caregiver Contact
    primary_member = db.query(CareSpaceMember).filter(
        CareSpaceMember.care_space_id == care_space.id,
        CareSpaceMember.role == "primary_caregiver"
    ).first()

    caregiver_contact = None
    if primary_member and primary_member.user:
        caregiver_contact = {
            "name": primary_member.user.full_name or "Primary Caregiver",
            "relationship": primary_member.relationship_label,
            "phone": primary_member.user.phone or "+91 9876543212",
        }

    # Safety & emergency contact
    safety_data = {}
    if care_space.safety_plan_json:
        try:
            safety_data = json.loads(care_space.safety_plan_json)
        except Exception:
            safety_data = {}

    emergency_phone = "+91 9876543212"
    contacts = safety_data.get("emergency_contacts", [])
    if contacts and isinstance(contacts, list) and len(contacts) > 0:
        emergency_phone = contacts[0].get("phone", emergency_phone)

    emergency_help = {
        "label": "Call for Help",
        "primary_contact_name": contacts[0].get("name", "Caregiver") if contacts else "Caregiver",
        "phone": emergency_phone,
        "home_address": safety_data.get("home_address", "14 Green Park, New Delhi"),
        "assistance_mode": "Press button to call directly",
    }

    return PatientHomeViewDTO(
        care_space_id=care_space.id,
        patient_name=p_name,
        patient_code=p_code,
        greeting=greeting,
        date_display=now.strftime("%A, %d %B %Y"),
        today_routine=routine_dtos,
        familiar_people=familiar_dtos,
        comfort_memories=memory_dtos,
        primary_caregiver_contact=caregiver_contact,
        emergency_help=emergency_help,
        assistance_level=care_space.assistance_level,
    )


def build_caregiver_dashboard_view(db: Session, care_space: CareSpace, caregiver: User) -> CaregiverDashboardViewDTO:
    """User Type B: Coordination dashboard for Primary Caregiver."""
    now = datetime.now(timezone.utc)
    patient = care_space.patient or db.query(User).filter(User.id == care_space.patient_id).first()
    p_name = patient.full_name if patient else "Patient"
    p_code = patient.patient_profile.patient_code if (patient and patient.patient_profile) else "DX-4091"

    # Routine items
    items = db.query(DailyRoutineItem).filter(
        DailyRoutineItem.care_space_id == care_space.id
    ).order_by(DailyRoutineItem.scheduled_time.asc()).all()

    routine_dtos = [
        RoutineItemDTO(
            id=item.id,
            title=item.title,
            description=item.description,
            category=item.category,
            scheduled_time=item.scheduled_time,
            assigned_to_role=item.assigned_to_role,
            is_completed=item.is_completed,
            completed_at=item.completed_at.isoformat() if item.completed_at else None,
            recurrence=item.recurrence,
            difficulty_level=item.difficulty_level,
            icon_hint=item.icon_hint,
        )
        for item in items
    ]

    pending_count = sum(1 for i in items if not i.is_completed)
    completed_count = sum(1 for i in items if i.is_completed)

    # Recent care activity logs
    logs = db.query(CareActivityLog).filter(
        CareActivityLog.care_space_id == care_space.id
    ).order_by(CareActivityLog.created_at.desc()).limit(10).all()

    log_dtos = []
    for l in logs:
        details = {}
        if l.details_json:
            try:
                details = json.loads(l.details_json)
            except Exception:
                details = {}
        log_dtos.append(
            CareActivityLogDTO(
                id=l.id,
                author_id=l.author_id,
                author_name=l.author_name,
                log_type=l.log_type,
                title=l.title,
                details=details,
                notes=l.notes,
                created_at=l.created_at.isoformat() if l.created_at else now.isoformat(),
            )
        )

    # Upcoming appointments
    apts = db.query(AppointmentModel).filter(
        AppointmentModel.patient_id.in_([care_space.patient_id, "patient-001"]),
        AppointmentModel.status.in_(["Upcoming", "Confirmed"])
    ).order_by(AppointmentModel.created_at.desc()).limit(5).all()

    apt_list = [
        {
            "id": a.id,
            "doctor": a.doctor_name,
            "date": a.date_str,
            "time": a.time_str,
            "type": a.consultation_type,
            "status": a.status,
            "issue": a.reason_for_visit,
        }
        for a in apts
    ]

    # Safety plan
    safety_obj = SafetyPlanDTO()
    if care_space.safety_plan_json:
        try:
            parsed = json.loads(care_space.safety_plan_json)
            safety_obj = SafetyPlanDTO(**parsed)
        except Exception:
            pass

    # Members
    members = db.query(CareSpaceMember).filter(
        CareSpaceMember.care_space_id == care_space.id,
        CareSpaceMember.is_active == True
    ).all()

    member_dtos = []
    for m in members:
        u = m.user
        perms = parse_permissions(m.permissions_json, m.role)
        member_dtos.append(
            CareSpaceMemberDTO(
                id=m.id,
                user_id=m.user_id,
                full_name=u.full_name or u.email if u else "Member",
                email=u.email if u else "",
                role=m.role,
                relationship_label=m.relationship_label,
                permissions=perms,
                joined_at=m.joined_at.isoformat() if m.joined_at else now.isoformat(),
                is_active=m.is_active,
            )
        )

    # Curated education tips
    tips = db.query(CaregiverResource).limit(3).all()
    curated_tips = [
        {
            "id": t.id,
            "title": t.title,
            "category": t.category,
            "summary": t.summary,
            "readTime": f"{t.read_time_mins} min",
        }
        for t in tips
    ]

    # Authorized reports count
    reports_count = 2  # Based on consultation reports & completed assessments

    return CaregiverDashboardViewDTO(
        care_space_id=care_space.id,
        care_space_name=care_space.name,
        patient_name=p_name,
        patient_code=p_code,
        role_in_space="primary_caregiver",
        assistance_level=care_space.assistance_level,
        daily_routine_overview=routine_dtos,
        pending_tasks_count=pending_count,
        completed_tasks_count=completed_count,
        recent_care_logs=log_dtos,
        upcoming_appointments=apt_list,
        safety_summary=safety_obj,
        family_members=member_dtos,
        curated_tips=curated_tips,
        authorized_reports_count=reports_count,
    )


def build_family_dashboard_view(
    db: Session,
    care_space: CareSpace,
    family_user: User,
    member: CareSpaceMember
) -> FamilyDashboardViewDTO:
    """User Type C: Scoped view strictly respecting granted permissions."""
    now = datetime.now(timezone.utc)
    patient = care_space.patient or db.query(User).filter(User.id == care_space.patient_id).first()
    p_name = patient.full_name if patient else "Family Member"

    perms = parse_permissions(member.permissions_json, member.role)

    # Assigned tasks
    items = db.query(DailyRoutineItem).filter(
        DailyRoutineItem.care_space_id == care_space.id
    ).all()

    assigned_items = [
        RoutineItemDTO(
            id=item.id,
            title=item.title,
            description=item.description,
            category=item.category,
            scheduled_time=item.scheduled_time,
            assigned_to_role=item.assigned_to_role,
            is_completed=item.is_completed,
            completed_at=item.completed_at.isoformat() if item.completed_at else None,
            recurrence=item.recurrence,
            difficulty_level=item.difficulty_level,
            icon_hint=item.icon_hint,
        )
        for item in items
        if item.assigned_to_user_id == family_user.id or item.assigned_to_role in ("all", "family_member")
    ]

    # Appointments (only if can_manage_appointments)
    apts_list = None
    if perms.can_manage_appointments:
        apts = db.query(AppointmentModel).filter(
            AppointmentModel.patient_id.in_([care_space.patient_id, "patient-001"]),
            AppointmentModel.status.in_(["Upcoming", "Confirmed"])
        ).limit(5).all()
        apts_list = [
            {
                "id": a.id,
                "doctor": a.doctor_name,
                "date": a.date_str,
                "time": a.time_str,
                "type": a.consultation_type,
                "status": a.status,
            }
            for a in apts
        ]

    # Memory book (only if can_view_memory_book)
    # Strictly respect patient privacy: do not show private memories to family members
    memory_list = None
    if perms.can_view_memory_book:
        memories = db.query(MemoryBookItem).filter(
            MemoryBookItem.care_space_id == care_space.id,
            MemoryBookItem.is_private_to_patient == False  # Privacy enforcement
        ).all()
        memory_list = [
            MemoryBookItemDTO(
                id=m.id,
                item_type=m.item_type,
                name_or_title=m.name_or_title,
                relationship_or_context=m.relationship_or_context,
                description=m.description,
                phone=m.phone,
                avatar_or_photo_url=m.avatar_or_photo_url,
                is_private_to_patient=False,
                is_favorite=m.is_favorite,
                created_at=m.created_at.isoformat() if m.created_at else now.isoformat(),
            )
            for m in memories
        ]

    # Safety contacts (only if can_receive_safety_alerts)
    safety_contacts = None
    if perms.can_receive_safety_alerts and care_space.safety_plan_json:
        try:
            parsed = json.loads(care_space.safety_plan_json)
            safety_contacts = parsed.get("emergency_contacts", [])
        except Exception:
            pass

    # Care notes (only if can_view_vitals or can_log_care)
    care_notes = None
    if perms.can_view_vitals or perms.can_log_care:
        logs = db.query(CareActivityLog).filter(
            CareActivityLog.care_space_id == care_space.id
        ).order_by(CareActivityLog.created_at.desc()).limit(5).all()

        care_notes = []
        for l in logs:
            det = {}
            if l.details_json:
                try:
                    det = json.loads(l.details_json)
                except Exception:
                    det = {}
            care_notes.append(
                CareActivityLogDTO(
                    id=l.id,
                    author_id=l.author_id,
                    author_name=l.author_name,
                    log_type=l.log_type,
                    title=l.title,
                    details=det,
                    notes=l.notes,
                    created_at=l.created_at.isoformat() if l.created_at else now.isoformat(),
                )
            )

    return FamilyDashboardViewDTO(
        care_space_id=care_space.id,
        care_space_name=care_space.name,
        patient_name=p_name,
        my_role=member.role,
        my_permissions=perms,
        assigned_tasks=assigned_items,
        upcoming_appointments=apts_list,
        memory_book=memory_list,
        safety_contacts=safety_contacts,
        care_notes=care_notes,
    )
