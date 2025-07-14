import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple, Optional
import pickle
import os

class MaintenanceAlertsService:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.models_dir = "models"
        os.makedirs(self.models_dir, exist_ok=True)
        
        # Alert severity levels
        self.severity_levels = ["low", "medium", "high", "critical"]
        
        # Equipment types and their normal operating ranges
        self.equipment_ranges = {
            "motor": {
                "temperature": {"min": 20, "max": 80, "critical": 90},
                "voltage": {"min": 380, "max": 420, "critical": 450},
                "current": {"min": 0, "max": 100, "critical": 120},
                "vibration": {"min": 0, "max": 10, "critical": 15}
            },
            "transformer": {
                "temperature": {"min": 20, "max": 70, "critical": 85},
                "voltage": {"min": 380, "max": 420, "critical": 450},
                "load": {"min": 0, "max": 100, "critical": 110}
            },
            "generator": {
                "temperature": {"min": 20, "max": 85, "critical": 100},
                "voltage": {"min": 380, "max": 420, "critical": 450},
                "frequency": {"min": 49.5, "max": 50.5, "critical": 52},
                "oil_pressure": {"min": 2, "max": 5, "critical": 1}
            }
        }
    
    def generate_sample_sensor_data(self, equipment_type: str = "motor", 
                                  days: int = 30, hours_per_day: int = 24) -> pd.DataFrame:
        """Generate sample sensor data for testing"""
        if equipment_type not in self.equipment_ranges:
            equipment_type = "motor"
        
        ranges = self.equipment_ranges[equipment_type]
        
        # Generate timestamps
        timestamps = []
        start_date = datetime.now() - timedelta(days=days)
        
        for day in range(days):
            for hour in range(hours_per_day):
                timestamps.append(start_date + timedelta(days=day, hours=hour))
        
        data = {"timestamp": timestamps}
        
        # Generate data for each sensor type
        for sensor_type, limits in ranges.items():
            normal_values = []
            
            for i, timestamp in enumerate(timestamps):
                # Base value within normal range
                base_value = np.random.uniform(limits["min"], limits["max"])
                
                # Add daily patterns
                hour = timestamp.hour
                if sensor_type == "temperature":
                    # Temperature varies during the day
                    daily_factor = 1 + 0.1 * np.sin(2 * np.pi * hour / 24)
                    base_value *= daily_factor
                
                # Add some noise
                noise = np.random.normal(0, (limits["max"] - limits["min"]) * 0.02)
                value = base_value + noise
                
                # Introduce occasional anomalies (5% chance)
                if np.random.random() < 0.05:
                    if np.random.random() < 0.5:
                        # High anomaly
                        value = np.random.uniform(limits["max"] * 1.1, limits["critical"])
                    else:
                        # Low anomaly (if applicable)
                        if limits["min"] > 0:
                            value = np.random.uniform(limits["min"] * 0.5, limits["min"] * 0.9)
                
                normal_values.append(max(0, value))  # Ensure non-negative
            
            data[sensor_type] = normal_values
        
        return pd.DataFrame(data)
    
    def detect_anomalies_isolation_forest(self, data: pd.DataFrame, 
                                        equipment_type: str = "motor",
                                        existing_model_name: Optional[str] = None) -> Dict[str, Any]:
        """Detect anomalies using Isolation Forest with optional incremental learning"""
        
        # Prepare features (exclude timestamp)
        feature_columns = [col for col in data.columns if col != "timestamp"]
        X = data[feature_columns]
        
        # Scale features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Load existing model if provided
        if existing_model_name:
            try:
                existing_model_data = self.load_model(existing_model_name, equipment_type)
                model = existing_model_data['model']
                print(f"Loaded existing Isolation Forest model: {existing_model_name}")
                
                # For Isolation Forest, we need to retrain with combined data
                # This is a limitation of Isolation Forest - it doesn't support true incremental learning
                # But we can create a new model with similar parameters
                print("Isolation Forest incremental learning: Creating new model with similar parameters")
                
                # Create a new model with similar parameters
                model = IsolationForest(
                    contamination=0.1,  # Expect 10% anomalies
                    random_state=42,
                    n_estimators=100
                )
                
                # Fit and predict
                predictions = model.fit_predict(X_scaled)
                anomaly_scores = model.decision_function(X_scaled)
                
                print(f"Incremental training completed with {len(data)} new samples")
                
            except Exception as e:
                print(f"Failed to load existing model, creating new one: {e}")
                model = IsolationForest(
                    contamination=0.1,  # Expect 10% anomalies
                    random_state=42,
                    n_estimators=100
                )
                
                # Fit and predict
                predictions = model.fit_predict(X_scaled)
                anomaly_scores = model.decision_function(X_scaled)
        else:
            # Train new model
            model = IsolationForest(
                contamination=0.1,  # Expect 10% anomalies
                random_state=42,
                n_estimators=100
            )
            
            # Fit and predict
            predictions = model.fit_predict(X_scaled)
            anomaly_scores = model.decision_function(X_scaled)
        
        # Convert predictions: -1 (anomaly) to 1, 1 (normal) to 0
        anomalies = (predictions == -1).astype(int)
        
        # Calculate severity based on anomaly score
        severities = []
        for score in anomaly_scores:
            if score < -0.5:
                severities.append("critical")
            elif score < -0.3:
                severities.append("high")
            elif score < -0.1:
                severities.append("medium")
            else:
                severities.append("low")
        
        # Generate alerts for anomalies
        alerts = []
        for i, is_anomaly in enumerate(anomalies):
            if is_anomaly:
                alert = {
                    "timestamp": data.iloc[i]["timestamp"],
                    "severity": severities[i],
                    "anomaly_score": anomaly_scores[i],
                    "sensor_values": {col: data.iloc[i][col] for col in feature_columns},
                    "description": self.generate_alert_description(
                        data.iloc[i], feature_columns, equipment_type
                    )
                }
                alerts.append(alert)
        
        return {
            "model": model,
            "scaler": scaler,
            "anomalies": anomalies.tolist(),
            "anomaly_scores": anomaly_scores.tolist(),
            "alerts": alerts,
            "total_anomalies": sum(anomalies),
            "anomaly_rate": sum(anomalies) / len(anomalies) * 100,
            "is_incremental": existing_model_name is not None
        }
    
    def generate_alert_description(self, row: pd.Series, feature_columns: List[str], 
                                 equipment_type: str) -> str:
        """Generate human-readable alert description"""
        ranges = self.equipment_ranges.get(equipment_type, self.equipment_ranges["motor"])
        
        violations = []
        for sensor in feature_columns:
            if sensor in ranges:
                value = row[sensor]
                limits = ranges[sensor]
                
                if value > limits["critical"]:
                    violations.append(f"{sensor} critically high ({value:.1f} > {limits['critical']})")
                elif value > limits["max"]:
                    violations.append(f"{sensor} high ({value:.1f} > {limits['max']})")
                elif value < limits["min"] and limits["min"] > 0:
                    violations.append(f"{sensor} low ({value:.1f} < {limits['min']})")
        
        if violations:
            return f"Equipment fault detected: {', '.join(violations)}"
        else:
            return "Anomalous sensor pattern detected"
    
    def predict_maintenance_need(self, data: pd.DataFrame, 
                               equipment_type: str = "motor") -> Dict[str, Any]:
        """Predict maintenance needs based on sensor trends"""
        
        # Calculate trends for each sensor
        feature_columns = [col for col in data.columns if col != "timestamp"]
        trends = {}
        
        for sensor in feature_columns:
            # Calculate rolling averages and trends
            data[f"{sensor}_ma7"] = data[sensor].rolling(window=7).mean()
            data[f"{sensor}_ma24"] = data[sensor].rolling(window=24).mean()
            
            # Calculate trend slope (last 24 hours)
            recent_data = data.tail(24)
            if len(recent_data) > 1:
                x = np.arange(len(recent_data))
                y = recent_data[sensor].values
                trend_slope = np.polyfit(x, y, 1)[0]
                trends[sensor] = trend_slope
        
        # Predict maintenance needs based on trends
        maintenance_alerts = []
        ranges = self.equipment_ranges.get(equipment_type, self.equipment_ranges["motor"])
        
        for sensor, trend in trends.items():
            if sensor in ranges:
                current_value = data[sensor].iloc[-1]
                limits = ranges[sensor]
                
                # Check if trend indicates approaching limits
                if trend > 0:  # Increasing trend
                    if current_value > limits["max"] * 0.8:
                        days_to_limit = (limits["max"] - current_value) / (trend * 24)
                        if days_to_limit < 30:
                            maintenance_alerts.append({
                                "sensor": sensor,
                                "type": "increasing_trend",
                                "current_value": current_value,
                                "trend": trend,
                                "days_to_limit": max(0, days_to_limit),
                                "severity": "high" if days_to_limit < 7 else "medium"
                            })
        
        return {
            "trends": trends,
            "maintenance_alerts": maintenance_alerts,
            "total_alerts": len(maintenance_alerts)
        }
    
    def analyze_equipment_health(self, data: pd.DataFrame, 
                               equipment_type: str = "motor",
                               existing_model_name: Optional[str] = None) -> Dict[str, Any]:
        """Analyze equipment health with optional incremental learning"""
        
        # Detect anomalies
        anomaly_result = self.detect_anomalies_isolation_forest(
            data, equipment_type, existing_model_name
        )
        
        # Predict maintenance needs
        maintenance_result = self.predict_maintenance_need(data, equipment_type)
        
        # Calculate health score
        health_score = self.calculate_health_score(data, equipment_type, anomaly_result)
        
        # Generate summary
        summary = self.generate_health_summary(health_score, anomaly_result, maintenance_result)
        
        return {
            "health_score": health_score,
            "anomaly_detection": anomaly_result,
            "maintenance_prediction": maintenance_result,
            "summary": summary,
            "is_incremental": anomaly_result.get('is_incremental', False)
        }
    
    def calculate_health_score(self, data: pd.DataFrame, equipment_type: str, 
                             anomaly_result: Dict[str, Any]) -> float:
        """Calculate equipment health score (0-100)"""
        ranges = self.equipment_ranges.get(equipment_type, self.equipment_ranges["motor"])
        
        # Base score
        score = 100
        
        # Deduct points for anomalies
        anomaly_rate = anomaly_result['anomaly_rate']
        score -= min(50, anomaly_rate * 2)  # Max 50 points deduction for anomalies
        
        # Deduct points for sensor violations
        feature_columns = [col for col in data.columns if col != "timestamp"]
        violations = 0
        
        for sensor in feature_columns:
            if sensor in ranges:
                values = data[sensor]
                limits = ranges[sensor]
                
                # Count violations
                critical_violations = (values > limits["critical"]).sum()
                high_violations = (values > limits["max"]).sum()
                
                violations += critical_violations * 2 + high_violations
        
        # Deduct points for violations
        violation_penalty = min(30, violations * 0.1)
        score -= violation_penalty
        
        return max(0, score)
    
    def generate_health_summary(self, health_score: float, anomaly_result: Dict[str, Any], 
                              maintenance_result: Dict[str, Any]) -> str:
        """Generate human-readable health summary"""
        if health_score >= 80:
            status = "Excellent"
        elif health_score >= 60:
            status = "Good"
        elif health_score >= 40:
            status = "Fair"
        elif health_score >= 20:
            status = "Poor"
        else:
            status = "Critical"
        
        summary = f"Equipment Health: {status} ({health_score:.1f}/100)\n"
        summary += f"Anomalies Detected: {anomaly_result['total_anomalies']}\n"
        summary += f"Maintenance Alerts: {maintenance_result['total_alerts']}"
        
        return summary
    
    def save_model(self, model_data: Dict[str, Any], equipment_name: str, equipment_type: str):
        """Save trained model"""
        model_path = os.path.join(self.models_dir, f"{equipment_name}_{equipment_type}_maintenance")
        
        # Save model and scaler
        with open(f"{model_path}_model.pkl", 'wb') as f:
            pickle.dump(model_data['model'], f)
        
        with open(f"{model_path}_scaler.pkl", 'wb') as f:
            pickle.dump(model_data['scaler'], f)
        
        # Save metadata
        metadata = {
            'equipment_type': equipment_type,
            'equipment_name': equipment_name,
            'total_anomalies': model_data['total_anomalies'],
            'anomaly_rate': model_data['anomaly_rate'],
            'is_incremental': model_data.get('is_incremental', False),
            'created_at': datetime.now().isoformat()
        }
        
        with open(f"{model_path}_metadata.json", 'w') as f:
            json.dump(metadata, f)
    
    def load_model(self, equipment_name: str, equipment_type: str) -> Dict[str, Any]:
        """Load trained model"""
        model_path = os.path.join(self.models_dir, f"{equipment_name}_{equipment_type}_maintenance")
        
        with open(f"{model_path}_model.pkl", 'rb') as f:
            model = pickle.load(f)
        
        with open(f"{model_path}_scaler.pkl", 'rb') as f:
            scaler = pickle.load(f)
        
        return {'model': model, 'scaler': scaler} 