import os
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
import bcrypt
import jwt
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Header
from dotenv import load_dotenv
from app.models.user import User
from app.schemas.user import UserCreate

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "default_secret_key_123456789")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "kondikantinareshsagar70@gmail.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Naresh@123")


def hash_password(plain_password: str) -> str:
    """Hashes a password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against stored bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed JWT access token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please log in again."
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token."
        )


def authenticate_user(db: Session, email: str, password: str) -> Dict[str, Any]:
    """
    Authenticates either:
    1. Admin (credentials verified from .env)
    2. Customer / User (credentials verified from MySQL users table)
    """
    clean_email = email.strip().lower()

    # 1. Check Hardcoded Admin Credentials from .env
    if clean_email == ADMIN_EMAIL.strip().lower():
        if password == ADMIN_PASSWORD:
            token = create_access_token({
                "sub": "admin_system",
                "email": ADMIN_EMAIL,
                "name": "Naresh Sagar (Owner)",
                "role": "admin"
            })
            return {
                "access_token": token,
                "token_type": "bearer",
                "user": {
                    "id": "admin_system",
                    "email": ADMIN_EMAIL,
                    "name": "Naresh Sagar",
                    "role": "admin"
                }
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password for administrator account."
            )

    # 2. Check Customer Credentials in MySQL Database
    user = db.query(User).filter(User.email.ilike(clean_email)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with this email. Please sign up first."
        )

    if not user.password_hash or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please try again."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated."
        )

    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "name": user.full_name,
        "phone": user.phone_number,
        "role": "customer"
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.full_name,
            "phone": user.phone_number,
            "role": "customer"
        }
    }


def register_customer(db: Session, user_data: UserCreate) -> Dict[str, Any]:
    """
    Registers a new customer in MySQL database.
    """
    if not user_data.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid email is required for registration."
        )

    clean_email = str(user_data.email).strip().lower()

    # Prevent using admin email for customer signup
    if clean_email == ADMIN_EMAIL.strip().lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email address is reserved for administrator access."
        )

    # Check for existing customer email
    existing_user = db.query(User).filter(User.email.ilike(clean_email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email is already registered. Please log in."
        )

    hashed_pw = hash_password(user_data.password) if user_data.password else None

    new_user = User(
        full_name=user_data.full_name.strip(),
        phone_number=user_data.phone_number.strip(),
        email=clean_email,
        password_hash=hashed_pw,
        is_active=True,
        is_phone_verified=False
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({
        "sub": new_user.id,
        "email": new_user.email,
        "name": new_user.full_name,
        "phone": new_user.phone_number,
        "role": "customer"
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "name": new_user.full_name,
            "phone": new_user.phone_number,
            "role": "customer"
        }
    }


def require_admin(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    FastAPI dependency to protect admin-only endpoints.
    Requires Authorization: Bearer <token> where role == 'admin'.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required. Please login with admin credentials."
        )

    token = authorization.split(" ")[1]
    payload = decode_token(token)

    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Administrator privileges required."
        )

    return payload
