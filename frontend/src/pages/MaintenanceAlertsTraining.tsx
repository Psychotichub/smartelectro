import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import {
  TrainingProgressMonitor,
  TrainingConfig,
  TrainingResults,
  DataUpload,
  AnomalyThresholdSelector,
  TrainingProgress,
  TrainingResult
} from '../components/TrainingComponents';
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

const MaintenanceAlertsTraining: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<string>('motor');
  const [anomalyThreshold, setAnomalyThreshold] = useState<number>(10);
  const [trainedModels, setTrainedModels] = useState<TrainingResult[]>([]);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  const [uploadedData, setUploadedData] = useState<SensorData[]>([]);
  const [detectedAlerts, setDetectedAlerts] = useState<MaintenanceAlert[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    fetchProjects();
  }, []);

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
      setError('Failed to load projects. Please try again.');
    }
  };

  const fetchTrainedModels = async () => {
    if (!selectedProject) return;
    
    try {
      const response = await axios.get(`${API_ENDPOINTS.maintenanceAlerts.getAlerts}/${selectedProject}`);
      
      // Transform the API response to match the TrainingResult interface
      const models: TrainingResult[] = response.data.map((alert: any) => ({
        model_id: alert.id.toString(),
        model_type: alert.alert_type || 'anomaly_detection',
        accuracy: alert.probability_score || 0,
        training_time: 0, // API doesn't provide training time
        metrics: {
          'Severity': alert.severity || 'low',
          'Probability': alert.probability_score || 0,
          'Equipment': alert.equipment_name || 'Unknown',
          'Alert Type': alert.alert_type || 'normal'
        }
      }));
      
      setTrainedModels(models);
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
      formData.append('equipment_type', selectedEquipmentType);
      
      const response = await axios.post(API_ENDPOINTS.maintenanceAlerts.uploadSensorData, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...axios.defaults.headers.common, // Preserve existing headers including Authorization
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
        equipment_type: selectedEquipmentType,
        days: 30,
        hours_per_day: 24
      });
      
      // Convert the response data to SensorData format
      const timestamps = response.data.data.timestamps;
      const sensorData = response.data.data.sensor_data;
      
      const formattedData: SensorData[] = timestamps.map((timestamp: string, index: number) => ({
        timestamp,
        equipment_id: `${selectedEquipmentType}_001`,
        equipment_type: selectedEquipmentType,
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
      setError('Failed to generate sample data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrainModel = async () => {
    if (!selectedProject) {
      setError('Please select a project first.');
      return;
    }

    if (uploadedData.length === 0) {
      setError('Please upload sensor data first.');
      return;
    }

    setError('');
    setTrainingProgress({
      status: 'training',
      progress: 0,
      message: 'Initializing anomaly detection training...'
    });

    try {
      // Prepare training data
      const trainingData = uploadedData.map(row => ({
        timestamp: row.timestamp,
        temperature: row.temperature,
        vibration: row.vibration,
        current: row.current,
        voltage: row.voltage,
        pressure: row.pressure,
        humidity: row.humidity
      }));

      // Update progress to show data preparation
      setTrainingProgress(prev => ({
        ...prev,
        progress: 20,
        message: 'Preparing sensor data for training...'
      }));

      // Make real API call to train model
      const response = await axios.post(API_ENDPOINTS.maintenanceAlerts.analyze, {
        project_id: selectedProject,
        equipment_name: `Equipment_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`,
        equipment_type: selectedEquipmentType,
        sensor_data: trainingData.reduce((acc, row) => {
          Object.keys(row).forEach(key => {
            if (key !== 'timestamp') {
              if (!acc[key]) acc[key] = [];
              acc[key].push(row[key as keyof typeof row] as number);
            }
          });
          return acc;
        }, {} as Record<string, number[]>),
        timestamps: trainingData.map(row => row.timestamp)
      });

      setTrainingProgress({
        status: 'completed',
        progress: 100,
        message: 'Anomaly detection model trained successfully!'
      });
      
      await fetchTrainedModels();
      
    } catch (error: any) {
      console.error('Error training model:', error);
      setTrainingProgress({
        status: 'error',
        progress: 0,
        message: 'Training failed. Please try again.'
      });
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (error.response?.data?.detail) {
        setError(`Training failed: ${error.response.data.detail}`);
      } else {
        setError('Failed to train model. Please try again.');
      }
    }
  };

  const handleResetTraining = () => {
    setTrainingProgress({
      status: 'idle',
      progress: 0,
      message: ''
    });
    setError('');
  };

  const handleSelectModel = (modelId: string) => {
    console.log('Selected model:', modelId);
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!selectedProject) {
      setError('Please select a project first.');
      return;
    }
    
    try {
      await axios.delete(`${API_ENDPOINTS.maintenanceAlerts.deleteModel}/${selectedProject}/${modelId}`);
      await fetchTrainedModels();
      setError('Model deleted successfully.');
    } catch (error: any) {
      console.error('Error deleting model:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError('Failed to delete model. Please try again.');
      }
    }
  };

  const isTrainingDisabled = !selectedProject || uploadedData.length === 0;

  return (
    <div className="module-page">
      <div className="electric-training-container">
        {/* Electric Header */}
        <div className="electric-header">
          <h1>⚡ Maintenance Alerts Training</h1>
          <p>Train anomaly detection models to predict equipment failures using sensor data</p>
        </div>

        <div className="electric-content">
          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Guidelines Section - TOP */}
          <div className="electric-guidelines">
            <h3>📋 Training Guidelines</h3>
            <div className="electric-guide-lines">
              <div className="electric-guide-line">
                <span className="electric-step-number">1</span>
                <span className="electric-guide-text">Select a project from the dropdown menu where you want to train your maintenance alert model</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">2</span>
                <span className="electric-guide-text">Choose the specific equipment type from available options: motor, transformer, generator, circuit breaker, compressor, or pump</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">3</span>
                <span className="electric-guide-text">Upload sensor data CSV file containing timestamp and sensor readings for your selected equipment type</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">4</span>
                <span className="electric-guide-text">Ensure CSV includes columns: timestamp, temperature, vibration, current, voltage, pressure, and humidity measurements</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">5</span>
                <span className="electric-guide-text">Use sample data option to generate 30 days of realistic sensor data for testing and demonstration purposes</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">6</span>
                <span className="electric-guide-text">Review sensor data preview showing first 5 records with all measurement parameters and timestamps</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">7</span>
                <span className="electric-guide-text">Check data statistics including equipment type, total records, and date range coverage for completeness</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">8</span>
                <span className="electric-guide-text">Configure anomaly detection threshold percentage - lower values increase sensitivity to detect subtle anomalies</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">9</span>
                <span className="electric-guide-text">Understand that default 10% threshold balances false positives with detection sensitivity for most applications</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">10</span>
                <span className="electric-guide-text">Review model information showing Isolation Forest algorithm for detecting anomalous sensor patterns</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">11</span>
                <span className="electric-guide-text">Click "Train Model" to start training with automatic feature extraction from six sensor input parameters</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">12</span>
                <span className="electric-guide-text">Monitor training progress showing completion percentage and validation against historical normal operation patterns</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">13</span>
                <span className="electric-guide-text">Wait for training completion with automatic model validation using unsupervised anomaly detection techniques</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">14</span>
                <span className="electric-guide-text">Review training results including model performance metrics and anomaly detection capabilities</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">15</span>
                <span className="electric-guide-text">View trained models in results section with equipment-specific performance indicators and creation dates</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">16</span>
                <span className="electric-guide-text">Select models for deployment to monitor real-time equipment health and predict maintenance needs</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">17</span>
                <span className="electric-guide-text">Delete underperforming models to maintain optimal anomaly detection accuracy for critical equipment</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">18</span>
                <span className="electric-guide-text">Fine-tune threshold settings based on operational requirements and acceptable false positive rates</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">19</span>
                <span className="electric-guide-text">Implement continuous learning by regularly updating models with new sensor data and maintenance records</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">20</span>
                <span className="electric-guide-text">Deploy trained models in production environment with automated alert generation and maintenance scheduling</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">21</span>
                <span className="electric-guide-text">Monitor model performance metrics and retrain periodically to maintain accuracy as equipment ages</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">22</span>
                <span className="electric-guide-text">Integrate with maintenance management systems for automated work order generation and resource planning</span>
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
              aria-label="Select project for maintenance alerts model training"
            >
              <option value="">Choose a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {!selectedProject && (
              <p className="selection-hint">Please select a project to continue with model training.</p>
            )}
          </div>

          {/* Equipment Type Selection */}
          <div className="electric-control-section">
            <h2>Equipment Type</h2>
            <select
              value={selectedEquipmentType}
              onChange={(e) => setSelectedEquipmentType(e.target.value)}
              disabled={loading || trainingProgress.status === 'training'}
              className="electric-select"
              aria-label="Select equipment type for anomaly detection"
            >
              {equipmentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="selection-hint">Different equipment types have different sensor patterns and failure modes.</p>
          </div>

          {/* Data Upload Section */}
          <div className="electric-control-section">
            <h2>Data Upload</h2>
            <div className="electric-upload-section">
              <DataUpload
                onFileUpload={handleFileUpload}
                onUseSampleData={handleUseSampleData}
                acceptedTypes=".csv"
                sampleDataDescription="30 days of sensor data (temperature, vibration, current, voltage, pressure, humidity)"
                isProcessing={loading}
              />
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
              
              {/* Data Statistics */}
              <div className="data-stats">
                <h4>Sensor Data Statistics</h4>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Equipment Type:</span>
                    <span className="stat-value">{selectedEquipmentType}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total Records:</span>
                    <span className="stat-value">{uploadedData.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Date Range:</span>
                    <span className="stat-value">
                      {new Date(uploadedData[0].timestamp).toLocaleDateString()} - {new Date(uploadedData[uploadedData.length - 1].timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Training Configuration */}
          <div className="electric-control-section">
            <h2>Training Configuration</h2>
            <div className="electric-config-grid">
              <div className="electric-config-card">
                <h3>Anomaly Detection Settings</h3>
                <AnomalyThresholdSelector
                  value={anomalyThreshold}
                  onChange={setAnomalyThreshold}
                  disabled={trainingProgress.status === 'training'}
                />
                
                <div className="training-info">
                  <h4>Model Information</h4>
                  <p><strong>Algorithm:</strong> Isolation Forest</p>
                  <p><strong>Purpose:</strong> Detect anomalous sensor patterns indicating potential equipment failure</p>
                  <p><strong>Input Features:</strong> Temperature, Vibration, Current, Voltage, Pressure, Humidity</p>
                </div>
              </div>
            </div>
            
            {isTrainingDisabled && (
              <div className="training-requirements">
                <p>⚠️ Requirements for training:</p>
                <ul>
                  <li>Select a project</li>
                  <li>Choose equipment type</li>
                  <li>Upload sensor data (CSV with timestamp and sensor readings)</li>
                  <li>Set anomaly threshold (default: 10%)</li>
                </ul>
              </div>
            )}
          </div>

          {/* Train Button */}
          <button
            onClick={handleTrainModel}
            disabled={isTrainingDisabled || trainingProgress.status === 'training'}
            className="electric-train-button"
          >
            {trainingProgress.status === 'training' ? 'Training in Progress...' : 'Train Model'}
          </button>

          {/* Training Progress */}
          {trainingProgress.status !== 'idle' && (
            <div className="electric-progress-monitor">
              <TrainingProgressMonitor
                progress={trainingProgress}
                onCancel={() => {
                  setTrainingProgress({
                    status: 'idle',
                    progress: 0,
                    message: ''
                  });
                }}
              />
            </div>
          )}

          {/* Training Results */}
          {trainedModels.length > 0 && (
            <div className="electric-control-section">
              <h2>Trained Models</h2>
              <div className="electric-config-grid">
                {trainedModels.map((model) => (
                  <div key={model.model_id} className="electric-model-card">
                    <div className="model-header">
                      <h4>{model.name || `${model.model_type} Model`}</h4>
                      <span className="electric-status normal">{model.model_type}</span>
                    </div>
                    <div className="model-metrics">
                      <div className="metric">
                        <span className="metric-label">Accuracy:</span>
                        <span className="metric-value">{(model.accuracy * 100).toFixed(1)}%</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Equipment:</span>
                        <span className="metric-value">{selectedEquipmentType}</span>
                      </div>
                    </div>
                    <div className="model-actions">
                      <button
                        onClick={() => model.model_id && handleSelectModel(model.model_id)}
                        className="select-btn"
                        title="Select model"
                        disabled={!model.model_id}
                      >
                        ✓ Select
                      </button>
                      <button
                        onClick={() => model.model_id && handleDeleteModel(model.model_id)}
                        className="delete-btn"
                        title="Delete model"
                        disabled={!model.model_id}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceAlertsTraining; 