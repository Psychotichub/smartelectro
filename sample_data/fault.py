import pandas as pd
import numpy as np

# Configurations
num_samples_per_class = 1000
fault_types = ['Normal', 'L-G', 'L-L', 'L-L-G', '3-Φ']
nominal_voltage = 230  # V
rated_current = 15     # A

# Function to generate one row of data
def generate_values(fault_type):
    if fault_type == 'Normal':
        voltage = np.random.normal(nominal_voltage, 2, 3).tolist()
        current = np.random.normal(rated_current, 1, 3).tolist()
        freq = float(np.random.normal(50, 0.1))
        pf = float(np.random.uniform(0.9, 1.0))
    elif fault_type == 'L-G':
        voltage = [np.random.uniform(0.4*nominal_voltage, 0.7*nominal_voltage)] + \
                  np.random.normal(nominal_voltage, 2, 2).tolist()
        current = [np.random.uniform(1.5*rated_current, 2.0*rated_current)] + \
                  np.random.normal(rated_current, 1, 2).tolist()
        freq = float(np.random.normal(49.8, 0.2))
        pf = float(np.random.uniform(0.8, 0.9))
    elif fault_type == 'L-L':
        voltage = np.random.uniform(0.5*nominal_voltage, 0.8*nominal_voltage, 2).tolist() + \
                  [np.random.normal(nominal_voltage, 2)]
        current = np.random.uniform(1.2*rated_current, 1.8*rated_current, 2).tolist() + \
                  [np.random.normal(rated_current, 1)]
        freq = float(np.random.normal(49.7, 0.2))
        pf = float(np.random.uniform(0.75, 0.85))
    elif fault_type == 'L-L-G':
        voltage = np.random.uniform(0.3*nominal_voltage, 0.7*nominal_voltage, 2).tolist() + \
                  [np.random.normal(nominal_voltage, 2)]
        current = np.random.uniform(1.5*rated_current, 2.2*rated_current, 2).tolist() + \
                  [np.random.normal(rated_current, 1)]
        freq = float(np.random.normal(49.6, 0.3))
        pf = float(np.random.uniform(0.7, 0.8))
    elif fault_type == '3-Φ':
        voltage = np.random.uniform(0.2*nominal_voltage, 0.6*nominal_voltage, 3).tolist()
        current = np.random.uniform(1.8*rated_current, 2.5*rated_current, 3).tolist()
        freq = float(np.random.normal(49.5, 0.4))
        pf = float(np.random.uniform(0.6, 0.75))
    return voltage + current + [freq, pf, fault_type]

# Generate dataset
data = []
for fault in fault_types:
    for _ in range(num_samples_per_class):
        data.append(generate_values(fault))

# Create DataFrame
columns = ['voltage_a', 'voltage_b', 'voltage_c',
           'current_a', 'current_b', 'current_c',
           'frequency', 'power_factor', 'fault_type']
df = pd.DataFrame(data, columns=columns)

# Save to CSV
df.to_csv("fault_detection_balanced.csv", index=False)
print("✅ File saved as 'fault_detection_balanced.csv'")
