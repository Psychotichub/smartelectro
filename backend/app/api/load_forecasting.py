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
    existing_model_name: Optional[str] = None  # New parameter for incremental learning

class LoadForecastResponse(BaseModel):
    id: int
    project_id: int
    name: str
    model_type: str
    accuracy_score: float
    forecast_data: List[float]
    created_at: datetime
    is_incremental: Optional[bool] = None

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
    """Train load forecasting model with optional incremental learning"""
    try:
        print(f"Train request received:")
        print(f"  Project ID: {request.project_id}")
        print(f"  Model type: {request.model_type}")
        print(f"  Use sample data: {request.use_sample_data}")
        print(f"  Existing model: {request.existing_model_name}")
        print(f"  User ID: {current_user.id}")
        
        # Verify project exists and belongs to user
        project = db.query(Project).filter(
            Project.id == request.project_id,
            Project.owner_id == current_user.id
        ).first()
        
        if not project:
            print(f"Project {request.project_id} not found for user {current_user.id}")
            raise HTTPException(status_code=404, detail="Project not found")
        
        print(f"Project found: {project.name}")
        
        # Generate or use sample data or uploaded data
        if request.use_sample_data:
            print("Using sample data")
            # Generate 3 months of hourly data
            data = load_service.generate_sample_data(
                start_date="2023-01-01",
                end_date="2023-04-01",
                freq="1H"
            )
            print(f"Generated {len(data)} sample records")
        elif request.uploaded_data:
            print("Using uploaded data")
            # Use uploaded data
            df_data = []
            for row in request.uploaded_data:
                df_data.append({
                    'timestamp': row['timestamp'],
                    'load': row['load']
                })
            data = pd.DataFrame(df_data)
            data['timestamp'] = pd.to_datetime(data['timestamp'])
            print(f"Using {len(data)} uploaded records")
        else:
            print("No data provided - raising error")
            raise HTTPException(
                status_code=400,
                detail="Please upload data, provide uploaded_data, or set use_sample_data=True"
            )
        
        # Train model with optional incremental learning
        print(f"Training {request.model_type} model...")
        if request.model_type == "lstm":
            try:
                result = load_service.train_lstm_model(
                    data, 
                    request.forecast_hours,
                    request.existing_model_name
                )
                print("LSTM training completed successfully")
            except ImportError as e:
                print(f"LSTM not available, falling back to Random Forest: {e}")
                # TensorFlow not available, fallback to Random Forest
                result = load_service.train_random_forest_model(
                    data, 
                    request.forecast_hours,
                    request.existing_model_name
                )
                result['model_type'] = 'random_forest'  # Override model type
                print("Random Forest training completed (fallback)")
        elif request.model_type == "random_forest":
            result = load_service.train_random_forest_model(
                data, 
                request.forecast_hours,
                request.existing_model_name
            )
            print("Random Forest training completed successfully")
        else:
            raise HTTPException(
                status_code=400,
                detail="Model type must be 'lstm' or 'random_forest'"
            )
        
        # Save model
        print("Saving model...")
        model_name = f"{request.name}_{current_user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        actual_model_type = result.get('model_type', request.model_type)
        load_service.save_model(result, model_name, actual_model_type)
        print("Model saved successfully")
        
        # Save to database
        print("Saving to database...")
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
        print("Database record created successfully")
        
        return LoadForecastResponse(
            id=db_forecast.id,
            project_id=db_forecast.project_id,
            name=db_forecast.name,
            model_type=actual_model_type,
            accuracy_score=db_forecast.accuracy_score,
            forecast_data=result['forecast'],
            created_at=db_forecast.created_at,
            is_incremental=result.get('is_incremental', False)
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
    existing_model_name: Optional[str] = None,  # New parameter
    file: UploadFile = File(...),
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Train model with uploaded data and optional incremental learning"""
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
        
        # Train model with optional incremental learning
        if model_type == "lstm":
            try:
                result = load_service.train_lstm_model(
                    data, 
                    forecast_hours,
                    existing_model_name
                )
            except ImportError as e:
                # TensorFlow not available, fallback to Random Forest
                result = load_service.train_random_forest_model(
                    data, 
                    forecast_hours,
                    existing_model_name
                )
                result['model_type'] = 'random_forest'  # Override model type
        elif model_type == "random_forest":
            result = load_service.train_random_forest_model(
                data, 
                forecast_hours,
                existing_model_name
            )
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
            created_at=db_forecast.created_at,
            is_incremental=result.get('is_incremental', False)
        )
        
    except Exception as e:
        import traceback
        error_msg = f"Training failed: {str(e)}\nTraceback: {traceback.format_exc()}"
        print(error_msg)  # Log to console
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models/{project_id}")
async def get_trained_models(
    project_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all trained models for a project"""
    # Verify project exists and belongs to user
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get trained models from filesystem
    import os
    import glob
    import json
    
    models_dir = load_service.models_dir
    model_files = glob.glob(os.path.join(models_dir, f"*_{current_user.id}_*_metadata.json"))
    
    trained_models = []
    for metadata_file in model_files:
        try:
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
            
            # Extract model name from filename
            base_name = os.path.basename(metadata_file).replace('_metadata.json', '')
            model_name = base_name.rsplit('_', 2)[0]  # Remove user_id and timestamp
            
            trained_models.append({
                "model_id": base_name,
                "model_name": model_name,
                "model_type": metadata.get('model_type', 'unknown'),
                "accuracy_score": metadata.get('r2_score', 0),
                "mse": metadata.get('mse', 0),
                "created_at": metadata.get('created_at', ''),
                "training_time": metadata.get('training_time', 0)
            })
        except Exception as e:
            print(f"Error reading metadata file {metadata_file}: {e}")
            continue
    
    return sorted(trained_models, key=lambda x: x['created_at'], reverse=True)

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
    
    models_dir = load_service.models_dir
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