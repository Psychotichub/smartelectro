import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/pages/Modules.css';

const MaintenanceAlerts: React.FC = () => {
  return (
    <div className="electric-training-container">
      <div className="electric-header">
        <h1>🔧 Maintenance Alerts</h1>
        <p>AI-powered equipment failure prediction with sensor intelligence</p>
      </div>

      <div className="electric-content">
        <div className="electric-control-section">
          <h2>🔄 Enhanced Maintenance Workflows</h2>
          <p className="electric-card-content-text electric-text-center">
            Maintenance Alerts is now organized into two specialized workflows:
          </p>
          
          <div className="electric-config-grid">
            <div className="electric-model-card">
              <div className="card-header">
                <h3 className="electric-section-title">📚 Training Workflow</h3>
              </div>
              <div className="card-content">
                <p className="electric-card-content-text">Train your AI models with sensor data:</p>
                <ul className="electric-card-list">
                  <li>Upload or generate sample sensor data</li>
                  <li>Configure anomaly detection parameters</li>
                  <li>Monitor training progress in real-time</li>
                  <li>Manage trained maintenance models</li>
                </ul>
                <Link to="/maintenance-alerts-training" className="electric-train-button electric-card-button-custom">
                  ⚡ Go to Training →
                </Link>
              </div>
            </div>

            <div className="electric-model-card">
              <div className="card-header">
                <h3 className="electric-section-subtitle">🔮 Prediction Workflow</h3>
              </div>
              <div className="card-content">
                <p className="electric-card-content-text">Use trained models to predict equipment failures:</p>
                <ul className="electric-card-list">
                  <li>Select from trained AI models</li>
                  <li>Generate intelligent maintenance alerts</li>
                  <li>Analyze predictions with equipment insights</li>
                  <li>Export alert results for analysis</li>
                </ul>
                <Link to="/maintenance-alerts-prediction" className="electric-train-button electric-card-button-alt">
                  🔬 Go to Prediction →
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="electric-control-section">
          <h2>⚡ Quick Access</h2>
          <div className="electric-config-grid">
            <Link to="/maintenance-alerts-training" className="electric-model-card electric-module-link">
              <span className="electric-icon-large">📚</span>
              <div>
                <h4 className="electric-icon-title">Start Training</h4>
                <p className="electric-icon-text">Train new anomaly detection models with your sensor data</p>
              </div>
            </Link>
            <Link to="/maintenance-alerts-prediction" className="electric-model-card electric-module-link">
              <span className="electric-icon-large">🔮</span>
              <div>
                <h4 className="electric-icon-alt-title">Make Predictions</h4>
                <p className="electric-icon-text">Use existing models for equipment failure prediction</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="electric-control-section">
          <h3 className="electric-section-title">🔬 Advanced Maintenance Features</h3>
          <div className="electric-config-grid">
            <div className="electric-model-card">
              <h4 className="electric-feature-title">🌲 Isolation Forest</h4>
              <p className="electric-icon-text">Unsupervised anomaly detection for equipment monitoring</p>
            </div>
            <div className="electric-model-card">
              <h4 className="electric-feature-title">📊 Multi-Sensor Analysis</h4>
              <p className="electric-icon-text">Comprehensive sensor data analysis for accurate predictions</p>
            </div>
            <div className="electric-model-card">
              <h4 className="electric-feature-title">⚙️ Equipment-Specific Models</h4>
              <p className="electric-icon-text">Specialized models for motors, transformers, generators, etc.</p>
            </div>
            <div className="electric-model-card">
              <h4 className="electric-feature-title">🚨 Real-time Alerts</h4>
              <p className="electric-icon-text">Instant notifications for potential equipment failures</p>
            </div>
          </div>
        </div>

        <div className="electric-control-section">
          <h3 className="electric-section-title">⚡ Enhanced Maintenance Features</h3>
          <div className="electric-config-grid">
            <div className="electric-model-card">
              <h4 className="electric-feature-title">🎯 Focused Workflows</h4>
              <p className="electric-icon-text">Dedicated interfaces for model training and prediction</p>
            </div>
            <div className="electric-model-card">
              <h4 className="electric-feature-title">⚡ Improved Performance</h4>
              <p className="electric-icon-text">Lightning-fast loading and maintenance user experience</p>
            </div>
            <div className="electric-model-card">
              <h4 className="electric-feature-title">📈 Smart Organization</h4>
              <p className="electric-icon-text">Intelligent separation of model management and maintenance usage</p>
            </div>
            <div className="electric-model-card">
              <h4 className="electric-feature-title">🔧 Advanced Tools</h4>
              <p className="electric-icon-text">Sophisticated tools for equipment maintenance prediction</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceAlerts; 