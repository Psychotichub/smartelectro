# SmartElectro AI - Troubleshooting Guide

## 500 Internal Server Error When Training Models

### Quick Fix Steps

1. **Start the Backend Server**
   ```bash
   cd backend
   python start_backend.py
   ```
   
   This will:
   - Create a test user (username: `testuser`, password: `password123`)
   - Create a test project
   - Start the backend server on port 8000

2. **Login to the Frontend**
   - Go to http://localhost:3000/login
   - Use credentials: `testuser` / `password123`

3. **Test Model Training**
   - Go to Load Forecasting page
   - Select "Test Project"
   - Click "Use Sample Data"
   - Select model type (Random Forest or LSTM)
   - Click "Train Model"

### Common Issues and Solutions

#### Issue 1: Backend Server Not Running
**Error**: `Unable to connect to server. Please check if the backend is running on port 8000.`

**Solution**:
```bash
cd backend
python start_backend.py
```

#### Issue 2: Authentication Failed
**Error**: `Authentication failed. Please log in again.`

**Solution**:
1. Clear browser local storage
2. Login again with `testuser` / `password123`

#### Issue 3: Project Not Found
**Error**: `Project not found. Please select a valid project.`

**Solution**:
1. Make sure you're logged in
2. If no projects exist, create one using the test user

#### Issue 4: Database Issues
**Error**: Various database-related errors

**Solution**:
```bash
cd backend
python -c "from app.models.database import create_tables; create_tables()"
```

### Manual Testing

#### Test Backend API Directly
```bash
cd backend
python test_api.py
```

#### Test Training Service
```bash
cd backend
python debug_train.py
```

### Server Status Check

Check if backend is running:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status": "healthy", "service": "SmartElectro AI Backend"}
```

### API Documentation

Once the backend is running, visit:
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### Debug Mode

For detailed logging, set environment variable:
```bash
export LOG_LEVEL=debug
python start_backend.py
```

### Common Port Conflicts

If port 8000 is in use:
```bash
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Need Help?

1. Check the backend console logs for detailed error messages
2. Check browser console for frontend errors
3. Verify all dependencies are installed: `pip install -r requirements.txt`
4. Verify the database is initialized: `python init_db.py` 