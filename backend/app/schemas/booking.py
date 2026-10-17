from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator
from app.models.booking import BookingStatus
from app.schemas.bike import BikeResponse


class BookingCreate(BaseModel):
    bike_id: str
    user_id: Optional[str] = None
    customer_name: str = Field(..., min_length=2, max_length=100)
    customer_phone: str = Field(..., min_length=10, max_length=15, pattern=r"^\+?[0-9]{10,15}$")
    pickup_datetime: datetime
    return_datetime: datetime
    customer_notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.return_datetime <= self.pickup_datetime:
            raise ValueError("return_datetime must be strictly after pickup_datetime")
        return self


class BookingStatusUpdate(BaseModel):
    status: BookingStatus
    admin_notes: Optional[str] = None


class BookingResponse(BaseModel):
    id: str
    booking_reference: str
    user_id: Optional[str]
    bike_id: str
    bike: Optional[BikeResponse] = None
    customer_name: str
    customer_phone: str
    pickup_datetime: datetime
    return_datetime: datetime
    rental_days: int
    daily_rent_snapshot: Decimal
    security_deposit_snapshot: Decimal
    total_rent: Decimal
    total_amount: Decimal
    status: BookingStatus
    customer_notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
