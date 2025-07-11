# SmartElectro AI 🔌⚡

<div align="center">
  <h3>AI-Powered Electrical Engineering Solutions</h3>
  <p>A comprehensive full-stack AI web application designed for electrical engineers featuring advanced load forecasting, fault detection, cable calculation, and predictive maintenance capabilities.</p>
</div>

---

## 🚀 Features

### 🔮 **Load Forecasting**
- **LSTM Neural Networks**: Deep learning models for time-series prediction
- **Random Forest**: Ensemble learning for robust forecasting
- **Prophet**: Advanced time-series forecasting with seasonality detection
- **Real-time Data Processing**: Live data integration and prediction updates

### ⚡ **Fault Detection**
- **Single-Phase Systems**: Comprehensive fault classification
- **Three-Phase Systems**: Advanced multi-phase fault analysis
- **Anomaly Detection**: AI-powered anomaly identification
- **Real-time Monitoring**: Continuous system health monitoring

### 🔧 **Cable Calculator**
- **Optimal Sizing**: AI-driven cable size optimization
- **Load Analysis**: Comprehensive electrical load calculations
- **Safety Margins**: Automated safety factor calculations
- **Code Compliance**: Industry standard compliance checking

### 🔔 **Maintenance Alerts**
- **Predictive Analytics**: Equipment failure prediction
- **Anomaly Detection**: Advanced pattern recognition
- **Automated Alerts**: Real-time notification system
- **Maintenance Scheduling**: Intelligent maintenance planning

### 📊 **Dashboard & Analytics**
- **Real-time Visualization**: Interactive charts and graphs
- **Project Management**: Comprehensive project tracking
- **Export Capabilities**: PDF and CSV report generation
- **Data Integration**: Multiple data source support

---

## 🛠️ Tech Stack

### **Frontend**
- **React 18** with TypeScript
- **Webpack 5** for module bundling
- **CSS3** with modern styling
- **Chart.js/Plotly** for data visualization

### **Backend**
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM
- **Alembic** - Database migrations
- **JWT Authentication** - Secure user management

### **AI/ML Libraries**
- **TensorFlow 2.15** - Deep learning framework
- **scikit-learn** - Machine learning library
- **Prophet** - Time series forecasting
- **Pandas & NumPy** - Data manipulation
- **Matplotlib & Seaborn** - Data visualization

### **Database**
- **SQLite** - Lightweight database
- **MongoDB** - Document database support

---

## 📋 Prerequisites

- **Python 3.10+** (Required)
- **Node.js 16+** (Required)
- **npm** or **yarn** (Required)
- **Git** (Recommended)

---

## 🚀 Installation

### 1️⃣ **Clone the Repository**

```bash
git clone https://github.com/yourusername/smartelectro-ai.git
cd smartelectro-ai
```

### 2️⃣ **Backend Setup**

#### Create Virtual Environment
```bash
# Using Python 3.10
python -m venv smartelectro_env

# Activate virtual environment
# On Windows:
smartelectro_env\Scripts\activate
# On macOS/Linux:
source smartelectro_env/bin/activate
```

#### Install Dependencies
```bash
pip install -r requirements.txt
```

#### Initialize Database
```bash
cd backend
python init_db.py
```

### 3️⃣ **Frontend Setup**

```bash
cd frontend
npm install
```

---

## 🏃‍♂️ Running the Application

### **Development Mode**

#### Start Backend Server
```bash
cd backend
uvicorn main:app --reload --port 8000
```

#### Start Frontend Server
```bash
cd frontend
npm start
```

### **Production Mode**

#### Build Frontend
```bash
cd frontend
npm run build
```

#### Start Production Server
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 🌐 Access Points

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **API Redoc**: http://localhost:8000/redoc

---

## 📁 Project Structure

