import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/pages/Modules.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(username, password);
    
    if (success) {
      navigate('/');
    } else {
      setError('Invalid username or password');
    }
    
    setLoading(false);
  };

  return (
    <div className="electric-training-container electric-auth-container">
      <div className="electric-control-section electric-auth-content">
        <div className="electric-auth-header">
          <h1 className="electric-auth-title">⚡ SmartElectro AI</h1>
          <h2 className="electric-auth-subtitle">Welcome Back</h2>
          <p className="electric-auth-description">Sign in to your electrical engineering dashboard</p>
        </div>
        
        <form onSubmit={handleSubmit} className="electric-auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="electric-config-card">
            <label htmlFor="username" className="electric-auth-label">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
              className="electric-input"
            />
          </div>
          
          <div className="electric-config-card">
            <label htmlFor="password" className="electric-auth-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="electric-input"
            />
          </div>
          
          <button type="submit" disabled={loading} className="electric-train-button">
            {loading ? 'Signing In...' : '⚡ Sign In'}
          </button>
        </form>
        
        <div className="electric-auth-footer">
          <p className="electric-auth-footer-text">
            Don't have an account?{' '}
            <Link to="/register" className="electric-auth-link">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 