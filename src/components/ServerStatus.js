import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

const ServerStatus = () => {
  const [status, setStatus] = useState('checking'); // 'checking', 'connected', 'disconnected'
  const [message, setMessage] = useState('Checking server connection...');
  const [visible, setVisible] = useState(true);
  const [fadeTimeout, setFadeTimeout] = useState(null);

  useEffect(() => {
    // Check server connection on mount and every 60 seconds (increased from 30 to reduce checks)
    checkServerConnection();
    const interval = setInterval(checkServerConnection, 60000);
    
    return () => {
      clearInterval(interval);
      if (fadeTimeout) clearTimeout(fadeTimeout);
    };
  }, []);

  useEffect(() => {
    // When status changes to connected, set a timeout to fade the status notification
    if (status === 'connected' && visible) {
      const timeout = setTimeout(() => {
        setVisible(false);
      }, 5000);
      
      setFadeTimeout(timeout);
      return () => clearTimeout(timeout);
    }
    
    // Keep status visible for disconnected state
    if (status === 'disconnected') {
      setVisible(true);
      if (fadeTimeout) {
        clearTimeout(fadeTimeout);
        setFadeTimeout(null);
      }
    }
  }, [status]);

  const checkServerConnection = async () => {
    try {
      setStatus('checking');
      setMessage('Checking server connection...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${API_URL}/health`, { 
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setStatus('connected');
        setMessage('Connected to server');
      } else {
        setStatus('disconnected');
        setMessage(`Server error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setStatus('disconnected');
      
      if (error.name === 'AbortError') {
        setMessage('Connection timeout. Server not responding.');
      } else if (error.message.includes('Failed to fetch')) {
        setMessage(`Cannot connect to server at ${API_URL}. Is it running?`);
      } else {
        setMessage(`Connection error: ${error.message}`);
      }
    }
  };

  const handleCloseClick = () => {
    setVisible(false);
  };

  const handleStatusClick = () => {
    // Make status visible again if clicked
    setVisible(true);
    // Reset fade timeout
    if (fadeTimeout) {
      clearTimeout(fadeTimeout);
      setFadeTimeout(null);
    }
    
    // Re-check connection when clicked
    checkServerConnection();
  };

  if (!visible && status !== 'checking') {
    return (
      <div 
        className={`server-status ${status} fade`}
        onClick={handleStatusClick}
        style={{ cursor: 'pointer' }}
      >
        <span className="server-status-icon">
          {status === 'connected' ? '✓' : '✗'}
        </span>
      </div>
    );
  }

  return (
    <div className={`server-status ${status}`}>
      <span className="server-status-icon">
        {status === 'connected' ? '✓' : status === 'disconnected' ? '✗' : '⟳'}
      </span>
      <span className="server-status-message">{message}</span>
      <button className="server-status-close" onClick={handleCloseClick}>×</button>
    </div>
  );
};

export default ServerStatus; 