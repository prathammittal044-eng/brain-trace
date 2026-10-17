"""
FastAPI Dependencies for Authentication, Authorization, and DB
"""

import logging
from typing import Optional, Generator
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from services.auth_service import decode_access_token
import config

logger = logging.getLogger("demenx.dependencies")
security = HTTPBearer(auto_error=False)


def get_current_user_optional(
    request: Request,
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Extract user from Bearer token or session cookies. Returns None if unauthenticated.
    """
    token = None
    if auth and auth.credentials:
        token = auth.credentials
    else:
        # Check cookies
        token = request.cookies.get(config.SESSION_COOKIE_NAME) or request.cookies.get("scansaarthi_session")

    if not token:
        return None

    payload = decode_access_token(token)
    if not payload:
        return None

    user_id = payload.get("sub") or payload.get("user_id")
    if not user_id:
        return None

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    return user


def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional)
) -> User:
    """
    Requires an authenticated user. Raises 401 if not authenticated.
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_role(*allowed_roles: str):
    """
    Role-based authorization dependency factory.
    """
    def _role_checker(user: User = Depends(get_current_user)) -> User:
        user_role = (user.role or "patient").lower()
        allowed = [r.lower() for r in allowed_roles]
        if user_role not in allowed and "admin" not in user_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of roles {allowed_roles}, but user has role '{user.role}'."
            )
        return user
    return _role_checker
