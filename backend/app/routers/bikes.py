from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.bike import BikeCreate, BikeUpdate, BikeResponse
from app.services import bike_service
from app.services.auth_service import require_admin

router = APIRouter(prefix="/api/bikes", tags=["Bikes"])


@router.post(
    "/",
    response_model=BikeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new bike (Admin)"
)
def create_new_bike(
    bike_data: BikeCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin)
):
    """
    Admin adds a new bike to the fleet with name, brand, model,
    registration number, daily rent, deposit, and optional image URL.
    """
    return bike_service.create_bike(db=db, bike_data=bike_data)


@router.get(
    "/",
    response_model=List[BikeResponse],
    summary="List all bikes (Customers & Admin)"
)
def list_bikes(
    is_active_only: bool = Query(True, description="Filter only active/available bikes for customers"),
    brand: Optional[str] = Query(None, description="Filter by brand"),
    search: Optional[str] = Query(None, description="Search keyword for name, model or registration"),
    db: Session = Depends(get_db)
):
    """
    Fetches bikes for customer browsing and admin management.
    """
    return bike_service.get_all_bikes(
        db=db,
        is_active_only=is_active_only,
        brand=brand,
        search=search
    )


@router.get(
    "/{bike_id}",
    response_model=BikeResponse,
    summary="Get single bike details"
)
def get_bike(bike_id: str, db: Session = Depends(get_db)):
    """
    Retrieves complete details of a specific bike.
    """
    return bike_service.get_bike_by_id(db=db, bike_id=bike_id)


@router.get(
    "/{bike_id}/availability",
    summary="Check date-based availability for a bike"
)
def check_availability(
    bike_id: str,
    pickup_datetime: str = Query(..., description="ISO 8601 pickup datetime"),
    return_datetime: str = Query(..., description="ISO 8601 return datetime"),
    db: Session = Depends(get_db)
):
    """
    Checks if a bike is available between pickup_datetime and return_datetime.
    If booked, returns 'Unavailable upto <date>'.
    """
    from datetime import datetime
    from app.services.availability import check_bike_availability
    
    # Parse ISO strings into datetime objects
    dt_pickup = datetime.fromisoformat(pickup_datetime.replace("Z", "+00:00"))
    dt_return = datetime.fromisoformat(return_datetime.replace("Z", "+00:00"))

    return check_bike_availability(
        db=db,
        bike_id=bike_id,
        pickup=dt_pickup,
        dropoff=dt_return,
        include_pending=True
    )


@router.put(
    "/{bike_id}",
    response_model=BikeResponse,
    summary="Update bike details (Admin)"
)
def update_bike_details(
    bike_id: str,
    bike_data: BikeUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin)
):
    """
    Admin updates bike pricing, status, image, or specifications.
    """
    return bike_service.update_bike(db=db, bike_id=bike_id, bike_data=bike_data)


@router.delete(
    "/{bike_id}",
    summary="Delete / Deactivate bike (Admin)"
)
def remove_bike(
    bike_id: str,
    hard_delete: bool = Query(False, description="Set True for permanent deletion, False for deactivating"),
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin)
):
    """
    Deactivates a bike or permanently removes it.
    """
    bike_service.delete_bike(db=db, bike_id=bike_id, hard_delete=hard_delete)
    return {"status": "success", "message": f"Bike {bike_id} removed/deactivated successfully."}
