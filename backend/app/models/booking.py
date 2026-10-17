import uuid
import enum
from sqlalchemy import (
    Column,
    String,
    Integer,
    Numeric,
    DateTime,
    Text,
    Enum as SqlEnum,
    ForeignKey,
    CheckConstraint,
    Index,
    func
)
from sqlalchemy.orm import relationship
from app.database import Base


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    ONGOING = "ongoing"
    COMPLETED = "completed"


class Booking(Base):
    """
    Booking model tracking customer rental requests and their full lifecycle.
    """
    __tablename__ = "bookings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_reference = Column(String(30), unique=True, nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    bike_id = Column(String(36), ForeignKey("bikes.id", ondelete="RESTRICT"), nullable=False, index=True)

    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(15), nullable=False, index=True)

    pickup_datetime = Column(DateTime(timezone=True), nullable=False, index=True)
    return_datetime = Column(DateTime(timezone=True), nullable=False, index=True)
    rental_days = Column(Integer, nullable=False)

    # Historical price snapshots (immutable once booking is placed)
    daily_rent_snapshot = Column(Numeric(10, 2), nullable=False)
    security_deposit_snapshot = Column(Numeric(10, 2), nullable=False, default=0.00)
    total_rent = Column(Numeric(10, 2), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)

    status = Column(
        SqlEnum(BookingStatus, name="booking_status_enum", native_enum=False),
        default=BookingStatus.PENDING,
        nullable=False,
        index=True
    )
    customer_notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("return_datetime > pickup_datetime", name="chk_booking_return_after_pickup"),
        CheckConstraint("rental_days >= 1", name="chk_booking_rental_days_positive"),
        CheckConstraint("daily_rent_snapshot >= 0", name="chk_booking_daily_rent_positive"),
        CheckConstraint("security_deposit_snapshot >= 0", name="chk_booking_deposit_positive"),
        CheckConstraint("total_rent >= 0", name="chk_booking_total_rent_positive"),
        CheckConstraint("total_amount >= 0", name="chk_booking_total_amount_positive"),
        Index("idx_booking_dates_status", "bike_id", "status", "pickup_datetime", "return_datetime"),
    )

    # Relationships
    user = relationship("User", back_populates="bookings")
    bike = relationship("Bike", back_populates="bookings")
    payments = relationship("Payment", back_populates="booking", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Booking ref={self.booking_reference} bike_id={self.bike_id} status={self.status}>"
