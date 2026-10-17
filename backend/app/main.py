from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import engine, Base, get_db
import app.models  # Registers all models with Base.metadata

# Create database tables automatically if models exist
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Database tables could not be initialized automatically: {e}")

app = FastAPI(
    title="Bike Rental System API",
    description="Backend API for Bike Rental Management System using FastAPI and MySQL",
    version="1.0.0"
)

# CORS configuration (allows React frontend to communicate with FastAPI)
origins = [
    "http://localhost:5173",  # Vite React default port
    "http://localhost:3000",  # CRA / Alternate React port
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
def read_root():
    """Root endpoint to check API status."""
    return {
        "status": "online",
        "message": "Welcome to the Bike Rental API!",
        "documentation": "/docs"
    }


@app.get("/api/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint to verify MySQL database connectivity."""
    try:
        # Ping the MySQL database
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected successfully to MySQL"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection failed: {str(e)}"
        )


# Include feature routers
from app.routers import bikes, bookings, auth
app.include_router(auth.router)
app.include_router(bikes.router)
app.include_router(bookings.router)
