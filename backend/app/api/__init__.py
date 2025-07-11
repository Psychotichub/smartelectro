"""
API Routes Package

Contains FastAPI routers for all SmartElectro AI endpoints.
"""

from . import (
    auth,
    projects,
    load_forecasting,
    fault_detection,
    cable_calculator,
    maintenance_alerts
)

# Export all routers
__all__ = [
    "auth",
    "projects",
    "load_forecasting", 
    "fault_detection",
    "cable_calculator",
    "maintenance_alerts"
]

# API metadata
API_VERSION = "v1"
API_PREFIX = "/api"

def get_all_routers():
    """Get all API routers with their configurations"""
    return [
        {"router": auth.router, "prefix": "/auth", "tags": ["authentication"]},
        {"router": projects.router, "prefix": "/projects", "tags": ["projects"]}, 
        {"router": load_forecasting.router, "prefix": "/load-forecasting", "tags": ["load forecasting"]},
        {"router": fault_detection.router, "prefix": "/fault-detection", "tags": ["fault detection"]},
        {"router": cable_calculator.router, "prefix": "/cable-calculator", "tags": ["cable calculator"]},
        {"router": maintenance_alerts.router, "prefix": "/maintenance-alerts", "tags": ["maintenance alerts"]}
    ] 