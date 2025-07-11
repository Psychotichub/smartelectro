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
}; 