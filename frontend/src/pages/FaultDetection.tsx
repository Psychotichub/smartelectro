import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/pages/Modules.css';

const FaultDetection: React.FC = () => {
  return (
    <div className="electric-training-container">
      <div className="electric-header">
        <h1>⚠️ Fault Detection</h1>
        <p>AI-powered electrical fault detection with neural precision</p>
      </div>

      <div className="electric-content">
        <div className="electric-control-section">
          <h2>🔄 Enhanced Electrical Workflows</h2>
          <p className="electric-card-content-text electric-text-center">
            Fault Detection is now organized into two specialized electrical workflows:
          </p>
          
          <div className="electric-config-grid">
            <div className="electric-model-card">
              <div className="card-header">
                <h3 className="electric-section-title">📚 Training Workflow</h3>
              </div>
              <div className="card-content">
                <p className="electric-card-content-text">Train your AI models with labeled fault data:</p>
                <ul className="electric-card-list">
                  <li>Upload or generate sample fault data</li>
                  <li>Configure neural network parameters</li>
                  <li>Monitor training progress in real-time</li>
                  <li>Manage trained electrical models</li>
                </ul>
                <Link to="/fault-detection-training" className="electric-train-button electric-card-button-custom">
                  ⚡ Go to Training →
                </Link>
              </div>
            </div>

            <div className="electric-model-card">
              <div className="card-header">
                <h3 className="electric-section-subtitle">🔍 Prediction Workflow</h3>
              </div>
              <div className="card-content">
                <p className="electric-card-content-text">Use trained models to classify electrical faults:</p>
                <ul className="electric-card-list">
                  <li>Select from trained AI models</li>
                  <li>Test with real-time electrical data</li>
                  <li>Analyze fault classification results</li>
                  <li>Get intelligent maintenance recommendations</li>
                </ul>
                <Link to="/fault-detection-prediction" className="electric-train-button electric-card-button-alt">
                  🔬 Go to Prediction →
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="electric-control-section">
          <h2>⚡ Quick Access</h2>
          <div className="electric-config-grid">
            <Link to="/fault-detection-training" className="electric-model-card electric-module-link">
              <span className="electric-icon-large">📚</span>
              <div>
                <h4 className="electric-icon-title">Start Training</h4>
                <p className="electric-icon-text">Train new neural networks with fault data</p>
              </div>
            </Link>
            <Link to="/fault-detection-prediction" className="electric-model-card electric-module-link">
              <span className="electric-icon-large">🔍</span>
              <div>
                <h4 className="electric-icon-alt-title">Classify Faults</h4>
                <p className="electric-icon-text">Use existing models for fault detection</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="electric-control-section">
          <h3 className="electric-section-title">🔬 Supported Electrical Fault Types</h3>
          <div className="electric-config-grid">
            <div className="electric-model-card">
              <h4 className="electric-fault-normal">Normal Operation</h4>
              <p className="electric-icon-text">System operating within normal electrical parameters</p>
            </div>
            <div className="electric-model-card">
              <h4 className="electric-fault-lg">L-G (Line-to-Ground)</h4>
              <p className="electric-icon-text">Single phase to ground fault, most common type</p>
            </div>
            <div className="electric-model-card">
              <h4 className="electric-fault-ll">L-L (Line-to-Line)</h4>
              <p className="electric-icon-text">Fault between two phases, no ground involvement</p>
            </div>
            <div className="electric-model-card">
              <h4 className="electric-fault-llg">L-L-G (Line-to-Line-to-Ground)</h4>
              <p className="electric-icon-text">Two phases to ground fault, more severe</p>
            </div>
            <div className="electric-model-card">
              <h4 className="electric-fault-three-phase">3-Phase Fault</h4>
              <p className="electric-icon-text">All three phases involved, most severe fault</p>
            </div>
          </div>
        </div>

        <div className="electric-control-section">
          <h3 className="electric-section-title">⚡ Enhanced Electrical Features</h3>
          <div className="electric-config-grid">
            <div className="electric-model-card">
              <h4 className="electric-feature-title">🎯 Neural Networks</h4>
              <p className="electric-icon-text">Advanced neural networks for electrical fault classification</p>
            </div>
            <div className="electric-model-card">
              <h4 className="electric-feature-title">⚡ Real-time Analysis</h4>
              <p className="electric-icon-text">Lightning-fast fault detection and classification</p>
            </div>
            <div className="electric-model-card">
              <h4 className="electric-feature-title">📈 Smart Organization</h4>
              <p className="electric-icon-text">Intelligent separation of training and prediction workflows</p>
            </div>
            <div className="electric-model-card">
              <h4 className="electric-feature-title">🔧 Advanced Tools</h4>
              <p className="electric-icon-text">Sophisticated tools for electrical fault analysis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaultDetection; 