"""
SmartElectro AI Backend Package

A comprehensive AI-powered platform for electrical engineers providing:
- Load Forecasting with LSTM and Random Forest models
- Fault Detection for electrical systems
- Cable Calculator for optimal sizing
- Maintenance Alerts with predictive analytics
"""

__version__ = "1.0.0"
__author__ = "SmartElectro AI Team"
__email__ = "support@smartelectro.ai"

# Import key components for easier access
from .models.database import (
    Base,
    User,
    Project,
    LoadForecast,
    FaultDetection,
    CableCalculation,
    MaintenanceAlert,
    get_db,
    create_tables,
    init_database
)

# Import API routers
from .api import (
    auth,
    projects,
    load_forecasting,
    fault_detection,
    cable_calculator,
    maintenance_alerts
)

# Import services
from .services import (
    load_forecasting as load_forecasting_service,
    fault_detection as fault_detection_service,
    cable_calculator as cable_calculator_service,
    maintenance_alerts as maintenance_alerts_service
)

# Define what gets imported with "from app import *"
__all__ = [
    # Database models
    "Base",
    "User", 
    "Project",
    "LoadForecast",
    "FaultDetection", 
    "CableCalculation",
    "MaintenanceAlert",
    "get_db",
    "create_tables",
    "init_database",
    
    # API routers
    "auth",
    "projects", 
    "load_forecasting",
    "fault_detection",
    "cable_calculator", 
    "maintenance_alerts",
    
    # Services
    "load_forecasting_service",
    "fault_detection_service",
    "cable_calculator_service",
    "maintenance_alerts_service",
    
    # Package metadata
    "__version__",
    "__author__",
    "__email__"
]

# Package-level configuration
PACKAGE_NAME = "SmartElectro AI Backend"
DESCRIPTION = "AI-powered electrical engineering tools and analytics platform"
SUPPORTED_MODELS = [
    "LSTM",
    "Random Forest", 
    "Decision Tree",
    "CNN",
    "Isolation Forest"
]

def get_package_info():
    """Get package information"""
    return {
        "name": PACKAGE_NAME,
        "version": __version__,
        "description": DESCRIPTION,
        "author": __author__,
        "email": __email__,
        "supported_models": SUPPORTED_MODELS
    } 