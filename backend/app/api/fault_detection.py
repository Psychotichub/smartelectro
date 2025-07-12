from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
import pandas as pd
import json
import io
from datetime import datetime

from ..models.database import get_db, FaultDetection, Project
from ..services.fault_detection import FaultDetectionService
from .auth import get_current_active_user

router = APIRouter()
fault_service = FaultDetectionService()

# Pydantic models
class FaultDetectionRequest(BaseModel):
    project_id: int
    name: str
    model_type: str  # "decision_tree", "random_forest", or "cnn"
    voltage_data: Dict[str, List[float]]  # {"A": [...], "B": [...], "C": [...]}
    current_data: Dict[str, List[float]]  # {"A": [...], "B": [...], "C": [...]}

class FaultDetectionResponse(BaseModel):
    id: int
    project_id: int
    name: str
    fault_type: str
    prediction_result: str
    confidence_score: float
    created_at: datetime

class FaultPredictionRequest(BaseModel):
    voltage_data: Dict[str, List[float]]
    current_data: Dict[str, List[float]]
    model_type: str = "decision_tree"

class TrainModelRequest(BaseModel):
    project_id: int
    name: str
    model_type: str
    use_sample_data: bool = True

@router.post("/train-model")
async def train_model(
    request: TrainModelRequest,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Train fault detection model"""
    try:
        # Verify project exists and belongs to user
        project = db.query(Project).filter(
            Project.id == request.project_id,
            Project.owner_id == current_user.id
        ).first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Train model
        if request.model_type == "decision_tree":
            result = fault_service.train_decision_tree_model()
        elif request.model_type == "cnn":
            result = fault_service.train_cnn_model()
        else:
            raise HTTPException(
                status_code=400,
                detail="Model type must be 'decision_tree' or 'cnn'"
            )
        
        # Save model
        model_name = f"{request.name}_{current_user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        fault_service.save_model(result, model_name, request.model_type)
        
        return {
            "message": "Model trained successfully",
            "model_name": model_name,
            "accuracy": result['accuracy'],
            "model_type": request.model_type,
            "confusion_matrix": result['confusion_matrix']
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict")
async def predict_fault(
    request: FaultPredictionRequest,
    current_user = Depends(get_current_active_user)
):
    """Predict fault type from voltage and current data"""
    try:
        # Validate input data
        if not request.voltage_data or not request.current_data:
            raise HTTPException(
                status_code=400,
                detail="Both voltage_data and current_data are required"
            )
        
        # Check if all phases are present
        required_phases = ['A', 'B', 'C']
        if not all(phase in request.voltage_data for phase in required_phases):
            raise HTTPException(
                status_code=400,
                detail="Voltage data must contain phases A, B, C"
            )
        
        if not all(phase in request.current_data for phase in required_phases):
            raise HTTPException(
                status_code=400,
                detail="Current data must contain phases A, B, C"
            )
        
        # Make prediction
        result = fault_service.predict_fault(
            voltage_data=request.voltage_data,
            current_data=request.current_data,
            model_type=request.model_type
        )
        
        return {
            "prediction": result['prediction'],
            "confidence": result['confidence'],
            "fault_types": fault_service.fault_types,
            "features": result['features']
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze", response_model=FaultDetectionResponse)
async def analyze_fault(
    request: FaultDetectionRequest,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Analyze fault and save results"""
    try:
        # Verify project exists and belongs to user
        project = db.query(Project).filter(
            Project.id == request.project_id,
            Project.owner_id == current_user.id
        ).first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Make prediction
        result = fault_service.predict_fault(
            voltage_data=request.voltage_data,
            current_data=request.current_data,
            model_type=request.model_type
        )
        
        # Save to database
        db_fault = FaultDetection(
            project_id=request.project_id,
            name=request.name,
            fault_type=result['prediction'],
            voltage_data=json.dumps(request.voltage_data),
            current_data=json.dumps(request.current_data),
            prediction_result=result['prediction'],
            confidence_score=result['confidence']
        )
        
        db.add(db_fault)
        db.commit()
        db.refresh(db_fault)
        
        return FaultDetectionResponse(
            id=db_fault.id,
            project_id=db_fault.project_id,
            name=db_fault.name,
            fault_type=db_fault.fault_type,
            prediction_result=db_fault.prediction_result,
            confidence_score=db_fault.confidence_score,
            created_at=db_fault.created_at
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-data")
async def upload_fault_data(
    file: UploadFile = File(...),
    current_user = Depends(get_current_active_user)
):
    """Upload fault data from CSV file"""
    try:
        # Read CSV file
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Check for frontend format (voltage_a, voltage_b, etc.)
        frontend_voltage_columns = ['voltage_a', 'voltage_b', 'voltage_c']
        frontend_current_columns = ['current_a', 'current_b', 'current_c']
        
        # Check for backend format (VA, VB, VC, IA, IB, IC)
        backend_columns = ['VA', 'VB', 'VC', 'IA', 'IB', 'IC']
        
        if all(col in df.columns for col in frontend_voltage_columns + frontend_current_columns):
            # Frontend format detected
            voltage_data = {
                'A': df['voltage_a'].tolist(),
                'B': df['voltage_b'].tolist(),
                'C': df['voltage_c'].tolist()
            }
            
            current_data = {
                'A': df['current_a'].tolist(),
                'B': df['current_b'].tolist(),
                'C': df['current_c'].tolist()
            }
            
            # Convert to expected format for consistency
            data = []
            for i in range(len(df)):
                row = {
                    'voltage_a': df['voltage_a'].iloc[i],
                    'voltage_b': df['voltage_b'].iloc[i],
                    'voltage_c': df['voltage_c'].iloc[i],
                    'current_a': df['current_a'].iloc[i],
                    'current_b': df['current_b'].iloc[i],
                    'current_c': df['current_c'].iloc[i],
                    'frequency': df.get('frequency', pd.Series([50.0] * len(df))).iloc[i],
                    'power_factor': df.get('power_factor', pd.Series([0.8] * len(df))).iloc[i],
                    'fault_type': df.get('fault_type', pd.Series(['Normal'] * len(df))).iloc[i],
                    'timestamp': df.get('timestamp', pd.Series([datetime.now().isoformat()] * len(df))).iloc[i]
                }
                data.append(row)
            
        elif all(col in df.columns for col in backend_columns):
            # Backend format detected
            voltage_data = {
                'A': df['VA'].tolist(),
                'B': df['VB'].tolist(),
                'C': df['VC'].tolist()
            }
            
            current_data = {
                'A': df['IA'].tolist(),
                'B': df['IB'].tolist(),
                'C': df['IC'].tolist()
            }
            
            # Convert to expected format for consistency
            data = []
            for i in range(len(df)):
                row = {
                    'voltage_a': df['VA'].iloc[i],
                    'voltage_b': df['VB'].iloc[i],
                    'voltage_c': df['VC'].iloc[i],
                    'current_a': df['IA'].iloc[i],
                    'current_b': df['IB'].iloc[i],
                    'current_c': df['IC'].iloc[i],
                    'frequency': df.get('frequency', pd.Series([50.0] * len(df))).iloc[i],
                    'power_factor': df.get('power_factor', pd.Series([0.8] * len(df))).iloc[i],
                    'fault_type': df.get('fault_type', pd.Series(['Normal'] * len(df))).iloc[i],
                    'timestamp': df.get('timestamp', pd.Series([datetime.now().isoformat()] * len(df))).iloc[i]
                }
                data.append(row)
        else:
            # Neither format detected
            raise HTTPException(
                status_code=400,
                detail=f"CSV must contain either frontend format {frontend_voltage_columns + frontend_current_columns} or backend format {backend_columns}"
            )
        
        # Validate data
        for col in ['voltage_a', 'voltage_b', 'voltage_c', 'current_a', 'current_b', 'current_c']:
            if col in df.columns and df[col].isna().any():
                raise HTTPException(
                    status_code=400,
                    detail=f"Column {col} contains null values"
                )
        
        return {
            "message": "Data uploaded successfully",
            "data": data,
            "records_count": len(df)
        }
        
    except Exception as e:
        import traceback
        print(f"Error in upload_fault_data: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-sample-data")
async def generate_sample_data(
    fault_type: str = "Normal",
    samples: int = 100,
    current_user = Depends(get_current_active_user)
):
    """Generate sample fault data for testing"""
    try:
        if fault_type not in fault_service.fault_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid fault type. Must be one of: {fault_service.fault_types}"
            )
        
        # Generate single fault type data
        data = fault_service.generate_fault_data(samples_per_fault=samples)
        fault_data = data[data['fault_type'] == fault_type].iloc[0]
        
        # Extract voltage and current data (simplified)
        # In real implementation, you'd generate proper waveforms
        voltage_data = {
            'A': [fault_data.get(f'feature_{i}', 0) for i in range(5)],
            'B': [fault_data.get(f'feature_{i}', 0) for i in range(5, 10)],
            'C': [fault_data.get(f'feature_{i}', 0) for i in range(10, 15)]
        }
        
        current_data = {
            'A': [fault_data.get(f'feature_{i}', 0) for i in range(15, 20)],
            'B': [fault_data.get(f'feature_{i}', 0) for i in range(20, 25)],
            'C': [fault_data.get(f'feature_{i}', 0) for i in range(25, 30)]
        }
        
        return {
            "message": "Sample data generated successfully",
            "fault_type": fault_type,
            "voltage_data": voltage_data,
            "current_data": current_data
        }
        
    except Exception as e:
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
    
    models_dir = fault_service.models_dir
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
                "accuracy": metadata.get('accuracy', 0),
                "fault_types": metadata.get('fault_types', []),
                "created_at": metadata.get('created_at', ''),
                "training_time": metadata.get('training_time', 0)
            })
        except Exception as e:
            print(f"Error reading metadata file {metadata_file}: {e}")
            continue
    
    return sorted(trained_models, key=lambda x: x['created_at'], reverse=True)

