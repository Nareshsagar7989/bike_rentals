from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from app.models.bike import Bike
from app.schemas.bike import BikeCreate, BikeUpdate


def create_bike(db: Session, bike_data: BikeCreate) -> Bike:
    """
    Creates a new bike in the fleet.
    Ensures registration number is unique.
    """
    existing = db.query(Bike).filter(
        Bike.registration_number.ilike(bike_data.registration_number.strip())
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A bike with registration number '{bike_data.registration_number}' already exists."
        )

    new_bike = Bike(
        name=bike_data.name.strip(),
        brand=bike_data.brand.strip(),
        model=bike_data.model.strip(),
        registration_number=bike_data.registration_number.strip().upper(),
        description=bike_data.description,
        daily_rent=bike_data.daily_rent,
        security_deposit=bike_data.security_deposit,
        image_url=bike_data.image_url,
        is_active=bike_data.is_active
    )
    db.add(new_bike)
    db.commit()
    db.refresh(new_bike)
    return new_bike


def get_all_bikes(
    db: Session,
    is_active_only: bool = True,
    brand: Optional[str] = None,
    search: Optional[str] = None
) -> List[Bike]:
    """
    Fetches bikes with optional active status, brand filter, and keyword search.
    """
    query = db.query(Bike)

    if is_active_only:
        query = query.filter(Bike.is_active.is_(True))

    if brand and brand.lower() != "all":
        query = query.filter(Bike.brand.ilike(f"%{brand}%"))

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Bike.name.ilike(search_filter),
                Bike.brand.ilike(search_filter),
                Bike.model.ilike(search_filter),
                Bike.registration_number.ilike(search_filter)
            )
        )

    return query.order_by(Bike.created_at.desc()).all()


def get_bike_by_id(db: Session, bike_id: str) -> Bike:
    """
    Fetches a single bike by ID or raises 404.
    """
    bike = db.query(Bike).filter(Bike.id == bike_id).first()
    if not bike:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bike with ID '{bike_id}' not found."
        )
    return bike


def update_bike(db: Session, bike_id: str, bike_data: BikeUpdate) -> Bike:
    """
    Updates bike details.
    """
    bike = get_bike_by_id(db, bike_id)

    update_fields = bike_data.model_dump(exclude_unset=True)

    # Check for unique registration number conflict if being updated
    if "registration_number" in update_fields and update_fields["registration_number"]:
        new_reg = update_fields["registration_number"].strip().upper()
        conflict = db.query(Bike).filter(
            Bike.registration_number.ilike(new_reg),
            Bike.id != bike_id
        ).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Another bike with registration number '{new_reg}' already exists."
            )
        update_fields["registration_number"] = new_reg

    for key, value in update_fields.items():
        if isinstance(value, str):
            value = value.strip()
        setattr(bike, key, value)

    db.commit()
    db.refresh(bike)
    return bike


def delete_bike(db: Session, bike_id: str, hard_delete: bool = False) -> bool:
    """
    Deletes or deactivates a bike.
    Default is soft delete (is_active = False) to protect booking history integrity.
    """
    bike = get_bike_by_id(db, bike_id)

    if hard_delete:
        db.delete(bike)
    else:
        bike.is_active = False

    db.commit()
    return True
