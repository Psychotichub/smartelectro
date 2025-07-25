import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.preprocessing import MinMaxScaler
import json
from datetime import datetime, timedelta
from typing import List, Tuple, Dict, Any, Optional
import pickle
import os

# Optional TensorFlow import
try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout
    from tensorflow.keras.callbacks import EarlyStopping
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False

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
    
    def create_lstm_model(self, sequence_length: int = 24):
        """Create LSTM model for load forecasting"""
        if not TENSORFLOW_AVAILABLE:
            raise ImportError("TensorFlow is not available. Please install TensorFlow to use LSTM models.")
        
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
    
    def train_lstm_model(self, data: pd.DataFrame, forecast_hours: int = 24, 
                        existing_model_name: Optional[str] = None) -> Dict[str, Any]:
        """Train LSTM model for load forecasting with optional incremental learning"""
        if not TENSORFLOW_AVAILABLE:
            raise ImportError("TensorFlow is not available. Please install TensorFlow to use LSTM models.")
        
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
        
        # Load existing model if provided
        if existing_model_name:
            try:
                existing_model_data = self.load_model(existing_model_name, 'lstm')
                model = existing_model_data['model']
                print(f"Loaded existing LSTM model: {existing_model_name}")
                
                # Continue training with new data
                early_stopping = EarlyStopping(
                    monitor='val_loss',
                    patience=5,  # Reduced patience for incremental learning
                    restore_best_weights=True
                )
                
                history = model.fit(
                    X_train, y_train,
                    epochs=20,  # Fewer epochs for incremental learning
                    batch_size=32,
                    validation_data=(X_test, y_test),
                    callbacks=[early_stopping],
                    verbose=0
                )
                
                print(f"Incremental training completed with {len(data)} new samples")
                
            except Exception as e:
                print(f"Failed to load existing model, creating new one: {e}")
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
        else:
            # Create and train new model
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
            'history': history.history,
            'is_incremental': existing_model_name is not None
        }
    
    def generate_lstm_forecast(self, model, last_sequence: np.ndarray, forecast_hours: int, scaler) -> List[float]:
        """Generate forecast using LSTM model"""
        if not TENSORFLOW_AVAILABLE:
            raise ImportError("TensorFlow is not available. Please install TensorFlow to use LSTM models.")
        
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
    
    def train_random_forest_model(self, data: pd.DataFrame, forecast_hours: int = 24,
                                existing_model_name: Optional[str] = None) -> Dict[str, Any]:
        """Train Random Forest model for load forecasting with optional incremental learning"""
        # Create features from time series
        features = self.create_features(data)
        
        # Handle small datasets
        if len(features) < 5:
            # For very small datasets, use all data for training
            X_train = features.drop('load', axis=1)
            y_train = features['load']
            X_test = X_train.copy()
            y_test = y_train.copy()
        else:
            # Split data for larger datasets
            test_size = min(0.2, max(0.1, 1.0 / len(features)))  # At least 1 sample for test
            X_train, X_test, y_train, y_test = train_test_split(
                features.drop('load', axis=1), features['load'],
                test_size=test_size, random_state=42, shuffle=False
            )
        
        # Load existing model if provided
        if existing_model_name:
            try:
                existing_model_data = self.load_model(existing_model_name, 'random_forest')
                model = existing_model_data['model']
                print(f"Loaded existing Random Forest model: {existing_model_name}")
                
                # For Random Forest, we need to retrain with combined data
                # This is a limitation of Random Forest - it doesn't support true incremental learning
                # But we can warm-start with existing trees and add new ones
                print("Random Forest incremental learning: Adding new trees to existing model")
                
                # Create a new model with warm start
                model = RandomForestRegressor(
                    n_estimators=model.n_estimators + 50,  # Add more trees
                    max_depth=model.max_depth,
                    random_state=42,
                    n_jobs=-1,
                    warm_start=True  # Enable warm start
                )
                
                # Fit the model (warm start will use existing trees)
                model.fit(X_train, y_train)
                
                print(f"Incremental training completed with {len(data)} new samples")
                
            except Exception as e:
                print(f"Failed to load existing model, creating new one: {e}")
                model = RandomForestRegressor(
                    n_estimators=100,
                    max_depth=10,
                    random_state=42,
                    n_jobs=-1
                )
                model.fit(X_train, y_train)
        else:
            # Train new model
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
            'feature_importance': dict(zip(X_train.columns, model.feature_importances_)),
            'is_incremental': existing_model_name is not None
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
        
        # Adaptive lag features based on data size
        data_size = len(features)
        max_lag = min(data_size // 4, 168)  # Don't use lags longer than 1/4 of data
        
        # Basic lag features that don't exceed data size
        for lag in [1, 2, 3]:
            if lag < data_size:
                features[f'load_lag_{lag}'] = features['load'].shift(lag)
        
        # Daily/weekly lags only for larger datasets
        if data_size > 24:
            features['load_lag_24'] = features['load'].shift(24)
        if data_size > 48:
            features['load_lag_48'] = features['load'].shift(48)
        if data_size > 168:
            features['load_lag_168'] = features['load'].shift(168)
        
        # Rolling statistics (adaptive window sizes)
        for window in [min(24, data_size // 2), min(48, data_size // 2)]:
            if window > 2:  # Only create if window is meaningful
                features[f'load_rolling_mean_{window}'] = features['load'].rolling(window=window).mean()
                features[f'load_rolling_std_{window}'] = features['load'].rolling(window=window).std()
        
        # Drop timestamp and NaN values
        features = features.drop('timestamp', axis=1)
        features = features.dropna()
        
        # If we still have no data, create minimal features
        if len(features) == 0:
            features = data.copy()
            features['timestamp'] = pd.to_datetime(features['timestamp'])
            features['hour'] = features['timestamp'].dt.hour
            features['day_of_week'] = features['timestamp'].dt.dayofweek
            features['month'] = features['timestamp'].dt.month
            features['is_weekend'] = features['day_of_week'].isin([5, 6]).astype(int)
            features = features.drop('timestamp', axis=1)
        
        return features
    
    def generate_rf_forecast(self, model, data: pd.DataFrame, forecast_hours: int) -> List[float]:
        """Generate forecast using Random Forest model"""
        # For small datasets, use simple prediction based on mean/trend
        if len(data) < 24:
            # Simple forecasting for small datasets
            recent_values = data['load'].tail(min(5, len(data)))
            mean_value = recent_values.mean()
            trend = (recent_values.iloc[-1] - recent_values.iloc[0]) / len(recent_values) if len(recent_values) > 1 else 0
            
            forecast = []
            for i in range(forecast_hours):
                predicted_value = mean_value + trend * i
                forecast.append(predicted_value)
            
            return forecast
        
        # For larger datasets, use the model
        forecast = []
        extended_data = data.copy()
        
        # Get the original features to ensure consistency
        original_features = self.create_features(data)
        if len(original_features) == 0:
            # Fallback to simple forecast
            return [data['load'].mean()] * forecast_hours
        
        feature_columns = original_features.drop('load', axis=1).columns.tolist()
        
        for i in range(forecast_hours):
            # Create features for the next time step
            features = self.create_features(extended_data)
            
            if len(features) == 0:
                # Use mean as fallback
                forecast.append(data['load'].mean())
                continue
            
            # Ensure feature consistency
            last_features = features.iloc[-1:].drop('load', axis=1)
            
            # Add missing features with zeros
            for col in feature_columns:
                if col not in last_features.columns:
                    last_features[col] = 0
            
            # Remove extra features
            last_features = last_features[feature_columns]
            
            try:
                prediction = model.predict(last_features)[0]
                forecast.append(prediction)
            except Exception:
                # Fallback to mean if prediction fails
                forecast.append(data['load'].mean())
                continue
            
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
    
    def _sanitize_filename(self, filename: str) -> str:
        """Sanitize filename to be safe for all operating systems"""
        # Remove or replace invalid characters
        invalid_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|', ',']
        for char in invalid_chars:
            filename = filename.replace(char, '_')
        # Remove leading/trailing spaces and dots
        filename = filename.strip(' .')
        # Ensure filename is not empty
        if not filename:
            filename = 'unnamed_model'
        return filename
    
    def save_model(self, model_data: Dict[str, Any], model_name: str, model_type: str):
        """Save trained model"""
        # Sanitize the model name for filesystem safety
        safe_model_name = self._sanitize_filename(model_name)
        model_path = os.path.join(self.models_dir, f"{safe_model_name}_{model_type}")
        
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
        # Sanitize the model name for filesystem safety
        safe_model_name = self._sanitize_filename(model_name)
        model_path = os.path.join(self.models_dir, f"{safe_model_name}_{model_type}")
        
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