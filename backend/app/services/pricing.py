import math
import random
import string
from datetime import datetime
from decimal import Decimal

# Configurable business policy for Jagityal bike rentals:
# 1. Minimum rental duration: 1 calendar day (24 hours).
# 2. Grace period for return: 60 minutes.
# 3. If exceeded beyond grace period, an extra day is charged.
GRACE_PERIOD_MINUTES = 60


def calculate_rental_days(pickup: datetime, dropoff: datetime) -> int:
    """
    Calculates billable rental days.
    
    Rule:
    - Base: (dropoff - pickup) in total seconds.
    - If total duration is less than or equal to 24 hours + grace period, it counts as 1 day.
    - Any partial day exceeding the 24-hour block by more than GRACE_PERIOD_MINUTES increments the day count.
    """
    duration = dropoff - pickup
    total_seconds = duration.total_seconds()
    
    if total_seconds <= 0:
        raise ValueError("dropoff datetime must be strictly after pickup datetime")
    
    total_hours = total_seconds / 3600.0
    
    # Minimum 1 full day
    if total_hours <= 24:
        return 1
    
    # Calculate days with grace period consideration
    full_days = int(total_hours // 24)
    remaining_hours = total_hours % 24
    
    grace_hours = GRACE_PERIOD_MINUTES / 60.0
    if remaining_hours > grace_hours:
        return full_days + 1
    else:
        return max(1, full_days)


def calculate_booking_totals(
    pickup: datetime,
    dropoff: datetime,
    daily_rent: Decimal,
    security_deposit: Decimal = Decimal("0.00")
) -> dict:
    """
    Computes backend-authoritative rental totals and snapshot amounts.
    Clients can NEVER pass total amounts directly.
    """
    days = calculate_rental_days(pickup, dropoff)
    total_rent = Decimal(days) * daily_rent
    total_amount = total_rent + security_deposit

    return {
        "rental_days": days,
        "daily_rent_snapshot": daily_rent,
        "security_deposit_snapshot": security_deposit,
        "total_rent": total_rent,
        "total_amount": total_amount
    }


def generate_booking_reference(prefix: str = "BK") -> str:
    """
    Generates a unique, human-readable reference like BK-20261016-A7X9.
    """
    date_part = datetime.now().strftime("%Y%m%d")
    random_part = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{prefix}-{date_part}-{random_part}"
