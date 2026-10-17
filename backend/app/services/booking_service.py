from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from app.models.booking import Booking, BookingStatus
from app.models.bike import Bike
from app.schemas.booking import BookingCreate, BookingStatusUpdate
from app.services.pricing import calculate_booking_totals, generate_booking_reference
from app.services.availability import is_bike_available_for_period, confirm_booking_with_lock, check_bike_availability


def create_booking(db: Session, booking_data: BookingCreate) -> Booking:
    """
    Creates a new customer booking request in PENDING state.
    Calculates authoritative backend pricing and validates date overlap.
    """
    bike = db.query(Bike).filter(Bike.id == booking_data.bike_id).first()
    if not bike:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bike with ID '{booking_data.bike_id}' not found."
        )
    if not bike.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This bike is currently deactivated or in maintenance."
        )

    # 1. Check availability for requested interval
    avail_check = check_bike_availability(
        db=db,
        bike_id=bike.id,
        pickup=booking_data.pickup_datetime,
        dropoff=booking_data.return_datetime,
        include_pending=True
    )
    if not avail_check["available"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=avail_check["message"]
        )

    # 2. Authoritative backend pricing calculation
    totals = calculate_booking_totals(
        pickup=booking_data.pickup_datetime,
        dropoff=booking_data.return_datetime,
        daily_rent=bike.daily_rent,
        security_deposit=bike.security_deposit
    )

    # 3. Create booking record
    ref = generate_booking_reference()
    new_booking = Booking(
        booking_reference=ref,
        user_id=booking_data.user_id,
        bike_id=bike.id,
        customer_name=booking_data.customer_name.strip(),
        customer_phone=booking_data.customer_phone.strip(),
        pickup_datetime=booking_data.pickup_datetime,
        return_datetime=booking_data.return_datetime,
        rental_days=totals["rental_days"],
        daily_rent_snapshot=totals["daily_rent_snapshot"],
        security_deposit_snapshot=totals["security_deposit_snapshot"],
        total_rent=totals["total_rent"],
        total_amount=totals["total_amount"],
        status=BookingStatus.PENDING,
        customer_notes=booking_data.customer_notes
    )

    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking


def get_all_bookings(
    db: Session,
    status_filter: Optional[BookingStatus] = None
) -> List[Booking]:
    """
    Lists all bookings for admin dashboard, eager-loading bike details.
    """
    query = db.query(Booking).options(joinedload(Booking.bike))
    if status_filter:
        query = query.filter(Booking.status == status_filter)
    return query.order_by(Booking.created_at.desc()).all()


def get_booking_by_id(db: Session, booking_id: str) -> Booking:
    """
    Gets single booking by ID with bike details or raises 404.
    """
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.bike))
        .filter(Booking.id == booking_id)
        .first()
    )
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID '{booking_id}' not found."
        )
    return booking


def update_booking_status(
    db: Session,
    booking_id: str,
    status_update: BookingStatusUpdate
) -> Booking:
    """
    Admin updates booking status (CONFIRMED, REJECTED, ONGOING, COMPLETED, CANCELLED).
    Uses pessimistic locking on confirmation to eliminate race conditions.
    """
    booking = get_booking_by_id(db, booking_id)

    target_status = status_update.status

    if target_status == BookingStatus.CONFIRMED:
        # Re-check availability with pessimistic lock
        success, err = confirm_booking_with_lock(db=db, booking_id=booking.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=err or "Unable to confirm booking due to date conflicts."
            )
        db.refresh(booking)
        return booking

    # Direct status transition
    booking.status = target_status
    db.commit()
    db.refresh(booking)
    return booking
