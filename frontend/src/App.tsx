import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LoadForecasting from './pages/LoadForecasting';
import LoadForecastingTraining from './pages/LoadForecastingTraining';
import LoadForecastingPrediction from './pages/LoadForecastingPrediction';
import FaultDetection from './pages/FaultDetection';
import FaultDetectionTraining from './pages/FaultDetectionTraining';
import FaultDetectionPrediction from './pages/FaultDetectionPrediction';
import CableCalculator from './pages/CableCalculator';
import MaintenanceAlerts from './pages/MaintenanceAlerts';
import Projects from './pages/Projects';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthProvider from './contexts/AuthContext';
import './styles/main/App.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="load-forecasting" element={<LoadForecasting />} />
              <Route path="load-forecasting-training" element={<LoadForecastingTraining />} />
              <Route path="load-forecasting-prediction" element={<LoadForecastingPrediction />} />
              <Route path="fault-detection" element={<FaultDetection />} />
              <Route path="fault-detection-training" element={<FaultDetectionTraining />} />
              <Route path="fault-detection-prediction" element={<FaultDetectionPrediction />} />
              <Route path="cable-calculator" element={<CableCalculator />} />
              <Route path="maintenance-alerts" element={<MaintenanceAlerts />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App; 