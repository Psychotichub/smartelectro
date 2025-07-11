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
    <div className="module-page">
      <div className="module-header">
        <h1>🔌 Cable Calculator</h1>
        <p>Calculate optimal cable sizing based on voltage, load, and distance</p>
      </div>
      
      <div className="module-content">
        <div className="calculator-container">
          <div className="input-section">
            <h2>Electrical Parameters</h2>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <div className="input-grid">
              <div className="input-group">
                <label>Voltage (V)</label>
                <input
                  type="number"
                  name="voltage"
                  value={inputs.voltage}
                  onChange={handleInputChange}
                  placeholder="e.g., 230, 400"
                  required
                />
              </div>

              <div className="input-group">
                <label>Power (kW)</label>
                <input
                  type="number"
                  name="power_kw"
                  value={inputs.power_kw}
                  onChange={handleInputChange}
                  placeholder="e.g., 5, 10, 15"
                  step="0.1"
                  required
                />
              </div>

              <div className="input-group">
                <label>Distance (m)</label>
                <input
                  type="number"
                  name="distance"
                  value={inputs.distance}
                  onChange={handleInputChange}
                  placeholder="e.g., 50, 100"
                  required
                />
              </div>

              <div className="input-group">
                <label>Power Factor</label>
                <input
                  type="number"
                  name="power_factor"
                  value={inputs.power_factor}
                  onChange={handleInputChange}
                  placeholder="0.8"
                  step="0.1"
                  min="0.1"
                  max="1"
                />
              </div>

              <div className="input-group">
                <label>Number of Phases</label>
                <select name="phases" value={inputs.phases} onChange={handleInputChange} aria-label="Number of Phases">
                  <option value="1">Single Phase</option>
                  <option value="3">Three Phase</option>
                </select>
              </div>

              <div className="input-group">
                <label>Installation Method</label>
                <select name="installation_method" value={inputs.installation_method} onChange={handleInputChange} aria-label="Installation Method">
                  <option value="air">Air (overhead)</option>
                  <option value="conduit">In Conduit</option>
                  <option value="buried">Buried Underground</option>
                  <option value="tray">Cable Tray</option>
                </select>
              </div>

              <div className="input-group">
                <label>Ambient Temperature (°C)</label>
                <select name="ambient_temp" value={inputs.ambient_temp} onChange={handleInputChange} aria-label="Ambient Temperature">
                  <option value="30">30°C</option>
                  <option value="35">35°C</option>
                  <option value="40">40°C</option>
                  <option value="45">45°C</option>
                  <option value="50">50°C</option>
                </select>
              </div>

              <div className="input-group">
                <label>Voltage Drop Limit (%)</label>
                <select name="voltage_drop_limit" value={inputs.voltage_drop_limit} onChange={handleInputChange} aria-label="Voltage Drop Limit">
                  <option value="3.0">3% (Lighting)</option>
                  <option value="5.0">5% (Power)</option>
                  <option value="2.5">2.5% (Critical)</option>
                </select>
              </div>
            </div>

            <div className="button-group">
              <button 
                onClick={calculateCable} 
                disabled={loading || !inputs.voltage || !inputs.power_kw || !inputs.distance}
                className="calculate-btn"
              >
                {loading ? 'Calculating...' : 'Calculate Cable Size'}
              </button>
              <button onClick={resetCalculation} className="reset-btn">
                Reset
              </button>
            </div>
          </div>

          {result && (
            <div className="results-section">
              <h2>Calculation Results</h2>
              
              <div className="result-grid">
                <div className="result-card">
                  <h3>Recommended Cable Size</h3>
                  <div className="result-value">{result.recommended_cable_size}</div>
                </div>

                <div className="result-card">
                  <h3>Current</h3>
                  <div className="result-value">{result.current_amperes.toFixed(1)}A</div>
                </div>

                <div className="result-card">
                  <h3>Voltage Drop</h3>
                  <div className="result-value">
                    {result.details.voltage_drop_volts.toFixed(2)}V 
                    <span className="percentage">({result.voltage_drop_percentage.toFixed(2)}%)</span>
                  </div>
                </div>

                <div className="result-card">
                  <h3>Power Loss</h3>
                  <div className="result-value">{result.power_loss_watts.toFixed(2)}W</div>
                </div>

                <div className="result-card">
                  <h3>Cable Capacity</h3>
                  <div className="result-value">{result.details.cable_current_capacity}A</div>
                </div>

                <div className={`result-card compliance ${result.is_safe ? 'compliant' : 'non-compliant'}`}>
                  <h3>Safety Status</h3>
                  <div className="result-value">
                    {result.is_safe ? '✅ Safe' : '❌ Unsafe'}
                  </div>
                  <small>
                    Safety Factor: {result.safety_factor.toFixed(2)}
                  </small>
                </div>
              </div>

              <div className="detailed-results">
                <h3>Detailed Analysis</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="label">Calculated Current:</span>
                    <span className="value">{result.details.calculated_current.toFixed(2)}A</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Derated Current:</span>
                    <span className="value">{result.details.derated_current.toFixed(2)}A</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Installation Factor:</span>
                    <span className="value">{result.details.installation_factor.toFixed(2)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Temperature Factor:</span>
                    <span className="value">{result.details.temperature_factor.toFixed(2)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Cable Resistance:</span>
                    <span className="value">{result.details.cable_resistance.toFixed(4)}Ω/km</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Total Derating:</span>
                    <span className="value">{result.details.total_derating.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="recommendations">
                <h3>Recommendations</h3>
                <ul>
                  {result.voltage_drop_percentage > 3 && (
                    <li>⚠️ Voltage drop is {result.voltage_drop_percentage.toFixed(2)}% - consider larger cable if critical</li>
                  )}
                  {result.power_loss_watts > 100 && (
                    <li>💡 Power loss is {result.power_loss_watts.toFixed(0)}W - larger cable will improve efficiency</li>
                  )}
                  {result.safety_factor < 1.5 && (
                    <li>⚡ Safety factor is {result.safety_factor.toFixed(2)} - consider next larger cable size</li>
                  )}
                  {result.is_safe && result.voltage_drop_percentage <= 3 && (
                    <li>✅ Excellent selection - meets all safety and efficiency requirements</li>
                  )}
                  <li>🔧 Ensure proper installation according to local electrical codes</li>
                  <li>📋 Consider future load growth and environmental factors</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CableCalculator; 