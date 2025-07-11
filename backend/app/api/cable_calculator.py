from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

from ..models.database import get_db, CableCalculation, Project
from ..services.cable_calculator import CableCalculatorService, CableResult
from .auth import get_current_active_user

router = APIRouter()
cable_service = CableCalculatorService()

# Pydantic models
class CableCalculationRequest(BaseModel):
    project_id: int
    name: str
    voltage: float
    power_kw: float
    power_factor: float
    distance: float
    voltage_drop_limit: float = 5.0
    phases: int = 3
    installation_method: str = "air"
    ambient_temp: int = 30

class CableCalculationResponse(BaseModel):
    id: int
    project_id: int
    name: str
    voltage: float
    load_kw: float
    power_factor: float
    distance: float
    recommended_cable_size: str
    voltage_drop: float
    power_loss: float
    created_at: datetime

class CableQuickCalculationRequest(BaseModel):
    voltage: float
    power_kw: float
    power_factor: float
    distance: float
    voltage_drop_limit: float = 5.0
    phases: int = 3
    installation_method: str = "air"
    ambient_temp: int = 30

class CableReportRequest(BaseModel):
    voltage: float
    power_kw: float
    power_factor: float
    distance: float
    voltage_drop_limit: float = 5.0
    phases: int = 3
    installation_method: str = "air"
    ambient_temp: int = 30

