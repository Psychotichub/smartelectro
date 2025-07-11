#!/usr/bin/env python3
"""
Backend startup script with proper error handling and user creation
"""
import os
import sys
import uvicorn
from app.models.database import SessionLocal, User, Project
from app.api.auth import get_password_hash

def ensure_test_data():
    """Ensure test user and project exist"""
    db = SessionLocal()
    
    try:
        # Check if test user exists
        user = db.query(User).filter(User.username == 'testuser').first()
        if not user:
            user = User(
                username='testuser',
                email='test@example.com',
                hashed_password=get_password_hash('password123')
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print('✅ Test user created (username: testuser, password: password123)')
        else:
            print('✅ Test user already exists')

        # Check if test project exists
        project = db.query(Project).filter(Project.owner_id == user.id).first()
        if not project:
            project = Project(
                name='Test Project',
                description='A test project for debugging',
                owner_id=user.id
            )
            db.add(project)
            db.commit()
            db.refresh(project)
            print('✅ Test project created')
        else:
            print('✅ Test project already exists')

        print(f'User ID: {user.id}, Project ID: {project.id}')
        return user, project
    except Exception as e:
        print(f'❌ Error creating test data: {e}')
        return None, None
    finally:
        db.close()

def main():
    print("🚀 Starting SmartElectro AI Backend...")
    print("=" * 50)
    
    # Ensure test data exists
    ensure_test_data()
    
    print("=" * 50)
    print("🌐 Starting server on http://localhost:8000")
    print("📊 API Documentation: http://localhost:8000/docs")
    print("=" * 50)
    
    # Start the server
    try:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 