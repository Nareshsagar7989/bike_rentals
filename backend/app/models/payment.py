import uuid
import enum
from sqlalchemy import (
    Column,
    String,
    Numeric,
    DateTime,
    Enum as SqlEnum,
    ForeignKey,
    CheckConstraint,
    func
)
from sqlalchemy.orm import relationship
from app.database import Base


class PaymentType(str, enum.Enum):
    ADVANCE = "advance"
    RENTAL_BALANCE = "rental_balance"
    SECURITY_DEPOSIT = "security_deposit"
    REFUND = "refund"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class Payment(Base):
    """
    Payment transaction model tracking advances, deposits, and settlement.
    """
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(String(36), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_type = Column(
        SqlEnum(PaymentType, name="payment_type_enum", native_enum=False),
        nullable=False,
        default=PaymentType.ADVANCE
    )
    payment_method = Column(String(50), nullable=False, default="cash")  # cash, upi, card
    payment_status = Column(
        SqlEnum(PaymentStatus, name="payment_status_enum", native_enum=False),
        nullable=False,
        default=PaymentStatus.PENDING
    )
    transaction_reference = Column(String(100), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("amount > 0", name="chk_payment_amount_positive"),
    )

    # Relationship
    booking = relationship("Booking", back_populates="payments")

    def __repr__(self):
        return f"<Payment id={self.id} booking_id={self.booking_id} amount={self.amount} status={self.payment_status}>"