@router.post("/calculate", response_model=CableCalculationResponse)
async def calculate_cable(
    request: CableCalculationRequest,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Calculate cable sizing and save to database"""
    try:
        # Verify project exists and belongs to user
        project = db.query(Project).filter(
            Project.id == request.project_id,
            Project.owner_id == current_user.id
        ).first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Validate input parameters
        errors = cable_service.validate_input_parameters(
            request.voltage, request.power_kw, request.power_factor, request.distance
        )
        if errors:
            raise HTTPException(status_code=400, detail="; ".join(errors))
        
        # Calculate cable sizing
        result = cable_service.calculate_cable_sizing(
            voltage=request.voltage,
            power_kw=request.power_kw,
            power_factor=request.power_factor,
            distance=request.distance,
            voltage_drop_limit=request.voltage_drop_limit,
            phases=request.phases,
            installation_method=request.installation_method,
            ambient_temp=request.ambient_temp
        )
        
        # Save to database
        db_calculation = CableCalculation(
            project_id=request.project_id,
            name=request.name,
            voltage=request.voltage,
            load_kw=request.power_kw,
            power_factor=request.power_factor,
            distance=request.distance,
            recommended_cable_size=result.recommended_cable_size,
            voltage_drop=result.voltage_drop,
            power_loss=result.power_loss
        )
        
        db.add(db_calculation)
        db.commit()
        db.refresh(db_calculation)
        
        return CableCalculationResponse(
            id=db_calculation.id,
            project_id=db_calculation.project_id,
            name=db_calculation.name,
            voltage=db_calculation.voltage,
            load_kw=db_calculation.load_kw,
            power_factor=db_calculation.power_factor,
            distance=db_calculation.distance,
            recommended_cable_size=db_calculation.recommended_cable_size,
            voltage_drop=db_calculation.voltage_drop,
            power_loss=db_calculation.power_loss,
            created_at=db_calculation.created_at
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/quick-calculate")
async def quick_calculate(
    request: CableQuickCalculationRequest,
    current_user = Depends(get_current_active_user)
):
    """Quick cable calculation without saving to database"""
    try:
        # Validate input parameters
        errors = cable_service.validate_input_parameters(
            request.voltage, request.power_kw, request.power_factor, request.distance
        )
        if errors:
            raise HTTPException(status_code=400, detail="; ".join(errors))
        
        # Calculate cable sizing
        result = cable_service.calculate_cable_sizing(
            voltage=request.voltage,
            power_kw=request.power_kw,
            power_factor=request.power_factor,
            distance=request.distance,
            voltage_drop_limit=request.voltage_drop_limit,
            phases=request.phases,
            installation_method=request.installation_method,
            ambient_temp=request.ambient_temp
        )
        
        return {
            "recommended_cable_size": result.recommended_cable_size,
            "voltage_drop_percentage": result.voltage_drop,
            "power_loss_watts": result.power_loss,
            "current_amperes": result.current,
            "is_safe": result.is_safe,
            "safety_factor": result.safety_factor,
            "details": result.details
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/detailed-report")
async def generate_detailed_report(
    request: CableReportRequest,
    current_user = Depends(get_current_active_user)
):
    """Generate detailed cable sizing report"""
    try:
        # Validate input parameters
        errors = cable_service.validate_input_parameters(
            request.voltage, request.power_kw, request.power_factor, request.distance
        )
        if errors:
            raise HTTPException(status_code=400, detail="; ".join(errors))
        
        # Generate comprehensive report
        report = cable_service.generate_cable_sizing_report(
            voltage=request.voltage,
            power_kw=request.power_kw,
            power_factor=request.power_factor,
            distance=request.distance,
            voltage_drop_limit=request.voltage_drop_limit,
            phases=request.phases,
            installation_method=request.installation_method,
            ambient_temp=request.ambient_temp
        )
        
        return report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cable-sizes")
async def get_cable_sizes(current_user = Depends(get_current_active_user)):
    """Get available cable sizes and their properties"""
    return {
        "cable_sizes": cable_service.get_available_cable_sizes(),
        "cable_properties": cable_service.cable_sizes,
        "installation_methods": list(cable_service.installation_factors.keys()),
        "temperature_factors": cable_service.temperature_factors
    }

@router.get("/voltage-levels")
async def get_voltage_levels(current_user = Depends(get_current_active_user)):
    """Get standard voltage levels"""
    return cable_service.voltage_levels

@router.post("/compare-scenarios")
async def compare_scenarios(
    scenarios: List[Dict[str, Any]],
    current_user = Depends(get_current_active_user)
):
    """Compare multiple cable sizing scenarios"""
    try:
        # Validate each scenario
        for i, scenario in enumerate(scenarios):
            errors = cable_service.validate_input_parameters(
                scenario.get("voltage", 400),
                scenario.get("power_kw", 10),
                scenario.get("power_factor", 0.8),
                scenario.get("distance", 100)
            )
            if errors:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Scenario {i+1} errors: {'; '.join(errors)}"
                )
        
        # Calculate all scenarios
        results = cable_service.calculate_multiple_scenarios(scenarios)
        
        # Format results
        comparison_results = []
        for i, result in enumerate(results):
            comparison_results.append({
                "scenario": i + 1,
                "input_parameters": scenarios[i],
                "recommended_cable_size": result.recommended_cable_size,
                "voltage_drop_percentage": result.voltage_drop,
                "power_loss_watts": result.power_loss,
                "current_amperes": result.current,
                "is_safe": result.is_safe,
                "safety_factor": result.safety_factor
            })
        
        return {
            "comparison_results": comparison_results,
            "summary": {
                "total_scenarios": len(scenarios),
                "safe_scenarios": sum(1 for r in results if r.is_safe),
                "average_voltage_drop": sum(r.voltage_drop for r in results) / len(results),
                "total_power_loss": sum(r.power_loss for r in results)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/calculations/{project_id}")
async def get_cable_calculations(
    project_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all cable calculations for a project"""
    # Verify project exists and belongs to user
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    calculations = db.query(CableCalculation).filter(
        CableCalculation.project_id == project_id
    ).all()
    
    return [
        {
            "id": calc.id,
            "name": calc.name,
            "voltage": calc.voltage,
            "load_kw": calc.load_kw,
            "power_factor": calc.power_factor,
            "distance": calc.distance,
            "recommended_cable_size": calc.recommended_cable_size,
            "voltage_drop": calc.voltage_drop,
            "power_loss": calc.power_loss,
            "created_at": calc.created_at
        }
        for calc in calculations
    ]

@router.get("/calculations/{project_id}/{calculation_id}")
async def get_cable_calculation(
    project_id: int,
    calculation_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific cable calculation"""
    # Verify project exists and belongs to user
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    calculation = db.query(CableCalculation).filter(
        CableCalculation.id == calculation_id,
        CableCalculation.project_id == project_id
    ).first()
    
    if not calculation:
        raise HTTPException(status_code=404, detail="Cable calculation not found")
    
    return {
        "id": calculation.id,
        "name": calculation.name,
        "voltage": calculation.voltage,
        "load_kw": calculation.load_kw,
        "power_factor": calculation.power_factor,
        "distance": calculation.distance,
        "recommended_cable_size": calculation.recommended_cable_size,
        "voltage_drop": calculation.voltage_drop,
        "power_loss": calculation.power_loss,
        "created_at": calculation.created_at
    }

@router.delete("/calculations/{project_id}/{calculation_id}")
async def delete_cable_calculation(
    project_id: int,
    calculation_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete cable calculation"""
    # Verify project exists and belongs to user
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    calculation = db.query(CableCalculation).filter(
        CableCalculation.id == calculation_id,
        CableCalculation.project_id == project_id
    ).first()
    
    if not calculation:
        raise HTTPException(status_code=404, detail="Cable calculation not found")
    
    db.delete(calculation)
    db.commit()
    
    return {"message": "Cable calculation deleted successfully"}

@router.get("/cable-properties/{cable_size}")
async def get_cable_properties(
    cable_size: str,
    current_user = Depends(get_current_active_user)
):
    """Get properties of a specific cable size"""
    properties = cable_service.get_cable_properties(cable_size)
    
    if not properties:
        raise HTTPException(status_code=404, detail="Cable size not found")
    
    return {
        "cable_size": cable_size,
        "properties": properties
    } 