from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class AdminBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr


class AdminCreate(AdminBase):
    password: str = Field(..., min_length=8)


class AdminResponse(AdminBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
