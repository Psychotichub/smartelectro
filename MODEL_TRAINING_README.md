# 🤖 AI Model Training Guide - SmartElectro AI

> **Complete guide for training, evaluating, and deploying AI models in SmartElectro AI**

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [🧠 Available AI Models](#-available-ai-models)
- [📊 Data Requirements](#-data-requirements)
- [🚀 Training Procedures](#-training-procedures)
- [📡 API Training Endpoints](#-api-training-endpoints)
- [📈 Model Evaluation](#-model-evaluation)
- [🔄 Model Management](#-model-management)
- [💡 Best Practices](#-best-practices)
- [🛠️ Troubleshooting](#️-troubleshooting)
- [📝 Examples](#-examples)

---

## 🎯 Overview

SmartElectro AI provides **4 main AI-powered modules** for electrical engineering analysis. Each module supports multiple machine learning approaches optimized for different use cases and data types.

### **Supported AI Technologies**
- **Deep Learning**: TensorFlow/Keras (LSTM, CNN)
- **Traditional ML**: Scikit-learn (Random Forest, Decision Trees, Isolation Forest)
- **Time Series**: LSTM for sequential data analysis
- **Anomaly Detection**: Isolation Forest for equipment monitoring

### **Training Modes**
1. **🔄 Web Interface**: Train models through the React frontend
2. **📡 API Endpoints**: Direct API calls for programmatic training
3. **📁 File Upload**: CSV data upload for custom datasets
4. **🎲 Sample Data**: Built-in synthetic data for testing

---

## 🧠 Available AI Models

### 1. **📊 Load Forecasting Models**

#### **🔥 LSTM (Long Short-Term Memory)**
- **Type**: Deep Learning - Recurrent Neural Network
- **Purpose**: Time series forecasting for power consumption
- **Architecture**: 3-layer LSTM with 50 neurons each
- **Input**: 24-hour sequences of load data
- **Output**: Multi-step ahead forecasts
- **Best For**: Complex temporal patterns, long-term dependencies

**Model Architecture:**
```
Input(24, 1) → LSTM(50, return_sequences=True) → LSTM(50, return_sequences=True) → LSTM(50) → Dense(25) → Dense(1)
```

#### **🌳 Random Forest**
- **Type**: Ensemble Learning
- **Purpose**: Load prediction with engineered features
- **Trees**: 100 decision trees
- **Features**: Time-based + lag features + rolling statistics
- **Best For**: Interpretable results, feature importance analysis

**Feature Engineering:**
- **Time Features**: hour, day_of_week, month, season
- **Lag Features**: Previous 1, 2, 3, 24, 48, 168 hours
- **Rolling Stats**: 24h mean, 7-day mean, std deviation

### 2. **⚡ Fault Detection Models**

#### **🌳 Decision Tree**
- **Type**: Rule-based Classification
- **Purpose**: Electrical fault classification
- **Max Depth**: 10 levels
- **Fault Types**: Normal, L-G, L-L, L-L-G, 3-Φ
- **Best For**: Interpretable rules, fast inference

#### **🧠 CNN (Convolutional Neural Network)**
- **Type**: Deep Learning
- **Purpose**: Signal pattern recognition for fault detection
- **Architecture**: 3 Conv1D layers + Dense layers
- **Input**: Raw electrical waveform data
- **Best For**: Complex signal patterns, high accuracy

**Model Architecture:**
```
Input(features, 1) → Conv1D(64, 3) → MaxPool1D(2) → Conv1D(128, 3) → MaxPool1D(2) → Conv1D(64, 3) → Flatten() → Dense(128) → Dropout(0.5) → Dense(5)
```

### 3. **🔧 Maintenance Alerts**

#### **🏥 Isolation Forest**
- **Type**: Unsupervised Anomaly Detection
- **Purpose**: Equipment failure prediction
- **Contamination**: 0.1 (10% anomaly rate)
- **Input**: Sensor readings (temperature, vibration, current)
- **Best For**: Detecting unusual equipment behavior

### 4. **🔌 Cable Calculator**
- **Type**: Engineering Calculations (Not ML-based)
- **Purpose**: Optimal cable sizing
- **Method**: Electrical engineering formulas + optimization
- **Standards**: IEC/IEEE electrical codes compliance

---

## 📊 Data Requirements

### **🔄 Load Forecasting Data**

#### **CSV Format Requirements:**
```csv
timestamp,load,temperature,humidity
2024-01-01 00:00:00,1500.5,25.2,60
2024-01-01 01:00:00,1450.3,24.8,62
2024-01-01 02:00:00,1420.1,24.5,63
```

#### **Required Columns:**
- **`timestamp`**: ISO format datetime (YYYY-MM-DD HH:MM:SS)
- **`load`**: Power consumption in kW (numeric)

#### **Optional Columns:**
- **`temperature`**: Ambient temperature in °C
- **`humidity`**: Relative humidity (%)
- **`day_type`**: weekday/weekend/holiday

#### **Data Quality Requirements:**
- **Minimum Records**: 1000+ for meaningful training
- **Frequency**: Hourly data recommended
- **Time Span**: 3+ months for seasonal patterns
- **Missing Values**: <5% missing data
- **Outliers**: Pre-filtered extreme values

### **⚡ Fault Detection Data**

#### **CSV Format Requirements:**
```csv
voltage_a,voltage_b,voltage_c,current_a,current_b,current_c,frequency,power_factor,fault_type
230.5,229.8,231.2,15.2,14.8,15.5,50.0,0.92,Normal
145.2,228.9,230.1,25.8,14.9,15.1,49.8,0.85,L-G
```

#### **Required Columns:**
- **Voltage Measurements**: `voltage_a`, `voltage_b`, `voltage_c` (V)
- **Current Measurements**: `current_a`, `current_b`, `current_c` (A)
- **System Parameters**: `frequency` (Hz), `power_factor`
- **Target**: `fault_type` (Normal, L-G, L-L, L-L-G, 3-Φ)

#### **Data Quality Requirements:**
- **Balanced Dataset**: Equal samples per fault type
- **Realistic Values**: Voltage 80-120% nominal, Current 0-200% rated
- **Sampling Rate**: 1kHz+ for CNN models

### **🔧 Maintenance Data**

#### **CSV Format Requirements:**
```csv
timestamp,equipment_id,temperature,vibration,current,voltage,pressure,status
2024-01-01 00:00:00,MOTOR_001,65.2,2.1,45.8,230.1,8.5,normal
2024-01-01 00:15:00,MOTOR_001,67.1,2.3,46.2,229.8,8.7,normal
```

#### **Required Columns:**
- **`timestamp`**: Measurement time
- **`equipment_id`**: Unique equipment identifier
- **Sensor Readings**: `temperature`, `vibration`, `current`, `voltage`, `pressure`
- **`status`**: normal/warning/fault

---

## 🚀 Training Procedures

### **Method 1: 🌐 Web Interface Training**

#### **Step 1: Login & Project Setup**
1. Navigate to `http://localhost:3001`
2. Login with credentials (`testuser` / `password123`)
3. Create new project or select existing one

#### **Step 2: Module Selection**
1. Choose your target module:
   - **Load Forecasting** (`/load-forecasting`)
   - **Fault Detection** (`/fault-detection`)
   - **Maintenance Alerts** (`/maintenance-alerts`)

#### **Step 3: Model Training**
1. **Load Forecasting**:
   - Click "Train Model" button
   - Select model type: LSTM or Random Forest
   - Choose data source: Upload CSV or Use Sample Data
   - Set forecast horizon (24, 48, 168 hours)
   - Monitor training progress

2. **Fault Detection**:
   - Click "Train Fault Model"
   - Select: Decision Tree or CNN
   - Upload labeled fault data
   - Review training metrics

3. **Maintenance Alerts**:
   - Click "Train Anomaly Model"
   - Upload equipment sensor data
   - Set anomaly threshold (default: 10%)

#### **Step 4: Model Evaluation**
- Review accuracy metrics
- Analyze confusion matrices
- Check feature importance (for tree models)
- Validate on test data

### **Method 2: 📡 API Training**

#### **Authentication Setup**
```bash
# Get access token
curl -X POST "http://localhost:8000/api/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=password123"

# Use token in subsequent requests
TOKEN="your_access_token_here"
```

#### **Train Load Forecasting Model**
```bash
curl -X POST "http://localhost:8000/api/load-forecasting/train" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "name": "My_LSTM_Model",
    "model_type": "lstm",
    "forecast_hours": 24,
    "use_sample_data": true
  }'
```

#### **Train with Custom Data**
```bash
curl -X POST "http://localhost:8000/api/load-forecasting/train-with-data" \
  -H "Authorization: Bearer $TOKEN" \
  -F "project_id=1" \
  -F "name=Custom_Model" \
  -F "model_type=random_forest" \
  -F "forecast_hours=48" \
  -F "file=@your_data.csv"
```

#### **Train Fault Detection Model**
```bash
curl -X POST "http://localhost:8000/api/fault-detection/train-model" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "name": "Fault_CNN_Model",
    "model_type": "cnn"
  }'
```

---

## 📡 API Training Endpoints

### **🔐 Authentication Endpoints**
```http
POST /api/auth/token          # Get JWT token
POST /api/auth/register       # Register new user
GET  /api/auth/me            # Get current user info
```

### **📊 Load Forecasting Endpoints**
```http
POST /api/load-forecasting/train                    # Train with sample data
POST /api/load-forecasting/train-with-data         # Train with uploaded CSV
GET  /api/load-forecasting/models/{project_id}     # List trained models
POST /api/load-forecasting/predict                 # Make predictions
GET  /api/load-forecasting/model-info/{model_id}   # Get model details
```

### **⚡ Fault Detection Endpoints**
```http
POST /api/fault-detection/train-model              # Train fault model
POST /api/fault-detection/classify                 # Classify fault
GET  /api/fault-detection/models/{project_id}      # List models
POST /api/fault-detection/batch-classify           # Batch classification
```

### **🔧 Maintenance Endpoints**
```http
POST /api/maintenance/train-anomaly-model          # Train anomaly detection
POST /api/maintenance/detect-anomaly               # Detect anomalies
GET  /api/maintenance/alerts/{project_id}          # Get alerts
POST /api/maintenance/add-sensor-data              # Add sensor readings
```

### **📋 Project Management**
```http
GET  /api/projects/                    # List projects
POST /api/projects/                    # Create project
GET  /api/projects/{project_id}        # Get project details
DELETE /api/projects/{project_id}      # Delete project
```

---

## 📈 Model Evaluation

### **📊 Load Forecasting Metrics**

#### **Regression Metrics:**
- **MSE (Mean Squared Error)**: Lower is better
- **RMSE (Root Mean Squared Error)**: In same units as target
- **MAE (Mean Absolute Error)**: Average prediction error
- **R² Score**: Coefficient of determination (0-1, higher is better)
- **MAPE (Mean Absolute Percentage Error)**: Percentage error

#### **Time Series Specific:**
- **Forecast Horizon Accuracy**: Performance across different time steps
- **Seasonal Pattern Capture**: How well seasonal trends are learned
- **Trend Prediction**: Long-term trend accuracy

#### **Expected Performance:**
- **LSTM Models**: R² > 0.85 for hourly data
- **Random Forest**: R² > 0.80, better feature interpretability

### **⚡ Fault Detection Metrics**

#### **Classification Metrics:**
- **Accuracy**: Overall correct predictions (target >95%)
- **Precision**: Per-class precision (minimize false positives)
- **Recall**: Per-class recall (minimize false negatives)
- **F1-Score**: Harmonic mean of precision and recall
- **Confusion Matrix**: Detailed per-class performance

#### **Critical Requirements:**
- **Safety**: High recall for dangerous faults (L-L-G, 3-Φ)
- **False Alarms**: Low false positive rate for normal operation
- **Response Time**: <100ms inference for real-time systems

#### **Expected Performance:**
- **Decision Tree**: 90-95% accuracy, fast inference
- **CNN Models**: 95-98% accuracy, higher computational cost

### **🔧 Anomaly Detection Metrics**

#### **Unsupervised Metrics:**
- **Anomaly Score Distribution**: Separation between normal/anomalous
- **Contamination Rate**: Percentage of data marked as anomalous
- **Precision@K**: Precision of top K anomalies
- **ROC-AUC**: If labeled data available

#### **Operational Metrics:**
- **Alert Rate**: Sustainable rate of maintenance alerts
- **False Positive Rate**: Minimize unnecessary maintenance
- **Lead Time**: How early failures are detected

---

## 🔄 Model Management

### **💾 Model Storage**

#### **File Structure:**
```
models/
├── load_forecasting/
│   ├── MyModel_LSTM_20241201_143022.h5          # TensorFlow model
│   ├── MyModel_LSTM_20241201_143022_scaler.pkl  # Data scaler
│   └── MyModel_LSTM_20241201_143022_metadata.json # Model info
├── fault_detection/
│   ├── FaultCNN_20241201_143022.h5              # CNN model
│   ├── FaultTree_20241201_143022.pkl            # Decision tree
│   └── FaultCNN_20241201_143022_scaler.pkl      # Feature scaler
└── maintenance/
    ├── MotorAnom_20241201_143022_model.pkl      # Isolation Forest
    └── MotorAnom_20241201_143022_metadata.json  # Anomaly info
```

#### **Model Metadata:**
```json
{
  "model_type": "lstm",
  "accuracy": 0.92,
  "r2_score": 0.87,
  "training_samples": 8760,
  "features": ["load", "temperature"],
  "created_at": "2024-12-01T14:30:22",
  "training_duration": "00:15:32",
  "hyperparameters": {
    "epochs": 50,
    "batch_size": 32,
    "sequence_length": 24
  }
}
```

### **🔄 Model Versioning**

#### **Naming Convention:**
```
{ModelName}_{UserID}_{YYYYMMDD}_{HHMMSS}
```

#### **Version Management:**
- **Automatic Timestamping**: Each training creates new version
- **Model Comparison**: Compare metrics across versions
- **Rollback Support**: Revert to previous model versions
- **Performance Tracking**: Historical performance monitoring

### **📊 Model Deployment**

#### **Production Deployment:**
1. **Model Validation**: Ensure metrics meet requirements
2. **A/B Testing**: Compare with existing models
3. **Gradual Rollout**: Deploy to subset of users first
4. **Performance Monitoring**: Track real-world performance
5. **Automatic Fallback**: Revert if performance degrades

---

## 💡 Best Practices

### **📊 Data Preparation**

#### **Data Quality Checklist:**
- [ ] **Missing Values**: Handle <5% missing data with interpolation
- [ ] **Outliers**: Remove values >3 standard deviations
- [ ] **Consistency**: Uniform sampling intervals
- [ ] **Seasonality**: Include full seasonal cycles (1+ years)
- [ ] **Stationarity**: Check for trends and seasonal decomposition

#### **Feature Engineering:**
- **Time Features**: Extract hour, day, month, season
- **Lag Features**: Include relevant historical values
- **Rolling Statistics**: Moving averages and standard deviations
- **Domain Knowledge**: Include electrical engineering relationships

### **🔧 Model Training**

#### **Training Strategy:**
- **Data Split**: 70% train, 15% validation, 15% test
- **Cross-Validation**: Time series aware splitting
- **Early Stopping**: Prevent overfitting with patience=10
- **Hyperparameter Tuning**: Grid search for optimal parameters

#### **Model Selection:**
- **LSTM**: Use for complex temporal patterns, long sequences
- **Random Forest**: Use for interpretability, feature importance
- **Decision Tree**: Use for simple rules, fast inference
- **CNN**: Use for raw signal data, complex patterns

### **📈 Performance Optimization**

#### **Training Optimization:**
- **Batch Size**: Start with 32, adjust based on memory
- **Learning Rate**: 0.001 for Adam optimizer
- **Regularization**: Dropout 0.2-0.5 for neural networks
- **Data Augmentation**: Add noise for robustness

#### **Inference Optimization:**
- **Model Quantization**: Reduce model size for deployment
- **Batch Prediction**: Process multiple samples together
- **Caching**: Cache frequent predictions
- **GPU Acceleration**: Use GPU for large models

### **🔒 Security & Privacy**

#### **Data Security:**
- **Encryption**: Encrypt sensitive electrical data
- **Access Control**: Role-based model access
- **Audit Logging**: Track model training and usage
- **Data Retention**: Automatic cleanup of old training data

#### **Model Security:**
- **Model Validation**: Verify model integrity
- **Version Control**: Track model changes
- **Backup**: Regular model backups
- **Recovery**: Disaster recovery procedures

---

## 🛠️ Troubleshooting

### **❌ Common Training Errors**

#### **1. Memory Errors**
**Error**: `OOM (Out of Memory)`
**Solutions:**
- Reduce batch size (32 → 16 → 8)
- Use data generators instead of loading all data
- Enable mixed precision training
- Increase system RAM or use cloud training

#### **2. Poor Model Performance**
**Error**: Low accuracy or high loss
**Solutions:**
- **More Data**: Increase training dataset size
- **Feature Engineering**: Add relevant features
- **Hyperparameter Tuning**: Adjust learning rate, epochs
- **Model Architecture**: Try different model types
- **Data Quality**: Check for noise and outliers

#### **3. Convergence Issues**
**Error**: Loss not decreasing
**Solutions:**
- Lower learning rate (0.001 → 0.0001)
- Add batch normalization
- Check gradient clipping
- Simplify model architecture
- Verify data preprocessing

#### **4. Overfitting**
**Error**: High training accuracy, low validation accuracy
**Solutions:**
- Add dropout layers (0.2-0.5)
- Reduce model complexity
- Increase training data
- Use early stopping
- Add regularization (L1/L2)

### **🔧 API Error Handling**

#### **Authentication Errors**
```json
{
  "detail": "Could not validate credentials",
  "status_code": 401
}
```
**Solution**: Refresh JWT token

#### **Validation Errors**
```json
{
  "detail": "CSV must contain columns: ['timestamp', 'load']",
  "status_code": 400
}
```
**Solution**: Fix CSV format

#### **Training Errors**
```json
{
  "detail": "Training failed: Insufficient data",
  "status_code": 500
}
```
**Solution**: Provide more training data

### **📊 Performance Issues**

#### **Slow Training**
**Causes & Solutions:**
- **Large Dataset**: Use data sampling or cloud training
- **Complex Model**: Simplify architecture or use GPU
- **CPU Bound**: Enable multiprocessing
- **I/O Bound**: Use SSD storage, optimize data loading

#### **Poor Predictions**
**Diagnosis Steps:**
1. Check data quality and preprocessing
2. Verify model architecture matches data type
3. Compare with baseline models
4. Analyze residuals and error patterns
5. Validate on fresh test data

---

## 📝 Examples

### **Example 1: 📊 Train LSTM Load Forecasting Model**

#### **1. Prepare Data (load_data.csv):**
```csv
timestamp,load,temperature
2024-01-01 00:00:00,1500.5,25.2
2024-01-01 01:00:00,1450.3,24.8
2024-01-01 02:00:00,1420.1,24.5
... (8760 records for full year)
```

#### **2. API Training Call:**
```bash
curl -X POST "http://localhost:8000/api/load-forecasting/train-with-data" \
  -H "Authorization: Bearer $TOKEN" \
  -F "project_id=1" \
  -F "name=YearlyLSTM" \
  -F "model_type=lstm" \
  -F "forecast_hours=168" \
  -F "file=@load_data.csv"
```

#### **3. Expected Response:**
```json
{
  "message": "Model trained successfully",
  "model_name": "YearlyLSTM_1_20241201_143022",
  "mse": 12500.8,
  "r2_score": 0.89,
  "forecast": [1445.2, 1432.1, 1428.5, ...],
  "training_duration": "00:12:45"
}
```

### **Example 2: ⚡ Train CNN Fault Detection**

#### **1. Prepare Fault Data (fault_data.csv):**
```csv
voltage_a,voltage_b,voltage_c,current_a,current_b,current_c,frequency,power_factor,fault_type
230.5,229.8,231.2,15.2,14.8,15.5,50.0,0.92,Normal
145.2,228.9,230.1,25.8,14.9,15.1,49.8,0.85,L-G
230.1,145.5,229.8,15.1,25.9,14.7,49.9,0.87,L-G
... (10000 balanced samples)
```

#### **2. API Training Call:**
```bash
curl -X POST "http://localhost:8000/api/fault-detection/train-model" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "name": "Production_CNN",
    "model_type": "cnn"
  }'
```

#### **3. Expected Response:**
```json
{
  "message": "Model trained successfully",
  "model_name": "Production_CNN_1_20241201_143022",
  "accuracy": 0.967,
  "model_type": "cnn",
  "confusion_matrix": [
    [485, 3, 2, 0, 0],
    [1, 487, 2, 0, 0],
    [0, 2, 488, 0, 0],
    [0, 0, 1, 489, 0],
    [0, 0, 0, 1, 489]
  ],
  "classification_report": "..."
}
```

### **Example 3: 🔧 Train Anomaly Detection for Motors**

#### **1. Prepare Sensor Data (motor_sensors.csv):**
```csv
timestamp,equipment_id,temperature,vibration,current,voltage,pressure,status
2024-01-01 00:00:00,MOTOR_001,65.2,2.1,45.8,230.1,8.5,normal
2024-01-01 00:15:00,MOTOR_001,67.1,2.3,46.2,229.8,8.7,normal
2024-01-01 00:30:00,MOTOR_001,89.5,5.2,52.1,225.3,9.8,fault
... (50000 sensor readings)
```

#### **2. Web Interface Training:**
1. Navigate to **Maintenance Alerts** module
2. Click **"Train Anomaly Model"**
3. Upload `motor_sensors.csv`
4. Set contamination rate: 0.1 (10%)
5. Click **"Start Training"**

#### **3. Expected Results:**
- **Anomaly Detection Rate**: 12.3%
- **Training Time**: 2 minutes
- **Model Score**: 0.87
- **False Positive Rate**: 5.2%

### **Example 4: 🔄 Model Comparison Workflow**

#### **1. Train Multiple Models:**
```bash
# Train LSTM model
curl -X POST "..." -d '{"model_type": "lstm", ...}'

# Train Random Forest model  
curl -X POST "..." -d '{"model_type": "random_forest", ...}'
```

#### **2. Compare Performance:**
```bash
# Get model list
curl -X GET "http://localhost:8000/api/load-forecasting/models/1" \
  -H "Authorization: Bearer $TOKEN"
```

#### **3. Select Best Model:**
Based on metrics comparison:
- **LSTM**: R² = 0.89, Training time = 12 min
- **Random Forest**: R² = 0.85, Training time = 2 min

Choose LSTM for highest accuracy or Random Forest for faster inference.

---

## 🎯 Quick Start Checklist

### **Before Training:**
- [ ] **Environment Setup**: Backend and frontend running
- [ ] **Authentication**: Valid JWT token obtained
- [ ] **Project Created**: Project ID available
- [ ] **Data Prepared**: CSV files with required columns
- [ ] **Data Quality**: Checked for missing values and outliers

### **During Training:**
- [ ] **Monitor Progress**: Check training logs for errors
- [ ] **Resource Usage**: Monitor CPU/Memory consumption
- [ ] **Early Stopping**: Watch for convergence
- [ ] **Validation Metrics**: Track validation performance

### **After Training:**
- [ ] **Model Evaluation**: Review accuracy metrics
- [ ] **Test Predictions**: Validate on unseen data
- [ ] **Performance Testing**: Check inference speed
- [ ] **Documentation**: Record model parameters and performance
- [ ] **Deployment**: Deploy to production if metrics acceptable

---

## 📞 Support & Resources

### **📚 Additional Documentation**
- **Setup Guide**: [SETUP.md](SETUP.md)
- **API Documentation**: `http://localhost:8000/docs`
- **Frontend Guide**: [frontend/README.md](frontend/README.md)

### **🐛 Issue Reporting**
- **GitHub Issues**: Report bugs and feature requests
- **Discussion Forum**: Community support and questions
- **Email Support**: support@smartelectro.ai

### **🤝 Contributing**
- **Model Improvements**: Submit better architectures
- **New Algorithms**: Add support for new ML methods
- **Documentation**: Improve training guides
- **Testing**: Add training test cases

---

**🎉 Happy Training! Build better electrical systems with AI! ⚡🤖** 