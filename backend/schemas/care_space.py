"""
Care Space and Connected Care Pydantic Schemas for DemenX

Provides tailored schemas for:
- User Type A (Person living with dementia): simplified, low-cognitive-load daily assistance.
- User Type B (Primary Caregiver): care coordination, routine tracking, logs, safety.
- User Type C (Family Member): fine-grained, permission-scoped view.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# --- Permissions Schema ---

class CareSpacePermissionsDTO(BaseModel):
    can_manage_routine: bool = True
    can_manage_appointments: bool = True
    can_view_memory_book: bool = True
    can_edit_memory_book: bool = False
    can_log_care: bool = True
    can_view_vitals: bool = True
    can_view_reports: bool = False
    can_receive_safety_alerts: bool = True
    can_manage_members: bool = False


# --- Member & Invitation DTOs ---

class CareSpaceMemberDTO(BaseModel):
    id: str
    user_id: str
    full_name: str
    email: str
    role: str  # "patient", "primary_caregiver", "family_member", "trusted_contact"
    relationship_label: str  # "Daughter", "Husband", "Self", etc.
    permissions: CareSpacePermissionsDTO
    joined_at: str
    is_active: bool = True
    avatar_url: Optional[str] = None


class CareSpaceCreateRequest(BaseModel):
    name: Optional[str] = "Family Care Circle"
    patient_id: Optional[str] = None  # If created by caregiver on behalf of patient, or None if patient creates for self
    assistance_level: Optional[str] = "guided"  # "independent", "guided", "assisted"
    preferences: Optional[Dict[str, Any]] = None
    safety_plan: Optional[Dict[str, Any]] = None


class InviteMemberRequest(BaseModel):
    email: str
    role: str = "family_member"  # "family_member", "trusted_contact", "primary_caregiver"
    relationship_label: str = "Family Member"
    permissions: Optional[CareSpacePermissionsDTO] = None


class AcceptInvitationRequest(BaseModel):
    invite_code: str


class UpdateMemberPermissionsRequest(BaseModel):
    permissions: CareSpacePermissionsDTO


# --- Routine & Task DTOs ---

class RoutineItemDTO(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: str = "routine"  # "routine", "medication", "activity", "reminder", "appointment"
    scheduled_time: str
    assigned_to_role: str = "patient"
    assigned_to_name: Optional[str] = None
    is_completed: bool = False
    completed_at: Optional[str] = None
    recurrence: str = "daily"
    difficulty_level: str = "easy"
    icon_hint: str = "sun"


class RoutineItemCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "routine"
    scheduled_time: str  # e.g., "09:00 AM"
    assigned_to_user_id: Optional[str] = None
    assigned_to_role: Optional[str] = "patient"
    recurrence: Optional[str] = "daily"
    difficulty_level: Optional[str] = "easy"
    icon_hint: Optional[str] = "sun"


# --- Care Activity Log & Vitals DTOs ---

class CareActivityLogDTO(BaseModel):
    id: str
    author_id: str
    author_name: str
    log_type: str  # "vital_check", "mood", "meal", "sleep", "general_note", "safety_incident"
    title: str
    details: Dict[str, Any] = {}
    notes: Optional[str] = None
    created_at: str


class CareActivityLogCreateRequest(BaseModel):
    log_type: str = "general_note"
    title: str
    details: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


# --- Memory Book & Familiar People DTOs ---

class MemoryBookItemDTO(BaseModel):
    id: str
    item_type: str  # "familiar_person", "life_memory", "favorite_place", "comfort_item"
    name_or_title: str
    relationship_or_context: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    avatar_or_photo_url: Optional[str] = None
    audio_memo_url: Optional[str] = None
    is_private_to_patient: bool = False
    is_favorite: bool = False
    created_at: str


class MemoryBookItemCreateRequest(BaseModel):
    item_type: str = "familiar_person"
    name_or_title: str
    relationship_or_context: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    avatar_or_photo_url: Optional[str] = None
    audio_memo_url: Optional[str] = None
    is_private_to_patient: Optional[bool] = False
    is_favorite: Optional[bool] = False


# --- Safety Plan DTOs ---

class SafetyPlanDTO(BaseModel):
    emergency_contacts: List[Dict[str, str]] = []  # [{"name": "Rahul (Son)", "phone": "+91 9876543210", "role": "Primary Caregiver"}]
    home_address: Optional[str] = None
    safe_zones: List[str] = []
    wandering_risk_level: str = "low"  # "low", "moderate", "high"
    calming_strategies: List[str] = []
    preferred_hospital: Optional[str] = None
    primary_doctor_name: Optional[str] = None
    primary_doctor_phone: Optional[str] = None
    last_updated: Optional[str] = None


class SafetyPlanUpdateRequest(BaseModel):
    emergency_contacts: Optional[List[Dict[str, str]]] = None
    home_address: Optional[str] = None
    safe_zones: Optional[List[str]] = None
    wandering_risk_level: Optional[str] = "low"
    calming_strategies: Optional[List[str]] = None
    preferred_hospital: Optional[str] = None
    primary_doctor_name: Optional[str] = None
    primary_doctor_phone: Optional[str] = None


# --- User Experience Tailored DTOs ---

class PatientHomeViewDTO(BaseModel):
    """User Type A: Simplified, zero-clutter home screen for person living with dementia."""
    care_space_id: str
    patient_name: str
    patient_code: str
    greeting: str
    date_display: str
    today_routine: List[RoutineItemDTO]
    familiar_people: List[MemoryBookItemDTO]  # Quick familiar faces with relationship and call action
    comfort_memories: List[MemoryBookItemDTO]  # 2-3 comforting personal memories
    primary_caregiver_contact: Optional[Dict[str, str]] = None
    emergency_help: Dict[str, str]  # Plain one-touch call details
    assistance_level: str


class CaregiverDashboardViewDTO(BaseModel):
    """User Type B: Comprehensive coordination dashboard for Primary Caregiver."""
    care_space_id: str
    care_space_name: str
    patient_name: str
    patient_code: str
    role_in_space: str
    assistance_level: str
    daily_routine_overview: List[RoutineItemDTO]
    pending_tasks_count: int
    completed_tasks_count: int
    recent_care_logs: List[CareActivityLogDTO]
    upcoming_appointments: List[Dict[str, Any]]
    safety_summary: SafetyPlanDTO
    family_members: List[CareSpaceMemberDTO]
    curated_tips: List[Dict[str, Any]]
    authorized_reports_count: int


class FamilyDashboardViewDTO(BaseModel):
    """User Type C: Scoped view for additional trusted family members based on permissions."""
    care_space_id: str
    care_space_name: str
    patient_name: str
    my_role: str
    my_permissions: CareSpacePermissionsDTO
    assigned_tasks: List[RoutineItemDTO]
    upcoming_appointments: Optional[List[Dict[str, Any]]] = None  # only if can_manage_appointments
    memory_book: Optional[List[MemoryBookItemDTO]] = None  # only if can_view_memory_book
    safety_contacts: Optional[List[Dict[str, str]]] = None  # only if can_receive_safety_alerts
    care_notes: Optional[List[CareActivityLogDTO]] = None  # only if can_view_vitals or can_log_care


class CareSpaceContextDTO(BaseModel):
    """Provides current user's Care Space onboarding and role status."""
    has_care_space: bool
    care_space_id: Optional[str] = None
    care_space_name: Optional[str] = None
    patient_name: Optional[str] = None
    user_role_in_space: Optional[str] = None  # "patient", "primary_caregiver", "family_member", "none"
    permissions: Optional[CareSpacePermissionsDTO] = None
    setup_flow_available: bool = True
