from datetime import datetime
from typing import Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.bike import Bike
from app.models.booking import Booking, BookingStatus
from app.models.bike_unavailability import BikeUnavailability


def format_display_datetime(dt: datetime) -> str:
    """Formats datetime to DD/MM/YYYY hh:mm AM/PM (e.g. 16/10/2026 10:00 PM)"""
    if not dt:
        return ""
    # Use standard strftime with AM/PM
    return dt.strftime("%d/%m/%Y %I:%M %p")


def check_bike_availability(
    db: Session,
    bike_id: str,
    pickup: datetime,
    dropoff: datetime,
    exclude_booking_id: Optional[str] = None,
    include_pending: bool = True
) -> Dict[str, Any]:
    """
    Checks if a bike is available for a requested period [pickup, dropoff].
    
    Mathematical Overlap Condition:
    existing.pickup_datetime < requested.return_datetime AND existing.return_datetime > requested.pickup_datetime

    Returns:
    {
        "available": bool,
        "message": str,
        "unavailable_until": Optional[str],
        "conflicting_booking_ref": Optional[str]
    }
    """
    # 1. Verify bike exists and is active
    bike = db.query(Bike).filter(Bike.id == bike_id).first()
    if not bike:
        return {
            "available": False,
            "message": "Bike not found",
            "unavailable_until": None,
            "conflicting_booking_ref": None
        }
    if not bike.is_active:
        return {
            "available": False,
            "message": "Bike is currently inactive / retired from fleet",
            "unavailable_until": None,
            "conflicting_booking_ref": None
        }

    # 2. Check for maintenance / unavailability blocks
    maint = (
        db.query(BikeUnavailability)
        .filter(
            BikeUnavailability.bike_id == bike_id,
            BikeUnavailability.start_datetime < dropoff,
            BikeUnavailability.end_datetime > pickup
        )
        .order_by(BikeUnavailability.end_datetime.desc())
        .first()
    )
    if maint:
        until_str = format_display_datetime(maint.end_datetime)
        reason_txt = f" ({maint.reason})" if maint.reason else ""
        return {
            "available": False,
            "message": f"Unavailable upto {until_str} due to maintenance{reason_txt}",
            "unavailable_until": maint.end_datetime.isoformat(),
            "conflicting_booking_ref": None
        }

    # 3. Check for overlapping bookings (Pending, Confirmed, Ongoing)
    blocking_statuses = [BookingStatus.CONFIRMED, BookingStatus.ONGOING]
    if include_pending:
        blocking_statuses.append(BookingStatus.PENDING)

    booking_query = (
        db.query(Booking)
        .filter(
            Booking.bike_id == bike_id,
            Booking.status.in_(blocking_statuses),
            Booking.pickup_datetime < dropoff,
            Booking.return_datetime > pickup
        )
    )

    if exclude_booking_id:
        booking_query = booking_query.filter(Booking.id != exclude_booking_id)

    # Order by return_datetime desc to get the latest end time of conflicts
    conflict = booking_query.order_by(Booking.return_datetime.desc()).first()

    if conflict:
        until_str = format_display_datetime(conflict.return_datetime)
        status_note = "Already booked" if conflict.status == BookingStatus.CONFIRMED else "Booking requested"
        return {
            "available": False,
            "message": f"Unavailable upto {until_str} ({status_note})",
            "unavailable_until": conflict.return_datetime.isoformat(),
            "conflicting_booking_ref": conflict.booking_reference
        }

    return {
        "available": True,
        "message": "Bike is available for selected schedule",
        "unavailable_until": None,
        "conflicting_booking_ref": None
    }


def is_bike_available_for_period(
    db: Session,
    bike_id: str,
    pickup: datetime,
    dropoff: datetime,
    exclude_booking_id: Optional[str] = None,
    include_pending: bool = True
) -> Tuple[bool, Optional[str]]:
    """Legacy helper returning (bool, message)"""
    res = check_bike_availability(
        db=db,
        bike_id=bike_id,
        pickup=pickup,
        dropoff=dropoff,
        exclude_booking_id=exclude_booking_id,
        include_pending=include_pending
    )
    return res["available"], res["message"] if not res["available"] else None


def confirm_booking_with_lock(
    db: Session,
    booking_id: str
) -> Tuple[bool, Optional[str]]:
    """
    Safely confirms a pending booking using MySQL InnoDB pessimistic row locking (SELECT ... FOR UPDATE).
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        return False, "Booking not found"
    
    if booking.status != BookingStatus.PENDING:
        return False, f"Only pending bookings can be confirmed. Current status: {booking.status.value}"

    # Lock bike row
    bike = (
        db.query(Bike)
        .filter(Bike.id == booking.bike_id)
        .with_for_update()
        .first()
    )
    if not bike or not bike.is_active:
        return False, "Bike is no longer active in the fleet"

    # Re-verify availability with the lock held (excluding this booking itself)
    available, reason = is_bike_available_for_period(
        db=db,
        bike_id=booking.bike_id,
        pickup=booking.pickup_datetime,
        dropoff=booking.return_datetime,
        exclude_booking_id=booking.id,
        include_pending=False
    )

    if not available:
        return False, f"Cannot confirm booking: {reason}"

    # Safe to confirm
    booking.status = BookingStatus.CONFIRMED
    db.commit()
    return True, None
