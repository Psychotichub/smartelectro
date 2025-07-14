import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import {
  ModelSelector,
  TrainingProgressMonitor,
  TrainingConfig,
  TrainingResults,
  DataUpload,
  ForecastHorizonSelector,
  TrainingProgress,
  TrainingResult
} from '../components/TrainingComponents';
import '../styles/pages/Modules.css';

interface LoadData {
  timestamp: string;
  load: number;
  temperature?: number;
  humidity?: number;
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
  accuracy_score: number;
  created_at: string;
}

const LoadForecastingTraining: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('lstm');
  const [forecastHorizon, setForecastHorizon] = useState<number>(24);
  const [trainedModels, setTrainedModels] = useState<TrainingResult[]>([]);
  const [existingModels, setExistingModels] = useState<ExistingModel[]>([]);
  const [selectedExistingModel, setSelectedExistingModel] = useState<string>('');
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  const [uploadedData, setUploadedData] = useState<LoadData[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Model options
  const modelOptions = [
    {
      value: 'lstm',
      label: 'LSTM',
      description: 'Long Short-Term Memory neural network for time series forecasting. Best for complex patterns and long-term dependencies.'
    },
    {
      value: 'random_forest',
      label: 'Random Forest',
      description: 'Ensemble method using multiple decision trees. Good for capturing non-linear relationships and feature importance.'
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
      const response = await axios.get(`${API_ENDPOINTS.loadForecasting.models}/${selectedProject}`);
      setTrainedModels(response.data.map((model: any) => ({
        model_type: model.model_type,
        accuracy: model.accuracy_score,
        training_time: 0,
        metrics: { r2_score: model.accuracy_score, mse: model.mse || 0 },
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
      const response = await axios.get(`${API_ENDPOINTS.loadForecasting.models}/${selectedProject}`);
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
      
      const response = await axios.post(API_ENDPOINTS.loadForecasting.uploadData, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const data = response.data.data;
      const loadData: LoadData[] = data.map((item: any) => ({
        timestamp: item.timestamp,
        load: item.load,
        temperature: item.temperature,
        humidity: item.humidity
      }));
      
      setUploadedData(loadData);
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
      // Generate sample data on the frontend
      const sampleData: LoadData[] = [];
      const startDate = new Date('2023-01-01');
      
      for (let i = 0; i < 24 * 30; i++) { // 30 days of hourly data
        const timestamp = new Date(startDate.getTime() + i * 60 * 60 * 1000);
        const hour = timestamp.getHours();
        const dayOfWeek = timestamp.getDay();
        
        // Create realistic load pattern
        let load = 1000; // Base load
        load += 200 * Math.sin((hour - 6) * Math.PI / 12); // Daily pattern
        load += 100 * (dayOfWeek < 5 ? 1 : 0); // Weekday/weekend pattern
        load += Math.random() * 100 - 50; // Random noise
        
        sampleData.push({
          timestamp: timestamp.toISOString(),
          load: Math.max(load, 100) // Ensure minimum load
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

    if (uploadedData.length === 0) {
      setError('Please upload data or use sample data first.');
      return;
    }

    setError('');
    setTrainingProgress({
      status: 'training',
      progress: 0,
      message: 'Initializing model training...'
    });

    try {
      // Prepare training data
      const trainingData = uploadedData.map(row => ({
        timestamp: row.timestamp,
        load: row.load
      }));

      // Update progress to show data preparation
      setTrainingProgress(prev => ({
        ...prev,
        progress: 20,
        message: 'Preparing training data...'
      }));

      // Make real API call to train model with optional incremental learning
      const requestData: any = {
        project_id: selectedProject,
        name: `Load_Forecast_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`,
        model_type: selectedModel,
        forecast_hours: forecastHorizon,
        use_sample_data: false,
        uploaded_data: trainingData
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

      const response = await axios.post(API_ENDPOINTS.loadForecasting.train, requestData);

      setTrainingProgress({
        status: 'completed',
        progress: 100,
        message: response.data.is_incremental 
          ? 'Model updated successfully with incremental learning!' 
          : 'Model trained successfully!'
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
      await axios.delete(`${API_ENDPOINTS.loadForecasting.deleteModel}/${selectedProject}/${modelId}`);
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

  const isTrainingDisabled = !selectedProject;

  return (
    <div className="electric-training-container">
      <div className="electric-header">
        <h1>📊 Load Forecasting Model Training</h1>
        <p>Train AI models to predict future power consumption based on historical load data.</p>
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
          
          <ForecastHorizonSelector
            value={forecastHorizon}
            onChange={setForecastHorizon}
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
                    {model.model_name} (Accuracy: {(model.accuracy_score * 100).toFixed(1)}%)
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
            sampleDataDescription="1000 load records with timestamp and power consumption data"
            isProcessing={loading}
          />
          
          {uploadedData.length > 0 && (
            <div className="data-summary">
              <h3>Data Summary</h3>
              <p>📊 Records: {uploadedData.length}</p>
              <p>📅 Date Range: {new Date(uploadedData[0].timestamp).toLocaleDateString()} - {new Date(uploadedData[uploadedData.length - 1].timestamp).toLocaleDateString()}</p>
              <p>⚡ Load Range: {Math.min(...uploadedData.map(d => d.load)).toFixed(1)} - {Math.max(...uploadedData.map(d => d.load)).toFixed(1)} watts</p>
            </div>
          )}
        </div>

        <div className="electric-control-section">
          <h2>Training Configuration</h2>
          <div className="training-config-info">
            <p><strong>Selected Model:</strong> {selectedModel}</p>
            <p><strong>Forecast Horizon:</strong> {forecastHorizon} hours</p>
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
            disabled={!selectedProject || uploadedData.length === 0 || trainingProgress.status === 'training'}
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

export default LoadForecastingTraining; 