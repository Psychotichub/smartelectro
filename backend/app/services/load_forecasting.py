import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.preprocessing import MinMaxScaler
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping
import json
from datetime import datetime, timedelta
from typing import List, Tuple, Dict, Any
import pickle
import os

class LoadForecastingService:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.models_dir = "models"
        os.makedirs(self.models_dir, exist_ok=True)
    
    def prepare_data(self, data: pd.DataFrame, sequence_length: int = 24) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare data for time series forecasting"""
        # Ensure data is sorted by timestamp
        data = data.sort_values('timestamp')
        
        # Extract load values
        load_values = data['load'].values
        
        # Create sequences
        X, y = [], []
        for i in range(len(load_values) - sequence_length):
            X.append(load_values[i:(i + sequence_length)])
            y.append(load_values[i + sequence_length])
        
        return np.array(X), np.array(y)
    
    def create_lstm_model(self, sequence_length: int = 24) -> Sequential:
        """Create LSTM model for load forecasting"""
        model = Sequential([
            LSTM(50, return_sequences=True, input_shape=(sequence_length, 1)),
            Dropout(0.2),
            LSTM(50, return_sequences=False),
            Dropout(0.2),
            Dense(25),
            Dense(1)
        ])
        
        model.compile(optimizer='adam', loss='mse', metrics=['mae'])
        return model
    
    def train_lstm_model(self, data: pd.DataFrame, forecast_hours: int = 24) -> Dict[str, Any]:
        """Train LSTM model for load forecasting"""
        # Scale the data
        scaler = MinMaxScaler()
        scaled_data = scaler.fit_transform(data[['load']])
        
        # Prepare sequences
        X, y = [], []
        sequence_length = 24  # 24 hours
        
        for i in range(len(scaled_data) - sequence_length):
            X.append(scaled_data[i:(i + sequence_length)])
            y.append(scaled_data[i + sequence_length])
        
        X, y = np.array(X), np.array(y)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, shuffle=False
        )
        
        # Create and train model
        model = self.create_lstm_model(sequence_length)
        
        early_stopping = EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True
        )
        
        history = model.fit(
            X_train, y_train,
            epochs=50,
            batch_size=32,
            validation_data=(X_test, y_test),
            callbacks=[early_stopping],
            verbose=0
        )
        
        # Make predictions
        y_pred = model.predict(X_test)
        
        # Inverse transform predictions
        y_test_inv = scaler.inverse_transform(y_test)
        y_pred_inv = scaler.inverse_transform(y_pred)
        
        # Calculate metrics
        mse = mean_squared_error(y_test_inv, y_pred_inv)
        r2 = r2_score(y_test_inv, y_pred_inv)
        
        # Generate forecast
        last_sequence = scaled_data[-sequence_length:]
        forecast = self.generate_lstm_forecast(model, last_sequence, forecast_hours, scaler)
        
        return {
            'model': model,
            'scaler': scaler,
            'mse': mse,
            'r2_score': r2,
            'forecast': forecast,
            'history': history.history
        }
    
    def generate_lstm_forecast(self, model, last_sequence: np.ndarray, forecast_hours: int, scaler) -> List[float]:
        """Generate forecast using LSTM model"""
        forecast = []
        current_sequence = last_sequence.copy()
        
        for _ in range(forecast_hours):
            # Predict next value
            prediction = model.predict(current_sequence.reshape(1, -1, 1), verbose=0)
            forecast.append(prediction[0, 0])
            
            # Update sequence
            current_sequence = np.roll(current_sequence, -1)
            current_sequence[-1] = prediction[0, 0]
        
        # Inverse transform forecast
        forecast = scaler.inverse_transform(np.array(forecast).reshape(-1, 1))
        return forecast.flatten().tolist()
    
    def train_random_forest_model(self, data: pd.DataFrame, forecast_hours: int = 24) -> Dict[str, Any]:
        """Train Random Forest model for load forecasting"""
        # Create features from time series
        features = self.create_features(data)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            features.drop('load', axis=1), features['load'],
            test_size=0.2, random_state=42
        )
        
        # Train model
        model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        
        model.fit(X_train, y_train)
        
        # Make predictions
        y_pred = model.predict(X_test)
        
        # Calculate metrics
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        # Generate forecast
        forecast = self.generate_rf_forecast(model, data, forecast_hours)
        
        return {
            'model': model,
            'mse': mse,
            'r2_score': r2,
            'forecast': forecast,
            'feature_importance': dict(zip(X_train.columns, model.feature_importances_))
        }
    
    def create_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Create features for Random Forest model"""
        features = data.copy()
        
        # Time-based features
        features['timestamp'] = pd.to_datetime(features['timestamp'])
        features['hour'] = features['timestamp'].dt.hour
        features['day_of_week'] = features['timestamp'].dt.dayofweek
        features['month'] = features['timestamp'].dt.month
        features['is_weekend'] = features['day_of_week'].isin([5, 6]).astype(int)
        
        # Lag features
        for lag in [1, 2, 3, 24, 48, 168]:  # 1h, 2h, 3h, 1d, 2d, 1w
            features[f'load_lag_{lag}'] = features['load'].shift(lag)
        
        # Rolling statistics
        for window in [24, 48, 168]:
            features[f'load_rolling_mean_{window}'] = features['load'].rolling(window=window).mean()
            features[f'load_rolling_std_{window}'] = features['load'].rolling(window=window).std()
        
        # Drop timestamp and NaN values
        features = features.drop('timestamp', axis=1)
        features = features.dropna()
        
        return features
    
    def generate_rf_forecast(self, model, data: pd.DataFrame, forecast_hours: int) -> List[float]:
        """Generate forecast using Random Forest model"""
        forecast = []
        extended_data = data.copy()
        
        for i in range(forecast_hours):
            # Create features for the next time step
            features = self.create_features(extended_data)
            
            if len(features) == 0:
                break
            
            # Predict next value
            last_features = features.iloc[-1:].drop('load', axis=1)
            prediction = model.predict(last_features)[0]
            forecast.append(prediction)
            
            # Add prediction to data for next iteration
            next_timestamp = extended_data['timestamp'].iloc[-1] + pd.Timedelta(hours=1)
            new_row = pd.DataFrame({
                'timestamp': [next_timestamp],
                'load': [prediction]
            })
            extended_data = pd.concat([extended_data, new_row], ignore_index=True)
        
        return forecast
    
    def generate_sample_data(self, start_date: str, end_date: str, freq: str = '1H') -> pd.DataFrame:
        """Generate sample load data for testing"""
        date_range = pd.date_range(start=start_date, end=end_date, freq=freq)
        
        # Base load pattern
        base_load = 100
        
        # Daily pattern (higher during day, lower at night)
        daily_pattern = 30 * np.sin(2 * np.pi * date_range.hour / 24)
        
        # Weekly pattern (higher on weekdays)
        weekly_pattern = 20 * (date_range.dayofweek < 5)
        
        # Seasonal pattern (higher in summer/winter)
        seasonal_pattern = 15 * np.sin(2 * np.pi * date_range.dayofyear / 365.25)
        
        # Add noise
        noise = np.random.normal(0, 10, len(date_range))
        
        # Combine patterns
        load = base_load + daily_pattern + weekly_pattern + seasonal_pattern + noise
        
        # Ensure non-negative values
        load = np.maximum(load, 10)
        
        return pd.DataFrame({
            'timestamp': date_range,
            'load': load
        })
    
    def save_model(self, model_data: Dict[str, Any], model_name: str, model_type: str):
        """Save trained model"""
        model_path = os.path.join(self.models_dir, f"{model_name}_{model_type}")
        
        if model_type == 'lstm':
            model_data['model'].save(f"{model_path}.h5")
            with open(f"{model_path}_scaler.pkl", 'wb') as f:
                pickle.dump(model_data['scaler'], f)
        else:  # random_forest
            with open(f"{model_path}.pkl", 'wb') as f:
                pickle.dump(model_data['model'], f)
        
        # Save metadata
        metadata = {
            'model_type': model_type,
            'mse': model_data['mse'],
            'r2_score': model_data['r2_score'],
            'created_at': datetime.now().isoformat()
        }
        
        with open(f"{model_path}_metadata.json", 'w') as f:
            json.dump(metadata, f)
    
    def load_model(self, model_name: str, model_type: str) -> Dict[str, Any]:
        """Load trained model"""
        model_path = os.path.join(self.models_dir, f"{model_name}_{model_type}")
        
        if model_type == 'lstm':
            model = tf.keras.models.load_model(f"{model_path}.h5")
            with open(f"{model_path}_scaler.pkl", 'rb') as f:
                scaler = pickle.load(f)
            return {'model': model, 'scaler': scaler}
        else:  # random_forest
            with open(f"{model_path}.pkl", 'rb') as f:
                model = pickle.load(f)
            return {'model': model}
    
    def predict_with_saved_model(self, model_name: str, model_type: str, data: pd.DataFrame, forecast_hours: int = 24) -> List[float]:
        """Make predictions using saved model"""
        model_data = self.load_model(model_name, model_type)
        
        if model_type == 'lstm':
            scaler = model_data['scaler']
            scaled_data = scaler.transform(data[['load']])
            last_sequence = scaled_data[-24:]  # Last 24 hours
            forecast = self.generate_lstm_forecast(model_data['model'], last_sequence, forecast_hours, scaler)
        else:  # random_forest
            forecast = self.generate_rf_forecast(model_data['model'], data, forecast_hours)
        
        return forecast 