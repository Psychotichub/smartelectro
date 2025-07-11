import React, { useState } from 'react';
import '../styles/pages/Modules.css';

interface FaultData {
  voltage_a: number;
  voltage_b: number;
  voltage_c: number;
  current_a: number;
  current_b: number;
  current_c: number;
  frequency: number;
  power_factor: number;
  timestamp: Date;
}

interface FaultResult {
  faultType: string;
  confidence: number;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  recommendations: string[];
}

const FaultDetection: React.FC = () => {
  const [inputs, setInputs] = useState({
    voltage_a: '',
    voltage_b: '',
    voltage_c: '',
    current_a: '',
    current_b: '',
    current_c: '',
    frequency: '50',
    power_factor: '0.9',
    system_type: '3phase'
  });

  const [result, setResult] = useState<FaultResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [faultHistory, setFaultHistory] = useState<FaultResult[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const classifyFault = () => {
    setLoading(true);
    
    // Parse inputs
    const va = parseFloat(inputs.voltage_a);
    const vb = parseFloat(inputs.voltage_b);
    const vc = parseFloat(inputs.voltage_c);
    const ia = parseFloat(inputs.current_a);
    const ib = parseFloat(inputs.current_b);
    const ic = parseFloat(inputs.current_c);
    const freq = parseFloat(inputs.frequency);
    const pf = parseFloat(inputs.power_factor);

    // Simulate fault detection logic
    const faultResult = performFaultAnalysis(va, vb, vc, ia, ib, ic, freq, pf);
    
    setResult(faultResult);
    setFaultHistory(prev => [faultResult, ...prev.slice(0, 9)]); // Keep last 10 results
    setLoading(false);
  };

  const performFaultAnalysis = (
    va: number, vb: number, vc: number,
    ia: number, ib: number, ic: number,
    freq: number, pf: number
  ): FaultResult => {
    
    // Calculate voltage and current imbalances
    const avgVoltage = (va + vb + vc) / 3;
    const avgCurrent = (ia + ib + ic) / 3;
    
    const voltageImbalance = Math.max(
      Math.abs(va - avgVoltage),
      Math.abs(vb - avgVoltage),
      Math.abs(vc - avgVoltage)
    ) / avgVoltage * 100;
    
    const currentImbalance = Math.max(
      Math.abs(ia - avgCurrent),
      Math.abs(ib - avgCurrent),
      Math.abs(ic - avgCurrent)
    ) / avgCurrent * 100;

    // Determine fault type based on patterns
    let faultType = 'No Fault';
    let confidence = 0;
    let severity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
    let description = '';
    let recommendations: string[] = [];

    // Check for different fault conditions
    if (voltageImbalance > 20 || currentImbalance > 30) {
      // Three-phase fault
      faultType = 'Three-Phase Fault (L-L-L)';
      confidence = 90 + Math.random() * 10;
      severity = 'Critical';
      description = 'Severe three-phase fault detected. All phases are affected.';
      recommendations = [
        'Immediately isolate the faulty section',
        'Check for ground faults and short circuits',
        'Inspect protective devices',
        'Verify system grounding'
      ];
    } else if (voltageImbalance > 15 || currentImbalance > 20) {
      // Two-phase fault
      faultType = 'Line-to-Line Fault (L-L)';
      confidence = 80 + Math.random() * 15;
      severity = 'High';
      description = 'Line-to-line fault detected between two phases.';
      recommendations = [
        'Isolate affected phases',
        'Check insulation between phases',
        'Inspect cable connections',
        'Test protective relay coordination'
      ];
    } else if (voltageImbalance > 10 || currentImbalance > 15) {
      // Line-to-ground fault
      faultType = 'Line-to-Ground Fault (L-G)';
      confidence = 75 + Math.random() * 20;
      severity = 'High';
      description = 'Single line-to-ground fault detected.';
      recommendations = [
        'Check ground fault protection',
        'Inspect insulation to ground',
        'Verify grounding system integrity',
        'Test ground fault circuit breakers'
      ];
    } else if (voltageImbalance > 5 || currentImbalance > 10) {
      // Line-to-line-to-ground fault
      faultType = 'Line-to-Line-to-Ground Fault (L-L-G)';
      confidence = 70 + Math.random() * 25;
      severity = 'High';
      description = 'Double line-to-ground fault detected.';
      recommendations = [
        'Isolate affected phases immediately',
        'Check for multiple ground points',
        'Inspect protective coordination',
        'Test ground fault protection'
      ];
    } else if (voltageImbalance > 2 || currentImbalance > 5) {
      // Minor imbalance
      faultType = 'Phase Imbalance';
      confidence = 60 + Math.random() * 30;
      severity = 'Medium';
      description = 'Minor phase imbalance detected. Monitor for progression.';
      recommendations = [
        'Monitor system continuously',
        'Check load distribution',
        'Inspect connections for looseness',
        'Verify protective settings'
      ];
    } else {
      // No fault or very minor issues
      faultType = 'System Normal';
      confidence = 95 + Math.random() * 5;
      severity = 'Low';
      description = 'System operating within normal parameters.';
      recommendations = [
        'Continue routine monitoring',
        'Perform preventive maintenance',
        'Review historical trends',
        'Update protection settings if needed'
      ];
    }

    // Additional checks for frequency and power factor
    if (Math.abs(freq - 50) > 1) {
      faultType += ' + Frequency Deviation';
      severity = severity === 'Low' ? 'Medium' : severity;
      recommendations.push('Check frequency regulation and grid stability');
    }

    if (pf < 0.8) {
      faultType += ' + Poor Power Factor';
      severity = severity === 'Low' ? 'Medium' : severity;
      recommendations.push('Install power factor correction equipment');
    }

    return {
      faultType,
      confidence: Math.round(confidence),
      severity,
      description,
      recommendations: recommendations.slice(0, 4) // Limit to 4 recommendations
    };
  };

  const resetForm = () => {
    setInputs({
      voltage_a: '',
      voltage_b: '',
      voltage_c: '',
      current_a: '',
      current_b: '',
      current_c: '',
      frequency: '50',
      power_factor: '0.9',
      system_type: '3phase'
    });
    setResult(null);
  };



  return (
    <div className="module-page">
      <div className="module-header">
        <h1>⚠️ Fault Detection</h1>
        <p>Classify electrical faults in single/three-phase systems</p>
      </div>
      
      <div className="module-content">
        <div className="fault-detection-container">
          <div className="input-section">
            <h2>Electrical Parameters</h2>
            
            <div className="system-type-selector">
              <label>System Type</label>
              <select 
                name="system_type" 
                value={inputs.system_type} 
                onChange={handleInputChange}
                aria-label="System Type"
              >
                <option value="3phase">Three-Phase System</option>
                <option value="1phase">Single-Phase System</option>
              </select>
            </div>

            <div className="phase-inputs">
              <h3>Voltage Measurements (V)</h3>
              <div className="input-grid">
                <div className="input-group">
                  <label>Phase A Voltage</label>
                  <input
                    type="number"
                    name="voltage_a"
                    value={inputs.voltage_a}
                    onChange={handleInputChange}
                    placeholder="e.g., 230"
                    step="0.1"
                    required
                  />
                </div>
                
                {inputs.system_type === '3phase' && (
                  <>
                    <div className="input-group">
                      <label>Phase B Voltage</label>
                      <input
                        type="number"
                        name="voltage_b"
                        value={inputs.voltage_b}
                        onChange={handleInputChange}
                        placeholder="e.g., 230"
                        step="0.1"
                        required
                      />
                    </div>
                    
                    <div className="input-group">
                      <label>Phase C Voltage</label>
                      <input
                        type="number"
                        name="voltage_c"
                        value={inputs.voltage_c}
                        onChange={handleInputChange}
                        placeholder="e.g., 230"
                        step="0.1"
                        required
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="phase-inputs">
              <h3>Current Measurements (A)</h3>
              <div className="input-grid">
                <div className="input-group">
                  <label>Phase A Current</label>
                  <input
                    type="number"
                    name="current_a"
                    value={inputs.current_a}
                    onChange={handleInputChange}
                    placeholder="e.g., 25"
                    step="0.1"
                    required
                  />
                </div>
                
                {inputs.system_type === '3phase' && (
                  <>
                    <div className="input-group">
                      <label>Phase B Current</label>
                      <input
                        type="number"
                        name="current_b"
                        value={inputs.current_b}
                        onChange={handleInputChange}
                        placeholder="e.g., 25"
                        step="0.1"
                        required
                      />
                    </div>
                    
                    <div className="input-group">
                      <label>Phase C Current</label>
                      <input
                        type="number"
                        name="current_c"
                        value={inputs.current_c}
                        onChange={handleInputChange}
                        placeholder="e.g., 25"
                        step="0.1"
                        required
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="additional-params">
              <h3>Additional Parameters</h3>
              <div className="input-grid">
                <div className="input-group">
                  <label>Frequency (Hz)</label>
                  <input
                    type="number"
                    name="frequency"
                    value={inputs.frequency}
                    onChange={handleInputChange}
                    placeholder="50"
                    step="0.1"
                  />
                </div>
                
                <div className="input-group">
                  <label>Power Factor</label>
                  <input
                    type="number"
                    name="power_factor"
                    value={inputs.power_factor}
                    onChange={handleInputChange}
                    placeholder="0.9"
                    step="0.01"
                    min="0"
                    max="1"
                  />
                </div>
              </div>
            </div>

            <div className="button-group">
              <button 
                onClick={classifyFault}
                disabled={loading || !inputs.voltage_a || !inputs.current_a}
                className="analyze-btn"
              >
                {loading ? 'Analyzing...' : 'Analyze Fault'}
              </button>
              <button onClick={resetForm} className="reset-btn">
                Reset
              </button>
            </div>
          </div>

          {result && (
            <div className="results-section">
              <h2>Fault Analysis Results</h2>
              
              <div className="fault-result-card">
                <div className="fault-header">
                  <h3>{result.faultType}</h3>
                  <div 
                    className={`severity-badge severity-${result.severity.toLowerCase()}`}
                  >
                    {result.severity}
                  </div>
                </div>
                
                <div className="confidence-meter">
                  <label>Confidence Level</label>
                  <div className="confidence-bar">
                    <div 
                      className={`confidence-fill confidence-${Math.floor(result.confidence / 10) * 10}`}
                    ></div>
                  </div>
                  <span>{result.confidence}%</span>
                </div>
                
                <div className="fault-description">
                  <p>{result.description}</p>
                </div>
                
                <div className="recommendations">
                  <h4>Recommendations</h4>
                  <ul>
                    {result.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {faultHistory.length > 0 && (
            <div className="history-section">
              <h2>Recent Fault Analysis</h2>
              <div className="history-grid">
                {faultHistory.slice(0, 5).map((fault, index) => (
                  <div key={index} className="history-card">
                    <div className="history-header">
                      <span className="fault-type">{fault.faultType}</span>
                                    <span 
                className={`severity-mini severity-${fault.severity.toLowerCase()}`}
              >
                {fault.severity}
              </span>
                    </div>
                    <div className="history-confidence">
                      Confidence: {fault.confidence}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaultDetection; 