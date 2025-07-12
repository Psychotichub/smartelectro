import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/pages/Modules.css';

const LoadForecasting: React.FC = () => {
  return (
    <div className="electric-training-container">
      <div className="electric-header">
        <h1>📊 Load Forecasting</h1>
        <p>AI-powered electrical load prediction with neural precision</p>
      </div>

      <div className="electric-content">
        <div className="electric-control-section">
          <h2>🔄 Enhanced Electrical Workflows</h2>
          <p className="electric-card-content-text electric-text-center">
            Load Forecasting is now organized into two specialized electrical workflows:
          </p>
          
          <div className="electric-config-grid">
            <div className="electric-model-card">
              <div className="card-header">
                <h3 className="electric-section-title">📚 Training Workflow</h3>
              </div>
              <div className="card-content">
                <p className="electric-card-content-text">Train your AI models with historical load data:</p>
                <ul className="electric-card-list">
                  <li>Upload or generate sample electrical data</li>
                  <li>Configure LSTM & Random Forest parameters</li>
                  <li>Monitor training progress in real-time</li>
                  <li>Manage trained forecasting models</li>
                </ul>
                <Link to="/load-forecasting-training" className="electric-train-button electric-card-button-custom">
                  ⚡ Go to Training →
                </Link>
              </div>
            </div>

            <div className="electric-model-card">
              <div className="card-header">
                <h3 className="electric-section-subtitle">🔮 Prediction Workflow</h3>
              </div>
              <div className="card-content">
                <p className="electric-card-content-text">Use trained models to predict future electrical loads:</p>
                <ul className="electric-card-list">
                  <li>Select from trained AI models</li>
                  <li>Generate intelligent load forecasts</li>
                  <li>Analyze predictions with electrical insights</li>
                  <li>Export forecast results for analysis</li>
                </ul>
                <Link to="/load-forecasting-prediction" className="electric-train-button electric-card-button-alt">
                  🔬 Go to Prediction →
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="electric-control-section">
          <h2>⚡ Quick Access</h2>
          <div className="electric-config-grid">
            <Link to="/load-forecasting-training" className="electric-model-card electric-module-link">
              <span className="electric-icon-large">📚</span>
              <div>
                <h4 className="electric-icon-title">Start Training</h4>
                <p className="electric-icon-text">Train new neural networks with your electrical data</p>
              </div>
            </Link>
            <Link to="/load-forecasting-prediction" className="electric-model-card electric-module-link">
              <span className="electric-icon-large">🔮</span>
              <div>
                <h4 className="electric-icon-alt-title">Make Predictions</h4>
                <p className="electric-icon-text">Use existing models for electrical load forecasting</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="electric-control-section">
          <h3 className="electric-section-title">🔬 Advanced Forecasting Features</h3>
          <div className="electric-config-grid">
            <div className="electric-model-card">
              <h4 className="electric-feature-title">🧠 LSTM Neural Networks</h4>
              <p className="electric-icon-text">Long Short-Term Memory networks for electrical time series</p>
            </div>
            <div className="electric-model-card">
              <h4 className="electric-feature-title">🌲 Random Forest</h4>
              <p className="electric-icon-text">Ensemble learning for robust electrical load predictions</p>
            </div>
            <div className="electric-model-card">
              <h4 className="electric-feature-title">📈 Time Series Analysis</h4>
              <p className="electric-icon-text">Advanced time series analysis for electrical patterns</p>
            </div>
            <div className="electric-model-card">
              <h4 className="electric-feature-title">⚡ Real-time Forecasting</h4>
              <p className="electric-icon-text">Lightning-fast predictions for electrical demand</p>
            </div>
          </div>
        </div>

        <div className="electric-control-section">
          <h3 className="electric-section-title">⚡ Enhanced Electrical Features</h3>
          <div className="electric-config-grid">
            <div className="electric-model-card">
              <h4 className="electric-feature-title">🎯 Focused Workflows</h4>
              <p className="electric-icon-text">Dedicated interfaces for electrical training and prediction</p>
            </div>
            <div className="electric-model-card">
              <h4 className="electric-feature-title">⚡ Improved Performance</h4>
              <p className="electric-icon-text">Lightning-fast loading and electrical user experience</p>
            </div>
            <div className="electric-model-card">
              <h4 className="electric-feature-title">📈 Smart Organization</h4>
              <p className="electric-icon-text">Intelligent separation of model management and electrical usage</p>
            </div>
            <div className="electric-model-card">
              <h4 className="electric-feature-title">🔧 Advanced Tools</h4>
              <p className="electric-icon-text">Sophisticated tools for electrical load forecasting</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadForecasting; 