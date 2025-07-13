from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
import pandas as pd
import json
import io
from datetime import datetime

from ..models.database import get_db, MaintenanceAlert, Project
from ..services.maintenance_alerts import MaintenanceAlertsService
from .auth import get_current_active_user

router = APIRouter()
maintenance_service = MaintenanceAlertsService()

# Pydantic models
class MaintenanceAnalysisRequest(BaseModel):
    project_id: int
    equipment_name: str
    equipment_type: str
    sensor_data: Dict[str, List[float]]
    timestamps: List[str]

class MaintenanceAlertResponse(BaseModel):
    id: int
    project_id: int
    equipment_name: str
    alert_type: str
    severity: str
    prediction_result: str
    probability_score: float
    created_at: datetime

class SensorDataRequest(BaseModel):
    equipment_type: str = "motor"
    days: int = 30
    hours_per_day: int = 24

@router.post("/analyze", response_model=MaintenanceAlertResponse)
async def analyze_equipment(
    request: MaintenanceAnalysisRequest,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Analyze equipment sensor data for maintenance alerts"""
    try:
        # Verify project exists and belongs to user
        project = db.query(Project).filter(
            Project.id == request.project_id,
            Project.owner_id == current_user.id
        ).first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Prepare data for analysis
        data_dict = {"timestamp": pd.to_datetime(request.timestamps)}
        data_dict.update(request.sensor_data)
        data = pd.DataFrame(data_dict)
        
        # Perform equipment health analysis
        analysis_result = maintenance_service.analyze_equipment_health(
            data, request.equipment_type
        )
        
        # Determine alert severity based on health score
        health_score = analysis_result["health_score"]
        if health_score < 40:
            severity = "critical"
            alert_type = "equipment_failure_risk"
        elif health_score < 60:
            severity = "high"
            alert_type = "maintenance_required"
        elif health_score < 75:
            severity = "medium"
            alert_type = "maintenance_recommended"
        else:
            severity = "low"
            alert_type = "normal_operation"
        
        # Save to database
        db_alert = MaintenanceAlert(
            project_id=request.project_id,
            equipment_name=request.equipment_name,
            sensor_data=json.dumps(request.sensor_data),
            alert_type=alert_type,
            severity=severity,
            prediction_result=analysis_result["summary"],
            probability_score=analysis_result["maintenance_prediction"]["predicted_failure_probability"]
        )
        
        db.add(db_alert)
        db.commit()
        db.refresh(db_alert)
        
        return MaintenanceAlertResponse(
            id=db_alert.id,
            project_id=db_alert.project_id,
            equipment_name=db_alert.equipment_name,
            alert_type=db_alert.alert_type,
            severity=db_alert.severity,
            prediction_result=db_alert.prediction_result,
            probability_score=db_alert.probability_score,
            created_at=db_alert.created_at
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/health-analysis")
async def equipment_health_analysis(
    equipment_type: str = "motor",
    sensor_data: Dict[str, List[float]] = None,
    timestamps: List[str] = None,
    current_user = Depends(get_current_active_user)
):
    """Perform equipment health analysis without saving to database"""
    try:
        # Use provided data or generate sample data
        if sensor_data and timestamps:
            data_dict = {"timestamp": pd.to_datetime(timestamps)}
            data_dict.update(sensor_data)
            data = pd.DataFrame(data_dict)
        else:
            # Generate sample data for demonstration
            data = maintenance_service.generate_sample_sensor_data(equipment_type)
        
        # Perform analysis
        analysis_result = maintenance_service.analyze_equipment_health(data, equipment_type)
        
        return analysis_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-sample-data")
async def generate_sample_data(
    request: SensorDataRequest,
    current_user = Depends(get_current_active_user)
):
    """Generate sample sensor data for testing"""
    try:
        # Validate equipment type
        if request.equipment_type not in maintenance_service.equipment_ranges:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid equipment type. Must be one of: {list(maintenance_service.equipment_ranges.keys())}"
            )
        
        # Generate sample data
        data = maintenance_service.generate_sample_sensor_data(
            equipment_type=request.equipment_type,
            days=request.days,
            hours_per_day=request.hours_per_day
        )
        
        # Convert to JSON-serializable format
        result = {
            "equipment_type": request.equipment_type,
            "timestamps": data["timestamp"].dt.strftime('%Y-%m-%dT%H:%M:%S').tolist(),
            "sensor_data": {}
        }
        
        # Add sensor data
        for column in data.columns:
            if column != "timestamp":
                result["sensor_data"][column] = data[column].tolist()
        
        return {
            "message": "Sample data generated successfully",
            "data": result,
            "records_count": len(data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-sensor-data")
async def upload_sensor_data(
    file: UploadFile = File(...),
    equipment_type: str = "motor",
    current_user = Depends(get_current_active_user)
):
    """Upload sensor data from CSV file"""
    try:
        # Read CSV file
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Validate required columns
        if "timestamp" not in df.columns:
            raise HTTPException(
                status_code=400,
                detail="CSV must contain 'timestamp' column"
            )
        
        # Convert timestamp
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        
        # Get expected sensor columns for equipment type
        expected_sensors = list(maintenance_service.equipment_ranges.get(equipment_type, {}).keys())
        
        # Check for sensor columns
        sensor_columns = [col for col in df.columns if col != "timestamp"]
        if not sensor_columns:
            raise HTTPException(
                status_code=400,
                detail="CSV must contain sensor data columns"
            )
        
        # Validate data
        for col in sensor_columns:
            if df[col].isnull().any():
                raise HTTPException(
                    status_code=400,
                    detail=f"Column {col} contains null values"
                )
        
        # Convert to the expected format
        sensor_data = {}
        for col in sensor_columns:
            sensor_data[col] = df[col].tolist()
        
        return {
            "message": "Sensor data uploaded successfully",
            "equipment_type": equipment_type,
            "timestamps": df["timestamp"].dt.strftime('%Y-%m-%dT%H:%M:%S').tolist(),
            "sensor_data": sensor_data,
            "records_count": len(df),
            "available_sensors": sensor_columns,
            "expected_sensors": expected_sensors
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/equipment-types")
async def get_equipment_types(current_user = Depends(get_current_active_user)):
    """Get available equipment types and their sensor ranges"""
    return {
        "equipment_types": list(maintenance_service.equipment_ranges.keys()),
        "equipment_ranges": maintenance_service.equipment_ranges,
        "severity_levels": maintenance_service.severity_levels
    }

@router.post("/anomaly-detection")
async def detect_anomalies(
    equipment_type: str = "motor",
    sensor_data: Dict[str, List[float]] = None,
    timestamps: List[str] = None,
    current_user = Depends(get_current_active_user)
):
    """Detect anomalies in sensor data"""
    try:
        # Prepare data
        if sensor_data and timestamps:
            data_dict = {"timestamp": pd.to_datetime(timestamps)}
            data_dict.update(sensor_data)
            data = pd.DataFrame(data_dict)
        else:
            # Generate sample data for demonstration
            data = maintenance_service.generate_sample_sensor_data(equipment_type)
        
        # Detect anomalies
        result = maintenance_service.detect_anomalies_isolation_forest(data, equipment_type)
        
        # Remove non-serializable objects
        serializable_result = {
            "anomalies": result["anomalies"],
            "anomaly_scores": result["anomaly_scores"],
            "alerts": result["alerts"],
            "total_anomalies": result["total_anomalies"],
            "anomaly_rate": result["anomaly_rate"]
        }
        
        # Convert timestamps in alerts to strings
        for alert in serializable_result["alerts"]:
            if isinstance(alert["timestamp"], pd.Timestamp):
                alert["timestamp"] = alert["timestamp"].isoformat()
        
        return serializable_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts/{project_id}")
async def get_maintenance_alerts(
    project_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all maintenance alerts for a project"""
    # Verify project exists and belongs to user
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    alerts = db.query(MaintenanceAlert).filter(
        MaintenanceAlert.project_id == project_id
    ).all()
    
    return [
        {
            "id": alert.id,
            "equipment_name": alert.equipment_name,
            "alert_type": alert.alert_type,
            "severity": alert.severity,
            "prediction_result": alert.prediction_result,
            "probability_score": alert.probability_score,
            "created_at": alert.created_at
        }
        for alert in alerts
    ]

@router.get("/alerts/{project_id}/{alert_id}")
async def get_maintenance_alert(
    project_id: int,
    alert_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific maintenance alert"""
    # Verify project exists and belongs to user
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    alert = db.query(MaintenanceAlert).filter(
        MaintenanceAlert.id == alert_id,
        MaintenanceAlert.project_id == project_id
    ).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Maintenance alert not found")
    
    return {
        "id": alert.id,
        "equipment_name": alert.equipment_name,
        "alert_type": alert.alert_type,
        "severity": alert.severity,
        "prediction_result": alert.prediction_result,
        "probability_score": alert.probability_score,
        "sensor_data": json.loads(alert.sensor_data),
        "created_at": alert.created_at
    }

@router.delete("/alerts/{project_id}/{alert_id}")
async def delete_maintenance_alert(
    project_id: int,
    alert_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete maintenance alert"""
    # Verify project exists and belongs to user
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    alert = db.query(MaintenanceAlert).filter(
        MaintenanceAlert.id == alert_id,
        MaintenanceAlert.project_id == project_id
    ).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Maintenance alert not found")
    
    db.delete(alert)
    db.commit()
    
    return {"message": "Maintenance alert deleted successfully"}

@router.delete("/models/{project_id}/{model_id}")
async def delete_trained_model(
    project_id: int,
    model_id: str,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete trained model"""
    # Verify project exists and belongs to user
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete model files from filesystem
    import os
    import glob
    
    models_dir = maintenance_service.models_dir
    model_files = glob.glob(os.path.join(models_dir, f"{model_id}*"))
    
    if not model_files:
        raise HTTPException(status_code=404, detail="Model not found")
    
    # Delete all files related to this model
    for file_path in model_files:
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")
    
    return {"message": "Model deleted successfully"} 