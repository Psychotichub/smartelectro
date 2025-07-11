import os
# Suppress TensorFlow warnings
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
from app.api import load_forecasting, fault_detection, cable_calculator, maintenance_alerts, auth, projects
from app.models.database import create_tables

# Create FastAPI app
app = FastAPI(
    title="SmartElectro AI",
    description="AI-powered electrical engineering tools",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # React frontend
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(load_forecasting.router, prefix="/api/load-forecasting", tags=["load forecasting"])
app.include_router(fault_detection.router, prefix="/api/fault-detection", tags=["fault detection"])
app.include_router(cable_calculator.router, prefix="/api/cable-calculator", tags=["cable calculator"])
app.include_router(maintenance_alerts.router, prefix="/api/maintenance-alerts", tags=["maintenance alerts"])

# Create static files directory for uploads
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup"""
    create_tables()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "SmartElectro AI Backend is running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "SmartElectro AI Backend"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 