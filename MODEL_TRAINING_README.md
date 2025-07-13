# Model Training Guide

## Overview

SmartElectro AI supports real machine learning model training using CPU and GPU resources. The system includes several AI models for different electrical engineering tasks.

## Available Models

### 1. Load Forecasting Models
- **LSTM (Long Short-Term Memory)**: Deep learning model for complex time series patterns
- **Random Forest**: Ensemble method for simpler forecasting tasks

### 2. Fault Detection Models  
- **Decision Tree**: Fast classification for electrical fault detection
- **CNN (Convolutional Neural Network)**: Deep learning for complex fault patterns

### 3. Maintenance Alert Models
- **Isolation Forest**: Anomaly detection for equipment monitoring

## How to Train Models

### Step 1: Prepare Your Data

#### For Load Forecasting:
- Upload CSV file with columns: `timestamp`, `load`
- Or use sample data for testing
- Ensure data covers multiple days/weeks for better patterns

#### For Fault Detection:
- Upload CSV with voltage/current data for 3-phase system
- Columns: `VA`, `VB`, `VC`, `IA`, `IB`, `IC`
- Or use synthetic data for testing

#### For Maintenance Alerts:
- Upload sensor data CSV with equipment readings
- Include timestamp and sensor values
- Or use sample data for testing

### Step 2: Select Training Parameters

1. **Choose Project**: Select a project from the dropdown
2. **Model Type**: 
   - LSTM: Best for complex patterns, uses more CPU/GPU
   - Random Forest: Faster training, good for simpler patterns
3. **Forecast Horizon**: How many hours ahead to predict (1-168 hours)
4. **Data Source**: Upload your data or use sample data

### Step 3: Start Training

1. Click "Train Model" button
2. Monitor progress:
   - Data preparation (20%)
   - Model training (20-80%)
   - Validation and saving (80-100%)
3. Training time varies:
   - LSTM: 2-10 minutes (uses more resources)
   - Random Forest: 30 seconds - 2 minutes
   - CNN: 1-5 minutes

## Resource Usage

### CPU Usage
- **LSTM Models**: High CPU usage during training
- **Random Forest**: Moderate CPU usage
- **CNN Models**: High CPU usage during training

### GPU Usage (if available)
- **LSTM Models**: Will use GPU if TensorFlow detects CUDA
- **CNN Models**: Will use GPU for faster training
- **Random Forest**: CPU-only (no GPU acceleration)

### Memory Usage
- **LSTM**: 2-4 GB RAM during training
- **Random Forest**: 500MB-2GB RAM
- **CNN**: 1-3 GB RAM during training

## Training Process

### What Happens During Training:

1. **Data Preparation** (20%):
   - Loading and validating data
   - Feature engineering
   - Data scaling/normalization

2. **Model Training** (20-80%):
   - **LSTM**: Training neural network layers
   - **Random Forest**: Building decision trees
   - **CNN**: Training convolutional layers

3. **Validation** (80-100%):
   - Testing model performance
   - Calculating accuracy metrics
   - Saving model files

### Expected Training Times:

| Model Type | Data Size | CPU Time | GPU Time |
|------------|-----------|----------|----------|
| LSTM | 1K samples | 2-3 min | 30-60 sec |
| LSTM | 10K samples | 5-8 min | 1-2 min |
| Random Forest | 1K samples | 30-60 sec | N/A |
| Random Forest | 10K samples | 1-2 min | N/A |
| CNN | 1K samples | 1-2 min | 30-60 sec |
| CNN | 10K samples | 3-5 min | 1-2 min |

## Troubleshooting

### Common Issues:

1. **"Training failed" error**:
   - Check data format (CSV with correct columns)
   - Ensure sufficient data (at least 24 samples for time series)
   - Verify project selection

2. **Slow training**:
   - LSTM models are computationally intensive
   - Consider using Random Forest for faster results
   - Check system resources (CPU/memory usage)

3. **Memory errors**:
   - Reduce data size
   - Use Random Forest instead of LSTM
   - Close other applications to free memory

4. **GPU not detected**:
   - Install CUDA drivers if using NVIDIA GPU
   - TensorFlow will fallback to CPU automatically
   - Training will still work, just slower

### Performance Tips:

1. **For faster training**:
   - Use Random Forest instead of LSTM
   - Reduce data size for initial testing
   - Use sample data for quick validation

2. **For better accuracy**:
   - Use LSTM for complex patterns
   - Provide more training data
   - Ensure data quality and consistency

3. **For production use**:
   - Train on representative data
   - Validate model performance
   - Retrain periodically with new data

## Model Management

### Viewing Trained Models:
- Go to "Trained Models" section
- See model type, accuracy, creation date
- View training metrics and performance

### Using Trained Models:
- Navigate to Prediction pages
- Select trained model from dropdown
- Input new data for predictions

### Deleting Models:
- Click delete button next to model
- Models are permanently removed
- Free up storage space

## System Requirements

### Minimum Requirements:
- CPU: 4 cores
- RAM: 8 GB
- Storage: 10 GB free space

### Recommended Requirements:
- CPU: 8+ cores
- RAM: 16 GB
- GPU: NVIDIA with CUDA support
- Storage: 50 GB free space

### For GPU Training:
- NVIDIA GPU with 4GB+ VRAM
- CUDA 11.0+ installed
- cuDNN library installed

## Monitoring Training

### During Training:
- Watch progress bar and status messages
- Monitor system resource usage
- Don't close browser tab during training

### After Training:
- Check accuracy metrics
- Review training results
- Save or delete model as needed

## Best Practices

1. **Data Quality**:
   - Use clean, consistent data
   - Remove outliers and errors
   - Ensure proper data format

2. **Model Selection**:
   - Start with Random Forest for quick results
   - Use LSTM for complex patterns
   - Test different model types

3. **Training Strategy**:
   - Use sample data for initial testing
   - Train on representative datasets
   - Validate model performance

4. **Resource Management**:
   - Monitor system resources
   - Close unnecessary applications
   - Use appropriate model for data size

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify system requirements
3. Try with sample data first
4. Contact support with error details 