```
SmartElectro AI/
├── 📁 backend/
│   ├── 📁 app/
│   │   ├── 📁 api/                     # API endpoints
│   │   │   ├── auth.py                 # Authentication routes
│   │   │   ├── cable_calculator.py     # Cable calculation API
│   │   │   ├── fault_detection.py      # Fault detection API
│   │   │   ├── load_forecasting.py     # Load forecasting API
│   │   │   ├── maintenance_alerts.py   # Maintenance alerts API
│   │   │   └── projects.py             # Project management API
│   │   ├── 📁 models/                  # Database models
│   │   │   └── database.py             # Database configuration
│   │   └── 📁 services/                # Business logic
│   │       ├── cable_calculator.py     # Cable calculation service
│   │       ├── fault_detection.py      # Fault detection service
│   │       ├── load_forecasting.py     # Load forecasting service
│   │       └── maintenance_alerts.py   # Maintenance alerts service
│   ├── main.py                         # FastAPI application
│   ├── init_db.py                      # Database initialization
│   └── smartelectro.db                 # SQLite database
├── 📁 frontend/
│   ├── 📁 src/
│   │   ├── 📁 components/              # Reusable components
│   │   │   └── Layout.tsx              # Main layout component
│   │   ├── 📁 contexts/                # React contexts
│   │   │   └── AuthContext.tsx         # Authentication context
│   │   ├── 📁 pages/                   # Page components
│   │   │   ├── Dashboard.tsx           # Main dashboard
│   │   │   ├── CableCalculator.tsx     # Cable calculator page
│   │   │   ├── FaultDetection.tsx      # Fault detection page
│   │   │   ├── LoadForecasting.tsx     # Load forecasting page
│   │   │   ├── MaintenanceAlerts.tsx   # Maintenance alerts page
│   │   │   ├── Projects.tsx            # Projects page
│   │   │   ├── Login.tsx               # Login page
│   │   │   └── Register.tsx            # Registration page
│   │   ├── App.tsx                     # Main application component
│   │   └── index.tsx                   # Application entry point
│   ├── 📁 public/                      # Static assets
│   ├── package.json                    # Frontend dependencies
│   ├── tsconfig.json                   # TypeScript configuration
│   └── webpack.config.js               # Webpack configuration
├── requirements.txt                    # Python dependencies
├── package.json                        # Root package.json
└── README.md                          # This file
```

---

## 🔧 API Documentation

### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### **Cable Calculator**
- `POST /api/cable-calculator` - Calculate optimal cable size
- `GET /api/cable-calculator/history` - Get calculation history

### **Fault Detection**
- `POST /api/fault-detection/analyze` - Analyze fault patterns
- `GET /api/fault-detection/results` - Get detection results

### **Load Forecasting**
- `POST /api/load-forecasting/predict` - Generate load predictions
- `GET /api/load-forecasting/models` - Get available models

### **Maintenance Alerts**
- `GET /api/maintenance-alerts` - Get maintenance alerts
- `POST /api/maintenance-alerts/create` - Create new alert

### **Projects**
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get specific project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

---

## 💡 Usage Guide

### **1. Getting Started**
1. Register a new account or log in
2. Navigate to the Dashboard
3. Create a new project

### **2. Load Forecasting**
1. Upload historical load data (CSV format)
2. Select forecasting model (LSTM, Random Forest, Prophet)
3. Configure prediction parameters
4. Generate forecasts and view results

### **3. Fault Detection**
1. Upload system data
2. Select system type (single/three-phase)
3. Run fault analysis
4. Review detected anomalies and classifications

### **4. Cable Calculator**
1. Input electrical parameters
2. Specify load requirements
3. Calculate optimal cable size
4. Review safety margins and compliance

### **5. Maintenance Alerts**
1. Set up monitoring parameters
2. Configure alert thresholds
3. Review predictive maintenance recommendations
4. Schedule maintenance activities

---

## 🔍 Troubleshooting

### **Common Issues**

#### **Webpack Configuration Error**
```bash
Error: Invalid options object. Dev Server has been initialized using an options object that does not match the API schema.
```
**Solution**: The webpack.config.js has been updated to use the array format for proxy configuration.

#### **Python Virtual Environment Issues**
```bash
ModuleNotFoundError: No module named 'pip'
```
**Solution**: Recreate the virtual environment and install dependencies again.

#### **Port Already in Use**
```bash
Error: Port 3000 is already in use
```
**Solution**: Change the port in webpack.config.js or kill the process using the port.

#### **Database Connection Issues**
```bash
Database connection failed
```
**Solution**: Ensure the database is properly initialized with `python init_db.py`.

---

## 🧪 Testing

### **Backend Tests**
```bash
cd backend
pytest
```

### **Frontend Tests**
```bash
cd frontend
npm test
```

---

## 📊 Performance

- **Load Time**: < 2 seconds initial load
- **API Response**: < 500ms average response time
- **Concurrent Users**: Supports 100+ concurrent users
- **Data Processing**: Handles datasets up to 10GB

---

## 🚀 Deployment

### **Docker Deployment**
```bash
# Build and run with Docker Compose
docker-compose up --build
```

### **Manual Deployment**
1. Build frontend: `npm run build`
2. Configure environment variables
3. Start backend server
4. Serve frontend static files

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### **Development Guidelines**
- Follow PEP 8 for Python code
- Use TypeScript for frontend development
- Write comprehensive tests
- Update documentation for new features

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙋‍♂️ Support

- **Documentation**: [Wiki](https://github.com/yourusername/smartelectro-ai/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/smartelectro-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/smartelectro-ai/discussions)

---

## 🏆 Acknowledgments

- Built with modern web technologies
- Powered by advanced AI/ML algorithms
- Designed for electrical engineering professionals
- Open source community contributions

---

<div align="center">
  <p>⚡ <strong>SmartElectro AI</strong> - Empowering Electrical Engineers with AI ⚡</p>
</div> 