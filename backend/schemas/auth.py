"""
Auth Schemas
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Optional[str] = "patient"
    full_name: Optional[str] = None
    phone: Optional[str] = None


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: Optional[str] = ""
    role: Optional[str] = None


class UserResponseData(BaseModel):
    id: str
    email: str
    role: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_verified: bool = True
    is_active: bool = True
    created_at: Optional[str] = None
    last_login_at: Optional[str] = None
    patient_code: Optional[str] = None


class LoginTokenData(BaseModel):
    access_token: str
    refresh_token: str = ""
    token_type: str = "bearer"
    expires_in: int = 86400
    mfa_required: bool = False
    user: Optional[UserResponseData] = None


class PasswordResetRequest(BaseModel):
    email: EmailStr
    reset_code: str
    new_password: str = Field(..., min_length=6)


class UserProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    two_factor_enabled: Optional[bool] = None
    preferences: Optional[Dict[str, Any]] = None