@router.get("/fault-types")
async def get_fault_types(current_user = Depends(get_current_active_user)):
    """Get available fault types"""
    return {
        "fault_types": fault_service.fault_types,
        "descriptions": {
            "Normal": "Normal operation - balanced 3-phase system",
            "L-G": "Line-to-Ground fault - single line touches ground",
            "L-L": "Line-to-Line fault - two lines touch each other",
            "L-L-G": "Line-to-Line-to-Ground fault - two lines touch each other and ground",
            "3-Φ": "Three-phase fault - all three lines short circuit"
        }
    }

@router.get("/detections/{project_id}")
async def get_fault_detections(
    project_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all fault detections for a project"""
    # Verify project exists and belongs to user
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    detections = db.query(FaultDetection).filter(
        FaultDetection.project_id == project_id
    ).all()
    
    return [
        {
            "id": detection.id,
            "name": detection.name,
            "fault_type": detection.fault_type,
            "prediction_result": detection.prediction_result,
            "confidence_score": detection.confidence_score,
            "created_at": detection.created_at
        }
        for detection in detections
    ]

@router.get("/detections/{project_id}/{detection_id}")
async def get_fault_detection(
    project_id: int,
    detection_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific fault detection"""
    # Verify project exists and belongs to user
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    detection = db.query(FaultDetection).filter(
        FaultDetection.id == detection_id,
        FaultDetection.project_id == project_id
    ).first()
    
    if not detection:
        raise HTTPException(status_code=404, detail="Fault detection not found")
    
    return {
        "id": detection.id,
        "name": detection.name,
        "fault_type": detection.fault_type,
        "prediction_result": detection.prediction_result,
        "confidence_score": detection.confidence_score,
        "voltage_data": json.loads(detection.voltage_data),
        "current_data": json.loads(detection.current_data),
        "created_at": detection.created_at
    }

@router.delete("/detections/{project_id}/{detection_id}")
async def delete_fault_detection(
    project_id: int,
    detection_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete fault detection"""
    # Verify project exists and belongs to user
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    detection = db.query(FaultDetection).filter(
        FaultDetection.id == detection_id,
        FaultDetection.project_id == project_id
    ).first()
    
    if not detection:
        raise HTTPException(status_code=404, detail="Fault detection not found")
    
    db.delete(detection)
    db.commit()
    
    return {"message": "Fault detection deleted successfully"} 