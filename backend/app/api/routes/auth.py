import logging
import re
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, status
from jose import jwt
from pydantic import BaseModel

from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)
PASSCODE_PATTERN = re.compile(r"^[A-Za-z0-9]{10}$")


class LoginRequest(BaseModel):
    passcode: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest) -> TokenResponse:
    if not PASSCODE_PATTERN.fullmatch(body.passcode):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passcode must be exactly 10 alphanumeric characters.",
        )

    if not PASSCODE_PATTERN.fullmatch(settings.app_passcode):
        logger.error("[auth/login] APP_PASSCODE is misconfigured; expected 10 alphanumeric chars")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server auth configuration error.",
        )

    # Constant-time comparison to prevent timing attacks
    if not secrets.compare_digest(body.passcode, settings.app_passcode):
        logger.warning("[auth/login] failed attempt")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid passcode.",
        )

    expire = datetime.now(timezone.utc) + timedelta(days=settings.token_expire_days)
    token = jwt.encode(
        {"sub": "user", "exp": expire},
        settings.secret_key,
        algorithm="HS256",
    )
    logger.info("[auth/login] token issued, expires %s", expire.date())
    return TokenResponse(access_token=token)
