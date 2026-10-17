"""
Appointment and Consultation Report Schemas
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class ConsultationReportDTO(BaseModel):
    reportId: str
    date: str
    mriSummary: Optional[str] = None
    hippocampalVol: Optional[str] = None
    cognitiveScore: Optional[str] = None
    reactionTime: Optional[str] = None
    memoryAccuracy: Optional[str] = None
    aiRiskLevel: Optional[str] = None
    doctorNotes: Optional[str] = None
    medications: List[str] = []
    recommendedActions: List[str] = []


class AppointmentResponse(BaseModel):
    id: str
    patient: str
    doctor: str
    age: int = 65
    time: str
    date: str
    type: str
    status: str
    issue: Optional[str] = None
    report: Optional[ConsultationReportDTO] = None


class AppointmentCreateRequest(BaseModel):
    doctor_id: Optional[str] = "dr-rajesh"
    doctor_name: Optional[str] = "Dr. Rajesh Sharma"
    date_str: str  # e.g. "22 Jul 2026"
    time_str: str  # e.g. "10:00 AM"
    consultation_type: Optional[str] = "In-Person Consultation"
    reason_for_visit: Optional[str] = ""
