# 🚀 SmartElectro AI - Complete Setup Guide

Welcome to **SmartElectro AI**! This guide will help you set up the complete full-stack AI application for electrical engineering tools.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** ([Download](https://www.python.org/downloads/))
- **Node.js 16+** ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/downloads))
- **Git LFS** ([Download](https://git-lfs.github.io/))

### Verify Prerequisites
```bash
python --version          # Should show Python 3.8+
node --version           # Should show Node.js 16+
npm --version           # Should show npm 6+
git --version           # Should show Git 2.0+
git lfs version         # Should show Git LFS
```

## 📥 1. Clone the Repository

### Step 1: Install Git LFS (if not already installed)
```bash
# Download and install Git LFS from https://git-lfs.github.io/
# Or use package managers:

# Windows (using chocolatey)
choco install git-lfs

# macOS (using homebrew)
brew install git-lfs

# Ubuntu/Debian
sudo apt install git-lfs
```

### Step 2: Initialize Git LFS
```bash
git lfs install
```

### Step 3: Clone the Repository
```bash
# Clone the repository (this will automatically download LFS files)
git clone https://github.com/yourusername/smartelectro-ai.git
cd smartelectro-ai

# Verify LFS files are downloaded
git lfs ls-files
```

**Note**: The cloning process will automatically download all AI model files (*.h5, *.pkl) via Git LFS.

## 🐍 2. Backend Setup (FastAPI + AI Services)

### Step 1: Navigate to Project Root
```bash
cd smartelectro-ai
```

### Step 2: Create Python Virtual Environment
```bash
# Windows
python -m venv smartelectro_env
smartelectro_env\Scripts\activate

# macOS/Linux
python3 -m venv smartelectro_env
source smartelectro_env/bin/activate
```

**Verify activation**: Your terminal should show `(smartelectro_env)` prefix.

### Step 3: Install Python Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Set Up Environment Variables
Create a `.env` file in the project root:

```bash
# Windows
copy nul .env

# macOS/Linux
touch .env
```

Add the following content to `.env`:
```env
# Database Configuration
DATABASE_URL=sqlite:///./smartelectro.db

# API Configuration
API_HOST=localhost
API_PORT=8000
DEBUG=True

# JWT Secret (generate a secure secret key)
SECRET_KEY=your-super-secret-jwt-key-here

# CORS Origins
CORS_ORIGINS=["http://localhost:3000", "http://localhost:3001"]

# AI Model Configuration
MODEL_DIR=./models
ENABLE_MODEL_TRAINING=True

# Logging
LOG_LEVEL=INFO
```

### Step 5: Initialize Database
```bash
cd backend
python init_db.py
```

### Step 6: Create Test User (Optional)
```bash
python create_test_user.py
```

This creates a test user:
- **Username**: `testuser`
- **Password**: `password123`
- **Email**: `test@example.com`

## ⚛️ 3. Frontend Setup (React)

### Step 1: Navigate to Frontend Directory
```bash
cd frontend
```

### Step 2: Install Node.js Dependencies
```bash
npm install
```

**Note**: This may take a few minutes to download all packages.

### Step 3: Verify Frontend Configuration
Check that `src/contexts/AuthContext.tsx` has the correct API URL:
```typescript
// Should point to your backend
const response = await axios.post('http://localhost:8000/api/auth/token', ...)
```

## 🚀 4. Starting the Application

### Step 1: Start Backend Server
```bash
# In project root, activate virtual environment if not already
# Windows
smartelectro_env\Scripts\activate

# macOS/Linux  
source smartelectro_env/bin/activate

# Start backend
cd backend
python main.py
```

**Backend will start on**: `http://localhost:8000`

### Step 2: Start Frontend Development Server
Open a **new terminal** and run:
```bash
cd smartelectro-ai/frontend
npm start
```

**Frontend will start on**: `http://localhost:3000` or `http://localhost:3001`

## ✅ 5. Verify Setup

### Step 1: Check Backend API
Open your browser and visit:
- `http://localhost:8000` - Should show: "SmartElectro AI Backend is running"
- `http://localhost:8000/health` - Should show: `{"status":"healthy",...}`
- `http://localhost:8000/docs` - FastAPI interactive documentation

### Step 2: Check Frontend Application
Open your browser and visit:
- `http://localhost:3000` (or `http://localhost:3001`)
- You should see the SmartElectro AI login page
- Try logging in with test credentials:
  - **Username**: `testuser`
  - **Password**: `password123`

### Step 3: Test AI Modules
After logging in, test each module:
1. **📊 Load Forecasting** - Upload CSV or use sample data
2. **⚡ Fault Detection** - Test with voltage/current values
3. **🔌 Cable Calculator** - Enter electrical parameters
4. **🔧 Maintenance Alerts** - Check equipment monitoring

## 🗂️ 6. Project Structure

```
smartelectro-ai/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/               # API endpoints
│   │   ├── models/            # Database models
│   │   └── services/          # AI/ML services
│   ├── models/                # Trained AI models (Git LFS)
│   ├── static/                # Static files
│   ├── main.py                # FastAPI app entry point
│   ├── config.py              # Configuration
│   ├── init_db.py             # Database initialization
│   └── create_test_user.py    # Test user creation
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── contexts/          # React contexts
│   │   └── styles/            # CSS stylesheets
│   ├── public/                # Public assets
│   └── package.json           # Frontend dependencies
├── smartelectro_env/          # Python virtual environment
├── .env                       # Environment variables (create this)
├── .gitignore                 # Git ignore rules
├── .gitattributes             # Git LFS configuration
├── requirements.txt           # Python dependencies
├── package.json               # Root package.json
└── SETUP.md                   # This setup guide
```

## 🛠️ 7. AI Models Information

The repository includes pre-trained AI models via Git LFS:

### Load Forecasting Models
- **LSTM Model** (`*.h5`): Deep learning for time series prediction
- **Random Forest** (`*.pkl`): Ensemble learning for load forecasting

### Fault Detection Models  
- **CNN Model** (`*.h5`): Convolutional neural network for signal analysis
- **Decision Tree** (`*.pkl`): Rule-based fault classification

### Model Training
Models can be retrained through the web interface:
1. Login to the application
2. Navigate to the desired module
3. Click "Train Model" 
4. Upload data or use sample data
5. Monitor training progress

## 🔧 8. Troubleshooting

### Common Issues and Solutions

#### Backend Issues

**Error: `ModuleNotFoundError`**
```bash
# Ensure virtual environment is activated
smartelectro_env\Scripts\activate  # Windows
source smartelectro_env/bin/activate  # macOS/Linux

# Reinstall dependencies
pip install -r requirements.txt
```

**Error: `Database locked` or SQLite issues**
```bash
# Delete and recreate database
rm smartelectro.db  # macOS/Linux
del smartelectro.db  # Windows
python backend/init_db.py
```

**Error: `Port 8000 already in use`**
```bash
# Find and kill process using port 8000
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti :8000 | xargs kill
```

#### Frontend Issues

**Error: `npm install` fails**
```bash
# Clear npm cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json  # macOS/Linux
rmdir /s node_modules & del package-lock.json  # Windows
npm install
```

**Error: `CORS policy` errors**
- Ensure backend is running on port 8000
- Check that CORS origins in `.env` include your frontend URL

#### Git LFS Issues

**Error: LFS files not downloading**
```bash
# Manually pull LFS files
git lfs pull

# Reset LFS if needed
git lfs fetch --all
git lfs checkout
```

**Error: `git-lfs` command not found**
```bash
# Reinstall Git LFS
# Follow installation instructions at https://git-lfs.github.io/
git lfs install
```

#### AI Model Issues

**Error: Model files missing**
```bash
# Verify LFS files are present
git lfs ls-files
ls backend/models/  # Should show model files

# If missing, pull LFS files
git lfs pull
```

**Error: TensorFlow/Keras model loading fails**
```bash
# Update TensorFlow
pip install --upgrade tensorflow

# Check model file integrity
python -c "import tensorflow as tf; print(tf.__version__)"
```

## 📚 9. Development Workflow

### Making Changes
```bash
# Create a new branch for your feature
git checkout -b feature/your-feature-name

# Make your changes
# ... edit files ...

# Add and commit changes
git add .
git commit -m "Add your feature description"

# Push to GitHub
git push origin feature/your-feature-name
```

### Updating Dependencies
```bash
# Backend dependencies
pip install new-package
pip freeze > requirements.txt

# Frontend dependencies
cd frontend
npm install new-package
```

### Retraining Models
Models can be retrained through the web interface or programmatically:
```python
# Example: Retrain LSTM model
from app.services.load_forecasting import LoadForecastingService

service = LoadForecastingService()
result = service.train_lstm_model(your_data)
```

## 📖 10. API Documentation

Once the backend is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key API Endpoints
- `POST /api/auth/token` - User authentication
- `POST /api/load-forecasting/train` - Train forecasting models
- `POST /api/fault-detection/classify` - Classify electrical faults  
- `POST /api/cable-calculator/calculate` - Calculate cable parameters
- `GET /api/projects/` - List user projects

## 🆘 11. Getting Help

If you encounter issues not covered in this guide:

1. **Check Issues**: Visit the [GitHub Issues](https://github.com/yourusername/smartelectro-ai/issues) page
2. **Create Issue**: If your problem isn't listed, create a new issue with:
   - Your operating system
   - Python and Node.js versions
   - Complete error message
   - Steps to reproduce

3. **Community**: Join discussions in the repository

## 🎉 12. Success!

If you've completed all steps successfully, you should have:
- ✅ Backend API running on `http://localhost:8000`
- ✅ Frontend app running on `http://localhost:3000`
- ✅ Database initialized with test user
- ✅ AI models loaded and ready for training/inference
- ✅ All modules (Load Forecasting, Fault Detection, etc.) functional

**Welcome to SmartElectro AI!** 🚀 You're now ready to explore AI-powered electrical engineering tools.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

We welcome contributions! Please read our contributing guidelines and submit pull requests.

## 📧 Support

For technical support, please create an issue on GitHub or contact the development team. 

## 🔐 **1. JWT Configuration Explained**

Your JWT (JSON Web Token) authentication system works as follows:

### **🔧 Configuration Settings**
```env
JWT_SECRET_KEY=your-256-bit-secret-key    # Secret key for signing tokens
JWT_ALGORITHM=HS256                       # HMAC SHA-256 algorithm
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30        # Token expires in 30 minutes
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7           # Refresh token lasts 7 days
```

### **🔄 How JWT Authentication Works**

1. **User Login Process**:
   ```python
   # User sends credentials (username/password)
   POST /api/auth/token
   Content-Type: application/x-www-form-urlencoded
   username=testuser&password=password123
   ```

2. **Token Generation**:
   ```python
   def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
       to_encode = data.copy()
       expire = datetime.utcnow() + timedelta(minutes=30)  # 30 min expiry
       to_encode.update({"exp": expire})
       encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
       return encoded_jwt
   ```

3. **Token Structure**:
   ```json
   {
     "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
     "token_type": "bearer"
   }
   ```

4. **Protected Route Access**:
   ```python
   # Frontend sends token in Authorization header
   Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
   
   # Backend validates token
   async def get_current_user(token: str = Depends(oauth2_scheme)):
       payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
       username = payload.get("sub")
       return get_user(db, username)
   ```

### **🛡️ Security Features**
- **Bcrypt Password Hashing**: Passwords are hashed with salt
- **Token Expiration**: Automatic logout after 30 minutes
- **Stateless Authentication**: No server-side session storage
- **CORS Protection**: Only allows requests from specific origins

---

## 🚀 **2. Setup Process Explained**

### **📋 Why This Setup Process?**

Your SmartElectro AI requires a complex setup because it's a full-stack AI application with:
- **Backend**: FastAPI server with ML models
- **Frontend**: React application 
- **Database**: SQLite with user management
- **AI Models**: Large TensorFlow/scikit-learn models via Git LFS

### **🔄 Step-by-Step Breakdown**

#### **Step 1: Git LFS Handling**
```bash
git lfs install                    # Initialize Git LFS
git clone https://github.com/...   # Auto-downloads large AI models
git lfs ls-files                   # Verify models downloaded
```

**Why Git LFS?** Your AI models (*.h5, *.pkl) are large files (10MB+) that would bloat the repository without LFS.

#### **Step 2: Python Environment**
```bash
python -m venv smartelectro_env    # Isolated Python environment
source smartelectro_env/bin/activate  # Activate environment
pip install -r requirements.txt   # Install 50+ AI/ML packages
```

**Why Virtual Environment?** Prevents conflicts between different Python projects and ensures consistent dependencies.

#### **Step 3: Database Setup**
```bash
python backend/init_db.py         # Creates SQLite database
python backend/create_test_user.py # Creates test user
```

**What This Creates**:
- `smartelectro.db` - SQLite database file
- User table with bcrypt-hashed passwords
- Test user: `testuser/password123`

#### **Step 4: Frontend Dependencies**
```bash
cd frontend
npm install                       # Downloads 500+ Node.js packages
```

**What This Installs**:
- React, TypeScript, Webpack
- Axios for API calls
- Chart.js for visualizations

#### **Step 5: Service Startup**
```bash
# Backend (Port 8000)
cd backend && python main.py

# Frontend (Port 3000/3001)
cd frontend && npm start
```

**Port Configuration**: CORS is configured to allow frontend (3000/3001) to access backend (8000).

---

## 🤖 **3. AI Models Explained**

Your SmartElectro AI uses **4 different AI approaches** across multiple modules:

### **📊 Load Forecasting Models**

#### **🔥 LSTM (Long Short-Term Memory) - Deep Learning**
```python
def create_lstm_model(self, sequence_length: int = 24):
    model = Sequential([
        LSTM(50, return_sequences=True, input_shape=(sequence_length, 1)),
        LSTM(50, return_sequences=True),
        LSTM(50),
        Dense(25),
        Dense(1)
    ])
    return model
```

**How It Learns**:
- **Input**: 24-hour sequences of power consumption data
- **Learning**: Captures temporal patterns and dependencies
- **Training**: Backpropagation through time with early stopping
- **Output**: Predicts next hour's power consumption

**Training Process**:
1. **Data Preparation**: Scale data to 0-1 range
2. **Sequence Creation**: Create 24-hour input sequences
3. **Model Training**: 50 epochs with validation split
4. **Prediction**: Generate multi-step forecasts

#### **🌳 Random Forest - Ensemble Learning**
```python
def create_features(self, data: pd.DataFrame):
    # Time-based features
    features['hour'] = data['timestamp'].dt.hour
    features['day_of_week'] = data['timestamp'].dt.dayofweek
    features['month'] = data['timestamp'].dt.month
    
    # Lag features (previous hours/days)
    for lag in [1, 2, 3, 24, 48, 168]:
        features[f'load_lag_{lag}'] = data['load'].shift(lag)
    
    # Rolling statistics
    features['rolling_mean_24h'] = data['load'].rolling(24).mean()
    return features
```

**How It Learns**:
- **Input**: Engineered features (time, lags, rolling stats)
- **Learning**: Builds 100 decision trees with random subsets
- **Training**: Bootstrap aggregating (bagging) method
- **Output**: Ensemble prediction from all trees

### **⚡ Fault Detection Models**

#### **🌳 Decision Tree - Rule-Based Classification**
```python
def create_decision_tree_model(self):
    model = DecisionTreeClassifier(
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2
    )
    return model
```

**How It Learns**:
- **Input**: Voltage/current features (RMS, THD, power)
- **Learning**: Creates decision rules based on feature thresholds
- **Training**: Finds optimal splits using information gain
- **Output**: Classifies into 5 fault types

#### **🧠 CNN (Convolutional Neural Network) - Deep Learning**
```python
def create_cnn_model(self, input_shape):
    model = Sequential([
        Conv1D(64, 3, activation='relu'),    # Feature extraction
        MaxPooling1D(2),                     # Downsampling
        Conv1D(128, 3, activation='relu'),   # Higher-level features
        MaxPooling1D(2),
        Conv1D(64, 3, activation='relu'),
        Flatten(),
        Dense(128, activation='relu'),        # Classification
        Dropout(0.5),
        Dense(5, activation='softmax')        # 5 fault types
    ])
    return model
```

**How It Learns**:
- **Input**: Raw electrical waveform data
- **Learning**: Convolutional layers extract signal patterns
- **Training**: Backpropagation with dropout for regularization
- **Output**: Probability distribution over fault types

### **🔌 Cable Calculator - Engineering Rules**
```python
def calculate_cable_size(self, current, voltage, length, material):
    # Engineering calculations based on electrical codes
    voltage_drop = (2 * current * length * resistivity) / (voltage * area)
    ampacity = self.get_ampacity_rating(cable_size, material)
    return optimized_cable_size
```

**How It Works**:
- **Input**: Electrical parameters (current, voltage, length)
- **Logic**: Engineering formulas and electrical codes
- **Processing**: Iterative optimization for cable sizing
- **Output**: Optimal cable size with safety margins

### **🔧 Maintenance Alerts - Anomaly Detection**
```python
from sklearn.ensemble import IsolationForest

def detect_anomalies(self, equipment_data):
    model = IsolationForest(contamination=0.1)
    model.fit(normal_data)
    anomalies = model.predict(new_data)
    return anomalies
```

**How It Learns**:
- **Input**: Equipment sensor data (temperature, vibration, current)
- **Learning**: Learns normal operating patterns
- **Detection**: Identifies outliers as potential failures
- **Output**: Anomaly scores and maintenance recommendations

---

## 📚 **4. Documentation Structure Explained**

### **📖 Two-Tier Documentation Strategy**

#### **README.md - Quick Overview**
```markdown
# ⚡ SmartElectro AI
**AI-powered electrical engineering tools**

## 📥 Quick Start
# Just the essential commands
git clone https://github.com/...
pip install -r requirements.txt
python main.py
```

**Purpose**: 
- **First Impression**: Attractive project showcase
- **Quick Start**: Get running in 5 minutes
- **Feature Highlights**: What the system does
- **Technical Stack**: Technologies used

#### **SETUP.md - Detailed Guide**
```markdown
# 🚀 Complete Setup Guide

## 📋 Prerequisites
- Python 3.8+ with verification commands
- Git LFS with installation instructions

## 📥 1. Clone Repository
- Step-by-step Git LFS setup
- Verification commands

## 🔧 8. Troubleshooting
- Common issues and solutions
- Platform-specific fixes
```

**Purpose**:
- **Comprehensive Instructions**: Every step explained
- **Troubleshooting**: Solutions for common problems
- **Cross-Platform**: Works on Windows, macOS, Linux
- **Production Ready**: Environment variables, deployment

### **📋 Documentation Sections Breakdown**

#### **🎯 Why Each Section Exists**

1. **Prerequisites**: Prevents setup failures
2. **Git LFS Instructions**: Handles large AI models
3. **Virtual Environment**: Isolates dependencies
4. **Database Setup**: Creates user system
5. **Environment Variables**: Secure configuration
6. **Service Startup**: Runs both frontend/backend
7. **Verification Steps**: Confirms everything works
8. **Troubleshooting**: Solves common issues
9. **API Documentation**: Developer reference
10. **Project Structure**: Code organization
11. **Development Workflow**: Contributing guidelines

#### **🔄 User Journey Through Documentation**

1. **Discover** → README.md (What is this?)
2. **Quick Try** → README.md Quick Start
3. **Full Setup** → SETUP.md (Detailed instructions)
4. **Troubleshoot** → SETUP.md Section 8
5. **Develop** → SETUP.md Section 9
6. **Deploy** → Environment configuration

### **🎨 Design Principles**

#### **Visual Hierarchy**
- **Emojis**: Quick visual recognition
- **Headers**: Clear section organization
- **Code Blocks**: Formatted commands
- **Badges**: Project status indicators

#### **User Experience**
- **Progressive Disclosure**: Simple → Detailed
- **Copy-Paste Ready**: All commands are executable
- **Platform Agnostic**: Works on all operating systems
- **Error Prevention**: Verification steps included

---

## 🎯 **Summary**

Your SmartElectro AI project is a **sophisticated full-stack AI application** that combines:

- **🔐 Secure Authentication**: JWT tokens with bcrypt passwords
- **🤖 Advanced AI Models**: LSTM, CNN, Random Forest, Decision Trees
- **📊 Real-time Processing**: FastAPI backend with React frontend
- **🛠️ Professional Setup**: Git LFS, virtual environments, comprehensive documentation
- **🔧 Production Ready**: Environment variables, CORS, error handling

The documentation structure ensures that anyone can successfully set up and contribute to your project, regardless of their experience level! 🚀 