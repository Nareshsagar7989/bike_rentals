from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.payment import PaymentType, PaymentStatus


class PaymentCreate(BaseModel):
    booking_id: str
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    payment_type: PaymentType = PaymentType.ADVANCE
    payment_method: str = Field(default="cash", max_length=50)
    transaction_reference: Optional[str] = Field(None, max_length=100)


class PaymentResponse(BaseModel):
    id: str
    booking_id: str
    amount: Decimal
    payment_type: PaymentType
    payment_method: str
    payment_status: PaymentStatus
    transaction_reference: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
