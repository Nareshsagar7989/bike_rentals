from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class BikeBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    brand: str = Field(..., min_length=1, max_length=50)
    model: str = Field(..., min_length=1, max_length=50)
    registration_number: str = Field(..., min_length=4, max_length=30)
    description: Optional[str] = None
    daily_rent: Decimal = Field(..., gt=0, decimal_places=2)
    security_deposit: Decimal = Field(default=Decimal("0.00"), ge=0, decimal_places=2)
    image_url: Optional[str] = None
    is_active: bool = True


class BikeCreate(BikeBase):
    pass


class BikeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    brand: Optional[str] = None
    model: Optional[str] = None
    registration_number: Optional[str] = None
    description: Optional[str] = None
    daily_rent: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    security_deposit: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class BikeResponse(BikeBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
