"""
Database initialization script for SmartElectro AI
Run this script to create the database tables
"""

from app.models.database import init_database

if __name__ == "__main__":
    print("Initializing SmartElectro AI database...")
    init_database()
    print("Database initialized successfully!")
    print("You can now start the FastAPI server with: uvicorn main:app --reload") 