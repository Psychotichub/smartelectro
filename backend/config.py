import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class DatabaseConfig:
    """Database configuration class"""
    
    def __init__(self):
        self.database_type = os.getenv("DATABASE_TYPE", "sqlite")
        self.database_host = os.getenv("DATABASE_HOST", "localhost")
        self.database_port = os.getenv("DATABASE_PORT")
        self.database_name = os.getenv("DATABASE_NAME", "smartelectro")
        self.database_user = os.getenv("DATABASE_USER")
        self.database_password = os.getenv("DATABASE_PASSWORD")
    
    def get_database_url(self) -> str:
        """Generate database URL based on configuration"""
        
        if self.database_type == "sqlite":
            return "sqlite:///./smartelectro.db"
        
        elif self.database_type == "postgresql":
            if not all([self.database_user, self.database_password]):
                raise ValueError("PostgreSQL requires DATABASE_USER and DATABASE_PASSWORD")
            port = self.database_port or "5432"
            return f"postgresql://{self.database_user}:{self.database_password}@{self.database_host}:{port}/{self.database_name}"
        
        elif self.database_type == "mysql":
            if not all([self.database_user, self.database_password]):
                raise ValueError("MySQL requires DATABASE_USER and DATABASE_PASSWORD")
            port = self.database_port or "3306"
            return f"mysql+pymysql://{self.database_user}:{self.database_password}@{self.database_host}:{port}/{self.database_name}"
        
        elif self.database_type == "sqlserver":
            if not all([self.database_user, self.database_password]):
                raise ValueError("SQL Server requires DATABASE_USER and DATABASE_PASSWORD")
            port = self.database_port or "1433"
            return f"mssql+pyodbc://{self.database_user}:{self.database_password}@{self.database_host}:{port}/{self.database_name}?driver=ODBC+Driver+17+for+SQL+Server"
        
        else:
            raise ValueError(f"Unsupported database type: {self.database_type}")

# Global configuration instance
db_config = DatabaseConfig()

# Environment variables template (copy to .env file)
ENV_TEMPLATE = """
# Database Configuration - Copy to .env file
# Choose one of the following database types:

# SQLite (Current - for development)
DATABASE_TYPE=sqlite

# PostgreSQL (Recommended for production)
# DATABASE_TYPE=postgresql
# DATABASE_HOST=localhost
# DATABASE_PORT=5432
# DATABASE_NAME=smartelectro
# DATABASE_USER=your_username
# DATABASE_PASSWORD=your_password

# MySQL
# DATABASE_TYPE=mysql
# DATABASE_HOST=localhost
# DATABASE_PORT=3306
# DATABASE_NAME=smartelectro
# DATABASE_USER=your_username
# DATABASE_PASSWORD=your_password

# SQL Server
# DATABASE_TYPE=sqlserver
# DATABASE_HOST=localhost
# DATABASE_PORT=1433
# DATABASE_NAME=smartelectro
# DATABASE_USER=your_username
# DATABASE_PASSWORD=your_password
""" 