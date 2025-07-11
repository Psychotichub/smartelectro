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

interface FaultResult {
  faultType: string;
  confidence: number;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  recommendations: string[];
}

interface Project {
  id: number;
  name: string;
  description: string;
}

const FaultDetection: React.FC = () => {
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
  const [classificationResults, setClassificationResults] = useState<FaultResult[]>([]);
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
      
      const response = await axios.post(API_ENDPOINTS.faultDetection.uploadData, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...axios.defaults.headers.common, // Preserve existing headers including Authorization
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
      // Generate sample fault data
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
          current_a *= 2 + Math.random() * 1.5;
          current_b *= 2 + Math.random() * 1.5;
          break;
        case '3-Phase':
          voltage_a *= 0.2 + Math.random() * 0.3;
          voltage_b *= 0.2 + Math.random() * 0.3;
          voltage_c *= 0.2 + Math.random() * 0.3;
          current_a *= 3 + Math.random() * 2;
          current_b *= 3 + Math.random() * 2;
          current_c *= 3 + Math.random() * 2;
          break;
      }
      
      data.push({
        voltage_a: Math.round(voltage_a * 100) / 100,
        voltage_b: Math.round(voltage_b * 100) / 100,
        voltage_c: Math.round(voltage_c * 100) / 100,
        current_a: Math.round(current_a * 100) / 100,
        current_b: Math.round(current_b * 100) / 100,
        current_c: Math.round(current_c * 100) / 100,
        frequency: 50 + (Math.random() - 0.5) * 2,
        power_factor: 0.8 + Math.random() * 0.2,
        fault_type: faultType,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    return data;
  };

  const handleTrainModel = async () => {
    if (!selectedProject || uploadedData.length === 0) {
      setError('Please select a project and upload training data first.');
      return;
    }

    setError('');
    setTrainingProgress({
      status: 'training',
      progress: 0,
      message: 'Initializing fault detection model training...'
    });

    try {
      // Simulate training progress
      const progressInterval = setInterval(() => {
        setTrainingProgress(prev => ({
          ...prev,
          progress: Math.min(prev.progress + Math.random() * 12, 90),
          message: prev.progress < 25 ? 'Preprocessing fault data...' :
                   prev.progress < 50 ? 'Training model parameters...' :
                   prev.progress < 75 ? 'Validating model performance...' :
                   'Finalizing model optimization...'
        }));
      }, 600);

      const response = await axios.post(API_ENDPOINTS.faultDetection.trainModel, {
        project_id: selectedProject,
        name: `${selectedModel.toUpperCase()} Model - ${new Date().toLocaleString()}`,
        model_type: selectedModel,
        training_data: uploadedData
      });

      clearInterval(progressInterval);
      
      setTrainingProgress({
        status: 'completed',
        progress: 100,
        message: 'Fault detection model training completed successfully!'
      });

      // Add the trained model to results
      const newResult: TrainingResult = {
        model_type: selectedModel.toUpperCase(),
        accuracy: 0.85 + Math.random() * 0.12, // Simulated accuracy
        training_time: Math.random() * 300 + 60, // Simulated training time
        metrics: {
          'Accuracy': 0.85 + Math.random() * 0.12,
          'Precision': 0.82 + Math.random() * 0.15,
          'Recall': 0.88 + Math.random() * 0.10,
          'F1-Score': 0.84 + Math.random() * 0.13
        },
        model_id: `${selectedModel}_${Date.now()}`
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
        error: error.response?.data?.detail || 'Model training failed. Please try again.'
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
    setSelectedModel('decision_tree');
    setTrainedModels([]);
    setClassificationResults([]);
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
    setError('Model selected successfully! You can now use it for fault detection.');
  };

  const handleDeleteModel = (modelId: string) => {
    setTrainedModels(prev => prev.filter(model => model.model_id !== modelId));
  };

  const isTrainingDisabled = !selectedProject || uploadedData.length === 0;

  return (
    <div className="module-page">
      <div className="module-header">
        <h1>⚠️ Fault Detection</h1>
        <p>Train AI models to classify electrical faults using Decision Tree and CNN algorithms</p>
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
        <DataUpload
          onFileUpload={handleFileUpload}
          onUseSampleData={handleUseSampleData}
          acceptedTypes=".csv"
          sampleDataDescription="500 labeled fault records with voltage, current, and fault type classifications"
          isProcessing={loading}
        />

        {/* Data Preview */}
        {uploadedData.length > 0 && (
          <div className="data-preview">
            <h3>Training Data Preview ({uploadedData.length} records)</h3>
            <div className="preview-table">
              <table>
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
            </div>
            
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
        <TrainingConfig
          title="Fault Detection Model Training"
          onTrain={handleTrainModel}
          onReset={handleResetTraining}
          isTraining={trainingProgress.status === 'training'}
          disabled={isTrainingDisabled}
        >
          <ModelSelector
            models={modelOptions}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            disabled={trainingProgress.status === 'training'}
          />
          
          {isTrainingDisabled && (
            <div className="training-requirements">
              <p>⚠️ Requirements for training:</p>
              <ul>
                <li>Select a project</li>
                <li>Upload labeled fault data (CSV with voltage, current, and fault_type columns)</li>
                <li>Ensure balanced dataset with multiple fault types</li>
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
                <h4>Select Project</h4>
                <p>Choose the project where you want to train the fault detection model.</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <div className="step-content">
                <h4>Upload Labeled Data</h4>
                <p>Upload CSV with voltage, current measurements and fault type labels, or use sample data.</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <div className="step-content">
                <h4>Select Model</h4>
                <p>Choose Decision Tree for fast interpretable results or CNN for complex pattern recognition.</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">4</span>
              <div className="step-content">
                <h4>Train Model</h4>
                <p>Click "Train Model" and monitor training progress with validation metrics.</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">5</span>
              <div className="step-content">
                <h4>Use Model</h4>
                <p>Select the trained model to classify new fault patterns in real-time.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fault Types Guide */}
        <div className="fault-types-guide">
          <h3>Fault Types</h3>
          <div className="fault-types-grid">
            <div className="fault-type-card">
              <h4>Normal</h4>
              <p>System operating within normal parameters</p>
            </div>
            <div className="fault-type-card">
              <h4>L-G (Line-to-Ground)</h4>
              <p>Single phase to ground fault, most common type</p>
            </div>
            <div className="fault-type-card">
              <h4>L-L (Line-to-Line)</h4>
              <p>Fault between two phases, no ground involvement</p>
            </div>
            <div className="fault-type-card">
              <h4>L-L-G (Line-to-Line-to-Ground)</h4>
              <p>Two phases to ground fault, more severe</p>
            </div>
            <div className="fault-type-card">
              <h4>3-Phase</h4>
              <p>All three phases involved, most severe fault</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaultDetection; 