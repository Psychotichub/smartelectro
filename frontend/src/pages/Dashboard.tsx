import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/pages/Modules.css';

interface DashboardStats {
  totalProjects: number;
  totalForecasts: number;
  totalFaultDetections: number;
  totalCableCalculations: number;
  totalMaintenanceAlerts: number;
  criticalAlerts: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalForecasts: 0,
    totalFaultDetections: 0,
    totalCableCalculations: 0,
    totalMaintenanceAlerts: 0,
    criticalAlerts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // For now, we'll use mock data since we don't have a dashboard stats endpoint
      setStats({
        totalProjects: 5,
        totalForecasts: 12,
        totalFaultDetections: 8,
        totalCableCalculations: 15,
        totalMaintenanceAlerts: 3,
        criticalAlerts: 1
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    {
      title: 'Load Forecasting',
      description: 'Predict future power consumption using LSTM and Random Forest models',
      icon: '📊',
      path: '/load-forecasting',
      className: 'load-forecasting'
    },
    {
      title: 'Fault Detection',
      description: 'Classify electrical faults in single/three-phase systems',
      icon: '⚠️',
      path: '/fault-detection',
      className: 'fault-detection'
    },
    {
      title: 'Cable Calculator',
      description: 'Calculate optimal cable sizing based on voltage, load, and distance',
      icon: '🔌',
      path: '/cable-calculator',
      className: 'cable-calculator'
    },
    {
      title: 'Maintenance Alerts',
      description: 'Predict equipment failures using sensor data analysis',
      icon: '🔧',
      path: '/maintenance-alerts',
      className: 'maintenance-alerts'
    }
  ];

  if (loading) {
    return (
      <div className="electric-training-container">
        <div className="electric-content">
          <div className="electric-control-section">
            <div className="loading-spinner"></div>
            <p className="electric-loading-text">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="electric-training-container">
      <div className="electric-header">
        <h1>⚡ SmartElectro AI Dashboard</h1>
        <p>Welcome to your electrical engineering command center</p>
      </div>

      <div className="electric-content">
        <div className="electric-control-section">
          <h2>⚡ System Statistics</h2>
          <div className="electric-config-grid">
            <div className="electric-model-card">
              <div className="stat-icon">📁</div>
              <div className="stat-content">
                <h3 className="electric-stat-value">{stats.totalProjects}</h3>
                <p className="electric-stat-text">Total Projects</p>
              </div>
            </div>
            
            <div className="electric-model-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <h3 className="electric-stat-value">{stats.totalForecasts}</h3>
                <p className="electric-stat-text">Load Forecasts</p>
              </div>
            </div>
            
            <div className="electric-model-card">
              <div className="stat-icon">⚡</div>
              <div className="stat-content">
                <h3 className="electric-stat-value">{stats.totalFaultDetections}</h3>
                <p className="electric-stat-text">Fault Detections</p>
              </div>
            </div>
            
            <div className="electric-model-card">
              <div className="stat-icon">🔌</div>
              <div className="stat-content">
                <h3 className="electric-stat-value">{stats.totalCableCalculations}</h3>
                <p className="electric-stat-text">Cable Calculations</p>
              </div>
            </div>
            
            <div className="electric-model-card">
              <div className="stat-icon">🚨</div>
              <div className="stat-content">
                <h3 className="electric-stat-critical">{stats.criticalAlerts}</h3>
                <p className="electric-stat-text">Critical Alerts</p>
              </div>
            </div>
            
            <div className="electric-model-card">
              <div className="stat-icon">🔧</div>
              <div className="stat-content">
                <h3 className="electric-stat-value">{stats.totalMaintenanceAlerts}</h3>
                <p className="electric-stat-text">Maintenance Alerts</p>
              </div>
            </div>
          </div>
        </div>

        <div className="electric-control-section">
          <h2>🔬 AI Modules</h2>
          <div className="electric-config-grid">
            {modules.map((module, index) => (
              <Link
                key={index}
                to={module.path}
                className="electric-model-card electric-module-link"
              >
                <div className="electric-module-icon">
                  {module.icon}
                </div>
                <div className="module-content">
                  <h3 className="electric-module-title">{module.title}</h3>
                  <p className="electric-module-description">{module.description}</p>
                </div>
                <div className="electric-module-arrow">→</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="electric-control-section">
          <h2>⚡ Quick Actions</h2>
          <div className="electric-config-grid">
            <Link to="/projects" className="electric-model-card electric-module-link">
              <span className="electric-action-icon">📁</span>
              <span className="electric-action-text">Create New Project</span>
            </Link>
            <Link to="/load-forecasting" className="electric-model-card electric-module-link">
              <span className="electric-action-icon">📊</span>
              <span className="electric-action-text">Start Load Forecast</span>
            </Link>
            <Link to="/fault-detection" className="electric-model-card electric-module-link">
              <span className="electric-action-icon">⚠️</span>
              <span className="electric-action-text">Analyze Fault Data</span>
            </Link>
            <Link to="/cable-calculator" className="electric-model-card electric-module-link">
              <span className="electric-action-icon">🔌</span>
              <span className="electric-action-text">Calculate Cable Size</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 