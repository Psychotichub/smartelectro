import React, { useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/components/Layout.css';

const Layout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Show loading or redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">⚡ SmartElectro AI</h1>
          <nav className="nav">
            <Link to="/" className="nav-link">Dashboard</Link>
            <Link to="/projects" className="nav-link">Projects</Link>
            <Link to="/load-forecasting" className="nav-link">Load Forecasting</Link>
            <Link to="/fault-detection" className="nav-link">Fault Detection</Link>
            <Link to="/cable-calculator" className="nav-link">Cable Calculator</Link>
            <Link to="/maintenance-alerts" className="nav-link">Maintenance Alerts</Link>
          </nav>
          <div className="user-menu">
            <span className="user-name">Welcome, {user?.username || 'Guest'}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout; 