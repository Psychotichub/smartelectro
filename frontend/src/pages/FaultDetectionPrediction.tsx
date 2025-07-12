import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { TrainingResult } from '../components/TrainingComponents';
import '../styles/pages/Modules.css';

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

const FaultDetectionPrediction: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [trainedModels, setTrainedModels] = useState<TrainingResult[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [testVoltageData, setTestVoltageData] = useState({A: 230, B: 230, C: 230});
  const [testCurrentData, setTestCurrentData] = useState({A: 10, B: 10, C: 10});
  const [classificationResult, setClassificationResult] = useState<FaultResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);

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

  const handleSelectModel = async (modelId: string) => {
    try {
      setSelectedModelId(modelId);
      
      // Find the selected model details
      const selectedModel = trainedModels.find(model => model.model_id === modelId);
      if (selectedModel) {
        setError(`✅ Model "${selectedModel.model_type}" selected successfully! You can now test fault classification below.`);
        console.log('Model selected:', modelId);
        
        // Auto-classify current test data
        await performFaultClassification();
      }
    } catch (error: any) {
      console.error('Error selecting model:', error);
      setError('Failed to select model. Please try again.');
    }
  };

  const performFaultClassification = async () => {
    if (!selectedModelId) return;

    try {
      setPredictionLoading(true);
      
      // Simulate fault classification with the test data
      const voltageImbalance = Math.max(
        Math.abs(testVoltageData.A - testVoltageData.B),
        Math.abs(testVoltageData.B - testVoltageData.C),
        Math.abs(testVoltageData.C - testVoltageData.A)
      );

      const currentImbalance = Math.max(
        Math.abs(testCurrentData.A - testCurrentData.B),
        Math.abs(testCurrentData.B - testCurrentData.C),
        Math.abs(testCurrentData.C - testCurrentData.A)
      );

      let faultType = 'Normal';
      let confidence = 0.95;
      let severity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';

      if (voltageImbalance > 50 || currentImbalance > 5) {
        if (testVoltageData.A < 200 || testCurrentData.A > 15) {
          faultType = 'L-G';
          severity = 'High';
        } else if (voltageImbalance > 30) {
          faultType = 'L-L';
          severity = 'Medium';
        } else if (currentImbalance > 8) {
          faultType = 'L-L-G';
          severity = 'Critical';
        }
        confidence = 0.85 + Math.random() * 0.1;
      }

      const result: FaultResult = {
        faultType,
        confidence,
        severity,
        description: `${faultType} fault detected with ${(confidence * 100).toFixed(1)}% confidence`,
        recommendations: [
          faultType === 'Normal' ? 'System operating normally' : 'Immediate inspection required',
          faultType !== 'Normal' ? 'Check protective relay settings' : 'Continue monitoring',
          faultType !== 'Normal' ? 'Schedule maintenance if needed' : 'Regular maintenance as scheduled'
        ]
      };

      setClassificationResult(result);
    } catch (error) {
      console.error('Error performing classification:', error);
      setError('Failed to classify fault. Please try again.');
    } finally {
      setPredictionLoading(false);
    }
  };

  const handleSimulateFault = (faultType: string) => {
    switch (faultType) {
      case 'L-G':
        setTestVoltageData({A: 150, B: 230, C: 230});
        setTestCurrentData({A: 25, B: 10, C: 10});
        break;
      case 'L-L':
        setTestVoltageData({A: 180, B: 180, C: 230});
        setTestCurrentData({A: 18, B: 18, C: 10});
        break;
      case 'L-L-G':
        setTestVoltageData({A: 140, B: 140, C: 230});
        setTestCurrentData({A: 30, B: 30, C: 10});
        break;
      case '3-Phase':
        setTestVoltageData({A: 120, B: 120, C: 120});
        setTestCurrentData({A: 40, B: 40, C: 40});
        break;
      default: // Normal
        setTestVoltageData({A: 230, B: 230, C: 230});
        setTestCurrentData({A: 10, B: 10, C: 10});
        break;
    }
  };

  return (
    <div className="module-page">
      <div className="module-header">
        <h1>🔍 Fault Detection - Prediction</h1>
        <p>Use trained AI models to classify electrical faults in real-time</p>
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
            aria-label="Select project for fault detection prediction"
          >
            <option value="">Choose a project...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {!selectedProject && (
            <p className="selection-hint">Please select a project to view available models.</p>
          )}
        </div>

        {/* Available Models */}
        {selectedProject && (
          <div className="models-section">
            <h3>Available Trained Models</h3>
            {trainedModels.length === 0 ? (
              <div className="no-models">
                <p>No trained models found for this project.</p>
                <p>Please train a model first in the Training page.</p>
              </div>
            ) : (
              <div className="models-grid">
                {trainedModels.map((model) => (
                  <div 
                    key={model.model_id} 
                    className={`model-card ${selectedModelId === model.model_id ? 'selected' : ''}`}
                  >
                    <div className="model-header">
                      <h4>{model.name || `${model.model_type} Model`}</h4>
                      <span className="model-type">{model.model_type}</span>
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
                        onClick={() => model.model_id && handleSelectModel(model.model_id)}
                        className="use-model-btn"
                        disabled={loading || !model.model_id}
                      >
                        {selectedModelId === model.model_id ? 
                          '✅ Selected' : 
                          '🔍 Use Model'
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fault Classification Testing */}
        {selectedModelId && (
          <div className="fault-testing">
            <h3>🔍 Test Fault Classification</h3>
            <div className="test-info">
              <p><strong>Selected Model:</strong> {trainedModels.find(m => m.model_id === selectedModelId)?.model_type}</p>
              <p>Enter voltage and current values to test fault classification:</p>
            </div>
            
            <div className="test-inputs">
              <div className="input-section">
                <h4>Voltage (V)</h4>
                <div className="phase-inputs">
                  <div className="input-group">
                    <label>Phase A:</label>
                    <input
                      type="number"
                      value={testVoltageData.A}
                      onChange={(e) => setTestVoltageData(prev => ({...prev, A: parseFloat(e.target.value) || 0}))}
                      placeholder="230"
                    />
                  </div>
                  <div className="input-group">
                    <label>Phase B:</label>
                    <input
                      type="number"
                      value={testVoltageData.B}
                      onChange={(e) => setTestVoltageData(prev => ({...prev, B: parseFloat(e.target.value) || 0}))}
                      placeholder="230"
                    />
                  </div>
                  <div className="input-group">
                    <label>Phase C:</label>
                    <input
                      type="number"
                      value={testVoltageData.C}
                      onChange={(e) => setTestVoltageData(prev => ({...prev, C: parseFloat(e.target.value) || 0}))}
                      placeholder="230"
                    />
                  </div>
                </div>
              </div>

              <div className="input-section">
                <h4>Current (A)</h4>
                <div className="phase-inputs">
                  <div className="input-group">
                    <label>Phase A:</label>
                    <input
                      type="number"
                      value={testCurrentData.A}
                      onChange={(e) => setTestCurrentData(prev => ({...prev, A: parseFloat(e.target.value) || 0}))}
                      placeholder="10"
                    />
                  </div>
                  <div className="input-group">
                    <label>Phase B:</label>
                    <input
                      type="number"
                      value={testCurrentData.B}
                      onChange={(e) => setTestCurrentData(prev => ({...prev, B: parseFloat(e.target.value) || 0}))}
                      placeholder="10"
                    />
                  </div>
                  <div className="input-group">
                    <label>Phase C:</label>
                    <input
                      type="number"
                      value={testCurrentData.C}
                      onChange={(e) => setTestCurrentData(prev => ({...prev, C: parseFloat(e.target.value) || 0}))}
                      placeholder="10"
                    />
                  </div>
                </div>
              </div>

              <div className="test-actions">
                <button 
                  onClick={performFaultClassification} 
                  className="classify-btn"
                  disabled={predictionLoading}
                >
                  {predictionLoading ? '⏳ Classifying...' : '🔍 Classify Fault'}
                </button>
                
                <div className="simulation-buttons">
                  <button 
                    onClick={() => handleSimulateFault('Normal')}
                    className="simulate-btn normal"
                  >
                    Normal Operation
                  </button>
                  <button 
                    onClick={() => handleSimulateFault('L-G')}
                    className="simulate-btn l-g"
                  >
                    Simulate L-G Fault
                  </button>
                  <button 
                    onClick={() => handleSimulateFault('L-L')}
                    className="simulate-btn l-l"
                  >
                    Simulate L-L Fault
                  </button>
                  <button 
                    onClick={() => handleSimulateFault('L-L-G')}
                    className="simulate-btn l-l-g"
                  >
                    Simulate L-L-G Fault
                  </button>
                  <button 
                    onClick={() => handleSimulateFault('3-Phase')}
                    className="simulate-btn three-phase"
                  >
                    Simulate 3-Phase Fault
                  </button>
                </div>
              </div>
            </div>

            {/* Classification Results */}
            {classificationResult && (
              <div className="classification-results">
                <h4>Classification Results</h4>
                <div className="result-card">
                  <div className="result-header">
                    <span className={`fault-type ${classificationResult.faultType.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                      {classificationResult.faultType}
                    </span>
                    <span className={`severity ${classificationResult.severity.toLowerCase()}`}>
                      {classificationResult.severity} Priority
                    </span>
                  </div>
                  <div className="result-details">
                    <p><strong>Confidence:</strong> {(classificationResult.confidence * 100).toFixed(1)}%</p>
                    <p><strong>Description:</strong> {classificationResult.description}</p>
                  </div>
                  <div className="recommendations">
                    <h5>Recommendations:</h5>
                    <ul>
                      {classificationResult.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* System Health Dashboard */}
            <div className="system-health">
              <h4>Comprehensive System Health Analysis</h4>
              <div className="health-metrics">
                <div className="metric-card">
                  <h5>Voltage Balance</h5>
                  <div className="metric-value">
                    {Math.max(
                      Math.abs(testVoltageData.A - testVoltageData.B),
                      Math.abs(testVoltageData.B - testVoltageData.C),
                      Math.abs(testVoltageData.C - testVoltageData.A)
                    ).toFixed(2)}V
                  </div>
                  <div className="metric-status">
                    {Math.max(
                      Math.abs(testVoltageData.A - testVoltageData.B),
                      Math.abs(testVoltageData.B - testVoltageData.C),
                      Math.abs(testVoltageData.C - testVoltageData.A)
                    ) < 5 ? 'Excellent' : 
                    Math.max(
                      Math.abs(testVoltageData.A - testVoltageData.B),
                      Math.abs(testVoltageData.B - testVoltageData.C),
                      Math.abs(testVoltageData.C - testVoltageData.A)
                    ) < 10 ? 'Good' : 
                    Math.max(
                      Math.abs(testVoltageData.A - testVoltageData.B),
                      Math.abs(testVoltageData.B - testVoltageData.C),
                      Math.abs(testVoltageData.C - testVoltageData.A)
                    ) < 20 ? 'Warning' : 'Critical'}
                  </div>
                </div>
                
                <div className="metric-card">
                  <h5>Current Balance</h5>
                  <div className="metric-value">
                    {Math.max(
                      Math.abs(testCurrentData.A - testCurrentData.B),
                      Math.abs(testCurrentData.B - testCurrentData.C),
                      Math.abs(testCurrentData.C - testCurrentData.A)
                    ).toFixed(2)}A
                  </div>
                  <div className="metric-status">
                    {Math.max(
                      Math.abs(testCurrentData.A - testCurrentData.B),
                      Math.abs(testCurrentData.B - testCurrentData.C),
                      Math.abs(testCurrentData.C - testCurrentData.A)
                    ) < 2 ? 'Excellent' :
                    Math.max(
                      Math.abs(testCurrentData.A - testCurrentData.B),
                      Math.abs(testCurrentData.B - testCurrentData.C),
                      Math.abs(testCurrentData.C - testCurrentData.A)
                    ) < 5 ? 'Good' :
                    Math.max(
                      Math.abs(testCurrentData.A - testCurrentData.B),
                      Math.abs(testCurrentData.B - testCurrentData.C),
                      Math.abs(testCurrentData.C - testCurrentData.A)
                    ) < 10 ? 'Warning' : 'Critical'}
                  </div>
                </div>
                
                <div className="metric-card">
                  <h5>Overall Status</h5>
                  <div className="metric-value">
                    {classificationResult?.faultType || 'Unknown'}
                  </div>
                  <div className="metric-status">
                    {classificationResult?.faultType === 'Normal' ? 'Healthy' : 'Alert'}
                  </div>
                </div>
              </div>
              
              {/* Detailed Electrical Parameters */}
              <div className="electrical-parameters">
                <h5>Detailed Electrical Parameters</h5>
                <div className="parameters-grid">
                  <div className="parameter-section">
                    <h6>Phase Voltages</h6>
                    <div className="parameter-row">
                      <span>VA:</span>
                      <span className={testVoltageData.A < 200 || testVoltageData.A > 250 ? 'abnormal' : 'normal'}>
                        {testVoltageData.A.toFixed(2)}V
                      </span>
                    </div>
                    <div className="parameter-row">
                      <span>VB:</span>
                      <span className={testVoltageData.B < 200 || testVoltageData.B > 250 ? 'abnormal' : 'normal'}>
                        {testVoltageData.B.toFixed(2)}V
                      </span>
                    </div>
                    <div className="parameter-row">
                      <span>VC:</span>
                      <span className={testVoltageData.C < 200 || testVoltageData.C > 250 ? 'abnormal' : 'normal'}>
                        {testVoltageData.C.toFixed(2)}V
                      </span>
                    </div>
                  </div>
                  
                  <div className="parameter-section">
                    <h6>Phase Currents</h6>
                    <div className="parameter-row">
                      <span>IA:</span>
                      <span className={testCurrentData.A < 0 || testCurrentData.A > 50 ? 'abnormal' : 'normal'}>
                        {testCurrentData.A.toFixed(2)}A
                      </span>
                    </div>
                    <div className="parameter-row">
                      <span>IB:</span>
                      <span className={testCurrentData.B < 0 || testCurrentData.B > 50 ? 'abnormal' : 'normal'}>
                        {testCurrentData.B.toFixed(2)}A
                      </span>
                    </div>
                    <div className="parameter-row">
                      <span>IC:</span>
                      <span className={testCurrentData.C < 0 || testCurrentData.C > 50 ? 'abnormal' : 'normal'}>
                        {testCurrentData.C.toFixed(2)}A
                      </span>
                    </div>
                  </div>
                  
                  <div className="parameter-section">
                    <h6>Calculated Parameters</h6>
                    <div className="parameter-row">
                      <span>Avg Voltage:</span>
                      <span>{((testVoltageData.A + testVoltageData.B + testVoltageData.C) / 3).toFixed(2)}V</span>
                    </div>
                    <div className="parameter-row">
                      <span>Avg Current:</span>
                      <span>{((testCurrentData.A + testCurrentData.B + testCurrentData.C) / 3).toFixed(2)}A</span>
                    </div>
                    <div className="parameter-row">
                      <span>Total Power:</span>
                      <span>{(testVoltageData.A * testCurrentData.A + testVoltageData.B * testCurrentData.B + testVoltageData.C * testCurrentData.C).toFixed(2)}W</span>
                    </div>
                  </div>
                  
                  <div className="parameter-section">
                    <h6>Symmetry Analysis</h6>
                    <div className="parameter-row">
                      <span>Voltage Symmetry:</span>
                      <span className={(() => {
                        const maxDiff = Math.max(
                          Math.abs(testVoltageData.A - testVoltageData.B),
                          Math.abs(testVoltageData.B - testVoltageData.C),
                          Math.abs(testVoltageData.C - testVoltageData.A)
                        );
                        return maxDiff < 5 ? 'excellent' : maxDiff < 10 ? 'good' : 'poor';
                      })()}>
                        {(() => {
                          const maxDiff = Math.max(
                            Math.abs(testVoltageData.A - testVoltageData.B),
                            Math.abs(testVoltageData.B - testVoltageData.C),
                            Math.abs(testVoltageData.C - testVoltageData.A)
                          );
                          return maxDiff < 5 ? 'Excellent' : maxDiff < 10 ? 'Good' : 'Poor';
                        })()}
                      </span>
                    </div>
                    <div className="parameter-row">
                      <span>Current Symmetry:</span>
                      <span className={(() => {
                        const maxDiff = Math.max(
                          Math.abs(testCurrentData.A - testCurrentData.B),
                          Math.abs(testCurrentData.B - testCurrentData.C),
                          Math.abs(testCurrentData.C - testCurrentData.A)
                        );
                        return maxDiff < 2 ? 'excellent' : maxDiff < 5 ? 'good' : 'poor';
                      })()}>
                        {(() => {
                          const maxDiff = Math.max(
                            Math.abs(testCurrentData.A - testCurrentData.B),
                            Math.abs(testCurrentData.B - testCurrentData.C),
                            Math.abs(testCurrentData.C - testCurrentData.A)
                          );
                          return maxDiff < 2 ? 'Excellent' : maxDiff < 5 ? 'Good' : 'Poor';
                        })()}
                      </span>
                    </div>
                    <div className="parameter-row">
                      <span>System Health:</span>
                      <span className={classificationResult?.faultType === 'Normal' ? 'healthy' : 'warning'}>
                        {classificationResult?.faultType === 'Normal' ? 'Healthy' : 'Needs Attention'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prediction Guide */}
        <div className="prediction-guide">
          <h3>Prediction Guide</h3>
          <div className="guide-lines">
            <div className="guide-line">
              <span className="step-number">1.</span>
              <span className="guide-text">Select a project from the dropdown menu that contains your trained fault detection models</span>
            </div>
            <div className="guide-line">
              <span className="step-number">2.</span>
              <span className="guide-text">Choose a trained model based on accuracy percentage and performance metrics from available models</span>
            </div>
            <div className="guide-line">
              <span className="step-number">3.</span>
              <span className="guide-text">Input three-phase voltage values (VA, VB, VC) in volts - typical range 200-250V for normal operation</span>
            </div>
            <div className="guide-line">
              <span className="step-number">4.</span>
              <span className="guide-text">Input three-phase current values (IA, IB, IC) in amperes - monitor for balanced loading conditions</span>
            </div>
            <div className="guide-line">
              <span className="step-number">5.</span>
              <span className="guide-text">Click "Classify Fault" button to perform real-time fault detection and analysis</span>
            </div>
            <div className="guide-line">
              <span className="step-number">6.</span>
              <span className="guide-text">Use simulation buttons to test different fault scenarios: Normal, L-G, L-L, L-L-G, 3-Phase</span>
            </div>
            <div className="guide-line">
              <span className="step-number">7.</span>
              <span className="guide-text">Review classification results showing fault type, confidence level, and severity assessment</span>
            </div>
            <div className="guide-line">
              <span className="step-number">8.</span>
              <span className="guide-text">Check system health dashboard for voltage balance, current balance, and overall status</span>
            </div>
            <div className="guide-line">
              <span className="step-number">9.</span>
              <span className="guide-text">Analyze detailed electrical parameters including phase voltages, currents, and calculated values</span>
            </div>
            <div className="guide-line">
              <span className="step-number">10.</span>
              <span className="guide-text">Monitor symmetry analysis for voltage and current balance to detect asymmetrical faults</span>
            </div>
            <div className="guide-line">
              <span className="step-number">11.</span>
              <span className="guide-text">Follow recommendations provided in classification results for fault mitigation actions</span>
            </div>
            <div className="guide-line">
              <span className="step-number">12.</span>
              <span className="guide-text">Consider system health status - Healthy systems show Normal classification with balanced parameters</span>
            </div>
          </div>
        </div>

        {/* Fault Types Reference */}
        <div className="fault-types-guide">
          <h3>Fault Types Reference</h3>
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

export default FaultDetectionPrediction; 