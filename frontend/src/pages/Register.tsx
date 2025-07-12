import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/pages/Modules.css';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    const success = await register(username, email, password);
    
    if (success) {
      navigate('/');
    } else {
      setError('Registration failed. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="electric-training-container electric-auth-container">
      <div className="electric-control-section electric-auth-content">
        <div className="electric-auth-header">
          <h1 className="electric-auth-title">⚡ SmartElectro AI</h1>
          <h2 className="electric-auth-subtitle">Create Account</h2>
          <p className="electric-auth-description">Join the future of electrical engineering</p>
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
              placeholder="Choose a username"
              className="electric-input"
            />
          </div>
          
          <div className="electric-config-card">
            <label htmlFor="email" className="electric-auth-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
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
              placeholder="Create a password"
              className="electric-input"
            />
          </div>
          
          <div className="electric-config-card">
            <label htmlFor="confirmPassword" className="electric-auth-label">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your password"
              className="electric-input"
            />
          </div>
          
          <button type="submit" disabled={loading} className="electric-train-button">
            {loading ? 'Creating Account...' : '⚡ Create Account'}
          </button>
        </form>
        
        <div className="electric-auth-footer">
          <p className="electric-auth-footer-text">
            Already have an account?{' '}
            <Link to="/login" className="electric-auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 