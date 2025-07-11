# SmartElectro AI Setup Script for Windows PowerShell
# This script sets up the Python 3.10 virtual environment and installs all dependencies

Write-Host "Setting up SmartElectro AI Application..." -ForegroundColor Green

# Check if Python 3.10 is available
Write-Host "Checking Python 3.10 availability..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($pythonVersion -notmatch "Python 3\.10") {
    Write-Host "Python 3.10 is required. Please install Python 3.10 first." -ForegroundColor Red
    Write-Host "Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

Write-Host "Python 3.10 found: $pythonVersion" -ForegroundColor Green

# Create virtual environment
Write-Host "Creating virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "Virtual environment already exists. Removing..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "venv"
}

python -m venv venv
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create virtual environment" -ForegroundColor Red
    exit 1
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install Python dependencies" -ForegroundColor Red
    exit 1
}

# Create project directories
Write-Host "Creating project structure..." -ForegroundColor Yellow
$directories = @(
    "backend",
    "backend/app",
    "backend/app/models",
    "backend/app/services",
    "backend/app/api",
    "backend/app/utils",
    "frontend",
    "frontend/src",
    "frontend/src/components",
    "frontend/src/pages",
    "frontend/src/services",
    "frontend/src/utils",
    "data",
    "data/datasets"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force
        Write-Host "Created directory: $dir" -ForegroundColor Gray
    }
}

Write-Host "Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "To activate the virtual environment in the future, run:" -ForegroundColor Yellow
Write-Host "venv\Scripts\Activate.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run 'cd backend && python main.py' to start the backend server" -ForegroundColor Cyan
Write-Host "2. Run 'cd frontend && npm start' to start the frontend (after setting up React)" -ForegroundColor Cyan 