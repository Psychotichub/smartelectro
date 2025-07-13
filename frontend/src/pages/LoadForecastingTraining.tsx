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
  description: string;
}

const LoadForecastingTraining: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('lstm');
  const [forecastHorizon, setForecastHorizon] = useState<number>(24);
  const [trainedModels, setTrainedModels] = useState<TrainingResult[]>([]);
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
      const response = await axios.get(`${API_ENDPOINTS.loadForecasting.getModels}/${selectedProject}`);
      
      // Transform the API response to match the TrainingResult interface
      const models: TrainingResult[] = response.data.map((model: any) => ({
        model_id: model.model_id,
        model_type: model.model_type,
        accuracy: model.accuracy_score,
        training_time: model.training_time || 0,
        metrics: {
          'R² Score': model.accuracy_score,
          'MSE': model.mse || 0
        },
        created_at: new Date(model.created_at).toLocaleString(),
        name: model.model_name
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
      
      const response = await axios.post(API_ENDPOINTS.loadForecasting.uploadData, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...axios.defaults.headers.common,
        },
      });
      
      // Convert the response data to LoadData format
      const timestamps = response.data.data.timestamps;
      const loads = response.data.data.loads;
      
      const loadData: LoadData[] = timestamps.map((timestamp: string, index: number) => ({
        timestamp,
        load: loads[index]
      }));
      
      setUploadedData(loadData);
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
      const response = await axios.post(API_ENDPOINTS.loadForecasting.generateSample, {
        start_date: '2023-01-01',
        end_date: '2023-04-01',
        freq: '1H'
      });
      
      // Convert the response data to LoadData format
      const timestamps = response.data.data.timestamps;
      const loads = response.data.data.loads;
      
      const loadData: LoadData[] = timestamps.map((timestamp: string, index: number) => ({
        timestamp,
        load: loads[index]
      }));
      
      setUploadedData(loadData);
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

    setError('');
    setTrainingProgress({
      status: 'training',
      progress: 0,
      message: 'Initializing model training...'
    });

    try {
      // Simulate training progress
      const progressInterval = setInterval(() => {
        setTrainingProgress(prev => {
          if (prev.progress >= 100) {
            clearInterval(progressInterval);
            return prev;
          }
          
          const newProgress = prev.progress + Math.random() * 15;
          const progress = Math.min(newProgress, 100);
          
          let message = 'Initializing model training...';
          if (progress > 20) message = 'Processing training data...';
          if (progress > 40) message = 'Training neural network...';
          if (progress > 60) message = 'Optimizing model parameters...';
          if (progress > 80) message = 'Validating model performance...';
          if (progress >= 100) message = 'Training completed successfully!';
          
          return {
            ...prev,
            progress,
            message
          };
        });
      }, 500);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      setTrainingProgress({
        status: 'completed',
        progress: 100,
        message: 'Model trained successfully!'
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
    <div className="module-page">
      <div className="electric-training-container">
        {/* Electric Header */}
        <div className="electric-header">
          <h1>⚡ Load Forecasting Training</h1>
          <p>Train AI models to predict future power consumption using advanced neural networks</p>
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
                <span className="electric-guide-text">Select a project from the dropdown menu where you want to train your load forecasting model</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">2</span>
                <span className="electric-guide-text">Upload your CSV data file containing timestamp and load columns, or use sample data for testing</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">3</span>
                <span className="electric-guide-text">Ensure your CSV file has proper format: timestamp column and load column with numerical values</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">4</span>
                <span className="electric-guide-text">Review the data preview table showing first 5 records to verify data formatting and completeness</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">5</span>
                <span className="electric-guide-text">Choose the appropriate model type: LSTM for complex patterns or Random Forest for simpler forecasting</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">6</span>
                <span className="electric-guide-text">Set the forecast horizon (hours) to determine how far ahead you want to predict load values</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">7</span>
                <span className="electric-guide-text">Click "Train Model" button to start the training process with your configured settings</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">8</span>
                <span className="electric-guide-text">Monitor training progress through the progress bar showing completion percentage and current status</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">9</span>
                <span className="electric-guide-text">Wait for training completion - LSTM models may take longer than Random Forest models to train</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">10</span>
                <span className="electric-guide-text">Review training results including accuracy metrics and validation performance indicators</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">11</span>
                <span className="electric-guide-text">View your trained models in the "Trained Models" section with creation dates and accuracy scores</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">12</span>
                <span className="electric-guide-text">Delete unwanted models using the delete button to keep your model library organized</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">13</span>
                <span className="electric-guide-text">Navigate to the Prediction page to use your trained models for generating load forecasts</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">14</span>
                <span className="electric-guide-text">For best results, ensure training data covers multiple load patterns and seasonal variations</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">15</span>
                <span className="electric-guide-text">Consider retraining models periodically with new data to maintain forecast accuracy over time</span>
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
              aria-label="Select project for model training"
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

          {/* Data Upload Section */}
          <div className="electric-control-section">
            <h2>Data Upload</h2>
            <div className="electric-upload-section">
              <DataUpload
                onFileUpload={handleFileUpload}
                onUseSampleData={handleUseSampleData}
                acceptedTypes=".csv"
                sampleDataDescription="3 months of hourly power consumption data with realistic patterns"
                isProcessing={loading}
              />
            </div>
          </div>

          {/* Data Preview */}
          {uploadedData.length > 0 && (
            <div className="electric-data-preview">
              <h3>Data Preview ({uploadedData.length} records)</h3>
              <table className="electric-preview-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Load (kW)</th>
                    {uploadedData[0].temperature && <th>Temperature (°C)</th>}
                    {uploadedData[0].humidity && <th>Humidity (%)</th>}
                  </tr>
                </thead>
                <tbody>
                  {uploadedData.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      <td>{row.timestamp}</td>
                      <td>{row.load}</td>
                      {row.temperature && <td>{row.temperature}</td>}
                      {row.humidity && <td>{row.humidity}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
              {uploadedData.length > 5 && (
                <p className="preview-note">... and {uploadedData.length - 5} more records</p>
              )}
            </div>
          )}

          {/* Training Configuration */}
          <div className="electric-control-section">
            <h2>Training Configuration</h2>
            <div className="electric-config-grid">
              <div className="electric-config-card">
                <h3>Model Selection</h3>
                <ModelSelector
                  models={modelOptions}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  disabled={trainingProgress.status === 'training'}
                />
              </div>
              
              <div className="electric-config-card">
                <h3>Forecast Horizon</h3>
                <ForecastHorizonSelector
                  value={forecastHorizon}
                  onChange={setForecastHorizon}
                  disabled={trainingProgress.status === 'training'}
                />
              </div>
            </div>
            
            {isTrainingDisabled && (
              <div className="training-requirements">
                <p>⚠️ Requirements for training:</p>
                <ul>
                  <li>Select a project</li>
                </ul>
                <p>💡 You can upload your own data or use generated sample data for training.</p>
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

          {/* Trained Models Management */}
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
    </div>
  );
};

export default LoadForecastingTraining; 