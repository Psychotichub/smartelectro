"""
AI Services Package

Contains AI/ML services for electrical engineering analysis:
- Load Forecasting: LSTM and Random Forest models for power consumption prediction
- Fault Detection: Decision Tree and CNN models for electrical fault classification  
- Cable Calculator: Engineering calculations for optimal cable sizing
- Maintenance Alerts: Anomaly detection and predictive maintenance analytics
"""

from . import (
    load_forecasting,
    fault_detection,
    cable_calculator,
    maintenance_alerts
)

__all__ = [
    "load_forecasting",
    "fault_detection", 
    "cable_calculator",
    "maintenance_alerts"
]

# Service metadata
AVAILABLE_SERVICES = {
    "load_forecasting": {
        "name": "Load Forecasting",
        "description": "Predict future power consumption using LSTM and Random Forest models",
        "models": ["LSTM", "Random Forest"],
        "input_types": ["time_series", "csv_upload"]
    },
    "fault_detection": {
        "name": "Fault Detection", 
        "description": "Classify electrical faults in single/three-phase systems",
        "models": ["Decision Tree", "CNN"],
        "fault_types": ["L-G", "L-L", "L-L-G", "3-Φ"]
    },
    "cable_calculator": {
        "name": "Cable Calculator",
        "description": "Calculate optimal cable sizing based on electrical parameters", 
        "calculation_types": ["voltage_drop", "power_loss", "safety_factors"],
        "input_parameters": ["voltage", "load_kw", "power_factor", "distance"]
    },
    "maintenance_alerts": {
        "name": "Maintenance Alerts",
        "description": "Predict equipment failures using sensor data analysis",
        "models": ["Isolation Forest"],
        "equipment_types": ["motors", "transformers", "generators"]
    }
}

def get_service_info(service_name: str = None):
    """Get information about available services"""
    if service_name:
        return AVAILABLE_SERVICES.get(service_name)
    return AVAILABLE_SERVICES

def list_all_models():
    """Get a list of all AI models used across services"""
    models = set()
    for service in AVAILABLE_SERVICES.values():
        if "models" in service:
            models.update(service["models"])
    return list(models) 