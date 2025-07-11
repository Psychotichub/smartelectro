import React, { useState } from 'react';
import '../styles/pages/Modules.css';

interface CableCalculation {
  recommendedSize: string;
  voltageDrop: number;
  voltageDropPercentage: number;
  powerLoss: number;
  currentCarryingCapacity: number;
  isCompliant: boolean;
}

interface CableData {
  size: string;
  currentCapacity: number;
  resistance: number; // ohms per km
  price: number; // per meter
}

const CableCalculator: React.FC = () => {
  const [inputs, setInputs] = useState({
    voltage: '',
    current: '',
    power: '',
    distance: '',
    cableType: 'copper',
    installationMethod: 'underground',
    phases: '1',
    powerFactor: '0.9',
    ambientTemp: '25'
  });

  const [calculation, setCalculation] = useState<CableCalculation | null>(null);
  const [loading, setLoading] = useState(false);

  // Cable data (simplified for demo)
  const cableData: CableData[] = [
    { size: '1.5mm²', currentCapacity: 15, resistance: 12.1, price: 2.50 },
    { size: '2.5mm²', currentCapacity: 20, resistance: 7.41, price: 3.20 },
    { size: '4mm²', currentCapacity: 25, resistance: 4.61, price: 4.10 },
    { size: '6mm²', currentCapacity: 32, resistance: 3.08, price: 5.80 },
    { size: '10mm²', currentCapacity: 43, resistance: 1.83, price: 8.90 },
    { size: '16mm²', currentCapacity: 57, resistance: 1.15, price: 12.50 },
    { size: '25mm²', currentCapacity: 75, resistance: 0.727, price: 18.20 },
    { size: '35mm²', currentCapacity: 94, resistance: 0.524, price: 24.60 },
    { size: '50mm²', currentCapacity: 119, resistance: 0.387, price: 34.80 },
    { size: '70mm²', currentCapacity: 151, resistance: 0.268, price: 48.90 },
    { size: '95mm²', currentCapacity: 182, resistance: 0.193, price: 68.50 },
    { size: '120mm²', currentCapacity: 210, resistance: 0.153, price: 86.20 }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateCable = () => {
    setLoading(true);
    
    // Parse inputs
    const voltage = parseFloat(inputs.voltage);
    const distance = parseFloat(inputs.distance) / 1000; // Convert to km
    const phases = parseInt(inputs.phases);
    const powerFactor = parseFloat(inputs.powerFactor);
    const ambientTemp = parseFloat(inputs.ambientTemp);
    
    // Calculate current
    let current: number;
    if (inputs.current) {
      current = parseFloat(inputs.current);
    } else if (inputs.power) {
      const power = parseFloat(inputs.power);
      if (phases === 1) {
        current = power / (voltage * powerFactor);
      } else {
        current = power / (Math.sqrt(3) * voltage * powerFactor);
      }
    } else {
      setLoading(false);
      return;
    }

    // Apply temperature derating factor
    const tempDerating = ambientTemp > 30 ? 0.8 : 1.0;
    const adjustedCurrent = current / tempDerating;

    // Find suitable cable size
    const suitableCable = cableData.find(cable => 
      cable.currentCapacity >= adjustedCurrent * 1.25 // 25% safety factor
    );

    if (!suitableCable) {
      setLoading(false);
      return;
    }

    // Calculate voltage drop
    const resistance = suitableCable.resistance * distance;
    const voltageDrop = phases === 1 ? 
      current * resistance : 
      Math.sqrt(3) * current * resistance;
    
    const voltageDropPercentage = (voltageDrop / voltage) * 100;

    // Calculate power loss
    const powerLoss = Math.pow(current, 2) * resistance;

    // Check compliance (voltage drop should be < 5% for power, < 3% for lighting)
    const isCompliant = voltageDropPercentage < 5;

    const result: CableCalculation = {
      recommendedSize: suitableCable.size,
      voltageDrop: voltageDrop,
      voltageDropPercentage: voltageDropPercentage,
      powerLoss: powerLoss,
      currentCarryingCapacity: suitableCable.currentCapacity,
      isCompliant: isCompliant
    };

    setCalculation(result);
    setLoading(false);
  };

  const resetCalculation = () => {
    setInputs({
      voltage: '',
      current: '',
      power: '',
      distance: '',
      cableType: 'copper',
      installationMethod: 'underground',
      phases: '1',
      powerFactor: '0.9',
      ambientTemp: '25'
    });
    setCalculation(null);
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
                <label>Number of Phases</label>
                <select name="phases" value={inputs.phases} onChange={handleInputChange} aria-label="Number of Phases">
                  <option value="1">Single Phase</option>
                  <option value="3">Three Phase</option>
                </select>
              </div>

              <div className="input-group">
                <label>Current (A)</label>
                <input
                  type="number"
                  name="current"
                  value={inputs.current}
                  onChange={handleInputChange}
                  placeholder="e.g., 25"
                  step="0.1"
                />
              </div>

              <div className="input-group">
                <label>OR Power (W)</label>
                <input
                  type="number"
                  name="power"
                  value={inputs.power}
                  onChange={handleInputChange}
                  placeholder="e.g., 5000"
                  step="1"
                />
              </div>

              <div className="input-group">
                <label>Distance (m)</label>
                <input
                  type="number"
                  name="distance"
                  value={inputs.distance}
                  onChange={handleInputChange}
                  placeholder="e.g., 50"
                  required
                />
              </div>

              <div className="input-group">
                <label>Power Factor</label>
                <input
                  type="number"
                  name="powerFactor"
                  value={inputs.powerFactor}
                  onChange={handleInputChange}
                  placeholder="0.9"
                  step="0.1"
                  min="0.1"
                  max="1"
                />
              </div>

              <div className="input-group">
                <label>Cable Type</label>
                <select name="cableType" value={inputs.cableType} onChange={handleInputChange} aria-label="Cable Type">
                  <option value="copper">Copper</option>
                  <option value="aluminum">Aluminum</option>
                </select>
              </div>

              <div className="input-group">
                <label>Installation Method</label>
                <select name="installationMethod" value={inputs.installationMethod} onChange={handleInputChange} aria-label="Installation Method">
                  <option value="underground">Underground</option>
                  <option value="overhead">Overhead</option>
                  <option value="conduit">In Conduit</option>
                  <option value="tray">Cable Tray</option>
                </select>
              </div>

              <div className="input-group">
                <label>Ambient Temperature (°C)</label>
                <input
                  type="number"
                  name="ambientTemp"
                  value={inputs.ambientTemp}
                  onChange={handleInputChange}
                  placeholder="25"
                />
              </div>
            </div>

            <div className="button-group">
              <button 
                onClick={calculateCable} 
                disabled={loading || !inputs.voltage || !inputs.distance || (!inputs.current && !inputs.power)}
                className="calculate-btn"
              >
                {loading ? 'Calculating...' : 'Calculate Cable Size'}
              </button>
              <button onClick={resetCalculation} className="reset-btn">
                Reset
              </button>
            </div>
          </div>

          {calculation && (
            <div className="results-section">
              <h2>Calculation Results</h2>
              
              <div className="result-grid">
                <div className="result-card">
                  <h3>Recommended Cable Size</h3>
                  <div className="result-value">{calculation.recommendedSize}</div>
                </div>

                <div className="result-card">
                  <h3>Current Carrying Capacity</h3>
                  <div className="result-value">{calculation.currentCarryingCapacity}A</div>
                </div>

                <div className="result-card">
                  <h3>Voltage Drop</h3>
                  <div className="result-value">
                    {calculation.voltageDrop.toFixed(2)}V 
                    <span className="percentage">({calculation.voltageDropPercentage.toFixed(2)}%)</span>
                  </div>
                </div>

                <div className="result-card">
                  <h3>Power Loss</h3>
                  <div className="result-value">{calculation.powerLoss.toFixed(2)}W</div>
                </div>

                <div className={`result-card compliance ${calculation.isCompliant ? 'compliant' : 'non-compliant'}`}>
                  <h3>Compliance Status</h3>
                  <div className="result-value">
                    {calculation.isCompliant ? '✅ Compliant' : '❌ Non-Compliant'}
                  </div>
                  <small>
                    {calculation.isCompliant ? 
                      'Voltage drop is within acceptable limits' : 
                      'Voltage drop exceeds 5% - consider larger cable'
                    }
                  </small>
                </div>
              </div>

              <div className="recommendations">
                <h3>Recommendations</h3>
                <ul>
                  {calculation.voltageDropPercentage > 3 && (
                    <li>⚠️ Consider using a larger cable size to reduce voltage drop</li>
                  )}
                  {calculation.powerLoss > 100 && (
                    <li>💡 High power loss detected - larger cable will improve efficiency</li>
                  )}
                  <li>🔧 Ensure proper installation according to local electrical codes</li>
                  <li>📋 Consider environmental factors and load growth</li>
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