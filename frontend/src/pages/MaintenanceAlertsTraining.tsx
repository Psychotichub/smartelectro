import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import {
  ModelSelector,
  TrainingProgressMonitor,
  TrainingConfig,
  DataUpload,
  TrainingProgress,
  TrainingResult,
  TrainingResults
} from '../components/TrainingComponents';
import '../styles/pages/Modules.css';

interface SensorData {
  temperature: number;
  voltage: number;
  current: number;
  vibration: number;
  timestamp: string;
}

interface Project {
  id: number;
  name: string;
  description?: string;
}

interface ExistingModel {
  model_id: string;
  equipment_name: string;
  equipment_type: string;
  total_anomalies: number;
  anomaly_rate: number;
  created_at: string;
}

const MaintenanceAlertsTraining: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('isolation_forest');
  const [trainedModels, setTrainedModels] = useState<TrainingResult[]>([]);
  const [existingModels, setExistingModels] = useState<ExistingModel[]>([]);
  const [selectedExistingModel, setSelectedExistingModel] = useState<string>('');
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  const [uploadedData, setUploadedData] = useState<SensorData[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Model options
  const modelOptions = [
    {
      value: 'isolation_forest',
      label: 'Isolation Forest',
      description: 'Anomaly detection using isolation forest algorithm. Good for detecting equipment faults and unusual patterns.'
    }
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchTrainedModels();
      fetchExistingModels();
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
      setTrainedModels(response.data.map((model: any) => ({
        model_type: model.model_type || 'isolation_forest',
        accuracy: model.health_score / 100 || 0,
        training_time: 0,
        metrics: { 
          health_score: model.health_score || 0,
          anomalies: model.total_anomalies || 0
        },
        model_id: model.model_id,
        created_at: model.created_at,
        name: model.equipment_name
      })));
    } catch (error: any) {
      console.error('Error fetching trained models:', error);
    }
  };

  const fetchExistingModels = async () => {
    if (!selectedProject) return;
    
    try {
      const response = await axios.get(`${API_ENDPOINTS.maintenanceAlerts.getAlerts}/${selectedProject}`);
      setExistingModels(response.data);
    } catch (error: any) {
      console.error('Error fetching existing models:', error);
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
        },
      });
      
      const data = response.data.data;
      const sensorData: SensorData[] = data.map((item: any) => ({
        temperature: item.temperature,
        voltage: item.voltage,
        current: item.current,
        vibration: item.vibration,
        timestamp: item.timestamp
      }));
      
      setUploadedData(sensorData);
      setError('');
    } catch (error: any) {
      console.error('Error uploading data:', error);
      setError('Failed to upload data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseSampleData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Generate sample sensor data
      const sampleData: SensorData[] = [];
      const equipmentTypes = ['motor', 'transformer', 'generator'];
      
      for (let i = 0; i < 720; i++) { // 30 days * 24 hours
        const equipmentType = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
        const timestamp = new Date(Date.now() - (720 - i) * 3600000).toISOString();
        
        let temperature, voltage, current, vibration;
        
        // Generate realistic sensor data with occasional anomalies
        const isAnomaly = Math.random() < 0.05; // 5% chance of anomaly
        
        if (equipmentType === 'motor') {
          temperature = isAnomaly ? 85 + Math.random() * 15 : 40 + Math.random() * 30;
          voltage = isAnomaly ? 450 + Math.random() * 50 : 380 + Math.random() * 40;
          current = isAnomaly ? 120 + Math.random() * 30 : 10 + Math.random() * 20;
          vibration = isAnomaly ? 15 + Math.random() * 10 : 2 + Math.random() * 8;
        } else if (equipmentType === 'transformer') {
          temperature = isAnomaly ? 85 + Math.random() * 15 : 30 + Math.random() * 40;
          voltage = isAnomaly ? 450 + Math.random() * 50 : 380 + Math.random() * 40;
          current = isAnomaly ? 110 + Math.random() * 20 : 20 + Math.random() * 80;
          vibration = 1 + Math.random() * 3;
        } else { // generator
          temperature = isAnomaly ? 100 + Math.random() * 20 : 50 + Math.random() * 35;
          voltage = isAnomaly ? 450 + Math.random() * 50 : 380 + Math.random() * 40;
          current = isAnomaly ? 130 + Math.random() * 30 : 30 + Math.random() * 70;
          vibration = isAnomaly ? 12 + Math.random() * 8 : 3 + Math.random() * 7;
        }
        
        sampleData.push({
          temperature: Math.round(temperature * 10) / 10,
          voltage: Math.round(voltage * 10) / 10,
          current: Math.round(current * 10) / 10,
          vibration: Math.round(vibration * 10) / 10,
          timestamp: timestamp
        });
      }
      
      setUploadedData(sampleData);
    } catch (error: any) {
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

    setError('');
    setTrainingProgress({
      status: 'training',
      progress: 0,
      message: 'Initializing maintenance alerts training...'
    });

    try {
      // Update progress to show data preparation
      setTrainingProgress(prev => ({
        ...prev,
        progress: 20,
        message: 'Preparing sensor data for analysis...'
      }));

      // Make real API call to train model with optional incremental learning
      const requestData: any = {
        project_id: selectedProject,
        equipment_name: `Equipment_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`,
        equipment_type: 'motor',
        sensor_data: {
          temperature: uploadedData.map(d => d.temperature),
          voltage: uploadedData.map(d => d.voltage),
          current: uploadedData.map(d => d.current),
          vibration: uploadedData.map(d => d.vibration)
        },
        timestamps: uploadedData.map(d => d.timestamp)
      };

      // Add existing model name if selected for incremental learning
      if (selectedExistingModel) {
        requestData.existing_model_name = selectedExistingModel;
        setTrainingProgress(prev => ({
          ...prev,
          progress: 30,
          message: 'Loading existing model for incremental learning...'
        }));
      }

      const response = await axios.post(API_ENDPOINTS.maintenanceAlerts.analyze, requestData);

      setTrainingProgress({
        status: 'completed',
        progress: 100,
        message: response.data.is_incremental 
          ? 'Maintenance alerts model updated successfully with incremental learning!' 
          : 'Maintenance alerts model trained successfully!'
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
    setSelectedExistingModel('');
  };

  return (
    <div className="electric-training-container">
      <div className="electric-header">
        <h1>🔧 Maintenance Alerts Model Training</h1>
        <p>Train AI models to detect equipment anomalies and predict maintenance needs using sensor data.</p>
      </div>

      <div className="electric-content">
        <div className="electric-control-section">
          <h2>Project Selection</h2>
          <select
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(Number(e.target.value))}
            className="form-select"
            aria-label="Select project for model training"
          >
            <option value="">Select a project</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="electric-control-section">
          <h2>Model Configuration</h2>
          <ModelSelector
            models={modelOptions}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>

        <div className="training-section">
          <h2>Incremental Learning (Optional)</h2>
          <div className="incremental-learning-section">
            <p className="section-description">
              Select an existing model to continue training with new data instead of creating a new model.
            </p>
            <select
              value={selectedExistingModel}
              onChange={(e) => setSelectedExistingModel(e.target.value)}
              className="form-select"
              aria-label="Select existing model for incremental learning"
            >
              <option value="">Create new model</option>
              {existingModels
                .filter(model => model.equipment_type === 'motor')
                .map(model => (
                  <option key={model.model_id} value={model.model_id}>
                    {model.equipment_name} (Health: {model.anomaly_rate.toFixed(1)}%)
                  </option>
                ))}
            </select>
            {selectedExistingModel && (
              <div className="incremental-info">
                <p>✅ Will continue training on existing model</p>
                <p>📊 New data will be added to improve the model</p>
                <p>⏱️ Training will be faster than creating a new model</p>
              </div>
            )}
          </div>
        </div>

        <div className="electric-control-section">
          <h2>Data Preparation</h2>
          <DataUpload
            onFileUpload={handleFileUpload}
            onUseSampleData={handleUseSampleData}
            acceptedTypes=".csv"
            sampleDataDescription="720 sensor readings (30 days) with temperature, voltage, current, and vibration data"
            isProcessing={loading}
          />
          
          {uploadedData.length > 0 && (
            <div className="data-summary">
              <h3>Data Summary</h3>
              <p>📊 Records: {uploadedData.length}</p>
              <p>🌡️ Temperature Range: {Math.min(...uploadedData.map(d => d.temperature)).toFixed(1)} - {Math.max(...uploadedData.map(d => d.temperature)).toFixed(1)}°C</p>
              <p>⚡ Voltage Range: {Math.min(...uploadedData.map(d => d.voltage)).toFixed(1)} - {Math.max(...uploadedData.map(d => d.voltage)).toFixed(1)}V</p>
              <p>🔌 Current Range: {Math.min(...uploadedData.map(d => d.current)).toFixed(1)} - {Math.max(...uploadedData.map(d => d.current)).toFixed(1)}A</p>
              <p>📈 Vibration Range: {Math.min(...uploadedData.map(d => d.vibration)).toFixed(1)} - {Math.max(...uploadedData.map(d => d.vibration)).toFixed(1)}mm/s</p>
            </div>
          )}
        </div>

        <div className="electric-control-section">
          <h2>Training Configuration</h2>
          <div className="training-config-info">
            <p><strong>Selected Model:</strong> {selectedModel}</p>
            <p><strong>Data Size:</strong> {uploadedData.length} records</p>
            <p><strong>Training Mode:</strong> {selectedExistingModel ? 'Incremental Learning' : 'New Model'}</p>
            {selectedExistingModel && (
              <div className="incremental-info">
                <p>✅ Will continue training on existing model</p>
                <p>📊 New data will be added to improve the model</p>
                <p>⏱️ Training will be faster than creating a new model</p>
              </div>
            )}
          </div>
        </div>

        <div className="electric-control-section">
          <h2>Start Training</h2>
          <button
            onClick={handleTrainModel}
            disabled={!selectedProject || trainingProgress.status === 'training'}
            className="btn btn-primary btn-large"
          >
            {selectedExistingModel ? 'Continue Training Model' : 'Train New Model'}
          </button>
          
          {trainingProgress.status !== 'idle' && (
            <button
              onClick={handleResetTraining}
              className="btn btn-secondary btn-reset"
            >
              Reset
            </button>
          )}
        </div>

        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
          </div>
        )}

        <TrainingProgressMonitor progress={trainingProgress} />

                         {trainedModels.length > 0 && (
          <div className="electric-control-section">
            <h2>Trained Models</h2>
             <TrainingResults results={trainedModels} />
           </div>
         )}
      </div>
    </div>
  );
};

export default MaintenanceAlertsTraining; 