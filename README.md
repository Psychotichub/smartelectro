# ⚡ SmartElectro AI

**AI-powered electrical engineering tools for load forecasting, fault detection, cable calculations, and predictive maintenance.**

![SmartElectro AI](https://img.shields.io/badge/AI-Electrical%20Engineering-blue)
![Python](https://img.shields.io/badge/Python-3.8+-green)
![React](https://img.shields.io/badge/React-18+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-red)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Features

### 🤖 AI-Powered Modules

- **📊 Load Forecasting** - LSTM & Random Forest models for power consumption prediction
- **⚡ Fault Detection** - CNN & Decision Tree models for electrical system fault classification
- **🔌 Cable Calculator** - ML-enhanced cable sizing with voltage drop calculations
- **🔧 Maintenance Alerts** - Anomaly detection for predictive equipment maintenance

### 🎯 Key Capabilities

- **Real-time Analysis** - Process electrical data instantly
- **Multiple ML Models** - LSTM, CNN, Random Forest, Decision Trees
- **Interactive Dashboard** - React-based modern UI
- **RESTful API** - FastAPI backend with automatic documentation
- **User Management** - Secure authentication and project management
- **Data Visualization** - Charts and graphs for insights
- **Model Training** - Train custom models with your data

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Axios, CSS3
- **Backend**: FastAPI, Python 3.8+, SQLAlchemy
- **AI/ML**: TensorFlow, Scikit-learn, Pandas, NumPy
- **Database**: SQLite (development), PostgreSQL (production ready)
- **Authentication**: JWT tokens with secure login
- **File Handling**: Git LFS for large AI model files

## 📥 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Git with Git LFS

### Installation
```bash
# Clone the repository (includes AI models via LFS)
git clone https://github.com/yourusername/smartelectro-ai.git
cd smartelectro-ai

# Backend setup
python -m venv smartelectro_env
smartelectro_env\Scripts\activate  # Windows
source smartelectro_env/bin/activate  # macOS/Linux
pip install -r requirements.txt

# Frontend setup
cd frontend
npm install

# Start backend
cd ../backend
python main.py

# Start frontend (new terminal)
cd frontend
npm start
```

📖 **For detailed setup instructions, see [SETUP.md](SETUP.md)**

## 🎮 Demo

1. **Login**: Use `testuser` / `password123` (created automatically)
2. **Load Forecasting**: Upload CSV data or use sample data to predict future power consumption
3. **Fault Detection**: Input voltage/current values to classify electrical faults
4. **Cable Calculator**: Enter electrical parameters for optimal cable sizing
5. **Maintenance**: Monitor equipment health with anomaly detection

## 📊 AI Models

### Pre-trained Models (via Git LFS)
- **LSTM Models** (*.h5) - Deep learning for time series forecasting
- **CNN Models** (*.h5) - Convolutional networks for signal pattern recognition  
- **Scikit-learn Models** (*.pkl) - Random Forest, Decision Trees for classification

### Supported Fault Types
- **L-G**: Line to Ground faults
- **L-L**: Line to Line faults  
- **L-L-G**: Line to Line to Ground faults
- **3-Φ**: Three-phase faults
- **Normal**: No fault condition

## 🌐 API Endpoints

Access interactive API documentation at `http://localhost:8000/docs`

### Key Endpoints
- `POST /api/auth/token` - User authentication
- `POST /api/load-forecasting/train` - Train forecasting models
- `POST /api/fault-detection/classify` - Classify electrical faults
- `POST /api/cable-calculator/calculate` - Cable sizing calculations
- `GET /api/projects/` - Project management

## 🗂️ Project Structure

```
smartelectro-ai/
├── backend/           # FastAPI backend + AI services
├── frontend/          # React frontend application
├── models/            # Pre-trained AI models (Git LFS)
├── SETUP.md          # Detailed setup instructions
├── requirements.txt   # Python dependencies
└── package.json      # Node.js dependencies
```

## 🔧 Development

### Adding New Models
```python
# Example: Add new forecasting model
from app.services.load_forecasting import LoadForecastingService

service = LoadForecastingService()
result = service.train_custom_model(data, model_type="new_algorithm")
```

### Frontend Development
```bash
cd frontend
npm run dev      # Development mode with hot reload
npm run build    # Production build
npm run test     # Run tests
```

### Backend Development
```bash
cd backend
python main.py        # Start development server
pytest               # Run tests
black .              # Code formatting
```

## 📈 Performance

- **Load Forecasting**: R² score > 0.95 on sample datasets
- **Fault Detection**: >99% accuracy on electrical fault classification
- **Response Time**: <100ms for most API calls
- **Model Training**: Optimized with early stopping and validation

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [SETUP.md](SETUP.md) for detailed instructions
- **Issues**: [GitHub Issues](https://github.com/yourusername/smartelectro-ai/issues)
- **API Docs**: `http://localhost:8000/docs` when running

## 🎯 Roadmap

- [ ] Advanced time series models (Prophet, ARIMA)
- [ ] Real-time data streaming integration
- [ ] Mobile application (React Native)
- [ ] Docker containerization
- [ ] Cloud deployment guides (AWS, GCP, Azure)
- [ ] Advanced visualization dashboards
- [ ] Integration with electrical CAD systems

## 🏆 Acknowledgments

- Built for electrical engineers by developers who understand the industry
- Leverages state-of-the-art AI/ML techniques for practical engineering solutions
- Designed with scalability and production deployment in mind

---

**⚡ Power your electrical engineering with AI!** 

For questions, suggestions, or collaboration opportunities, please open an issue or contact the development team. 