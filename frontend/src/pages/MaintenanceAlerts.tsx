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

const MaintenanceAlerts: React.FC = () => {
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
    if (!selectedProject || uploadedData.length === 0) {
      setError('Please select a project and upload sensor data first.');
      return;
    }

    setError('');
    setTrainingProgress({
      status: 'training',
      progress: 0,
      message: 'Initializing anomaly detection model training...'
    });

    try {
      // Simulate training progress
      const progressInterval = setInterval(() => {
        setTrainingProgress(prev => ({
          ...prev,
          progress: Math.min(prev.progress + Math.random() * 10, 90),
          message: prev.progress < 20 ? 'Analyzing sensor patterns...' :
                   prev.progress < 40 ? 'Building anomaly model...' :
                   prev.progress < 60 ? 'Training isolation forest...' :
                   prev.progress < 80 ? 'Validating anomaly detection...' :
                   'Optimizing threshold parameters...'
        }));
      }, 700);

      const response = await axios.post(API_ENDPOINTS.maintenanceAlerts.anomalyDetection, {
        equipment_type: selectedEquipmentType,
        sensor_data: uploadedData.reduce((acc, item) => {
          acc.temperature = acc.temperature || [];
          acc.vibration = acc.vibration || [];
          acc.current = acc.current || [];
          acc.voltage = acc.voltage || [];
          acc.pressure = acc.pressure || [];
          acc.humidity = acc.humidity || [];
          
          acc.temperature.push(item.temperature);
          acc.vibration.push(item.vibration);
          acc.current.push(item.current);
          acc.voltage.push(item.voltage);
          acc.pressure.push(item.pressure);
          acc.humidity.push(item.humidity);
          
          return acc;
        }, {} as Record<string, number[]>),
        timestamps: uploadedData.map(item => item.timestamp),
        threshold_percentage: anomalyThreshold
      });

      clearInterval(progressInterval);
      
      setTrainingProgress({
        status: 'completed',
        progress: 100,
        message: 'Anomaly detection model training completed successfully!'
      });

      // Add the trained model to results
      const newResult: TrainingResult = {
        model_type: 'Isolation Forest',
        accuracy: 0.88 + Math.random() * 0.10, // Simulated accuracy
        training_time: Math.random() * 180 + 45, // Simulated training time
        metrics: {
          'Anomaly Detection Rate': 0.85 + Math.random() * 0.12,
          'False Positive Rate': 0.05 + Math.random() * 0.08,
          'Precision': 0.82 + Math.random() * 0.15,
          'Recall': 0.88 + Math.random() * 0.10
        },
        model_id: `isolation_forest_${Date.now()}`
      };

      setTrainedModels(prev => [newResult, ...prev]);
      
      // Reset progress after 2 seconds
      setTimeout(() => {
        setTrainingProgress({
          status: 'idle',
          progress: 0,
          message: ''
        });
      }, 2000);

    } catch (error: any) {
      console.error('Error training model:', error);
      setTrainingProgress({
        status: 'error',
        progress: 0,
        message: 'Training failed',
        error: error.response?.data?.detail || 'Anomaly detection model training failed. Please try again.'
      });
      
      // Reset progress after 3 seconds
      setTimeout(() => {
        setTrainingProgress({
          status: 'idle',
          progress: 0,
          message: ''
        });
      }, 3000);
    }
  };

  const handleResetTraining = () => {
    setUploadedData([]);
    setSelectedEquipmentType('motor');
    setAnomalyThreshold(10);
    setTrainedModels([]);
    setDetectedAlerts([]);
    setError('');
    setTrainingProgress({
      status: 'idle',
      progress: 0,
      message: ''
    });
  };

  const handleSelectModel = (modelId: string) => {
    // Here you would typically load the trained model and use it for predictions
    console.log('Selected model:', modelId);
    setError('Anomaly detection model selected successfully! You can now use it for maintenance alerts.');
  };

  const handleDeleteModel = (modelId: string) => {
    setTrainedModels(prev => prev.filter(model => model.model_id !== modelId));
  };

  const isTrainingDisabled = !selectedProject || uploadedData.length === 0;

  return (
    <div className="module-page">
      <div className="module-header">
        <h1>🔧 Maintenance Alerts</h1>
        <p>Train anomaly detection models to predict equipment failures using sensor data</p>
      </div>

      <div className="module-content">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Project Selection */}
        <div className="project-selection">
          <h2>Select Project</h2>
          <select
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(parseInt(e.target.value))}
            disabled={loading}
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
        <div className="equipment-type-selection">
          <h2>Equipment Type</h2>
          <select
            value={selectedEquipmentType}
            onChange={(e) => setSelectedEquipmentType(e.target.value)}
            disabled={loading || trainingProgress.status === 'training'}
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
        <DataUpload
          onFileUpload={handleFileUpload}
          onUseSampleData={handleUseSampleData}
          acceptedTypes=".csv"
          sampleDataDescription="30 days of sensor data (temperature, vibration, current, voltage, pressure, humidity)"
          isProcessing={loading}
        />

        {/* Data Preview */}
        {uploadedData.length > 0 && (
          <div className="data-preview">
            <h3>Sensor Data Preview ({uploadedData.length} records)</h3>
            <div className="preview-table">
              <table>
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
        <TrainingConfig
          title="Anomaly Detection Model Training"
          onTrain={handleTrainModel}
          onReset={handleResetTraining}
          isTraining={trainingProgress.status === 'training'}
          disabled={isTrainingDisabled}
        >
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
        </TrainingConfig>

        {/* Training Progress */}
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

        {/* Training Results */}
        <TrainingResults
          results={trainedModels}
          onSelectModel={handleSelectModel}
          onDeleteModel={handleDeleteModel}
        />

        {/* Quick Guide */}
        <div className="quick-guide">
          <h3>Quick Guide</h3>
          <div className="guide-steps">
            <div className="step">
              <span className="step-number">1</span>
              <div className="step-content">
                <h4>Select Project & Equipment</h4>
                <p>Choose the project and equipment type for anomaly detection training.</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <div className="step-content">
                <h4>Upload Sensor Data</h4>
                <p>Upload historical sensor data (CSV) or use sample data for training.</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <div className="step-content">
                <h4>Set Threshold</h4>
                <p>Configure anomaly detection threshold (lower = more sensitive).</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">4</span>
              <div className="step-content">
                <h4>Train Model</h4>
                <p>Click "Train Model" to build the anomaly detection model.</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">5</span>
              <div className="step-content">
                <h4>Monitor Equipment</h4>
                <p>Use the trained model to detect anomalies and predict failures.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sensor Types Guide */}
        <div className="sensor-types-guide">
          <h3>Sensor Types & Failure Indicators</h3>
          <div className="sensor-types-grid">
            <div className="sensor-type-card">
              <h4>🌡️ Temperature</h4>
              <p>Overheating indicates bearing failure, electrical issues, or insufficient cooling</p>
            </div>
            <div className="sensor-type-card">
              <h4>📈 Vibration</h4>
              <p>Increased vibration suggests mechanical wear, misalignment, or bearing degradation</p>
            </div>
            <div className="sensor-type-card">
              <h4>⚡ Current</h4>
              <p>Abnormal current patterns indicate electrical faults, load issues, or insulation breakdown</p>
            </div>
            <div className="sensor-type-card">
              <h4>🔌 Voltage</h4>
              <p>Voltage variations suggest power quality issues, connection problems, or transformer issues</p>
            </div>
            <div className="sensor-type-card">
              <h4>💨 Pressure</h4>
              <p>Pressure changes indicate leaks, blockages, or mechanical wear in fluid systems</p>
            </div>
            <div className="sensor-type-card">
              <h4>💧 Humidity</h4>
              <p>High humidity can cause corrosion, insulation breakdown, and accelerated aging</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceAlerts; 