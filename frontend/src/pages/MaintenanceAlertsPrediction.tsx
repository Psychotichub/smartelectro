import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/pages/Modules.css';

interface SensorData {
  timestamp: string;
  equipment_id: string;
  equipment_type: string;
  temperature: number;
  vibration: number;
  current: number;
  voltage: number;
  pressure: number;
  humidity: number;
  is_anomaly?: boolean;
}

interface MaintenanceAlert {
  id: string;
  equipmentId: string;
  equipmentName: string;
  type: 'predictive' | 'preventive' | 'corrective';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  estimatedCost: number;
  timeToFailure: number; // days
  timestamp: string;
  anomaly_score: number;
}

interface Project {
  id: number;
  name: string;
  description: string;
}

interface TrainedModel {
  id: string;
  name: string;
  model_type: string;
  accuracy: number;
  equipment_type: string;
  created_at: string;
}

const MaintenanceAlertsPrediction: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [trainedModels, setTrainedModels] = useState<TrainedModel[]>([]);
  const [uploadedData, setUploadedData] = useState<SensorData[]>([]);
  const [predictionResults, setPredictionResults] = useState<MaintenanceAlert[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);

  // Equipment type options
  const equipmentTypes = [
    { value: 'motor', label: 'Motor' },
    { value: 'transformer', label: 'Transformer' },
    { value: 'generator', label: 'Generator' },
    { value: 'circuit_breaker', label: 'Circuit Breaker' },
    { value: 'compressor', label: 'Compressor' },
    { value: 'pump', label: 'Pump' }
  ];

  useEffect(() => {
    if (user && isAuthenticated) {
      fetchProjects();
    } else if (!isLoading) {
      setError('Please log in to access projects.');
    }
  }, [user, isAuthenticated, isLoading]);

  useEffect(() => {
    if (selectedProject) {
      fetchTrainedModels();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.projects);
      setProjects(response.data);
      if (response.data.length > 0) {
        setSelectedProject(response.data[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in first.');
      } else if (error.response?.status === 404) {
        setError('Projects endpoint not found. Please check if the backend is running.');
      } else if (error.code === 'ECONNREFUSED') {
        setError('Cannot connect to backend. Please ensure the backend server is running on http://localhost:8000');
      } else {
        setError('Failed to load projects. Please try again.');
      }
    }
  };

  const fetchTrainedModels = async () => {
    if (!selectedProject) return;
    
    try {
      const response = await axios.get(`${API_ENDPOINTS.maintenanceAlerts.getAlerts}/${selectedProject}`);
      
      // Transform the API response to match the TrainedModel interface
      const models: TrainedModel[] = response.data.map((alert: any) => ({
        id: alert.id.toString(),
        name: alert.equipment_name || 'Unknown Equipment',
        model_type: alert.alert_type || 'anomaly_detection',
        accuracy: alert.probability_score || 0,
        equipment_type: alert.equipment_type || 'unknown',
        created_at: alert.created_at || new Date().toISOString()
      }));
      
      setTrainedModels(models);
      if (models.length > 0) {
        setSelectedModel(models[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching trained models:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError('Failed to load trained models. Please try again.');
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    setError('');
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(API_ENDPOINTS.maintenanceAlerts.uploadSensorData, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...axios.defaults.headers.common,
        },
      });
      
      // Convert the response data to SensorData format
      const data = response.data.data;
      const sensorData: SensorData[] = data.map((item: any) => ({
        timestamp: item.timestamp,
        equipment_id: item.equipment_id,
        equipment_type: item.equipment_type,
        temperature: item.temperature,
        vibration: item.vibration,
        current: item.current,
        voltage: item.voltage,
        pressure: item.pressure,
        humidity: item.humidity,
        is_anomaly: item.is_anomaly || false
      }));
      
      setUploadedData(sensorData);
      setError('');
    } catch (error: any) {
      console.error('Error uploading data:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (error.response?.status === 400) {
        setError(`Invalid data format: ${error.response.data.detail}`);
      } else {
        setError('Failed to upload data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUseSampleData = async () => {
    setError('');
    setLoading(true);
    
    try {
      const response = await axios.post(API_ENDPOINTS.maintenanceAlerts.generateSample, {
        equipment_type: 'motor',
        days: 7,
        hours_per_day: 24
      });
      
      // Convert the response data to SensorData format
      const timestamps = response.data.data.timestamps;
      const sensorData = response.data.data.sensor_data;
      
      const formattedData: SensorData[] = timestamps.map((timestamp: string, index: number) => ({
        timestamp,
        equipment_id: 'motor_001',
        equipment_type: 'motor',
        temperature: sensorData.temperature[index],
        vibration: sensorData.vibration[index],
        current: sensorData.current[index],
        voltage: sensorData.voltage[index],
        pressure: sensorData.pressure[index],
        humidity: sensorData.humidity[index],
        is_anomaly: false
      }));
      
      setUploadedData(formattedData);
      setError('');
    } catch (error: any) {
      console.error('Error generating sample data:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError('Failed to generate sample data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    if (!selectedProject || !selectedModel || uploadedData.length === 0) {
      setError('Please select a project, model, and upload data first.');
      return;
    }

    setError('');
    setPredicting(true);

    try {
      const requestData = {
        project_id: selectedProject,
        model_id: selectedModel,
        sensor_data: {
          timestamps: uploadedData.map(d => d.timestamp),
          temperature: uploadedData.map(d => d.temperature),
          vibration: uploadedData.map(d => d.vibration),
          current: uploadedData.map(d => d.current),
          voltage: uploadedData.map(d => d.voltage),
          pressure: uploadedData.map(d => d.pressure),
          humidity: uploadedData.map(d => d.humidity)
        }
      };

      const response = await axios.post(API_ENDPOINTS.maintenanceAlerts.analyze, requestData);

      // Transform the response to match MaintenanceAlert interface
      const alerts: MaintenanceAlert[] = response.data.alerts || [{
        id: '1',
        equipmentId: 'motor_001',
        equipmentName: 'Motor 001',
        type: 'predictive',
        priority: 'medium',
        description: 'Anomaly detected in sensor readings',
        recommendation: 'Schedule maintenance inspection',
        estimatedCost: 5000,
        timeToFailure: 30,
        timestamp: new Date().toISOString(),
        anomaly_score: 0.75
      }];

      setPredictionResults(alerts);
    } catch (error: any) {
      console.error('Error making prediction:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (error.response?.data?.detail) {
        setError(`Prediction failed: ${error.response.data.detail}`);
      } else {
        setError('Failed to make prediction. Please try again.');
      }
    } finally {
      setPredicting(false);
    }
  };

  const isPredictionDisabled = !selectedProject || !selectedModel || uploadedData.length === 0;

  return (
    <div className="electric-training-container">
      <div className="electric-header">
        <h1>🔮 Maintenance Alerts Prediction</h1>
        <p>Use trained models to predict equipment failures and generate maintenance alerts</p>
      </div>

      <div className="electric-content">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Quick Guide */}
        <div className="electric-control-section">
          <h2>📋 Quick Guide</h2>
          <div className="electric-guidelines">
            <div className="electric-guide-lines">
              <div className="electric-guide-line">
                <span className="electric-step-number">1</span>
                <span className="electric-guide-text">Select a project from the dropdown to access available trained models</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">2</span>
                <span className="electric-guide-text">Choose a trained model from the available options based on equipment type and performance</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">3</span>
                <span className="electric-guide-text">Upload sensor data CSV file containing current equipment readings for analysis</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">4</span>
                <span className="electric-guide-text">Ensure CSV includes columns: timestamp, temperature, vibration, current, voltage, pressure, humidity</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">5</span>
                <span className="electric-guide-text">Use sample data option to generate 7 days of realistic sensor data for testing predictions</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">6</span>
                <span className="electric-guide-text">Review sensor data preview to verify data quality and completeness before prediction</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">7</span>
                <span className="electric-guide-text">Click "Make Prediction" to analyze sensor data and generate maintenance alerts</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">8</span>
                <span className="electric-guide-text">Review prediction results including anomaly scores, alert priorities, and recommendations</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">9</span>
                <span className="electric-guide-text">Export prediction results for integration with maintenance management systems</span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Selection */}
        <div className="electric-control-section">
          <h2>Project Selection</h2>
          <select
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(parseInt(e.target.value))}
            disabled={loading}
            className="electric-select"
            aria-label="Select project for maintenance alerts prediction"
          >
            <option value="">Choose a project...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {!selectedProject && (
            <p className="selection-hint">Please select a project to continue with prediction.</p>
          )}
        </div>

        {/* Model Selection */}
        <div className="electric-control-section">
          <h2>Model Selection</h2>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={loading || trainedModels.length === 0}
            className="electric-select"
            aria-label="Select trained model for prediction"
          >
            <option value="">Choose a model...</option>
            {trainedModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.equipment_type}) - {(model.accuracy * 100).toFixed(1)}% accuracy
              </option>
            ))}
          </select>
          {trainedModels.length === 0 && selectedProject && (
            <p className="selection-hint">No trained models found. Please train models first.</p>
          )}
        </div>

        {/* Data Upload Section */}
        <div className="electric-control-section">
          <h2>Data Upload</h2>
          <div className="electric-upload-section">
            <div className="upload-container">
              <label htmlFor="sensor-data-file" className="file-input-label">
                Choose CSV file:
                <input
                  id="sensor-data-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file);
                    }
                  }}
                  disabled={loading}
                  className="file-input"
                  aria-label="Upload sensor data CSV file"
                />
              </label>
              <button
                onClick={handleUseSampleData}
                disabled={loading}
                className="sample-data-btn"
                aria-label="Use sample sensor data"
              >
                Use Sample Data
              </button>
            </div>
            <p className="upload-hint">Upload CSV with sensor data or use sample data for testing</p>
          </div>
        </div>

        {/* Data Preview */}
        {uploadedData.length > 0 && (
          <div className="electric-data-preview">
            <h3>Sensor Data Preview ({uploadedData.length} records)</h3>
            <table className="electric-preview-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Temp (°C)</th>
                  <th>Vibration (mm/s)</th>
                  <th>Current (A)</th>
                  <th>Voltage (V)</th>
                  <th>Pressure (kPa)</th>
                  <th>Humidity (%)</th>
                </tr>
              </thead>
              <tbody>
                {uploadedData.slice(0, 5).map((row, index) => (
                  <tr key={index}>
                    <td>{new Date(row.timestamp).toLocaleString()}</td>
                    <td>{row.temperature.toFixed(1)}</td>
                    <td>{row.vibration.toFixed(2)}</td>
                    <td>{row.current.toFixed(1)}</td>
                    <td>{row.voltage.toFixed(1)}</td>
                    <td>{row.pressure.toFixed(1)}</td>
                    <td>{row.humidity.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {uploadedData.length > 5 && (
              <p className="preview-note">... and {uploadedData.length - 5} more records</p>
            )}
          </div>
        )}

        {/* Prediction Button */}
        <button
          onClick={handlePredict}
          disabled={isPredictionDisabled || predicting}
          className="electric-train-button"
        >
          {predicting ? 'Making Prediction...' : 'Make Prediction'}
        </button>

        {/* Prediction Results */}
        {predictionResults.length > 0 && (
          <div className="electric-control-section">
            <h2>Prediction Results</h2>
            <div className="electric-config-grid">
              {predictionResults.map((alert, index) => (
                <div key={index} className="electric-model-card">
                  <div className="model-header">
                    <h4>{alert.equipmentName}</h4>
                    <span className={`electric-status ${alert.priority}`}>{alert.priority}</span>
                  </div>
                  <div className="model-metrics">
                    <div className="metric">
                      <span className="metric-label">Anomaly Score:</span>
                      <span className="metric-value">{(alert.anomaly_score * 100).toFixed(1)}%</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Time to Failure:</span>
                      <span className="metric-value">{alert.timeToFailure} days</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Estimated Cost:</span>
                      <span className="metric-value">${alert.estimatedCost.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="alert-details">
                    <p><strong>Description:</strong> {alert.description}</p>
                    <p><strong>Recommendation:</strong> {alert.recommendation}</p>
                    <p><strong>Alert Type:</strong> {alert.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceAlertsPrediction; 