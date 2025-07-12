import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/components/Layout.css';

const Layout: React.FC = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loadForecastingDropdown, setLoadForecastingDropdown] = useState(false);
  const [faultDetectionDropdown, setFaultDetectionDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const loadForecastingRef = useRef<HTMLDivElement>(null);
  const faultDetectionRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (loadForecastingRef.current && !loadForecastingRef.current.contains(event.target as Node)) {
        setLoadForecastingDropdown(false);
      }
      if (faultDetectionRef.current && !faultDetectionRef.current.contains(event.target as Node)) {
        setFaultDetectionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setLoadForecastingDropdown(false);
    setFaultDetectionDropdown(false);
  }, [location.pathname]);

  // Close dropdowns when scrolling
  useEffect(() => {
    const handleScroll = () => {
      setLoadForecastingDropdown(false);
      setFaultDetectionDropdown(false);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Redirect to login if not authenticated (but not while loading)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  const toggleLoadForecastingDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadForecastingDropdown(!loadForecastingDropdown);
    setFaultDetectionDropdown(false);
  };

  const toggleFaultDetectionDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFaultDetectionDropdown(!faultDetectionDropdown);
    setLoadForecastingDropdown(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    setLoadForecastingDropdown(false);
    setFaultDetectionDropdown(false);
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const isActiveDropdown = (paths: string[]) => {
    return paths.some(path => location.pathname === path);
  };

  // Show loading spinner while authentication is initializing
  if (isLoading) {
    return (
      <div className="layout">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading or redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">SmartElectro AI</span>
          </Link>
          
          {/* Mobile Menu Toggle */}
          <button 
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <nav className={`nav ${mobileMenuOpen ? 'mobile-nav-open' : ''}`}>
            <Link 
              to="/" 
              className={`nav-link ${isActivePath('/') ? 'active' : ''}`}
            >
              <span className="nav-icon">🏠</span>
              <span className="nav-text">Dashboard</span>
            </Link>
            
            <Link 
              to="/projects" 
              className={`nav-link ${isActivePath('/projects') ? 'active' : ''}`}
            >
              <span className="nav-icon">📁</span>
              <span className="nav-text">Projects</span>
            </Link>
            
            {/* Load Forecasting Dropdown */}
            <div 
              className={`nav-dropdown ${isActiveDropdown(['/load-forecasting-training', '/load-forecasting-prediction']) ? 'active' : ''}`}
              ref={loadForecastingRef}
            >
              <button 
                className={`dropdown-trigger ${loadForecastingDropdown ? 'dropdown-open' : ''}`}
                onClick={toggleLoadForecastingDropdown}
                aria-haspopup="true"
              >
                <span className="nav-icon">📊</span>
                <span className="nav-text">Load Forecasting</span>
                <span className={`dropdown-arrow ${loadForecastingDropdown ? 'open' : ''}`}>▼</span>
              </button>
              <div className={`dropdown-menu ${loadForecastingDropdown ? 'show' : ''}`}>
                <Link to="/load-forecasting-training" className="dropdown-item">
                  <span className="dropdown-icon">📚</span>
                  <span className="dropdown-text">Training</span>
                </Link>
                <Link to="/load-forecasting-prediction" className="dropdown-item">
                  <span className="dropdown-icon">🔮</span>
                  <span className="dropdown-text">Prediction</span>
                </Link>
              </div>
            </div>
            
            {/* Fault Detection Dropdown */}
            <div 
              className={`nav-dropdown ${isActiveDropdown(['/fault-detection-training', '/fault-detection-prediction']) ? 'active' : ''}`}
              ref={faultDetectionRef}
            >
              <button 
                className={`dropdown-trigger ${faultDetectionDropdown ? 'dropdown-open' : ''}`}
                onClick={toggleFaultDetectionDropdown}
                aria-haspopup="true"
              >
                <span className="nav-icon">⚠️</span>
                <span className="nav-text">Fault Detection</span>
                <span className={`dropdown-arrow ${faultDetectionDropdown ? 'open' : ''}`}>▼</span>
              </button>
              <div className={`dropdown-menu ${faultDetectionDropdown ? 'show' : ''}`}>
                <Link to="/fault-detection-training" className="dropdown-item">
                  <span className="dropdown-icon">📚</span>
                  <span className="dropdown-text">Training</span>
                </Link>
                <Link to="/fault-detection-prediction" className="dropdown-item">
                  <span className="dropdown-icon">🔍</span>
                  <span className="dropdown-text">Prediction</span>
                </Link>
              </div>
            </div>
            
            <Link 
              to="/cable-calculator" 
              className={`nav-link ${isActivePath('/cable-calculator') ? 'active' : ''}`}
            >
              <span className="nav-icon">🔧</span>
              <span className="nav-text">Cable Calculator</span>
            </Link>
            
            <Link 
              to="/maintenance-alerts" 
              className={`nav-link ${isActivePath('/maintenance-alerts') ? 'active' : ''}`}
            >
              <span className="nav-icon">🚨</span>
              <span className="nav-text">Maintenance Alerts</span>
            </Link>
          </nav>
          
          <div className="user-menu">
            <div className="user-info">
              <span className="user-avatar">👤</span>
              <span className="user-name">{user?.username || 'Guest'}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              <span className="logout-icon">🚪</span>
              <span className="logout-text">Logout</span>
            </button>
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