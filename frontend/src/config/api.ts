// API configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// API endpoints
export const API_ENDPOINTS = {
  auth: {
    token: `${API_BASE_URL}/api/auth/token`,
    register: `${API_BASE_URL}/api/auth/register`,
    me: `${API_BASE_URL}/api/auth/me`,
  },
  projects: `${API_BASE_URL}/api/projects/`,
  cableCalculator: {
    quickCalculate: `${API_BASE_URL}/api/cable-calculator/quick-calculate`,
  },
  loadForecasting: {
    train: `${API_BASE_URL}/api/load-forecasting/train`,
    trainWithData: `${API_BASE_URL}/api/load-forecasting/train-with-data`,
    generateSample: `${API_BASE_URL}/api/load-forecasting/generate-sample-data`,
    uploadData: `${API_BASE_URL}/api/load-forecasting/upload-data`,
    getForecasts: `${API_BASE_URL}/api/load-forecasting/forecasts`,
    getModels: `${API_BASE_URL}/api/load-forecasting/models`,
  },
  faultDetection: {
    trainModel: `${API_BASE_URL}/api/fault-detection/train-model`,
    classifyFault: `${API_BASE_URL}/api/fault-detection/classify`,
    uploadData: `${API_BASE_URL}/api/fault-detection/upload-data`,
    getDetections: `${API_BASE_URL}/api/fault-detection/detections`,
    getModels: `${API_BASE_URL}/api/fault-detection/models`,
  },
  maintenanceAlerts: {
    analyze: `${API_BASE_URL}/api/maintenance-alerts/analyze`,
    healthAnalysis: `${API_BASE_URL}/api/maintenance-alerts/health-analysis`,
    generateSample: `${API_BASE_URL}/api/maintenance-alerts/generate-sample-data`,
    uploadSensorData: `${API_BASE_URL}/api/maintenance-alerts/upload-sensor-data`,
    anomalyDetection: `${API_BASE_URL}/api/maintenance-alerts/anomaly-detection`,
    getAlerts: `${API_BASE_URL}/api/maintenance-alerts/alerts`,
  },
}; 