from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class BikeUnavailabilityBase(BaseModel):
    bike_id: str
    start_datetime: datetime
    end_datetime: datetime
    reason: Optional[str] = Field(None, max_length=255)

    @model_validator(mode="after")
    def validate_maintenance_period(self):
        if self.end_datetime <= self.start_datetime:
            raise ValueError("end_datetime must be strictly after start_datetime")
        return self


class BikeUnavailabilityCreate(BikeUnavailabilityBase):
    pass


class BikeUnavailabilityResponse(BikeUnavailabilityBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
