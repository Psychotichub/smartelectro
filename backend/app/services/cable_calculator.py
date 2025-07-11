import math
from typing import Dict, Any, List
import pandas as pd
from dataclasses import dataclass

@dataclass
class CableResult:
    recommended_cable_size: str
    voltage_drop: float
    power_loss: float
    current: float
    is_safe: bool
    safety_factor: float
    details: Dict[str, Any]

class CableCalculatorService:
    def __init__(self):
        # Standard cable sizes (mm²) and their current carrying capacities (A)
        self.cable_sizes = {
            "1.5": {"current_capacity": 20, "resistance": 12.1},
            "2.5": {"current_capacity": 27, "resistance": 7.41},
            "4": {"current_capacity": 37, "resistance": 4.61},
            "6": {"current_capacity": 47, "resistance": 3.08},
            "10": {"current_capacity": 65, "resistance": 1.83},
            "16": {"current_capacity": 85, "resistance": 1.15},
            "25": {"current_capacity": 112, "resistance": 0.727},
            "35": {"current_capacity": 138, "resistance": 0.524},
            "50": {"current_capacity": 168, "resistance": 0.387},
            "70": {"current_capacity": 213, "resistance": 0.268},
            "95": {"current_capacity": 258, "resistance": 0.193},
            "120": {"current_capacity": 299, "resistance": 0.153},
            "150": {"current_capacity": 340, "resistance": 0.124},
            "185": {"current_capacity": 384, "resistance": 0.099},
            "240": {"current_capacity": 447, "resistance": 0.0754},
            "300": {"current_capacity": 510, "resistance": 0.0601},
            "400": {"current_capacity": 583, "resistance": 0.0470}
        }
        
        # Standard voltage levels
        self.voltage_levels = {
            "single_phase": [230, 240],
            "three_phase": [400, 415, 690, 1000, 3300, 6600, 11000, 33000]
        }
        
        # Installation method factors
        self.installation_factors = {
            "air": 1.0,
            "conduit": 0.8,
            "buried": 0.7,
            "tray": 0.9
        }
        
        # Ambient temperature factors
        self.temperature_factors = {
            30: 1.0,
            35: 0.94,
            40: 0.87,
            45: 0.79,
            50: 0.71,
            55: 0.61,
            60: 0.50
        }
    
    def calculate_current(self, voltage: float, power_kw: float, power_factor: float, phases: int = 3) -> float:
        """Calculate current from power, voltage, and power factor"""
        if phases == 1:
            # Single phase: I = P / (V * pf)
            current = (power_kw * 1000) / (voltage * power_factor)
        else:
            # Three phase: I = P / (√3 * V * pf)
            current = (power_kw * 1000) / (math.sqrt(3) * voltage * power_factor)
        
        return current
    
    def calculate_voltage_drop(self, current: float, resistance: float, distance: float, phases: int = 3) -> float:
        """Calculate voltage drop"""
        if phases == 1:
            # Single phase: Vd = 2 * I * R * L / 1000
            voltage_drop = 2 * current * resistance * distance / 1000
        else:
            # Three phase: Vd = √3 * I * R * L / 1000
            voltage_drop = math.sqrt(3) * current * resistance * distance / 1000
        
        return voltage_drop
    
    def calculate_power_loss(self, current: float, resistance: float, distance: float, phases: int = 3) -> float:
        """Calculate power loss in watts"""
        if phases == 1:
            # Single phase: P_loss = 2 * I² * R * L / 1000
            power_loss = 2 * (current ** 2) * resistance * distance / 1000
        else:
            # Three phase: P_loss = 3 * I² * R * L / 1000
            power_loss = 3 * (current ** 2) * resistance * distance / 1000
        
        return power_loss
    
    def get_cable_size_recommendation(self, current: float, voltage_drop_limit: float = 5.0, 
                                    safety_factor: float = 1.25) -> str:
        """Get recommended cable size based on current and voltage drop"""
        required_current = current * safety_factor
        
        # Find the smallest cable that can handle the current
        for size, properties in self.cable_sizes.items():
            if properties["current_capacity"] >= required_current:
                return size
        
        # If no cable is large enough, return the largest
        return "400"
    
    def calculate_cable_sizing(self, voltage: float, power_kw: float, power_factor: float, 
                             distance: float, voltage_drop_limit: float = 5.0, 
                             phases: int = 3, installation_method: str = "air",
                             ambient_temp: int = 30) -> CableResult:
        """Calculate cable sizing with all parameters"""
        
        # Calculate current
        current = self.calculate_current(voltage, power_kw, power_factor, phases)
        
        # Apply derating factors
        installation_factor = self.installation_factors.get(installation_method, 1.0)
        temperature_factor = self.temperature_factors.get(ambient_temp, 1.0)
        
        total_derating = installation_factor * temperature_factor
        derated_current = current / total_derating
        
        # Find suitable cable size
        recommended_size = None
        for size, properties in self.cable_sizes.items():
            # Check current capacity
            if properties["current_capacity"] >= derated_current * 1.25:  # 25% safety factor
                # Check voltage drop
                voltage_drop = self.calculate_voltage_drop(
                    current, properties["resistance"], distance, phases
                )
                voltage_drop_percentage = (voltage_drop / voltage) * 100
                
                if voltage_drop_percentage <= voltage_drop_limit:
                    recommended_size = size
                    break
        
        if not recommended_size:
            # If no cable meets both criteria, find largest available
            recommended_size = max(self.cable_sizes.keys(), key=float)
        
        # Calculate final parameters with recommended cable
        cable_properties = self.cable_sizes[recommended_size]
        voltage_drop = self.calculate_voltage_drop(
            current, cable_properties["resistance"], distance, phases
        )
        power_loss = self.calculate_power_loss(
            current, cable_properties["resistance"], distance, phases
        )
        
        voltage_drop_percentage = (voltage_drop / voltage) * 100
        is_safe = (voltage_drop_percentage <= voltage_drop_limit and 
                  cable_properties["current_capacity"] >= derated_current * 1.25)
        
        safety_factor = cable_properties["current_capacity"] / derated_current
        
        return CableResult(
            recommended_cable_size=f"{recommended_size} mm²",
            voltage_drop=voltage_drop_percentage,
            power_loss=power_loss,
            current=current,
            is_safe=is_safe,
            safety_factor=safety_factor,
            details={
                "calculated_current": current,
                "derated_current": derated_current,
                "cable_current_capacity": cable_properties["current_capacity"],
                "installation_factor": installation_factor,
                "temperature_factor": temperature_factor,
                "total_derating": total_derating,
                "voltage_drop_volts": voltage_drop,
                "voltage_drop_percentage": voltage_drop_percentage,
                "power_loss_watts": power_loss,
                "cable_resistance": cable_properties["resistance"],
                "phases": phases,
                "installation_method": installation_method,
                "ambient_temperature": ambient_temp
            }
        )
    
    def get_cable_properties(self, cable_size: str) -> Dict[str, Any]:
        """Get properties of a specific cable size"""
        if cable_size in self.cable_sizes:
            return self.cable_sizes[cable_size]
        return None
    
    def get_available_cable_sizes(self) -> List[str]:
        """Get list of available cable sizes"""
        return list(self.cable_sizes.keys())
    
    def calculate_multiple_scenarios(self, scenarios: List[Dict[str, Any]]) -> List[CableResult]:
        """Calculate cable sizing for multiple scenarios"""
        results = []
        
        for scenario in scenarios:
            result = self.calculate_cable_sizing(
                voltage=scenario.get("voltage", 400),
                power_kw=scenario.get("power_kw", 10),
                power_factor=scenario.get("power_factor", 0.8),
                distance=scenario.get("distance", 100),
                voltage_drop_limit=scenario.get("voltage_drop_limit", 5.0),
                phases=scenario.get("phases", 3),
                installation_method=scenario.get("installation_method", "air"),
                ambient_temp=scenario.get("ambient_temp", 30)
            )
            results.append(result)
        
        return results
    
    def generate_cable_sizing_report(self, voltage: float, power_kw: float, power_factor: float, 
                                   distance: float, **kwargs) -> Dict[str, Any]:
        """Generate comprehensive cable sizing report"""
        result = self.calculate_cable_sizing(voltage, power_kw, power_factor, distance, **kwargs)
        
        # Additional calculations
        cost_per_meter = self.estimate_cable_cost(result.recommended_cable_size)
        total_cost = cost_per_meter * distance
        
        # Economic analysis
        annual_power_loss_kwh = result.power_loss * 8760 / 1000  # Assuming continuous operation
        annual_loss_cost = annual_power_loss_kwh * 0.1  # $0.1 per kWh
        
        report = {
            "input_parameters": {
                "voltage": voltage,
                "power_kw": power_kw,
                "power_factor": power_factor,
                "distance": distance,
                **kwargs
            },
            "cable_sizing_result": {
                "recommended_cable_size": result.recommended_cable_size,
                "voltage_drop_percentage": result.voltage_drop,
                "power_loss_watts": result.power_loss,
                "current_amperes": result.current,
                "is_safe": result.is_safe,
                "safety_factor": result.safety_factor
            },
            "detailed_calculations": result.details,
            "economic_analysis": {
                "cable_cost_per_meter": cost_per_meter,
                "total_cable_cost": total_cost,
                "annual_power_loss_kwh": annual_power_loss_kwh,
                "annual_loss_cost": annual_loss_cost,
                "payback_period_years": self.calculate_payback_period(total_cost, annual_loss_cost)
            },
            "recommendations": self.generate_recommendations(result)
        }
        
        return report
    
    def estimate_cable_cost(self, cable_size: str) -> float:
        """Estimate cable cost per meter (simplified)"""
        size_value = float(cable_size.replace(" mm²", ""))
        
        # Rough cost estimation based on cable size
        base_cost = 2.0  # Base cost per meter
        size_factor = size_value * 0.1  # Cost increases with size
        
        return base_cost + size_factor
    
    def calculate_payback_period(self, initial_cost: float, annual_savings: float) -> float:
        """Calculate payback period for cable investment"""
        if annual_savings <= 0:
            return float('inf')
        
        return initial_cost / annual_savings
    
    def generate_recommendations(self, result: CableResult) -> List[str]:
        """Generate recommendations based on calculation results"""
        recommendations = []
        
        if not result.is_safe:
            recommendations.append("WARNING: Calculated configuration may not be safe. Consider larger cable size or shorter distance.")
        
        if result.voltage_drop > 3.0:
            recommendations.append("Consider using a larger cable size to reduce voltage drop.")
        
        if result.safety_factor < 1.5:
            recommendations.append("Safety factor is low. Consider increasing cable size for better safety margin.")
        
        if result.power_loss > 1000:
            recommendations.append("High power loss detected. Consider using larger cable to improve efficiency.")
        
        if result.voltage_drop < 1.0:
            recommendations.append("Cable size may be oversized. Consider smaller cable for cost optimization.")
        
        return recommendations
    
    def validate_input_parameters(self, voltage: float, power_kw: float, power_factor: float, 
                                distance: float) -> List[str]:
        """Validate input parameters and return error messages"""
        errors = []
        
        if voltage <= 0:
            errors.append("Voltage must be positive")
        
        if power_kw <= 0:
            errors.append("Power must be positive")
        
        if power_factor <= 0 or power_factor > 1:
            errors.append("Power factor must be between 0 and 1")
        
        if distance <= 0:
            errors.append("Distance must be positive")
        
        if distance > 10000:
            errors.append("Distance seems too large (>10km). Please verify.")
        
        return errors 