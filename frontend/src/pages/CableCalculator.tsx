import React, { useState } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import '../styles/pages/Modules.css';

interface CableCalculationResult {
  recommended_cable_size: string;
  voltage_drop_percentage: number;
  power_loss_watts: number;
  current_amperes: number;
  is_safe: boolean;
  safety_factor: number;
  details: {
    calculated_current: number;
    derated_current: number;
    cable_current_capacity: number;
    installation_factor: number;
    temperature_factor: number;
    total_derating: number;
    voltage_drop_volts: number;
    voltage_drop_percentage: number;
    power_loss_watts: number;
    cable_resistance: number;
    phases: number;
    installation_method: string;
    ambient_temperature: number;
  };
}

const CableCalculator: React.FC = () => {
  const [inputs, setInputs] = useState({
    voltage: '',
    power_kw: '',
    distance: '',
    power_factor: '0.8',
    phases: '3',
    installation_method: 'air',
    ambient_temp: '30',
    voltage_drop_limit: '5.0'
  });

  const [result, setResult] = useState<CableCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateCable = async () => {
    setLoading(true);
    setError('');
    
    try {
      const requestData = {
        voltage: parseFloat(inputs.voltage),
        power_kw: parseFloat(inputs.power_kw),
        power_factor: parseFloat(inputs.power_factor),
        distance: parseFloat(inputs.distance),
        voltage_drop_limit: parseFloat(inputs.voltage_drop_limit),
        phases: parseInt(inputs.phases),
        installation_method: inputs.installation_method,
        ambient_temp: parseInt(inputs.ambient_temp)
      };

      const response = await axios.post(API_ENDPOINTS.cableCalculator.quickCalculate, requestData);
      setResult(response.data);
    } catch (error: any) {
      console.error('Error calculating cable:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (error.response?.status === 400) {
        setError(`Invalid input: ${error.response.data.detail}`);
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        setError('Unable to connect to the server. Please check if the backend is running.');
      } else {
        setError('Failed to calculate cable size. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetCalculation = () => {
    setInputs({
      voltage: '',
      power_kw: '',
      distance: '',
      power_factor: '0.8',
      phases: '3',
      installation_method: 'air',
      ambient_temp: '30',
      voltage_drop_limit: '5.0'
    });
    setResult(null);
    setError('');
  };

  return (
    <div className="electric-training-container">
      <div className="electric-header">
        <h1>🔌 Cable Calculator</h1>
        <p>Calculate optimal cable sizing with electrical precision</p>
      </div>
      
      <div className="electric-content">
        <div className="electric-control-section">
          <h2>⚡ Electrical Parameters</h2>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="electric-config-grid">
            <div className="electric-config-card">
              <label className="electric-auth-label">Voltage (V)</label>
              <input
                type="number"
                name="voltage"
                value={inputs.voltage}
                onChange={handleInputChange}
                placeholder="e.g., 230, 400"
                className="electric-input"
                required
              />
            </div>

            <div className="electric-config-card">
              <label className="electric-auth-label">Power (kW)</label>
              <input
                type="number"
                name="power_kw"
                value={inputs.power_kw}
                onChange={handleInputChange}
                placeholder="e.g., 5, 10, 15"
                step="0.1"
                className="electric-input"
                required
              />
            </div>

            <div className="electric-config-card">
              <label className="electric-auth-label">Distance (m)</label>
              <input
                type="number"
                name="distance"
                value={inputs.distance}
                onChange={handleInputChange}
                placeholder="e.g., 50, 100"
                className="electric-input"
                required
              />
            </div>

            <div className="electric-config-card">
              <label className="electric-auth-label">Power Factor</label>
              <input
                type="number"
                name="power_factor"
                value={inputs.power_factor}
                onChange={handleInputChange}
                placeholder="0.8"
                step="0.1"
                min="0.1"
                max="1"
                className="electric-input"
              />
            </div>

            <div className="electric-config-card">
              <label className="electric-auth-label">Number of Phases</label>
              <select name="phases" value={inputs.phases} onChange={handleInputChange} className="electric-select" aria-label="Number of Phases">
                <option value="1">Single Phase</option>
                <option value="3">Three Phase</option>
              </select>
            </div>

            <div className="electric-config-card">
              <label className="electric-auth-label">Installation Method</label>
              <select name="installation_method" value={inputs.installation_method} onChange={handleInputChange} className="electric-select" aria-label="Installation Method">
                <option value="air">Air (overhead)</option>
                <option value="conduit">In Conduit</option>
                <option value="buried">Buried Underground</option>
                <option value="tray">Cable Tray</option>
              </select>
            </div>

            <div className="electric-config-card">
              <label className="electric-auth-label">Ambient Temperature (°C)</label>
              <select name="ambient_temp" value={inputs.ambient_temp} onChange={handleInputChange} className="electric-select" aria-label="Ambient Temperature">
                <option value="30">30°C</option>
                <option value="35">35°C</option>
                <option value="40">40°C</option>
                <option value="45">45°C</option>
                <option value="50">50°C</option>
              </select>
            </div>

            <div className="electric-config-card">
              <label className="electric-auth-label">Voltage Drop Limit (%)</label>
              <input
                type="number"
                name="voltage_drop_limit"
                value={inputs.voltage_drop_limit}
                onChange={handleInputChange}
                placeholder="5.0"
                step="0.1"
                className="electric-input"
              />
            </div>
          </div>

          <div className="electric-button-row">
            <button
              onClick={calculateCable}
              disabled={loading}
              className="electric-train-button"
            >
              {loading ? 'Calculating...' : '⚡ Calculate Cable'}
            </button>
            <button
              onClick={resetCalculation}
              className="reset-btn"
            >
              🔄 Reset
            </button>
          </div>
        </div>

        {result && (
          <div className="electric-control-section">
            <h2>🔬 Calculation Results</h2>
            <div className="electric-config-grid">
              <div className="electric-model-card">
                <h3 className="electric-stat-value">Recommended Cable Size</h3>
                <div className="electric-result-value-large">
                  {result.recommended_cable_size}
                </div>
              </div>

              <div className="electric-model-card">
                <h3 className="electric-stat-value">Current</h3>
                <div className="electric-result-value-normal">
                  {result.current_amperes.toFixed(2)} A
                </div>
              </div>

              <div className="electric-model-card">
                <h3 className="electric-stat-value">Voltage Drop</h3>
                <div className={result.voltage_drop_percentage > 5 ? "electric-result-value-warning" : "electric-result-value-large"}>
                  {result.voltage_drop_percentage.toFixed(2)}%
                </div>
              </div>

              <div className="electric-model-card">
                <h3 className="electric-stat-value">Power Loss</h3>
                <div className="electric-result-value-normal">
                  {result.power_loss_watts.toFixed(2)} W
                </div>
              </div>

              <div className="electric-model-card">
                <h3 className="electric-stat-value">Safety Status</h3>
                <div className={`electric-status ${result.is_safe ? 'normal' : 'critical'}`}>
                  {result.is_safe ? 'SAFE' : 'UNSAFE'}
                </div>
              </div>

              <div className="electric-model-card">
                <h3 className="electric-stat-value">Safety Factor</h3>
                <div className="electric-result-value-normal">
                  {result.safety_factor.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="electric-data-preview">
              <h3>📊 Detailed Analysis</h3>
              <table className="electric-preview-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Value</th>
                    <th>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Calculated Current</td>
                    <td>{result.details.calculated_current.toFixed(2)}</td>
                    <td>A</td>
                  </tr>
                  <tr>
                    <td>Derated Current</td>
                    <td>{result.details.derated_current.toFixed(2)}</td>
                    <td>A</td>
                  </tr>
                  <tr>
                    <td>Cable Current Capacity</td>
                    <td>{result.details.cable_current_capacity.toFixed(2)}</td>
                    <td>A</td>
                  </tr>
                  <tr>
                    <td>Installation Factor</td>
                    <td>{result.details.installation_factor.toFixed(2)}</td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td>Temperature Factor</td>
                    <td>{result.details.temperature_factor.toFixed(2)}</td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td>Total Derating</td>
                    <td>{result.details.total_derating.toFixed(2)}</td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td>Voltage Drop</td>
                    <td>{result.details.voltage_drop_volts.toFixed(2)}</td>
                    <td>V</td>
                  </tr>
                  <tr>
                    <td>Cable Resistance</td>
                    <td>{result.details.cable_resistance.toFixed(4)}</td>
                    <td>Ω/km</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CableCalculator; 