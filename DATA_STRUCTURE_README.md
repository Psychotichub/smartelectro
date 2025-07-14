# SmartElectro AI - Data Structure Documentation

## Overview

This document provides comprehensive information about the data structures used for training all AI models in the SmartElectro AI system. Each module has specific data requirements and formats that must be followed for successful model training.

## Table of Contents

1. [Load Forecasting Models](#load-forecasting-models)
2. [Fault Detection Models](#fault-detection-models)
3. [Maintenance Alerts Models](#maintenance-alerts-models)
4. [Cable Calculator Models](#cable-calculator-models)
5. [Incremental Learning](#incremental-learning)
6. [Common Data Formats](#common-data-formats)
7. [Sample Data Generation](#sample-data-generation)

---

## Load Forecasting Models

### Available Models
- **LSTM (Long Short-Term Memory)**: Deep learning model for complex time series patterns
- **Random Forest**: Ensemble method for simpler forecasting tasks

### Data Structure Requirements

#### Input Data Format (CSV)
```csv
timestamp,load
2023-01-01 00:00:00,1450.2
2023-01-01 01:00:00,1380.5
2023-01-01 02:00:00,1320.8
...
```

#### Required Columns
| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `timestamp` | datetime | ISO format timestamp | `2023-01-01 00:00:00` |
| `load` | float | Power consumption in watts | `1450.2` |

#### Optional Columns
| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `temperature` | float | Ambient temperature in °C | `22.5` |
| `humidity` | float | Relative humidity in % | `65.0` |

#### Data Requirements
- **Minimum Records**: 24 samples (24 hours)
- **Recommended**: 1-12 months of hourly data
- **Time Format**: ISO 8601 format (`YYYY-MM-DD HH:MM:SS`)
- **Missing Values**: Not allowed for required columns
- **Data Quality**: Continuous time series without gaps

#### Training Parameters
```json
{
  "project_id": 1,
  "name": "Load_Forecast_Model",
  "model_type": "lstm",  // or "random_forest"
  "forecast_hours": 24,
  "use_sample_data": false,
  "uploaded_data": [
    {
      "timestamp": "2023-01-01 00:00:00",
      "load": 1450.2
    }
  ],
  "existing_model_name": "Load_Forecast_Model_123_20240101_120000_lstm"  // Optional for incremental learning
}
```

#### Model Output Structure
```json
{
  "id": 1,
  "project_id": 1,
  "name": "Load_Forecast_Model",
  "model_type": "lstm",
  "accuracy_score": 0.92,
  "forecast_data": [1450.2, 1380.5, 1320.8, ...],
  "created_at": "2023-01-01T00:00:00Z",
  "is_incremental": true
}
```

---

## Fault Detection Models

### Available Models
- **Decision Tree**: Fast classification for electrical fault detection
- **CNN (Convolutional Neural Network)**: Deep learning for complex fault patterns

### Data Structure Requirements

#### Input Data Format (CSV)
```csv
voltage_a,voltage_b,voltage_c,current_a,current_b,current_c,frequency,power_factor,fault_type
230.1,229.8,230.2,15.1,14.9,15.0,50.0,0.95,Normal
92.3,230.1,229.8,28.5,15.1,14.9,49.8,0.85,L-G
...
```

#### Required Columns
| Column | Type | Description | Range | Example |
|--------|------|-------------|-------|---------|
| `voltage_a` | float | Phase A voltage (V) | 0-500V | `230.1` |
| `voltage_b` | float | Phase B voltage (V) | 0-500V | `229.8` |
| `voltage_c` | float | Phase C voltage (V) | 0-500V | `230.2` |
| `current_a` | float | Phase A current (A) | 0-100A | `15.1` |
| `current_b` | float | Phase B current (A) | 0-100A | `14.9` |
| `current_c` | float | Phase C current (A) | 0-100A | `15.0` |
| `frequency` | float | System frequency (Hz) | 45-55Hz | `50.0` |
| `power_factor` | float | Power factor | 0.6-1.0 | `0.95` |
| `fault_type` | string | Fault classification | See below | `Normal` |

#### Fault Types
- **Normal**: No fault condition
- **L-G**: Line to Ground fault
- **L-L**: Line to Line fault
- **L-L-G**: Line to Line to Ground fault
- **3-Φ**: Three-phase fault

#### Data Requirements
- **Minimum Records**: 100 samples per fault type
- **Recommended**: 1000+ samples per fault type
- **Balanced Dataset**: Equal representation of all fault types
- **Data Quality**: Realistic electrical values within specified ranges

#### Training Parameters
```json
{
  "project_id": 1,
  "name": "Fault_Detection_Model",
  "model_type": "decision_tree",  // or "cnn"
  "use_sample_data": true,
  "existing_model_name": "Fault_Detection_Model_123_20240101_120000_decision_tree"  // Optional
}
```

#### Model Output Structure
```json
{
  "message": "Model trained successfully",
  "model_name": "Fault_Detection_Model_123",
  "accuracy": 0.95,
  "model_type": "decision_tree",
  "confusion_matrix": [[...], [...], [...], [...], [...]]],
  "is_incremental": true
}
```

---

## Maintenance Alerts Models

### Available Models
- **Isolation Forest**: Anomaly detection for equipment monitoring

### Data Structure Requirements

#### Input Data Format (CSV)
```csv
timestamp,equipment_id,equipment_type,temperature,vibration,current,voltage,pressure,humidity
2024-01-01 00:00:00,MOTOR_001,motor,65.2,2.1,45.3,230.1,8.5,60
2024-01-01 00:15:00,MOTOR_001,motor,66.1,2.0,45.8,229.8,8.4,61
...
```

#### Required Columns
| Column | Type | Description | Range | Example |
|--------|------|-------------|-------|---------|
| `timestamp` | datetime | Measurement timestamp | ISO format | `2024-01-01 00:00:00` |
| `equipment_id` | string | Equipment identifier | Any string | `MOTOR_001` |
| `equipment_type` | string | Equipment category | See below | `motor` |
| `temperature` | float | Temperature in °C | 0-150°C | `65.2` |
| `vibration` | float | Vibration in mm/s | 0-20 mm/s | `2.1` |
| `current` | float | Current in A | 0-200A | `45.3` |
| `voltage` | float | Voltage in V | 0-500V | `230.1` |
| `pressure` | float | Pressure in bar | 0-20 bar | `8.5` |
| `humidity` | float | Humidity in % | 0-100% | `60` |

#### Equipment Types and Normal Ranges
| Equipment Type | Temperature (°C) | Voltage (V) | Current (A) | Vibration (mm/s) |
|----------------|------------------|-------------|-------------|------------------|
| `motor` | 20-80 | 380-420 | 0-100 | 0-10 |
| `transformer` | 20-70 | 380-420 | 0-100 | N/A |
| `generator` | 20-85 | 380-420 | 0-100 | N/A |

#### Data Requirements
- **Minimum Records**: 24 samples (24 hours)
- **Recommended**: 30+ days of continuous monitoring
- **Sampling Rate**: 15-minute intervals or higher
- **Data Quality**: Continuous monitoring without gaps

#### Training Parameters
```json
{
  "project_id": 1,
  "equipment_name": "Equipment_2024-01-01T00-00-00",
  "equipment_type": "motor",
  "sensor_data": {
    "temperature": [65.2, 66.1, 65.8, ...],
    "vibration": [2.1, 2.0, 2.2, ...],
    "current": [45.3, 45.8, 45.1, ...],
    "voltage": [230.1, 229.8, 230.2, ...],
    "pressure": [8.5, 8.4, 8.6, ...],
    "humidity": [60, 61, 59, ...]
  },
  "timestamps": ["2024-01-01 00:00:00", "2024-01-01 00:15:00", ...],
  "existing_model_name": "Equipment_MOTOR_001_motor_maintenance"  // Optional
}
```

#### Model Output Structure
```json
{
  "model": "isolation_forest_model",
  "scaler": "standard_scaler",
  "anomalies": [0, 0, 1, 0, 0, ...],
  "anomaly_scores": [-0.1, -0.2, -0.8, -0.1, -0.3, ...],
  "alerts": [
    {
      "timestamp": "2024-01-01 02:30:00",
      "severity": "high",
      "anomaly_score": -0.8,
      "sensor_values": {
        "temperature": 85.2,
        "vibration": 4.5,
        "current": 65.3
      },
      "description": "Equipment fault detected: temperature critically high (85.2 > 90)"
    }
  ],
  "total_anomalies": 15,
  "anomaly_rate": 2.1,
  "is_incremental": true
}
```

---

## Cable Calculator Models

### Available Models
- **Rule-based Calculator**: Traditional electrical engineering calculations
- **ML Regression**: Machine learning for cable sizing optimization

### Data Structure Requirements

#### Input Data Format
```json
{
  "voltage": 400,
  "load": 50,
  "power_factor": 0.85,
  "distance": 100,
  "installation_type": "underground",
  "ambient_temperature": 30
}
```

#### Required Parameters
| Parameter | Type | Description | Range | Example |
|-----------|------|-------------|-------|---------|
| `voltage` | float | System voltage (V) | 110-1000V | `400` |
| `load` | float | Load power (kW) | 0.1-1000kW | `50` |
| `power_factor` | float | Power factor | 0.6-1.0 | `0.85` |
| `distance` | float | Cable length (m) | 1-10000m | `100` |

#### Optional Parameters
| Parameter | Type | Description | Range | Example |
|-----------|------|-------------|-------|---------|
| `installation_type` | string | Installation method | See below | `underground` |
| `ambient_temperature` | float | Ambient temperature (°C) | -10-60°C | `30` |
| `cable_type` | string | Cable insulation type | See below | `PVC` |

#### Installation Types
- `underground`: Buried cable installation
- `overhead`: Overhead line installation
- `conduit`: Cable in conduit
- `tray`: Cable tray installation

#### Cable Types
- `PVC`: Polyvinyl chloride insulation
- `XLPE`: Cross-linked polyethylene
- `EPR`: Ethylene propylene rubber
- `PILC`: Paper insulated lead covered

#### Output Structure
```json
{
  "recommended_cable": {
    "size": "25mm²",
    "type": "XLPE",
    "current_capacity": 85,
    "voltage_drop": 2.3,
    "power_loss": 1.8
  },
  "calculations": {
    "current": 72.2,
    "voltage_drop_percentage": 0.58,
    "power_loss_percentage": 3.6
  },
  "safety_factors": {
    "current_derating": 0.9,
    "temperature_factor": 0.95,
    "installation_factor": 0.8
  }
}
```

---

## Incremental Learning

### Overview
SmartElectro AI supports **incremental learning**, allowing models to be trained on new data without creating completely new models. This feature enables continuous model improvement while preserving previous knowledge.

### How Incremental Learning Works

#### For LSTM Models
```python
# Load existing model and continue training
existing_model_data = load_service.load_model("model_name", "lstm")
model = existing_model_data['model']

# Continue training with new data
history = model.fit(
    X_train, y_train,
    epochs=20,  # Fewer epochs for incremental learning
    batch_size=32,
    validation_data=(X_test, y_test),
    callbacks=[early_stopping],
    verbose=0
)
```

#### For Random Forest Models
```python
# Create new model with warm start
model = RandomForestRegressor(
    n_estimators=existing_model.n_estimators + 50,  # Add more trees
    max_depth=existing_model.max_depth,
    random_state=42,
    n_jobs=-1,
    warm_start=True  # Enable warm start
)

# Fit with new data
model.fit(X_train, y_train)
```

### API Usage

#### Training with Incremental Learning
```json
{
  "project_id": 1,
  "name": "Updated_Load_Forecast_Model",
  "model_type": "lstm",
  "forecast_hours": 24,
  "use_sample_data": false,
  "uploaded_data": [
    {
      "timestamp": "2024-01-01 00:00:00",
      "load": 1500.2
    }
  ],
  "existing_model_name": "Load_Forecast_Model_123_20240101_120000_lstm"
}
```

#### Response with Incremental Learning
```json
{
  "id": 2,
  "project_id": 1,
  "name": "Updated_Load_Forecast_Model",
  "model_type": "lstm",
  "accuracy_score": 0.94,
  "forecast_data": [1500.2, 1450.5, 1400.8, ...],
  "created_at": "2024-01-15T10:30:00Z",
  "is_incremental": true
}
```

### Benefits of Incremental Learning

1. **Faster Training**: Models train faster on new data
2. **Preserved Knowledge**: Previous learning is maintained
3. **Continuous Improvement**: Models get better over time
4. **Resource Efficiency**: Less computational resources needed
5. **Real-time Adaptation**: Models can adapt to changing patterns

### Best Practices

1. **Data Consistency**: Ensure new data follows the same format as original training data
2. **Regular Updates**: Update models periodically with fresh data
3. **Performance Monitoring**: Track model performance after incremental updates
4. **Backup Models**: Keep backups of original models before incremental training
5. **Validation**: Always validate model performance after incremental learning

### Limitations

1. **LSTM Models**: 
   - Requires TensorFlow
   - May need hyperparameter tuning for optimal incremental learning
   - Risk of catastrophic forgetting if new data is very different

2. **Random Forest Models**:
   - Limited true incremental learning (uses warm start)
   - May need to retrain with combined data for best results
   - Tree structure remains fixed, only adds new trees

3. **General Considerations**:
   - New data should be similar to original training data
   - Model performance may degrade if data distribution changes significantly
   - Requires careful monitoring of model drift

---

## Common Data Formats

### CSV File Format
All training data should be provided in CSV format with the following specifications:
- **Encoding**: UTF-8
- **Delimiter**: Comma (,)
- **Header**: First row contains column names
- **Date Format**: ISO 8601 (`YYYY-MM-DD HH:MM:SS`)
- **Decimal Separator**: Period (.)
- **Missing Values**: Empty cells or NULL

### JSON API Format
For API interactions, data should be formatted as JSON:
```json
{
  "project_id": 1,
  "name": "Model_Name",
  "model_type": "model_type",
  "parameters": {
    "param1": "value1",
    "param2": "value2"
  },
  "data": [
    {
      "column1": "value1",
      "column2": "value2"
    }
  ],
  "existing_model_name": "optional_existing_model_name"
}
```

### Database Schema
Models are stored in the database with the following structure:
```sql
-- Load Forecasting Models
CREATE TABLE load_forecasts (
    id INTEGER PRIMARY KEY,
    project_id INTEGER,
    name VARCHAR(255),
    model_type VARCHAR(50),
    input_data TEXT,
    forecast_data TEXT,
    accuracy_score FLOAT,
    is_incremental BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP
);

-- Fault Detection Models
CREATE TABLE fault_detections (
    id INTEGER PRIMARY KEY,
    project_id INTEGER,
    name VARCHAR(255),
    model_type VARCHAR(50),
    accuracy FLOAT,
    confusion_matrix TEXT,
    is_incremental BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP
);

-- Maintenance Alert Models
CREATE TABLE maintenance_alerts (
    id INTEGER PRIMARY KEY,
    project_id INTEGER,
    equipment_name VARCHAR(255),
    equipment_type VARCHAR(50),
    model_data TEXT,
    anomaly_threshold FLOAT,
    is_incremental BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP
);
```

---

## Sample Data Generation

### Load Forecasting Sample Data
```python
# Generate 1 year of hourly load data
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

start_date = datetime(2023, 1, 1)
end_date = datetime(2024, 1, 1)
timestamps = pd.date_range(start=start_date, end=end_date, freq='H')

# Simulate load with daily and weekly patterns
load = 1400 + 200 * np.sin(np.linspace(0, 50 * np.pi, len(timestamps))) + np.random.normal(0, 50, len(timestamps))

df = pd.DataFrame({
    "timestamp": timestamps,
    "load": np.round(load, 1)
})
```

### Fault Detection Sample Data
```python
# Generate balanced fault detection dataset
import pandas as pd
import numpy as np

fault_types = ['Normal', 'L-G', 'L-L', 'L-L-G', '3-Φ']
nominal_voltage = 230
rated_current = 15

def generate_fault_data(fault_type, num_samples=1000):
    data = []
    for _ in range(num_samples):
        if fault_type == 'Normal':
            voltage = np.random.normal(nominal_voltage, 2, 3)
            current = np.random.normal(rated_current, 1, 3)
        elif fault_type == 'L-G':
            voltage = [np.random.uniform(0.4*nominal_voltage, 0.7*nominal_voltage)] + np.random.normal(nominal_voltage, 2, 2).tolist()
            current = [np.random.uniform(1.5*rated_current, 2.0*rated_current)] + np.random.normal(rated_current, 1, 2).tolist()
        # ... other fault types
        
        data.append(voltage + current + [50.0, 0.95, fault_type])
    
    return data
```

### Maintenance Alerts Sample Data
```python
# Generate sensor data for equipment monitoring
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_sensor_data(equipment_type="motor", days=30):
    timestamps = []
    start_date = datetime.now() - timedelta(days=days)
    
    for day in range(days):
        for hour in range(24):
            timestamps.append(start_date + timedelta(days=day, hours=hour))
    
    data = {"timestamp": timestamps}
    
    # Generate sensor readings based on equipment type
    if equipment_type == "motor":
        data["temperature"] = np.random.normal(65, 2, len(timestamps))
        data["vibration"] = np.random.normal(2.0, 0.2, len(timestamps))
        data["current"] = np.random.normal(45, 2, len(timestamps))
        data["voltage"] = np.random.normal(230, 1.5, len(timestamps))
    
    return pd.DataFrame(data)
```

---

## Data Validation Rules

### General Validation
1. **Required Columns**: All required columns must be present
2. **Data Types**: Values must match expected data types
3. **Ranges**: Numeric values must be within specified ranges
4. **Missing Values**: Required fields cannot be null
5. **Time Series**: Timestamps must be in chronological order

### Load Forecasting Validation
- Minimum 24 data points
- Load values must be positive
- Timestamps must be hourly intervals
- No gaps in time series

### Fault Detection Validation
- Balanced dataset across fault types
- Voltage values: 0-500V
- Current values: 0-100A
- Frequency: 45-55Hz
- Power factor: 0.6-1.0

### Maintenance Alerts Validation
- Equipment type must be valid
- Sensor values within normal ranges
- Continuous monitoring data
- No duplicate timestamps

### Incremental Learning Validation
- Existing model must be compatible with new data format
- New data should follow same schema as original training data
- Model type must match between existing and new training
- Sufficient new data for meaningful incremental learning

---

## Error Handling

### Common Data Errors
1. **Missing Required Columns**: Return error with list of missing columns
2. **Invalid Data Types**: Return error with column name and expected type
3. **Out of Range Values**: Return error with value and valid range
4. **Insufficient Data**: Return error with minimum requirements
5. **Time Series Gaps**: Return error with gap locations
6. **Incompatible Model Types**: Return error when trying incremental learning with different model types

### Error Response Format
```json
{
  "error": "Data validation failed",
  "details": {
    "missing_columns": ["timestamp", "load"],
    "invalid_types": {
      "load": "Expected float, got string"
    },
    "out_of_range": {
      "voltage_a": "Value 600V exceeds maximum 500V"
    },
    "incremental_learning_error": "Existing model type 'lstm' does not match requested type 'random_forest'"
  }
}
```

---

## Best Practices

### Data Preparation
1. **Clean Data**: Remove outliers and handle missing values
2. **Normalize**: Scale features appropriately for each model type
3. **Validate**: Check data quality before training
4. **Document**: Maintain clear documentation of data sources

### Model Training
1. **Split Data**: Use train/validation/test splits
2. **Cross-Validation**: Implement k-fold cross-validation
3. **Hyperparameter Tuning**: Optimize model parameters
4. **Model Evaluation**: Use appropriate metrics for each task

### Incremental Learning
1. **Regular Updates**: Update models periodically with fresh data
2. **Performance Monitoring**: Track model performance after updates
3. **Data Consistency**: Ensure new data follows original format
4. **Backup Strategy**: Keep backups of original models
5. **Validation**: Always validate after incremental training

### Data Storage
1. **Version Control**: Track data versions and changes
2. **Backup**: Regular backups of training datasets
3. **Security**: Protect sensitive electrical system data
4. **Compliance**: Follow industry standards and regulations

---

## Support

For questions about data structures or model training:
- Check the API documentation
- Review sample data files in `/sample_data/`
- Consult the model training guide in `MODEL_TRAINING_README.md`
- Contact the development team for technical support

---

*Last Updated: January 2024*
*Version: 1.1* 