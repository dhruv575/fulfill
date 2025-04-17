import React, { useState, useEffect } from 'react';
import './App.css';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import DataDashboard from './pages/DataDashboard';
import MapPage from './pages/MapPage';
import Header from './components/Header';
import Footer from './components/Footer';
import ServerStatus from './components/ServerStatus';
import { authService } from './services/api';
import { API_URL } from './config';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [authError, setAuthError] = useState('');

  // Check if user is already authenticated on load
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await authService.checkAuth();
        setIsAuthenticated(response.authenticated);
      } catch (error) {
        
        // Check if it's a connection error
        if (error.message && (
          error.message.includes('Network error') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('CORS')
        )) {
          setAuthError(`Cannot connect to the server at ${API_URL}. Please ensure the backend is running.`);
        } else {
          setAuthError(error.message || 'Authentication failed. Please try again.');
        }
        
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  const handleLogin = (status) => {
    setIsAuthenticated(status);
    setAuthError(''); // Clear any auth errors on successful login
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
    } catch (error) {
      // Even if logout fails, force logout on the frontend
      setIsAuthenticated(false);
    }
  };

  const navigateTo = (page) => {
    setCurrentPage(page);
  };

  // Function to update the Header navigation based on current page
  const getActiveNavItem = () => {
    switch (currentPage) {
      case 'home':
        return 'home';
      case 'data':
        return 'data';
      case 'map':
        return 'map';
      default:
        return 'home';
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage navigateTo={navigateTo} />;
      case 'data':
        return <DataDashboard />;
      case 'map':
        return <MapPage />;
      default:
        return <HomePage navigateTo={navigateTo} />;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading...</div>
        {authError && <div className="error-message">{authError}</div>}
        <ServerStatus />
      </div>
    );
  }

  return (
    <div className="App">
      {!isAuthenticated ? (
        <>
          <LoginPage onLogin={handleLogin} authError={authError} />
          <ServerStatus />
        </>
      ) : (
        <div className="dashboard-container">
          <Header 
            onLogout={handleLogout} 
            activeItem={getActiveNavItem()}
            onNavigate={navigateTo}
          />
          <main className="app-content">
            {renderContent()}
          </main>
          <Footer />
        </div>
      )}
    </div>
  );
}

export default App;
