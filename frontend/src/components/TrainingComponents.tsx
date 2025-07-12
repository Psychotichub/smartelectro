import React, { useState } from 'react';
import '../styles/components/TrainingComponents.css';

// Types
export interface TrainingProgress {
  status: 'idle' | 'training' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string;
}

export interface TrainingResult {
  model_type: string;
  accuracy: number;
  training_time: number;
  metrics: Record<string, number>;
  model_id?: string;
  forecast_data?: number[];
  created_at?: string;
  name?: string;
}

// Model Selection Component
interface ModelSelectorProps {
  models: { value: string; label: string; description: string }[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onModelChange,
  disabled = false
}) => {
  return (
    <div className="model-selector">
      <h3>Select Model Type</h3>
      <div className="model-options">
        {models.map((model) => (
          <div 
            key={model.value}
            className={`model-option ${selectedModel === model.value ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && onModelChange(model.value)}
          >
            <div className="model-name">{model.label}</div>
            <div className="model-description">{model.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Training Progress Component
interface TrainingProgressProps {
  progress: TrainingProgress;
  onCancel?: () => void;
}

export const TrainingProgressMonitor: React.FC<TrainingProgressProps> = ({
  progress,
  onCancel
}) => {
  if (progress.status === 'idle') return null;

  return (
    <div className="training-progress">
      <div className="progress-header">
        <h3>Model Training</h3>
        {progress.status === 'training' && onCancel && (
          <button onClick={onCancel} className="cancel-btn">Cancel</button>
        )}
      </div>
      
      <div className="progress-content">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress.progress}%` }}
          />
        </div>
        
        <div className="progress-info">
          <span className="progress-percentage">{progress.progress}%</span>
          <span className="progress-message">{progress.message}</span>
        </div>
        
        {progress.status === 'error' && progress.error && (
          <div className="error-message">
            Error: {progress.error}
          </div>
        )}
      </div>
    </div>
  );
};

// Training Configuration Component
interface TrainingConfigProps {
  title: string;
  children: React.ReactNode;
  onTrain: () => void;
  onReset: () => void;
  isTraining: boolean;
  disabled?: boolean;
}

export const TrainingConfig: React.FC<TrainingConfigProps> = ({
  title,
  children,
  onTrain,
  onReset,
  isTraining,
  disabled = false
}) => {
  return (
    <div className="training-config">
      <h2>{title}</h2>
      <div className="training-form">
        {children}
        
        <div className="training-actions">
          <button 
            onClick={onTrain}
            disabled={isTraining || disabled}
            className="train-btn"
          >
            {isTraining ? 'Training...' : 'Train Model'}
          </button>
          <button 
            onClick={onReset}
            disabled={isTraining}
            className="reset-btn"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

// Training Results Component
interface TrainingResultsProps {
  results: TrainingResult[];
  onSelectModel?: (modelId: string) => void;
  onDeleteModel?: (modelId: string) => void;
}

export const TrainingResults: React.FC<TrainingResultsProps> = ({
  results,
  onSelectModel,
  onDeleteModel
}) => {
  if (results.length === 0) return null;

  return (
    <div className="training-results">
      <h3>Training Results</h3>
      <div className="results-grid">
        {results.map((result, index) => (
          <div key={index} className="result-card">
            <div className="result-header">
              <h4>{result.model_type}</h4>
              <span className="accuracy">{(result.accuracy * 100).toFixed(1)}%</span>
            </div>
            
            <div className="result-metrics">
              <div className="metric">
                <span className="metric-label">Training Time:</span>
                <span className="metric-value">{result.training_time.toFixed(2)}s</span>
              </div>
              
              {Object.entries(result.metrics).map(([key, value]) => (
                <div key={key} className="metric">
                  <span className="metric-label">{key}:</span>
                  <span className="metric-value">{value.toFixed(3)}</span>
                </div>
              ))}
            </div>
            
            <div className="result-actions">
              {onSelectModel && result.model_id && (
                <button 
                  onClick={() => onSelectModel(result.model_id!)}
                  className="select-btn"
                >
                  Use Model
                </button>
              )}
              {onDeleteModel && result.model_id && (
                <button 
                  onClick={() => onDeleteModel(result.model_id!)}
                  className="delete-btn"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Data Upload Component
interface DataUploadProps {
  onFileUpload: (file: File) => void;
  onUseSampleData: () => void;
  acceptedTypes: string;
  sampleDataDescription: string;
  isProcessing: boolean;
}

export const DataUpload: React.FC<DataUploadProps> = ({
  onFileUpload,
  onUseSampleData,
  acceptedTypes,
  sampleDataDescription,
  isProcessing
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="data-upload">
      <h3>Training Data</h3>
      
      <div 
        className={`upload-zone ${dragActive ? 'drag-active' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleFileInput}
          className="upload-file-input"
          disabled={isProcessing}
          aria-label="Upload training data file"
        />
        
        <div className="upload-content">
          <div className="upload-icon">📁</div>
          <p className="upload-text">
            {isProcessing ? 'Processing...' : 'Drop your data file here or click to browse'}
          </p>
          <p className="upload-hint">Accepted formats: {acceptedTypes}</p>
        </div>
      </div>
      
      <div className="sample-data-option">
        <button 
          onClick={onUseSampleData}
          disabled={isProcessing}
          className="sample-data-btn"
        >
          Use Sample Data
        </button>
        <p className="sample-description">{sampleDataDescription}</p>
      </div>
    </div>
  );
};

// Forecast Horizon Selector
interface ForecastHorizonProps {
  value: number;
  onChange: (hours: number) => void;
  disabled?: boolean;
}

export const ForecastHorizonSelector: React.FC<ForecastHorizonProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const horizons = [
    { value: 24, label: '24 Hours (1 Day)' },
    { value: 48, label: '48 Hours (2 Days)' },
    { value: 168, label: '168 Hours (1 Week)' },
    { value: 336, label: '336 Hours (2 Weeks)' },
    { value: 720, label: '720 Hours (1 Month)' },
  ];

  return (
    <div className="forecast-horizon">
      <label>Forecast Horizon</label>
      <select 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        aria-label="Select forecast horizon"
      >
        {horizons.map((horizon) => (
          <option key={horizon.value} value={horizon.value}>
            {horizon.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// Anomaly Threshold Selector
interface AnomalyThresholdProps {
  value: number;
  onChange: (threshold: number) => void;
  disabled?: boolean;
}

export const AnomalyThresholdSelector: React.FC<AnomalyThresholdProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  return (
    <div className="anomaly-threshold">
      <label>Anomaly Threshold</label>
      <div className="threshold-control">
        <input
          type="range"
          min="1"
          max="50"
          step="1"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          disabled={disabled}
          aria-label="Set anomaly detection threshold"
        />
        <span className="threshold-value">{value}%</span>
      </div>
      <p className="threshold-description">
        Lower values detect more anomalies (more sensitive)
      </p>
    </div>
  );
}; 