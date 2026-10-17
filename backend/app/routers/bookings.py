from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.booking import BookingStatus
from app.schemas.booking import BookingCreate, BookingStatusUpdate, BookingResponse
from app.services import booking_service
from app.services.auth_service import require_admin

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])


@router.post(
    "/",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new rental booking request (Customer)"
)
def create_rental_booking(
    booking_data: BookingCreate,
    db: Session = Depends(get_db)
):
    """
    Customer submits a booking request for a bike.
    Backend calculates rental duration, checks dates, and creates a PENDING request.
    """
    return booking_service.create_booking(db=db, booking_data=booking_data)


@router.get(
    "/",
    response_model=List[BookingResponse],
    summary="List all bookings (Admin)"
)
def list_all_bookings(
    status: Optional[BookingStatus] = Query(None, description="Filter by status (pending, confirmed, etc.)"),
    db: Session = Depends(get_db)
):
    """
    Admin views all rental bookings with optional status filtering.
    """
    return booking_service.get_all_bookings(db=db, status_filter=status)


@router.get(
    "/{booking_id}",
    response_model=BookingResponse,
    summary="Get single booking details"
)
def get_booking_details(
    booking_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieves full details of a specific booking.
    """
    return booking_service.get_booking_by_id(db=db, booking_id=booking_id)


@router.patch(
    "/{booking_id}/status",
    response_model=BookingResponse,
    summary="Update booking status (Admin: Confirm, Reject, Complete, etc.)"
)
def update_status(
    booking_id: str,
    status_update: BookingStatusUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin)
):
    """
    Admin confirms, rejects, starts, or completes a booking.
    """
    return booking_service.update_booking_status(
        db=db,
        booking_id=booking_id,
        status_update=status_update
    )
