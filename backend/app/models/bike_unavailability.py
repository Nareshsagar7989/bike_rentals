import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, CheckConstraint, Index, func
from sqlalchemy.orm import relationship
from app.database import Base


class BikeUnavailability(Base):
    """
    Model recording periods when a bike is unavailable due to maintenance,
    repairs, or owner operational blocks.
    """
    __tablename__ = "bike_unavailabilities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    bike_id = Column(String(36), ForeignKey("bikes.id", ondelete="CASCADE"), nullable=False, index=True)
    start_datetime = Column(DateTime(timezone=True), nullable=False, index=True)
    end_datetime = Column(DateTime(timezone=True), nullable=False, index=True)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("end_datetime > start_datetime", name="chk_unavailability_end_after_start"),
        Index("idx_unavailability_bike_dates", "bike_id", "start_datetime", "end_datetime"),
    )

    # Relationship
    bike = relationship("Bike", back_populates="unavailabilities")

    def __repr__(self):
        return f"<BikeUnavailability bike_id={self.bike_id} start={self.start_datetime} end={self.end_datetime}>"
