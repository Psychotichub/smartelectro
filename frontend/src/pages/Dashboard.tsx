import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/pages/Dashboard.css';

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
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome to SmartElectro AI - Your electrical engineering assistant</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <h3>{stats.totalProjects}</h3>
            <p>Total Projects</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>{stats.totalForecasts}</h3>
            <p>Load Forecasts</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <h3>{stats.totalFaultDetections}</h3>
            <p>Fault Detections</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🔌</div>
          <div className="stat-content">
            <h3>{stats.totalCableCalculations}</h3>
            <p>Cable Calculations</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <h3>{stats.criticalAlerts}</h3>
            <p>Critical Alerts</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🔧</div>
          <div className="stat-content">
            <h3>{stats.totalMaintenanceAlerts}</h3>
            <p>Maintenance Alerts</p>
          </div>
        </div>
      </div>

      <div className="modules-section">
        <h2>AI Modules</h2>
        <div className="modules-grid">
          {modules.map((module, index) => (
            <Link
              key={index}
              to={module.path}
              className={`module-card ${module.className}`}
            >
              <div className="module-icon">
                {module.icon}
              </div>
              <div className="module-content">
                <h3>{module.title}</h3>
                <p>{module.description}</p>
              </div>
              <div className="module-arrow">→</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/projects" className="action-button">
            <span className="action-icon">📁</span>
            <span>Create New Project</span>
          </Link>
          <Link to="/load-forecasting" className="action-button">
            <span className="action-icon">📊</span>
            <span>Start Load Forecast</span>
          </Link>
          <Link to="/fault-detection" className="action-button">
            <span className="action-icon">⚠️</span>
            <span>Analyze Fault Data</span>
          </Link>
          <Link to="/cable-calculator" className="action-button">
            <span className="action-icon">🔌</span>
            <span>Calculate Cable Size</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 