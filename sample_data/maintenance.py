import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Configuration
start_time = datetime(2024, 1, 1, 0, 0)
time_interval_minutes = 15
num_days = 30
samples_per_day = int(24 * 60 / time_interval_minutes)
equipment_list = ['MOTOR_001', 'PUMP_002', 'FAN_003']
statuses = ['normal', 'warning', 'fault']
status_probabilities = [0.85, 0.1, 0.05]  # 85% normal, 10% warning, 5% fault

# Function to generate sensor values based on status
def generate_reading(status):
    if status == 'normal':
        temp = np.random.normal(65, 2)
        vib = np.random.normal(2.0, 0.2)
        curr = np.random.normal(45, 2)
        volt = np.random.normal(230, 1.5)
        pres = np.random.normal(8.5, 0.2)
    elif status == 'warning':
        temp = np.random.normal(75, 3)
        vib = np.random.normal(3.0, 0.3)
        curr = np.random.normal(55, 3)
        volt = np.random.normal(225, 3)
        pres = np.random.normal(9.5, 0.3)
    else:  # fault
        temp = np.random.normal(85, 5)
        vib = np.random.normal(4.5, 0.5)
        curr = np.random.normal(65, 5)
        volt = np.random.normal(220, 4)
        pres = np.random.normal(11.0, 0.5)
    return temp, vib, curr, volt, pres

# Generate dataset
data = []
for day in range(num_days):
    for i in range(samples_per_day):
        timestamp = start_time + timedelta(minutes=i + day * samples_per_day * time_interval_minutes)
        for equipment in equipment_list:
            status = random.choices(statuses, weights=status_probabilities)[0]
            temp, vib, curr, volt, pres = generate_reading(status)
            data.append([timestamp.strftime("%Y-%m-%d %H:%M:%S"), equipment,
                         round(temp, 2), round(vib, 2), round(curr, 2),
                         round(volt, 2), round(pres, 2), status])

# Create DataFrame
columns = ['timestamp', 'equipment_id', 'temperature', 'vibration',
           'current', 'voltage', 'pressure', 'status']
df = pd.DataFrame(data, columns=columns)

# Save to CSV
df.to_csv("maintenance_data.csv", index=False)
print("✅ File saved as 'maintenance_data.csv'")
