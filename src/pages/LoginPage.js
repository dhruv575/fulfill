import React, { useState, useEffect } from 'react';
import { authService } from '../services/api';
import { API_URL } from '../config';

const LoginPage = ({ onLogin, authError }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Set error from props if present
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Check if the password is correct
    if (password === 'MonmouthAndOcean') {
      try {
        console.log('🔒 Attempting login with password');
        await authService.login(password);
        console.log('✅ Login successful');
        onLogin(true);
      } catch (err) {
        console.error('🔴 Login error:', err);
        
        // Check if it's a connection error
        if (err.message && (
          err.message.includes('Network error') || 
          err.message.includes('Failed to fetch') ||
          err.message.includes('CORS')
        )) {
          setError(`Cannot connect to the server at ${API_URL}. Please ensure the backend is running.`);
        } else {
          setError(err.message || 'Server error. Please try again later.');
        }
      }
    } else {
      console.log('❌ Invalid password attempt');
      setError('Invalid password. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="logo-container">
          <img 
            src={process.env.PUBLIC_URL + '/images/FulfillLogo.png'} 
            alt="Fulfill NJ Logo" 
            className="fulfill-logo" 
          />
        </div>
        <h1>Fulfill NJ Data Dashboard</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={loading}
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage; 