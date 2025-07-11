import React, { useState, useEffect } from 'react';
import '../styles/pages/Modules.css';

interface Equipment {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'normal' | 'warning' | 'critical' | 'maintenance';
  healthScore: number;
  lastMaintenance: string;
  nextMaintenance: string;
  sensors: SensorData[];
}

interface SensorData {
  id: string;
  name: string;
  type: 'temperature' | 'vibration' | 'current' | 'voltage' | 'pressure' | 'humidity';
  value: number;
  unit: string;
  normalRange: [number, number];
  status: 'normal' | 'warning' | 'critical';
  timestamp: string;
}

interface MaintenanceAlert {
  id: string;
  equipmentId: string;
  equipmentName: string;
  type: 'predictive' | 'preventive' | 'corrective';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  estimatedCost: number;
  timeToFailure: number; // days
  timestamp: string;
}

interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  type: string;
  description: string;
  cost: number;
  date: string;
  technician: string;
  status: 'completed' | 'pending' | 'cancelled';
}

const MaintenanceAlerts: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [newSensorData, setNewSensorData] = useState({
    equipmentId: '',
    sensorType: 'temperature',
    value: '',
    unit: '°C'
  });
  const [loading, setLoading] = useState(false);

  // Initialize with sample data
  useEffect(() => {
    initializeSampleData();
  }, []);

  const initializeSampleData = () => {
    const sampleEquipment: Equipment[] = [
      {
        id: 'eq1',
        name: 'Main Transformer T1',
        type: 'Transformer',
        location: 'Substation A',
        status: 'normal',
        healthScore: 85,
        lastMaintenance: '2024-01-15',
        nextMaintenance: '2024-07-15',
        sensors: [
          {
            id: 's1',
            name: 'Core Temperature',
            type: 'temperature',
            value: 65,
            unit: '°C',
            normalRange: [20, 80],
            status: 'normal',
            timestamp: new Date().toISOString()
          },
          {
            id: 's2',
            name: 'Load Current',
            type: 'current',
            value: 450,
            unit: 'A',
            normalRange: [0, 500],
            status: 'normal',
            timestamp: new Date().toISOString()
          }
        ]
      },
      {
        id: 'eq2',
        name: 'Generator G1',
        type: 'Generator',
        location: 'Power Plant',
        status: 'warning',
        healthScore: 68,
        lastMaintenance: '2023-11-20',
        nextMaintenance: '2024-02-20',
        sensors: [
          {
            id: 's3',
            name: 'Vibration Level',
            type: 'vibration',
            value: 8.5,
            unit: 'mm/s',
            normalRange: [0, 7],
            status: 'warning',
            timestamp: new Date().toISOString()
          },
          {
            id: 's4',
            name: 'Bearing Temperature',
            type: 'temperature',
            value: 95,
            unit: '°C',
            normalRange: [20, 90],
            status: 'warning',
            timestamp: new Date().toISOString()
          }
        ]
      },
      {
        id: 'eq3',
        name: 'Circuit Breaker CB1',
        type: 'Circuit Breaker',
        location: 'Control Room',
        status: 'critical',
        healthScore: 45,
        lastMaintenance: '2023-09-10',
        nextMaintenance: '2024-01-10',
        sensors: [
          {
            id: 's5',
            name: 'Contact Resistance',
            type: 'current',
            value: 12.5,
            unit: 'mΩ',
            normalRange: [0, 10],
            status: 'critical',
            timestamp: new Date().toISOString()
          }
        ]
      }
    ];

    const sampleAlerts: MaintenanceAlert[] = [
      {
        id: 'a1',
        equipmentId: 'eq2',
        equipmentName: 'Generator G1',
        type: 'predictive',
        priority: 'high',
        description: 'High vibration levels detected - bearing failure predicted',
        recommendation: 'Schedule bearing replacement within 30 days',
        estimatedCost: 5000,
        timeToFailure: 25,
        timestamp: new Date().toISOString()
      },
      {
        id: 'a2',
        equipmentId: 'eq3',
        equipmentName: 'Circuit Breaker CB1',
        type: 'corrective',
        priority: 'critical',
        description: 'Contact resistance exceeds safe limits',
        recommendation: 'Immediate maintenance required - replace contacts',
        estimatedCost: 3000,
        timeToFailure: 5,
        timestamp: new Date().toISOString()
      }
    ];

    const sampleRecords: MaintenanceRecord[] = [
      {
        id: 'r1',
        equipmentId: 'eq1',
        type: 'Preventive',
        description: 'Oil change and insulation test',
        cost: 1500,
        date: '2024-01-15',
        technician: 'John Smith',
        status: 'completed'
      }
    ];

    setEquipment(sampleEquipment);
    setAlerts(sampleAlerts);
    setMaintenanceRecords(sampleRecords);
  };

  const addSensorReading = () => {
    if (!newSensorData.equipmentId || !newSensorData.value) return;

    const value = parseFloat(newSensorData.value);
    const updatedEquipment = equipment.map(eq => {
      if (eq.id === newSensorData.equipmentId) {
        const newSensor: SensorData = {
          id: `s${Date.now()}`,
          name: `${newSensorData.sensorType} Sensor`,
          type: newSensorData.sensorType as any,
          value: value,
          unit: newSensorData.unit,
          normalRange: getSensorNormalRange(newSensorData.sensorType),
          status: getSensorStatus(value, getSensorNormalRange(newSensorData.sensorType)),
          timestamp: new Date().toISOString()
        };

        const updatedSensors = [...eq.sensors, newSensor];
        const newHealthScore = calculateHealthScore(updatedSensors);
        const newStatus = getEquipmentStatus(newHealthScore);

        return {
          ...eq,
          sensors: updatedSensors,
          healthScore: newHealthScore,
          status: newStatus
        };
      }
      return eq;
    });

    setEquipment(updatedEquipment);
    
    // Generate alert if needed
    const equipment_item = updatedEquipment.find(eq => eq.id === newSensorData.equipmentId);
    if (equipment_item && equipment_item.healthScore < 70) {
      generateAlert(equipment_item);
    }

    // Reset form
    setNewSensorData({
      equipmentId: '',
      sensorType: 'temperature',
      value: '',
      unit: '°C'
    });
  };

  const getSensorNormalRange = (type: string): [number, number] => {
    switch (type) {
      case 'temperature': return [20, 80];
      case 'vibration': return [0, 7];
      case 'current': return [0, 500];
      case 'voltage': return [220, 240];
      case 'pressure': return [0, 10];
      case 'humidity': return [30, 70];
      default: return [0, 100];
    }
  };

  const getSensorStatus = (value: number, range: [number, number]): 'normal' | 'warning' | 'critical' => {
    if (value < range[0] * 0.8 || value > range[1] * 1.2) return 'critical';
    if (value < range[0] * 0.9 || value > range[1] * 1.1) return 'warning';
    return 'normal';
  };

  const calculateHealthScore = (sensors: SensorData[]): number => {
    let totalScore = 0;
    sensors.forEach(sensor => {
      switch (sensor.status) {
        case 'normal': totalScore += 100; break;
        case 'warning': totalScore += 70; break;
        case 'critical': totalScore += 30; break;
      }
    });
    return Math.round(totalScore / sensors.length);
  };

  const getEquipmentStatus = (healthScore: number): 'normal' | 'warning' | 'critical' | 'maintenance' => {
    if (healthScore >= 80) return 'normal';
    if (healthScore >= 60) return 'warning';
    return 'critical';
  };

  const generateAlert = (equipment: Equipment) => {
    const newAlert: MaintenanceAlert = {
      id: `a${Date.now()}`,
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      type: 'predictive',
      priority: equipment.healthScore < 50 ? 'critical' : 'high',
      description: `Health score dropped to ${equipment.healthScore}%`,
      recommendation: equipment.healthScore < 50 ? 
        'Immediate inspection required' : 
        'Schedule maintenance within 2 weeks',
      estimatedCost: Math.round(1000 + Math.random() * 4000),
      timeToFailure: equipment.healthScore < 50 ? 7 : 30,
      timestamp: new Date().toISOString()
    };

    setAlerts(prev => [newAlert, ...prev]);
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };



  return (
    <div className="module-page">
      <div className="module-header">
        <h1>🔧 Maintenance Alerts</h1>
        <p>Predict equipment failures using sensor data analysis</p>
      </div>
      
      <div className="module-content">
        <div className="maintenance-container">
          {/* Equipment Overview */}
          <div className="equipment-overview">
            <h2>Equipment Status</h2>
            <div className="equipment-grid">
              {equipment.map((eq) => (
                <div key={eq.id} className="equipment-card">
                  <div className="equipment-header">
                    <h3>{eq.name}</h3>
                    <div 
                      className={`status-badge status-${eq.status}`}
                    >
                      {eq.status}
                    </div>
                  </div>
                  <div className="equipment-details">
                    <p><strong>Type:</strong> {eq.type}</p>
                    <p><strong>Location:</strong> {eq.location}</p>
                    <div className="health-score">
                      <label>Health Score</label>
                      <div className="health-bar">
                        <div 
                          className={`health-fill status-${eq.status} health-${Math.floor(eq.healthScore / 10) * 10}`}
                        ></div>
                      </div>
                      <span>{eq.healthScore}%</span>
                    </div>
                    <p><strong>Last Maintenance:</strong> {eq.lastMaintenance}</p>
                  </div>
                  <div className="sensor-summary">
                    <h4>Sensors ({eq.sensors.length})</h4>
                    <div className="sensor-list">
                      {eq.sensors.map((sensor) => (
                        <div key={sensor.id} className="sensor-item">
                          <span className="sensor-name">{sensor.name}</span>
                          <span className="sensor-value">
                            {sensor.value} {sensor.unit}
                          </span>
                          <span 
                            className={`sensor-status text-${sensor.status}`}
                          >
                            {sensor.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Sensor Data */}
          <div className="sensor-input-section">
            <h2>Add Sensor Reading</h2>
            <div className="sensor-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Equipment</label>
                  <select 
                    value={newSensorData.equipmentId} 
                    onChange={(e) => setNewSensorData({...newSensorData, equipmentId: e.target.value})}
                    aria-label="Select Equipment"
                  >
                    <option value="">Select Equipment</option>
                    {equipment.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Sensor Type</label>
                  <select 
                    value={newSensorData.sensorType} 
                    onChange={(e) => setNewSensorData({...newSensorData, sensorType: e.target.value})}
                    aria-label="Sensor Type"
                  >
                    <option value="temperature">Temperature</option>
                    <option value="vibration">Vibration</option>
                    <option value="current">Current</option>
                    <option value="voltage">Voltage</option>
                    <option value="pressure">Pressure</option>
                    <option value="humidity">Humidity</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Value</label>
                  <input
                    type="number"
                    value={newSensorData.value}
                    onChange={(e) => setNewSensorData({...newSensorData, value: e.target.value})}
                    placeholder="Enter value"
                    step="0.1"
                  />
                </div>
                
                <div className="form-group">
                  <label>Unit</label>
                  <input
                    type="text"
                    value={newSensorData.unit}
                    onChange={(e) => setNewSensorData({...newSensorData, unit: e.target.value})}
                    placeholder="Unit"
                  />
                </div>
                
                <button 
                  onClick={addSensorReading}
                  disabled={!newSensorData.equipmentId || !newSensorData.value}
                  className="add-sensor-btn"
                >
                  Add Reading
                </button>
              </div>
            </div>
          </div>

          {/* Maintenance Alerts */}
          <div className="alerts-section">
            <h2>Maintenance Alerts ({alerts.length})</h2>
            <div className="alerts-list">
              {alerts.map((alert) => (
                <div key={alert.id} className="alert-card">
                  <div className="alert-header">
                    <div className="alert-info">
                      <h3>{alert.equipmentName}</h3>
                      <span 
                        className={`priority-badge priority-${alert.priority}`}
                      >
                        {alert.priority}
                      </span>
                    </div>
                    <button 
                      onClick={() => dismissAlert(alert.id)}
                      className="dismiss-btn"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="alert-content">
                    <p className="alert-description">{alert.description}</p>
                    <p className="alert-recommendation">{alert.recommendation}</p>
                    
                    <div className="alert-details">
                      <div className="detail-item">
                        <span className="detail-label">Type:</span>
                        <span className="detail-value">{alert.type}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Estimated Cost:</span>
                        <span className="detail-value">${alert.estimatedCost}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Time to Failure:</span>
                        <span className="detail-value">{alert.timeToFailure} days</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Generated:</span>
                        <span className="detail-value">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {alerts.length === 0 && (
                <div className="no-alerts">
                  <div className="no-alerts-icon">✅</div>
                  <h3>No Active Alerts</h3>
                  <p>All equipment is operating within normal parameters</p>
                </div>
              )}
            </div>
          </div>

          {/* Maintenance Records */}
          <div className="records-section">
            <h2>Maintenance History</h2>
            <div className="records-table">
              <table>
                <thead>
                  <tr>
                    <th>Equipment</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Cost</th>
                    <th>Date</th>
                    <th>Technician</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{equipment.find(eq => eq.id === record.equipmentId)?.name}</td>
                      <td>{record.type}</td>
                      <td>{record.description}</td>
                      <td>${record.cost}</td>
                      <td>{record.date}</td>
                      <td>{record.technician}</td>
                      <td>
                        <span 
                          className={`status-badge status-${record.status}`}
                        >
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Analytics Summary */}
          <div className="analytics-section">
            <h2>Analytics Summary</h2>
            <div className="analytics-grid">
              <div className="analytic-card">
                <h3>Equipment Health</h3>
                <div className="analytic-value">
                  {Math.round(equipment.reduce((sum, eq) => sum + eq.healthScore, 0) / equipment.length)}%
                </div>
                <p>Average health score</p>
              </div>
              
              <div className="analytic-card">
                <h3>Critical Equipment</h3>
                <div className="analytic-value">
                  {equipment.filter(eq => eq.status === 'critical').length}
                </div>
                <p>Require immediate attention</p>
              </div>
              
              <div className="analytic-card">
                <h3>Pending Alerts</h3>
                <div className="analytic-value">
                  {alerts.filter(alert => alert.priority === 'critical' || alert.priority === 'high').length}
                </div>
                <p>High priority alerts</p>
              </div>
              
              <div className="analytic-card">
                <h3>Maintenance Cost</h3>
                <div className="analytic-value">
                  ${alerts.reduce((sum, alert) => sum + alert.estimatedCost, 0)}
                </div>
                <p>Estimated upcoming costs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceAlerts; 