from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import pandas as pd
import json
import io
from datetime import datetime

from ..models.database import get_db, LoadForecast, Project
from ..services.load_forecasting import LoadForecastingService
from .auth import get_current_active_user

router = APIRouter()
load_service = LoadForecastingService()

# Pydantic models
class LoadForecastRequest(BaseModel):
    project_id: int
    name: str
    model_type: str  # "lstm" or "random_forest"
    forecast_hours: int = 24
    use_sample_data: bool = False
    uploaded_data: Optional[List[Dict[str, Any]]] = None  # For passing uploaded data

class LoadForecastResponse(BaseModel):
    id: int
    project_id: int
    name: str
    model_type: str
    accuracy_score: float
    forecast_data: List[float]
    created_at: datetime

class LoadDataRequest(BaseModel):
    start_date: str
    end_date: str
    freq: str = "1H"

@router.post("/generate-sample-data")
async def generate_sample_data(
    request: LoadDataRequest,
    current_user = Depends(get_current_active_user)
):
    """Generate sample load data for testing"""
    try:
        data = load_service.generate_sample_data(
            start_date=request.start_date,
            end_date=request.end_date,
            freq=request.freq
        )
        
        # Convert to JSON-serializable format
        data_json = {
            'timestamps': data['timestamp'].dt.strftime('%Y-%m-%dT%H:%M:%S').tolist(),
            'loads': data['load'].tolist()
        }
        
        return {
            "message": "Sample data generated successfully",
            "data": data_json,
            "records_count": len(data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-data")
async def upload_load_data(
    file: UploadFile = File(...),
    current_user = Depends(get_current_active_user)
):
    """Upload load data from CSV file"""
    try:
        # Read CSV file
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Validate required columns
        required_columns = ['timestamp', 'load']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(
                status_code=400,
                detail=f"CSV must contain columns: {required_columns}"
            )
        
        # Convert timestamp
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Validate data
        if df['load'].isnull().any():
            raise HTTPException(
                status_code=400,
                detail="Load data contains null values"
            )
        
        # Convert to JSON-serializable format
        data_json = {
            'timestamps': df['timestamp'].dt.strftime('%Y-%m-%dT%H:%M:%S').tolist(),
            'loads': df['load'].tolist()
        }
        
        return {
            "message": "Data uploaded successfully",
            "data": data_json,
            "records_count": len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/train", response_model=LoadForecastResponse)
async def train_model(
    request: LoadForecastRequest,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Train load forecasting model"""
    try:
        # Verify project exists and belongs to user
        project = db.query(Project).filter(
            Project.id == request.project_id,
            Project.owner_id == current_user.id
        ).first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Generate or use sample data or uploaded data
        if request.use_sample_data:
            # Generate 3 months of hourly data
            data = load_service.generate_sample_data(
                start_date="2023-01-01",
                end_date="2023-04-01",
                freq="1H"
            )
        elif request.uploaded_data:
            # Use uploaded data
            df_data = []
            for row in request.uploaded_data:
                df_data.append({
                    'timestamp': row['timestamp'],
                    'load': row['load']
                })
            data = pd.DataFrame(df_data)
            data['timestamp'] = pd.to_datetime(data['timestamp'])
        else:
            raise HTTPException(
                status_code=400,
                detail="Please upload data, provide uploaded_data, or set use_sample_data=True"
            )
        
        # Train model
        if request.model_type == "lstm":
            try:
                result = load_service.train_lstm_model(data, request.forecast_hours)
            except ImportError as e:
                # TensorFlow not available, fallback to Random Forest
                result = load_service.train_random_forest_model(data, request.forecast_hours)
                result['model_type'] = 'random_forest'  # Override model type
        elif request.model_type == "random_forest":
            result = load_service.train_random_forest_model(data, request.forecast_hours)
        else:
            raise HTTPException(
                status_code=400,
                detail="Model type must be 'lstm' or 'random_forest'"
            )
        
        # Save model
        model_name = f"{request.name}_{current_user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        actual_model_type = result.get('model_type', request.model_type)
        load_service.save_model(result, model_name, actual_model_type)
        
        # Save to database
        db_forecast = LoadForecast(
            project_id=request.project_id,
            name=request.name,
            model_type=actual_model_type,
            input_data=data.to_json(),
            forecast_data=json.dumps(result['forecast']),
            accuracy_score=result['r2_score']
        )
        
        db.add(db_forecast)
        db.commit()
        db.refresh(db_forecast)
        
        return LoadForecastResponse(
            id=db_forecast.id,
            project_id=db_forecast.project_id,
            name=db_forecast.name,
            model_type=actual_model_type,
            accuracy_score=db_forecast.accuracy_score,
            forecast_data=result['forecast'],
            created_at=db_forecast.created_at
        )
        
    except Exception as e:
        import traceback
        error_msg = f"Training failed: {str(e)}\nTraceback: {traceback.format_exc()}"
        print(error_msg)  # Log to console
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/train-with-data", response_model=LoadForecastResponse)
async def train_model_with_data(
    project_id: int,
    name: str,
    model_type: str,
    forecast_hours: int = 24,
    file: UploadFile = File(...),
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Train model with uploaded data"""
    try:
        # Verify project exists and belongs to user
        project = db.query(Project).filter(
            Project.id == project_id,
            Project.owner_id == current_user.id
        ).first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Read CSV file
        contents = await file.read()
        data = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Validate required columns
        required_columns = ['timestamp', 'load']
        if not all(col in data.columns for col in required_columns):
            raise HTTPException(
                status_code=400,
                detail=f"CSV must contain columns: {required_columns}"
            )
        
        # Convert timestamp
        data['timestamp'] = pd.to_datetime(data['timestamp'])
        
        # Train model
        if model_type == "lstm":
            try:
                result = load_service.train_lstm_model(data, forecast_hours)
            except ImportError as e:
                # TensorFlow not available, fallback to Random Forest
                result = load_service.train_random_forest_model(data, forecast_hours)
                result['model_type'] = 'random_forest'  # Override model type
        elif model_type == "random_forest":
            result = load_service.train_random_forest_model(data, forecast_hours)
        else:
            raise HTTPException(
                status_code=400,
                detail="Model type must be 'lstm' or 'random_forest'"
            )
        
        # Save model
        model_name = f"{name}_{current_user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        actual_model_type = result.get('model_type', model_type)
        load_service.save_model(result, model_name, actual_model_type)
        
        # Save to database
        db_forecast = LoadForecast(
            project_id=project_id,
            name=name,
            model_type=actual_model_type,
            input_data=data.to_json(),
            forecast_data=json.dumps(result['forecast']),
            accuracy_score=result['r2_score']
        )
        
        db.add(db_forecast)
        db.commit()
        db.refresh(db_forecast)
        
        return LoadForecastResponse(
            id=db_forecast.id,
            project_id=db_forecast.project_id,
            name=db_forecast.name,
            model_type=actual_model_type,
            accuracy_score=db_forecast.accuracy_score,
            forecast_data=result['forecast'],
            created_at=db_forecast.created_at
        )
        
    except Exception as e:
        import traceback
        error_msg = f"Training failed: {str(e)}\nTraceback: {traceback.format_exc()}"
        print(error_msg)  # Log to console
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forecasts/{project_id}")
async def get_forecasts(
    project_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all forecasts for a project"""
    # Verify project exists and belongs to user
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    forecasts = db.query(LoadForecast).filter(
        LoadForecast.project_id == project_id
    ).all()
    
    return [
        {
            "id": forecast.id,
            "name": forecast.name,
            "model_type": forecast.model_type,
            "accuracy_score": forecast.accuracy_score,
            "forecast_data": json.loads(forecast.forecast_data),
            "created_at": forecast.created_at
        }
        for forecast in forecasts
    ]

@router.get("/forecasts/{project_id}/{forecast_id}")
async def get_forecast(
    project_id: int,
    forecast_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific forecast"""
    # Verify project exists and belongs to user
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    forecast = db.query(LoadForecast).filter(
        LoadForecast.id == forecast_id,
        LoadForecast.project_id == project_id
    ).first()
    
    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")
    
    return {
        "id": forecast.id,
        "name": forecast.name,
        "model_type": forecast.model_type,
        "accuracy_score": forecast.accuracy_score,
        "forecast_data": json.loads(forecast.forecast_data),
        "input_data": json.loads(forecast.input_data),
        "created_at": forecast.created_at
    }

@router.delete("/forecasts/{project_id}/{forecast_id}")
async def delete_forecast(
    project_id: int,
    forecast_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete forecast"""
    # Verify project exists and belongs to user
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    forecast = db.query(LoadForecast).filter(
        LoadForecast.id == forecast_id,
        LoadForecast.project_id == project_id
    ).first()
    
    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")
    
    db.delete(forecast)
    db.commit()
    
    return {"message": "Forecast deleted successfully"} 