from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserCreate
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User or admin email address")
    password: str = Field(..., min_length=4, description="Account password")


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100, description="Full name of customer")
    email: EmailStr = Field(..., description="Customer email address")
    phone_number: str = Field(..., min_length=10, max_length=15, pattern=r"^\+?[0-9]{10,15}$", description="Customer mobile number")
    password: str = Field(..., min_length=6, description="Password (at least 6 characters)")


class UserAuthInfo(BaseModel):
    id: str
    email: str
    name: str
    role: str
    phone: Optional[str] = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserAuthInfo


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Login for both Admin (hardcoded) and Customers (database)"
)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    Unified Login:
    - If email matches ADMIN_EMAIL from .env, validates against ADMIN_PASSWORD from .env.
    - Otherwise, validates customer email and bcrypt password hash in MySQL database.
    """
    auth_result = auth_service.authenticate_user(
        db=db,
        email=credentials.email,
        password=credentials.password
    )
    return auth_result


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new customer account"
)
def register(user_data: RegisterRequest, db: Session = Depends(get_db)):
    """
    Registers a new customer in MySQL database.
    Admin accounts cannot be registered dynamically.
    """
    create_dto = UserCreate(
        full_name=user_data.full_name,
        email=user_data.email,
        phone_number=user_data.phone_number,
        password=user_data.password
    )
    auth_result = auth_service.register_customer(db=db, user_data=create_dto)
    return auth_result


@router.get(
    "/me",
    summary="Get current logged in user details from JWT token"
)
def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Validates the Bearer token in the Authorization header
    and returns authenticated user/admin profile.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header. Expected 'Bearer <token>'."
        )

    token = authorization.split(" ")[1]
    payload = auth_service.decode_token(token)
    return {
        "status": "authenticated",
        "user": {
            "id": payload.get("sub"),
            "email": payload.get("email"),
            "name": payload.get("name"),
            "role": payload.get("role", "customer"),
            "phone": payload.get("phone")
        }
    }
