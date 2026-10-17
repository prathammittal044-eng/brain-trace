"""
Authentication Router
"""

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, PatientProfile, DoctorProfile
from schemas.auth import UserRegisterRequest, UserLoginRequest, PasswordResetRequest
from services.auth_service import hash_password, verify_password, create_access_token
from dependencies import get_current_user, get_current_user_optional
import config

logger = logging.getLogger("demenx.router.auth")
router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


def _api_response(success: bool, message: str, data=None, status_code: int = 200):
    return JSONResponse(
        status_code=status_code,
        content={"success": success, "message": message, "data": data}
    )


@router.post("/register")
async def register(req: UserRegisterRequest, db: Session = Depends(get_db)):
    """Register a new patient account via public self-registration.

    Doctor and Caretaker accounts must be provisioned by an administrator.
    Any attempt to self-assign a privileged role is silently normalised to 'patient'.
    """
    email_clean = req.email.strip().lower()
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        return _api_response(False, "An account with this email already exists.", status_code=409)

    # Public registration is restricted to patient role only.
    # Silently reject privileged role self-assignment.
    role_clean = "patient"

    pw_hash = hash_password(req.password)
    user = User(
        email=email_clean,
        password_hash=pw_hash,
        role=role_clean,
        full_name=req.full_name or email_clean.split("@")[0].title(),
        phone=req.phone or "",
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    db.flush()

    # Create patient profile
    pat_prof = PatientProfile(
        user_id=user.id,
        patient_code=f"DX-{user.id[:4].upper()}",
        dob="01 Jan 1960",
        emergency_contact=req.phone or "+1 (555) 010-0000"
    )
    db.add(pat_prof)

    db.commit()
    db.refresh(user)

    logger.info("Registered new patient: %s", user.email)
    return _api_response(True, "Account created successfully.", data={
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name,
        "phone": user.phone,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "is_verified": user.is_verified,
        "is_active": user.is_active,
    })


@router.post("/login")
async def login(req: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email and password, returning JWT and setting session cookie."""
    email_clean = req.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean, User.is_active == True).first()

    if not user:
        return _api_response(False, "Invalid email or password.", status_code=401)

    # Always verify password — no bypass paths.
    if not verify_password(req.password, user.password_hash):
        return _api_response(False, "Invalid email or password.", status_code=401)

    # Generate token
    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "name": user.full_name or user.email
    })

    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    resp = JSONResponse(
        status_code=200,
        content={
            "success": True,
            "message": "Login successful.",
            "data": {
                "access_token": token,
                "refresh_token": "",
                "token_type": "bearer",
                "expires_in": config.JWT_EXPIRATION_SECONDS,
                "mfa_required": False,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "role": user.role,
                    "full_name": user.full_name,
                    "phone": user.phone,
                }
            }
        }
    )

    # Set secure session cookie
    resp.set_cookie(
        key=config.SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=config.JWT_EXPIRATION_SECONDS,
        path="/"
    )
    # Also set legacy cookie for compatibility
    resp.set_cookie(
        key="scansaarthi_session",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=config.JWT_EXPIRATION_SECONDS,
        path="/"
    )
    return resp


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    """Return currently authenticated user profile."""
    pat_code = None
    if user.patient_profile:
        pat_code = user.patient_profile.patient_code

    return _api_response(True, "OK", data={
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name or user.email.split("@")[0].title(),
        "phone": user.phone,
        "is_verified": user.is_verified,
        "is_active": user.is_active,
        "patient_code": pat_code,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
    })


@router.post("/logout")
async def logout():
    """Clear session cookies."""
    resp = JSONResponse(status_code=200, content={"success": True, "message": "Logged out.", "data": None})
    resp.delete_cookie(config.SESSION_COOKIE_NAME, path="/")
    resp.delete_cookie("scansaarthi_session", path="/")
    return resp


@router.post("/reset-password")
async def reset_password(req: PasswordResetRequest, db: Session = Depends(get_db)):
    """Reset account password."""
    email_clean = req.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        return _api_response(False, "Account not found.", status_code=404)

    user.password_hash = hash_password(req.new_password)
    db.commit()
    return _api_response(True, "Password reset successfully. You may now log in.")
