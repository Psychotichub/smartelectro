import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Generate a date range for 1 year (hourly data)
start_date = datetime(2020, 1, 1, 0, 0, 0)
end_date = datetime(2025, 1, 1, 0, 0, 0)
timestamps = pd.date_range(start=start_date, end=end_date, freq='H')

# Simulate load data (in watts), temperature (°C), and humidity (%)
np.random.seed(42)
load = 1400 + 200 * np.sin(np.linspace(0, 50 * np.pi, len(timestamps))) + np.random.normal(0, 50, len(timestamps))
temperature = 20 + 10 * np.sin(np.linspace(0, 2 * np.pi, len(timestamps))) + np.random.normal(0, 1.5, len(timestamps))
humidity = 60 + 10 * np.sin(np.linspace(0, 4 * np.pi, len(timestamps))) + np.random.normal(0, 5, len(timestamps))

# Create DataFrame
df = pd.DataFrame({
    "timestamp": timestamps,
    "load": np.round(load, 1),
    "temperature": np.round(temperature, 1),
    "humidity": np.round(humidity).astype(int)
})

# Save to CSV
csv_path = "/mnt/data/load_forecasting_data_2020_2025.csv"
df.to_csv(csv_path, index=False)
csv_path
