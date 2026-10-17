"""
Message and Conversation Schemas
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class ChatMessageDTO(BaseModel):
    id: str
    sender: str  # "patient" or "contact"
    text: str
    timestamp: str
    reactions: Optional[List[Dict[str, Any]]] = None
    attachment: Optional[Dict[str, Any]] = None


class ContactChatDTO(BaseModel):
    id: str
    name: str
    role: str
    category: str = "Doctors"
    avatarUrl: Optional[str] = None
    isBot: bool = False
    isTeam: bool = False
    hospital: str = "Apollo Hospitals, New Delhi"
    rating: float = 4.9
    reviewCount: int = 128
    isOnline: bool = True
    lastSeen: Optional[str] = None
    unreadCount: int = 0
    isStarred: bool = False
    isArchived: bool = False
    isMuted: bool = False
    bio: str = ""
    credentials: List[str] = []
    languages: List[str] = []
    messages: List[ChatMessageDTO] = []


class SendMessageRequest(BaseModel):
    conversation_id: Optional[str] = "conv-dr-rajesh"
    contact_id: Optional[str] = "dr-rajesh"
    text: str
    attachment: Optional[Dict[str, Any]] = None
