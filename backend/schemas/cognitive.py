"""
Cognitive Assessment Schemas
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class PatientResponseDTO(BaseModel):
    questionId: str
    domain: str
    activityKind: str
    userAnswer: Any
    isCorrect: bool = False
    scoreEarned: float = 0.0
    rawDetails: Optional[Dict[str, Any]] = None
    answeredAt: Optional[str] = None


class DomainScoreDTO(BaseModel):
    domain: str
    domainName: str
    correctResponses: int
    totalScoredResponses: int
    scorePercentage: float
    accuracyDescription: str


class AssessmentScoreDTO(BaseModel):
    overallScore: float
    domainScores: Dict[str, DomainScoreDTO]
    totalScoredQuestions: int
    totalCorrectQuestions: int
    unansweredCount: int
    durationSeconds: int
    observations: List[str] = []
    medicalDisclaimer: str


class AssessmentSessionResponse(BaseModel):
    id: str
    patientId: str
    patientName: str
    version: str = "v1.2.0-daily"
    startedAt: str
    completedAt: Optional[str] = None
    status: str
    currentStepIndex: int
    responses: Dict[str, PatientResponseDTO] = {}
    score: Optional[AssessmentScoreDTO] = None
    durationSeconds: int = 0


class AssessmentStartRequest(BaseModel):
    patientId: Optional[str] = "patient-001"
    patientName: Optional[str] = "Demo Patient (DX-4091)"
    version: Optional[str] = "v1.2.0-daily"


class AssessmentStepSaveRequest(BaseModel):
    currentStepIndex: int
    response: Optional[PatientResponseDTO] = None
    durationSeconds: Optional[int] = None


class AssessmentCompleteRequest(BaseModel):
    durationSeconds: int
    responses: Dict[str, PatientResponseDTO]
    score: Optional[AssessmentScoreDTO] = None
