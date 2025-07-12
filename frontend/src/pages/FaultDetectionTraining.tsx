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
  description: string;
}

const FaultDetectionTraining: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('decision_tree');
  const [trainedModels, setTrainedModels] = useState<TrainingResult[]>([]);
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
      description: 'Traditional machine learning approach for fault classification. Fast training and interpretable results with feature importance analysis.'
    },
    {
      value: 'cnn',
      label: 'CNN',
      description: 'Convolutional Neural Network for advanced fault pattern recognition. Excellent for complex fault signatures and time-series data.'
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
      const response = await axios.get(`${API_ENDPOINTS.faultDetection.getModels}/${selectedProject}`);
      
      // Transform the API response to match the TrainingResult interface
      const models: TrainingResult[] = response.data.map((model: any) => ({
        model_id: model.model_id,
        model_type: model.model_type,
        accuracy: model.accuracy,
        training_time: model.training_time || 0,
        metrics: {
          'Accuracy': model.accuracy,
          'Fault Types': model.fault_types?.join(', ') || 'Unknown'
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
      
      const response = await axios.post(API_ENDPOINTS.faultDetection.uploadData, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...axios.defaults.headers.common,
        },
      });
      
      // Convert the response data to FaultData format
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
      const sampleData: FaultData[] = generateSampleFaultData();
      setUploadedData(sampleData);
      setError('');
    } catch (error: any) {
      console.error('Error generating sample data:', error);
      setError('Failed to generate sample data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateSampleFaultData = (): FaultData[] => {
    const data: FaultData[] = [];
    const faultTypes = ['Normal', 'L-G', 'L-L', 'L-L-G', '3-Phase'];
    
    for (let i = 0; i < 500; i++) {
      const faultType = faultTypes[Math.floor(Math.random() * faultTypes.length)];
      const baseVoltage = 230 + Math.random() * 20;
      const baseCurrent = 10 + Math.random() * 50;
      
      let voltage_a = baseVoltage, voltage_b = baseVoltage, voltage_c = baseVoltage;
      let current_a = baseCurrent, current_b = baseCurrent, current_c = baseCurrent;
      
      // Apply fault patterns
      switch (faultType) {
        case 'L-G':
          voltage_a *= 0.3 + Math.random() * 0.3;
          current_a *= 2 + Math.random() * 2;
          break;
        case 'L-L':
          voltage_a *= 0.5 + Math.random() * 0.3;
          voltage_b *= 0.5 + Math.random() * 0.3;
          current_a *= 1.5 + Math.random();
          current_b *= 1.5 + Math.random();
          break;
        case 'L-L-G':
          voltage_a *= 0.4 + Math.random() * 0.2;
          voltage_b *= 0.4 + Math.random() * 0.2;
          current_a *= 1.8 + Math.random();
          current_b *= 1.8 + Math.random();
          current_c *= 1.2 + Math.random() * 0.5;
          break;
        case '3-Phase':
          voltage_a *= 0.2 + Math.random() * 0.2;
          voltage_b *= 0.2 + Math.random() * 0.2;
          voltage_c *= 0.2 + Math.random() * 0.2;
          current_a *= 2.5 + Math.random();
          current_b *= 2.5 + Math.random();
          current_c *= 2.5 + Math.random();
          break;
      }
      
      data.push({
        voltage_a: Math.round(voltage_a * 10) / 10,
        voltage_b: Math.round(voltage_b * 10) / 10,
        voltage_c: Math.round(voltage_c * 10) / 10,
        current_a: Math.round(current_a * 10) / 10,
        current_b: Math.round(current_b * 10) / 10,
        current_c: Math.round(current_c * 10) / 10,
        frequency: 50 + Math.random() * 2 - 1,
        power_factor: 0.8 + Math.random() * 0.2,
        fault_type: faultType,
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString()
      });
    }
    
    return data;
  };

  const handleTrainModel = async () => {
    if (!selectedProject) {
      setError('Please select a project first.');
      return;
    }

    if (uploadedData.length === 0) {
      setError('Please upload fault data first.');
      return;
    }

    setError('');
    setTrainingProgress({
      status: 'training',
      progress: 0,
      message: 'Initializing fault detection training...'
    });

    try {
      // Simulate training progress
      const progressInterval = setInterval(() => {
        setTrainingProgress(prev => {
          if (prev.progress >= 100) {
            clearInterval(progressInterval);
            return prev;
          }
          
          const newProgress = prev.progress + Math.random() * 12;
          const progress = Math.min(newProgress, 100);
          
          let message = 'Initializing fault detection training...';
          if (progress > 15) message = 'Processing electrical data...';
          if (progress > 30) message = 'Extracting fault patterns...';
          if (progress > 50) message = 'Training classification model...';
          if (progress > 70) message = 'Optimizing fault detection accuracy...';
          if (progress > 85) message = 'Validating model performance...';
          if (progress >= 100) message = 'Fault detection model trained successfully!';
          
          return {
            ...prev,
            progress,
            message
          };
        });
      }, 600);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      setTrainingProgress({
        status: 'completed',
        progress: 100,
        message: 'Fault detection model trained successfully!'
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
    try {
      await axios.delete(`${API_ENDPOINTS.faultDetection.getDetections}/${modelId}`);
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
          <h1>⚡ Fault Detection Training</h1>
          <p>Train AI models to classify electrical faults using advanced machine learning algorithms</p>
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
                <span className="electric-guide-text">Select a project from the dropdown menu where you want to train your fault detection model</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">2</span>
                <span className="electric-guide-text">Upload labeled fault data CSV file with voltage, current measurements and fault type classifications</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">3</span>
                <span className="electric-guide-text">Ensure CSV contains columns: VA, VB, VC (voltages), IA, IB, IC (currents), and fault_type labels</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">4</span>
                <span className="electric-guide-text">Use sample data option if you don't have your own fault records - generates 500 labeled examples</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">5</span>
                <span className="electric-guide-text">Review data preview table showing voltage, current values and fault classifications for first 5 records</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">6</span>
                <span className="electric-guide-text">Check dataset statistics to ensure balanced representation of different fault types in your data</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">7</span>
                <span className="electric-guide-text">Choose model type: Decision Tree for fast interpretable results or CNN for complex pattern recognition</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">8</span>
                <span className="electric-guide-text">Decision Tree models are recommended for real-time applications requiring quick fault classification</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">9</span>
                <span className="electric-guide-text">CNN models provide higher accuracy for complex fault patterns but require more training time</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">10</span>
                <span className="electric-guide-text">Click "Train Model" button to start training process with automatic feature extraction and validation</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">11</span>
                <span className="electric-guide-text">Monitor training progress showing completion percentage, validation accuracy, and current training phase</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">12</span>
                <span className="electric-guide-text">Wait for training completion - model will be automatically validated on unseen fault data</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">13</span>
                <span className="electric-guide-text">Review training results including accuracy metrics, confusion matrix, and model performance indicators</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">14</span>
                <span className="electric-guide-text">View trained models in the management section with accuracy scores and creation timestamps</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">15</span>
                <span className="electric-guide-text">Delete underperforming models using the delete button to maintain optimal fault detection accuracy</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">16</span>
                <span className="electric-guide-text">Navigate to the Prediction page to use your trained models for real-time fault classification</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">17</span>
                <span className="electric-guide-text">Test model performance with various fault scenarios before deploying in production environment</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">18</span>
                <span className="electric-guide-text">Retrain models regularly with new fault data to maintain classification accuracy and adapt to new patterns</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">19</span>
                <span className="electric-guide-text">Consider ensemble methods combining multiple models for improved fault detection reliability</span>
              </div>
              <div className="electric-guide-line">
                <span className="electric-step-number">20</span>
                <span className="electric-guide-text">Implement continuous monitoring and automated retraining pipelines for production deployment</span>
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
              aria-label="Select project for fault detection model training"
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
                sampleDataDescription="500 labeled fault records with voltage, current, and fault type classifications"
                isProcessing={loading}
              />
            </div>
          </div>

          {/* Data Preview */}
          {uploadedData.length > 0 && (
            <div className="electric-data-preview">
              <h3>Training Data Preview ({uploadedData.length} records)</h3>
              <table className="electric-preview-table">
                <thead>
                  <tr>
                    <th>VA (V)</th>
                    <th>VB (V)</th>
                    <th>VC (V)</th>
                    <th>IA (A)</th>
                    <th>IB (A)</th>
                    <th>IC (A)</th>
                    <th>Fault Type</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadedData.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      <td>{row.voltage_a}</td>
                      <td>{row.voltage_b}</td>
                      <td>{row.voltage_c}</td>
                      <td>{row.current_a}</td>
                      <td>{row.current_b}</td>
                      <td>{row.current_c}</td>
                      <td><span className={`fault-label ${row.fault_type.toLowerCase()}`}>{row.fault_type}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {uploadedData.length > 5 && (
                <p className="preview-note">... and {uploadedData.length - 5} more records</p>
              )}
              
              {/* Data Statistics */}
              <div className="data-stats">
                <h4>Dataset Statistics</h4>
                <div className="stats-grid">
                  {Object.entries(
                    uploadedData.reduce((acc, item) => {
                      acc[item.fault_type] = (acc[item.fault_type] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([faultType, count]) => (
                    <div key={faultType} className="stat-item">
                      <span className="stat-label">{faultType}:</span>
                      <span className="stat-value">{count} samples</span>
                    </div>
                  ))}
                </div>
              </div>
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
            </div>
            
            {isTrainingDisabled && (
              <div className="training-requirements">
                <p>⚠️ Requirements for training:</p>
                <ul>
                  <li>Select a project</li>
                  <li>Upload labeled fault data (CSV format)</li>
                </ul>
                <p>💡 Use sample data if you don't have your own fault records yet.</p>
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

export default FaultDetectionTraining; 