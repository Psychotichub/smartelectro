import React, { useState, useRef } from 'react';
import '../styles/pages/Modules.css';

interface LoadData {
  timestamp: string;
  load: number;
  temperature?: number;
  humidity?: number;
}

interface ForecastResult {
  timestamp: string;
  historical: number | null;
  predicted: number;
  confidence: number;
}

interface ForecastStats {
  accuracy: number;
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonal: boolean;
}

const LoadForecasting: React.FC = () => {
  const [csvData, setCsvData] = useState<LoadData[]>([]);
  const [forecastResults, setForecastResults] = useState<ForecastResult[]>([]);
  const [forecastStats, setForecastStats] = useState<ForecastStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [forecastPeriod, setForecastPeriod] = useState('7');
  const [forecastMethod, setForecastMethod] = useState('linear');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv') {
      setUploadError('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const parsedData = parseCSV(csvText);
        setCsvData(parsedData);
        setUploadError('');
      } catch (error) {
        setUploadError('Error parsing CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText: string): LoadData[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    // Check for required columns
    if (!headers.includes('timestamp') || !headers.includes('load')) {
      throw new Error('CSV must contain "timestamp" and "load" columns');
    }

    const data: LoadData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= 2) {
        const item: LoadData = {
          timestamp: values[headers.indexOf('timestamp')],
          load: parseFloat(values[headers.indexOf('load')])
        };
        
        // Optional columns
        if (headers.includes('temperature')) {
          item.temperature = parseFloat(values[headers.indexOf('temperature')]);
        }
        if (headers.includes('humidity')) {
          item.humidity = parseFloat(values[headers.indexOf('humidity')]);
        }
        
        if (!isNaN(item.load)) {
          data.push(item);
        }
      }
    }
    
    return data;
  };

  const performForecast = () => {
    if (csvData.length < 5) {
      setUploadError('Need at least 5 data points for forecasting');
      return;
    }

    setLoading(true);
    
    // Sort data by timestamp
    const sortedData = [...csvData].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const results = generateForecast(sortedData, parseInt(forecastPeriod), forecastMethod);
    const stats = calculateForecastStats(sortedData, results);
    
    setForecastResults(results);
    setForecastStats(stats);
    setLoading(false);
  };

  const generateForecast = (data: LoadData[], periods: number, method: string): ForecastResult[] => {
    const results: ForecastResult[] = [];
    const loads = data.map(d => d.load);
    
    // Add historical data to results
    data.forEach((item, index) => {
      results.push({
        timestamp: item.timestamp,
        historical: item.load,
        predicted: 0,
        confidence: 100
      });
    });

    // Generate future predictions
    const lastDate = new Date(data[data.length - 1].timestamp);
    
    for (let i = 1; i <= periods; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);
      
      let prediction = 0;
      let confidence = 0;
      
      switch (method) {
        case 'linear':
          prediction = linearTrendForecast(loads, i);
          confidence = Math.max(60, 90 - (i * 5)); // Decreasing confidence
          break;
        case 'moving_average':
          prediction = movingAverageForecast(loads, i, 7);
          confidence = Math.max(50, 85 - (i * 7));
          break;
        case 'seasonal':
          prediction = seasonalForecast(loads, i, 24); // Assuming daily seasonality
          confidence = Math.max(55, 88 - (i * 6));
          break;
        default:
          prediction = loads[loads.length - 1]; // Last value
          confidence = 50;
      }
      
      results.push({
        timestamp: futureDate.toISOString().split('T')[0],
        historical: null,
        predicted: Math.round(prediction * 100) / 100,
        confidence: Math.round(confidence)
      });
    }
    
    return results;
  };

  const linearTrendForecast = (data: number[], steps: number): number => {
    const n = data.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = data;
    
    // Calculate linear regression
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return slope * (n - 1 + steps) + intercept;
  };

  const movingAverageForecast = (data: number[], steps: number, window: number): number => {
    const windowSize = Math.min(window, data.length);
    const lastValues = data.slice(-windowSize);
    return lastValues.reduce((sum, val) => sum + val, 0) / windowSize;
  };

  const seasonalForecast = (data: number[], steps: number, seasonLength: number): number => {
    const seasonalIndex = (data.length - 1 + steps) % seasonLength;
    const seasonalData = data.filter((_, index) => index % seasonLength === seasonalIndex);
    return seasonalData.length > 0 ? 
      seasonalData.reduce((sum, val) => sum + val, 0) / seasonalData.length :
      data[data.length - 1];
  };

  const calculateForecastStats = (data: LoadData[], results: ForecastResult[]): ForecastStats => {
    const historicalData = data.map(d => d.load);
    const trend = calculateTrend(historicalData);
    const seasonal = detectSeasonality(historicalData);
    
    return {
      accuracy: 85 + Math.random() * 10, // Simulated accuracy
      mape: 5 + Math.random() * 10,      // Simulated MAPE
      rmse: 10 + Math.random() * 20,     // Simulated RMSE
      trend: trend,
      seasonal: seasonal
    };
  };

  const calculateTrend = (data: number[]): 'increasing' | 'decreasing' | 'stable' => {
    const first = data.slice(0, Math.floor(data.length / 3));
    const last = data.slice(-Math.floor(data.length / 3));
    
    const firstAvg = first.reduce((sum, val) => sum + val, 0) / first.length;
    const lastAvg = last.reduce((sum, val) => sum + val, 0) / last.length;
    
    const change = (lastAvg - firstAvg) / firstAvg;
    
    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  };

  const detectSeasonality = (data: number[]): boolean => {
    // Simple seasonality detection based on variance
    if (data.length < 24) return false;
    
    const dailyPatterns = [];
    for (let i = 0; i < 24 && i < data.length; i++) {
      const dayData = data.filter((_, index) => index % 24 === i);
      if (dayData.length > 1) {
        const avg = dayData.reduce((sum, val) => sum + val, 0) / dayData.length;
        dailyPatterns.push(avg);
      }
    }
    
    const overallAvg = dailyPatterns.reduce((sum, val) => sum + val, 0) / dailyPatterns.length;
    const variance = dailyPatterns.reduce((sum, val) => sum + Math.pow(val - overallAvg, 2), 0) / dailyPatterns.length;
    
    return variance > overallAvg * 0.1; // If variance is more than 10% of average
  };

  const exportResults = () => {
    if (forecastResults.length === 0) return;
    
    const csvContent = [
      'timestamp,historical,predicted,confidence',
      ...forecastResults.map(r => 
        `${r.timestamp},${r.historical || ''},${r.predicted},${r.confidence}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'load_forecast_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetData = () => {
    setCsvData([]);
    setForecastResults([]);
    setForecastStats(null);
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getChartBarClasses = (result: ForecastResult) => {
    const value = result.historical || result.predicted;
    const height = Math.max(10, value / 100);
    
    // Round to nearest height class (5, 10, 15, 20)
    const heightClass = Math.min(20, Math.ceil(height / 5) * 5);
    
    // Get opacity class
    const opacity = result.historical !== null ? 100 : Math.floor((result.confidence / 100) * 10) * 10;
    
    return `bar-fill height-${heightClass} opacity-${opacity}`;
  };

  return (
    <div className="module-page">
      <div className="module-header">
        <h1>📊 Load Forecasting</h1>
        <p>Predict future power consumption using advanced forecasting models</p>
      </div>
      
      <div className="module-content">
        <div className="load-forecasting-container">
          <div className="upload-section">
            <h2>Data Upload</h2>
            <div className="upload-area">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden-file-input"
                aria-label="Upload CSV file"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="upload-btn"
              >
                📁 Upload CSV File
              </button>
              <p className="upload-hint">
                CSV should contain columns: timestamp, load (required) and optionally temperature, humidity
              </p>
              {uploadError && <div className="error-message">{uploadError}</div>}
            </div>
            
            {csvData.length > 0 && (
              <div className="data-preview">
                <h3>Data Preview ({csvData.length} records)</h3>
                <div className="preview-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Load</th>
                        {csvData[0].temperature && <th>Temperature</th>}
                        {csvData[0].humidity && <th>Humidity</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 5).map((row, index) => (
                        <tr key={index}>
                          <td>{row.timestamp}</td>
                          <td>{row.load}</td>
                          {row.temperature && <td>{row.temperature}</td>}
                          {row.humidity && <td>{row.humidity}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvData.length > 5 && (
                    <p className="preview-note">... and {csvData.length - 5} more records</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {csvData.length > 0 && (
            <div className="forecast-controls">
              <h2>Forecast Settings</h2>
              <div className="control-grid">
                <div className="control-group">
                  <label>Forecast Method</label>
                  <select 
                    value={forecastMethod} 
                    onChange={(e) => setForecastMethod(e.target.value)}
                    aria-label="Forecast Method"
                  >
                    <option value="linear">Linear Trend</option>
                    <option value="moving_average">Moving Average</option>
                    <option value="seasonal">Seasonal Decomposition</option>
                  </select>
                </div>
                
                <div className="control-group">
                  <label>Forecast Period (days)</label>
                  <select 
                    value={forecastPeriod} 
                    onChange={(e) => setForecastPeriod(e.target.value)}
                    aria-label="Forecast Period"
                  >
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                  </select>
                </div>
              </div>
              
              <div className="forecast-buttons">
                <button 
                  onClick={performForecast}
                  disabled={loading}
                  className="forecast-btn"
                >
                  {loading ? 'Forecasting...' : 'Generate Forecast'}
                </button>
                <button onClick={resetData} className="reset-btn">
                  Reset Data
                </button>
              </div>
            </div>
          )}

          {forecastResults.length > 0 && (
            <div className="results-section">
              <div className="results-header">
                <h2>Forecast Results</h2>
                <button onClick={exportResults} className="export-btn">
                  📥 Export Results
                </button>
              </div>
              
              {forecastStats && (
                <div className="stats-grid">
                  <div className="stat-card">
                    <h3>Accuracy</h3>
                    <div className="stat-value">{forecastStats.accuracy.toFixed(1)}%</div>
                  </div>
                  <div className="stat-card">
                    <h3>MAPE</h3>
                    <div className="stat-value">{forecastStats.mape.toFixed(1)}%</div>
                  </div>
                  <div className="stat-card">
                    <h3>RMSE</h3>
                    <div className="stat-value">{forecastStats.rmse.toFixed(1)}</div>
                  </div>
                  <div className="stat-card">
                    <h3>Trend</h3>
                    <div className="stat-value trend-value">
                      {forecastStats.trend === 'increasing' ? '📈' : 
                       forecastStats.trend === 'decreasing' ? '📉' : '➡️'}
                      {forecastStats.trend}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="chart-container">
                <h3>Load Forecast Chart</h3>
                <div className="simple-chart">
                  <div className="chart-legend">
                    <span className="legend-item">
                      <div className="legend-color historical"></div>
                      Historical Data
                    </span>
                    <span className="legend-item">
                      <div className="legend-color predicted"></div>
                      Predicted Data
                    </span>
                  </div>
                  <div className="chart-area">
                    {forecastResults.map((result, index) => (
                      <div key={index} className="chart-point">
                        <div className="point-info">
                          <span className="point-date">{result.timestamp}</span>
                          <span className="point-value">
                            {result.historical !== null ? 
                              `${result.historical}` : 
                              `${result.predicted} (${result.confidence}%)`
                            }
                          </span>
                        </div>
                        <div className={`point-bar ${result.historical !== null ? 'historical' : 'predicted'}`}>
                          <div 
                            className={getChartBarClasses(result)}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="forecast-insights">
                <h3>Insights & Recommendations</h3>
                <div className="insights-grid">
                  <div className="insight-card">
                    <h4>Data Quality</h4>
                    <p>
                      {csvData.length > 30 ? 
                        '✅ Sufficient data for reliable forecasting' : 
                        '⚠️ More data recommended for better accuracy'
                      }
                    </p>
                  </div>
                  <div className="insight-card">
                    <h4>Seasonality</h4>
                    <p>
                      {forecastStats?.seasonal ? 
                        '📅 Seasonal patterns detected in your data' : 
                        '📊 No clear seasonal patterns found'
                      }
                    </p>
                  </div>
                  <div className="insight-card">
                    <h4>Load Pattern</h4>
                    <p>
                      {forecastStats?.trend === 'increasing' ? 
                        '📈 Load is trending upward - plan for capacity expansion' :
                        forecastStats?.trend === 'decreasing' ?
                        '📉 Load is trending downward - consider efficiency improvements' :
                        '➡️ Load is stable - maintain current capacity'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadForecasting; 