import uuid
from sqlalchemy import Column, String, Text, Numeric, Boolean, DateTime, CheckConstraint, func
from sqlalchemy.orm import relationship
from app.database import Base


class Bike(Base):
    """
    Fleet Bike model representing vehicles owned by the business.
    """
    __tablename__ = "bikes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    brand = Column(String(50), nullable=False, index=True)
    model = Column(String(50), nullable=False)
    registration_number = Column(String(30), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    daily_rent = Column(Numeric(10, 2), nullable=False)
    security_deposit = Column(Numeric(10, 2), nullable=False, default=0.00)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("daily_rent >= 0", name="chk_bike_daily_rent_positive"),
        CheckConstraint("security_deposit >= 0", name="chk_bike_security_deposit_positive"),
    )

    # Relationships
    bookings = relationship("Booking", back_populates="bike", cascade="all")
    unavailabilities = relationship("BikeUnavailability", back_populates="bike", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Bike id={self.id} reg={self.registration_number} name={self.name}>"
