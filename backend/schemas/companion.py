"""
DemenX Companion Chat Schemas
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class CompanionMessagePayload(BaseModel):
    role: str
    content: str


class CompanionContextPayload(BaseModel):
    currentRoute: Optional[str] = "home"
    activeTab: Optional[str] = None
    cognitiveSubView: Optional[str] = None
    userRole: Optional[str] = "Patient"


class CompanionActionDTO(BaseModel):
    type: str = "navigate"
    destination: str
    label: str


class CompanionChatRequest(BaseModel):
    messages: List[CompanionMessagePayload]
    context: Optional[CompanionContextPayload] = None


class CompanionChatResponse(BaseModel):
    success: bool = True
    message: str
    action: Optional[CompanionActionDTO] = None
    modelUsed: str = "gemini"
    followUps: Optional[List[str]] = None
