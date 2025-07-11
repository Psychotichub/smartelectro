#!/usr/bin/env python3
"""
JWT Token Generator for SmartElectro AI
Generate JWT tokens for testing and authentication
"""

import os
import sys
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import jwt
import json

# JWT Configuration (should match your backend settings)
SECRET_KEY = "your-secret-key-here"  # Change this to match your backend
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token
    
    Args:
        data: Dictionary containing the claims to encode
        expires_delta: Optional expiration time delta
    
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode a JWT token
    
    Args:
        token: JWT token string
    
    Returns:
        Dictionary containing the decoded claims
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return {"error": "Token has expired"}
    except jwt.JWTError as e:
        return {"error": f"Invalid token: {str(e)}"}

def create_user_token(username: str, user_id: Optional[int] = None, expires_minutes: Optional[int] = None) -> str:
    """
    Create a JWT token for a specific user
    
    Args:
        username: Username to encode in token
        user_id: Optional user ID
        expires_minutes: Optional custom expiration time
    
    Returns:
        JWT token string
    """
    data = {"sub": username}
    
    if user_id is not None:
        data["user_id"] = user_id
    
    if expires_minutes:
        expires_delta = timedelta(minutes=expires_minutes)
        return create_access_token(data, expires_delta)
    else:
        return create_access_token(data)

def create_refresh_token(username: str, expires_days: int = 7) -> str:
    """
    Create a refresh token with longer expiration
    
    Args:
        username: Username to encode in token
        expires_days: Expiration time in days
    
    Returns:
        Refresh token string
    """
    data = {"sub": username, "type": "refresh"}
    expires_delta = timedelta(days=expires_days)
    return create_access_token(data, expires_delta)

def verify_token(token: str) -> bool:
    """
    Verify if a token is valid
    
    Args:
        token: JWT token string
    
    Returns:
        True if token is valid, False otherwise
    """
    decoded = decode_token(token)
    return "error" not in decoded

def get_token_info(token: str) -> Dict[str, Any]:
    """
    Get detailed information about a token
    
    Args:
        token: JWT token string
    
    Returns:
        Dictionary with token information
    """
    decoded = decode_token(token)
    
    if "error" in decoded:
        return decoded
    
    # Convert timestamp to readable format
    if "exp" in decoded:
        exp_timestamp = decoded["exp"]
        exp_datetime = datetime.fromtimestamp(exp_timestamp)
        decoded["expires_at"] = exp_datetime.strftime("%Y-%m-%d %H:%M:%S")
        decoded["is_expired"] = datetime.utcnow() > exp_datetime
    
    return decoded

def main():
    """Main function with interactive CLI"""
    print("🔐 JWT Token Generator for SmartElectro AI")
    print("=" * 50)
    
    while True:
        print("\n🛠️  Options:")
        print("1. Generate access token for user")
        print("2. Generate refresh token")
        print("3. Decode existing token")
        print("4. Verify token")
        print("5. Get token information")
        print("6. Generate token with custom data")
        print("7. Exit")
        
        choice = input("\n➤ Choose an option (1-7): ").strip()
        
        if choice == "1":
            print("\n👤 Generate Access Token:")
            username = input("Enter username: ").strip()
            user_id = input("Enter user ID (optional): ").strip()
            expires_minutes = input("Enter expiration minutes (default: 30): ").strip()
            
            if not username:
                print("❌ Username is required!")
                continue
            
            user_id = int(user_id) if user_id else None
            expires_minutes = int(expires_minutes) if expires_minutes else None
            
            token = create_user_token(username, user_id, expires_minutes)
            print(f"\n✅ Access Token Generated:")
            print(f"🔑 Token: {token}")
            print(f"👤 Username: {username}")
            print(f"⏰ Expires: {expires_minutes or ACCESS_TOKEN_EXPIRE_MINUTES} minutes")
            
        elif choice == "2":
            print("\n🔄 Generate Refresh Token:")
            username = input("Enter username: ").strip()
            expires_days = input("Enter expiration days (default: 7): ").strip()
            
            if not username:
                print("❌ Username is required!")
                continue
            
            expires_days = int(expires_days) if expires_days else 7
            
            token = create_refresh_token(username, expires_days)
            print(f"\n✅ Refresh Token Generated:")
            print(f"🔑 Token: {token}")
            print(f"👤 Username: {username}")
            print(f"⏰ Expires: {expires_days} days")
            
        elif choice == "3":
            print("\n🔍 Decode Token:")
            token = input("Enter JWT token: ").strip()
            
            if not token:
                print("❌ Token is required!")
                continue
            
            decoded = decode_token(token)
            print(f"\n📋 Decoded Token:")
            print(json.dumps(decoded, indent=2, default=str))
            
        elif choice == "4":
            print("\n✅ Verify Token:")
            token = input("Enter JWT token: ").strip()
            
            if not token:
                print("❌ Token is required!")
                continue
            
            is_valid = verify_token(token)
            if is_valid:
                print("✅ Token is valid!")
            else:
                print("❌ Token is invalid or expired!")
            
        elif choice == "5":
            print("\n📊 Token Information:")
            token = input("Enter JWT token: ").strip()
            
            if not token:
                print("❌ Token is required!")
                continue
            
            info = get_token_info(token)
            print(f"\n📋 Token Information:")
            print(json.dumps(info, indent=2, default=str))
            
        elif choice == "6":
            print("\n🛠️  Generate Custom Token:")
            print("Enter custom data as JSON (e.g., {'sub': 'user', 'role': 'admin'}):")
            data_str = input("Custom data: ").strip()
            expires_minutes = input("Enter expiration minutes (default: 30): ").strip()
            
            try:
                data = json.loads(data_str) if data_str else {"sub": "custom_user"}
                expires_minutes = int(expires_minutes) if expires_minutes else None
                
                if expires_minutes:
                    expires_delta = timedelta(minutes=expires_minutes)
                    token = create_access_token(data, expires_delta)
                else:
                    token = create_access_token(data)
                
                print(f"\n✅ Custom Token Generated:")
                print(f"🔑 Token: {token}")
                print(f"📋 Data: {json.dumps(data, indent=2)}")
                print(f"⏰ Expires: {expires_minutes or ACCESS_TOKEN_EXPIRE_MINUTES} minutes")
                
            except json.JSONDecodeError:
                print("❌ Invalid JSON format!")
            except ValueError:
                print("❌ Invalid expiration minutes!")
            
        elif choice == "7":
            print("👋 Goodbye!")
            break
        else:
            print("❌ Invalid option. Please choose 1-7.")

def generate_test_tokens():
    """Generate tokens for common test scenarios"""
    print("\n🧪 Generating Test Tokens:")
    print("=" * 30)
    
    # Regular user token
    user_token = create_user_token("testuser", 1)
    print(f"👤 Test User Token: {user_token}")
    
    # Admin token with longer expiration
    admin_token = create_user_token("admin", 2, 60)
    print(f"👑 Admin Token (60 min): {admin_token}")
    
    # Refresh token
    refresh_token = create_refresh_token("testuser")
    print(f"🔄 Refresh Token: {refresh_token}")
    
    return {
        "user_token": user_token,
        "admin_token": admin_token,
        "refresh_token": refresh_token
    }

if __name__ == "__main__":
    # Check if script is run with arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "--test":
            generate_test_tokens()
        elif sys.argv[1] == "--help":
            print("Usage:")
            print("  python createtoken.py           # Interactive mode")
            print("  python createtoken.py --test    # Generate test tokens")
            print("  python createtoken.py --help    # Show this help")
        else:
            print("Unknown argument. Use --help for usage information.")
    else:
        main() 