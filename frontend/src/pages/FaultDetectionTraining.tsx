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
  TrainingResult
} from '../components/TrainingComponents';
import '../styles/pages/Modules.css';

interface FaultData {
  voltage_a: number;
  voltage_b: number;
  voltage_c: number;
  current_a: number;
  current_b: number;
  current_c: number;
  frequency: number;
  power_factor: number;
  fault_type: string;
  timestamp: string;
}

interface Project {
  id: number;
  name: string;
  description?: string;
}

interface ExistingModel {
  model_id: string;
  model_name: string;
  model_type: string;
  accuracy: number;
  fault_types: string[];
  created_at: string;
}

const FaultDetectionTraining: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('decision_tree');
  const [trainedModels, setTrainedModels] = useState<TrainingResult[]>([]);
  const [existingModels, setExistingModels] = useState<ExistingModel[]>([]);
  const [selectedExistingModel, setSelectedExistingModel] = useState<string>('');
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  const [uploadedData, setUploadedData] = useState<FaultData[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Model options
  const modelOptions = [
    {
      value: 'decision_tree',
      label: 'Decision Tree',
      description: 'Fast classification using decision rules. Good for interpretable results and quick training.'
    },
    {
      value: 'cnn',
      label: 'CNN (Convolutional Neural Network)',
      description: 'Deep learning model for complex fault patterns. Best for high accuracy but requires more training time.'
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
      const response = await axios.get(`${API_ENDPOINTS.faultDetection.models}/${selectedProject}`);
      setTrainedModels(response.data.map((model: any) => ({
        model_type: model.model_type,
        accuracy: model.accuracy,
        training_time: 0,
        metrics: { accuracy: model.accuracy },
        model_id: model.model_id,
        created_at: model.created_at,
        name: model.model_name
      })));
    } catch (error: any) {
      console.error('Error fetching trained models:', error);
    }
  };

  const fetchExistingModels = async () => {
    if (!selectedProject) return;
    
    try {
      const response = await axios.get(`${API_ENDPOINTS.faultDetection.models}/${selectedProject}`);
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
      
      const response = await axios.post(API_ENDPOINTS.faultDetection.uploadData, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const data = response.data.data;
      const faultData: FaultData[] = data.map((item: any) => ({
        voltage_a: item.voltage_a,
        voltage_b: item.voltage_b,
        voltage_c: item.voltage_c,
        current_a: item.current_a,
        current_b: item.current_b,
        current_c: item.current_c,
        frequency: item.frequency,
        power_factor: item.power_factor,
        fault_type: item.fault_type,
        timestamp: item.timestamp
      }));
      
      setUploadedData(faultData);
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
      // Generate sample fault data
      const sampleData: FaultData[] = [];
      const faultTypes = ['Normal', 'L-G', 'L-L', 'L-L-G', '3-Φ'];
      const nominalVoltage = 230;
      const ratedCurrent = 15;
      
      for (let i = 0; i < 1000; i++) {
        const faultType = faultTypes[Math.floor(Math.random() * faultTypes.length)];
        let voltageA, voltageB, voltageC, currentA, currentB, currentC, frequency, powerFactor;
        
        if (faultType === 'Normal') {
          voltageA = nominalVoltage + (Math.random() - 0.5) * 4;
          voltageB = nominalVoltage + (Math.random() - 0.5) * 4;
          voltageC = nominalVoltage + (Math.random() - 0.5) * 4;
          currentA = ratedCurrent + (Math.random() - 0.5) * 2;
          currentB = ratedCurrent + (Math.random() - 0.5) * 2;
          currentC = ratedCurrent + (Math.random() - 0.5) * 2;
          frequency = 50 + (Math.random() - 0.5) * 0.2;
          powerFactor = 0.9 + Math.random() * 0.1;
        } else if (faultType === 'L-G') {
          voltageA = (0.4 + Math.random() * 0.3) * nominalVoltage;
          voltageB = nominalVoltage + (Math.random() - 0.5) * 4;
          voltageC = nominalVoltage + (Math.random() - 0.5) * 4;
          currentA = (1.5 + Math.random() * 0.5) * ratedCurrent;
          currentB = ratedCurrent + (Math.random() - 0.5) * 2;
          currentC = ratedCurrent + (Math.random() - 0.5) * 2;
          frequency = 49.8 + (Math.random() - 0.5) * 0.4;
          powerFactor = 0.8 + Math.random() * 0.1;
        } else if (faultType === 'L-L') {
          voltageA = (0.5 + Math.random() * 0.3) * nominalVoltage;
          voltageB = (0.5 + Math.random() * 0.3) * nominalVoltage;
          voltageC = nominalVoltage + (Math.random() - 0.5) * 4;
          currentA = (1.2 + Math.random() * 0.6) * ratedCurrent;
          currentB = (1.2 + Math.random() * 0.6) * ratedCurrent;
          currentC = ratedCurrent + (Math.random() - 0.5) * 2;
          frequency = 49.7 + (Math.random() - 0.5) * 0.4;
          powerFactor = 0.75 + Math.random() * 0.1;
        } else if (faultType === 'L-L-G') {
          voltageA = (0.3 + Math.random() * 0.4) * nominalVoltage;
          voltageB = (0.3 + Math.random() * 0.4) * nominalVoltage;
          voltageC = nominalVoltage + (Math.random() - 0.5) * 4;
          currentA = (1.5 + Math.random() * 0.7) * ratedCurrent;
          currentB = (1.5 + Math.random() * 0.7) * ratedCurrent;
          currentC = ratedCurrent + (Math.random() - 0.5) * 2;
          frequency = 49.6 + (Math.random() - 0.5) * 0.6;
          powerFactor = 0.7 + Math.random() * 0.1;
        } else { // 3-Φ
          voltageA = (0.2 + Math.random() * 0.4) * nominalVoltage;
          voltageB = (0.2 + Math.random() * 0.4) * nominalVoltage;
          voltageC = (0.2 + Math.random() * 0.4) * nominalVoltage;
          currentA = (1.8 + Math.random() * 0.7) * ratedCurrent;
          currentB = (1.8 + Math.random() * 0.7) * ratedCurrent;
          currentC = (1.8 + Math.random() * 0.7) * ratedCurrent;
          frequency = 49.5 + (Math.random() - 0.5) * 0.8;
          powerFactor = 0.6 + Math.random() * 0.15;
        }
        
        sampleData.push({
          voltage_a: voltageA,
          voltage_b: voltageB,
          voltage_c: voltageC,
          current_a: currentA,
          current_b: currentB,
          current_c: currentC,
          frequency: frequency,
          power_factor: powerFactor,
          fault_type: faultType,
          timestamp: new Date(Date.now() + i * 1000).toISOString()
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
      message: 'Initializing fault detection training...'
    });

    try {
      // Update progress to show data preparation
      setTrainingProgress(prev => ({
        ...prev,
        progress: 20,
        message: 'Preparing fault detection data...'
      }));

      // Make real API call to train model with optional incremental learning
      const requestData: any = {
        project_id: selectedProject,
        name: `Fault_Detection_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`,
        model_type: selectedModel,
        use_sample_data: true
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

      const response = await axios.post(API_ENDPOINTS.faultDetection.trainModel, requestData);

      setTrainingProgress({
        status: 'completed',
        progress: 100,
        message: response.data.is_incremental 
          ? 'Fault detection model updated successfully with incremental learning!' 
          : 'Fault detection model trained successfully!'
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

  const handleDeleteModel = async (modelId: string) => {
    if (!selectedProject) {
      setError('Please select a project first.');
      return;
    }
    
    try {
      await axios.delete(`${API_ENDPOINTS.faultDetection.deleteModel}/${selectedProject}/${modelId}`);
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
    <div className="electric-training-container">
      <div className="electric-header">
        <h1>⚠️ Fault Detection Model Training</h1>
        <p>Train AI models to detect electrical faults in power systems using voltage and current data.</p>
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

        <div className="electric-control-section">
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
                .filter(model => model.model_type === selectedModel)
                .map(model => (
                  <option key={model.model_id} value={model.model_id}>
                    {model.model_name} (Accuracy: {(model.accuracy * 100).toFixed(1)}%)
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
             sampleDataDescription="1000 labeled fault records with voltage, current, and fault type classifications"
             isProcessing={loading}
           />
          
          {uploadedData.length > 0 && (
                         <div className="data-summary">
               <h3>Data Summary</h3>
               <p>📊 Records: {uploadedData.length}</p>
               <p>⚡ Fault Types: {Array.from(new Set(uploadedData.map(d => d.fault_type))).join(', ')}</p>
               <p>🔌 Voltage Range: {Math.min(...uploadedData.map(d => d.voltage_a)).toFixed(1)} - {Math.max(...uploadedData.map(d => d.voltage_a)).toFixed(1)}V</p>
               <p>⚡ Current Range: {Math.min(...uploadedData.map(d => d.current_a)).toFixed(1)} - {Math.max(...uploadedData.map(d => d.current_a)).toFixed(1)}A</p>
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
                        <span className="metric-label">Created:</span>
                        <span className="metric-value">{model.created_at}</span>
                      </div>
                    </div>
                    <div className="model-actions">
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
  );
};

export default FaultDetectionTraining; 