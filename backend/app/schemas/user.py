from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    phone_number: str = Field(..., min_length=10, max_length=15, pattern=r"^\+?[0-9]{10,15}$")
    email: Optional[EmailStr] = None


class UserCreate(UserBase):
    password: Optional[str] = Field(None, min_length=6)


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    is_phone_verified: Optional[bool] = None


class UserResponse(UserBase):
    id: str
    is_phone_verified: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
