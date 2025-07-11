#!/usr/bin/env python3
"""
Create a test user for SmartElectro AI login
"""
import sys
import os
from sqlalchemy.exc import IntegrityError

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.database import get_db, User, create_tables
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def create_test_user(username="testuser", email="test@example.com", password="password123"):
    """Create a test user with specified credentials"""
    try:
        # Create tables if they don't exist
        print("🔧 Creating database tables...")
        create_tables()
        
        # Get database session
        db = next(get_db())
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            print(f"✅ Test user '{username}' already exists!")
            print(f"📧 Email: {email}")
            print(f"🔑 Password: {password}")
            print(f"🆔 User ID: {existing_user.id}")
            return existing_user
        
        # Create new user
        print(f"👤 Creating new user '{username}'...")
        hashed_password = hash_password(password)
        user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            is_active=True
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        print("✅ Test user created successfully!")
        print(f"👤 Username: {username}")
        print(f"📧 Email: {email}")
        print(f"🔑 Password: {password}")
        print(f"🆔 User ID: {user.id}")
        
        return user
        
    except IntegrityError as e:
        print(f"❌ User creation failed: User '{username}' or email '{email}' already exists")
        db.rollback()
        return None
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        return None
    finally:
        if 'db' in locals():
            db.close()

def create_multiple_users():
    """Create multiple test users"""
    users = [
        ("testuser", "test@example.com", "password123"),
        ("admin", "admin@example.com", "admin123"),
        ("demo", "demo@example.com", "demo123"),
    ]
    
    print("🚀 Creating multiple test users...")
    print("=" * 50)
    
    for username, email, password in users:
        print(f"\n➤ Creating user: {username}")
        create_test_user(username, email, password)

def list_users():
    """List all users in the database"""
    try:
        db = next(get_db())
        users = db.query(User).all()
        
        if not users:
            print("📭 No users found in database")
            return
            
        print(f"\n👥 Found {len(users)} users:")
        print("=" * 50)
        for user in users:
            print(f"🆔 ID: {user.id}")
            print(f"👤 Username: {user.username}")
            print(f"📧 Email: {user.email}")
            print(f"✅ Active: {user.is_active}")
            print(f"📅 Created: {user.created_at}")
            print("-" * 30)
            
    except Exception as e:
        print(f"❌ Error listing users: {e}")
    finally:
        if 'db' in locals():
            db.close()

def main():
    """Main function with menu"""
    print("🚀 SmartElectro AI - Test User Manager")
    print("=" * 50)
    
    while True:
        print("\n🔧 Options:")
        print("1. Create single test user (testuser/password123)")
        print("2. Create multiple test users")
        print("3. Create custom user")
        print("4. List all users")
        print("5. Exit")
        
        choice = input("\n➤ Choose an option (1-5): ").strip()
        
        if choice == "1":
            create_test_user()
        elif choice == "2":
            create_multiple_users()
        elif choice == "3":
            print("\n📝 Create Custom User:")
            username = input("Username: ").strip()
            email = input("Email: ").strip()
            password = input("Password: ").strip()
            
            if username and email and password:
                create_test_user(username, email, password)
            else:
                print("❌ All fields are required!")
        elif choice == "4":
            list_users()
        elif choice == "5":
            print("👋 Goodbye!")
            break
        else:
            print("❌ Invalid option. Please choose 1-5.")

if __name__ == "__main__":
    main() 