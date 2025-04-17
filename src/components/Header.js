import React from 'react';

const Header = ({ onLogout, activeItem = 'home', onNavigate }) => {
  return (
    <header className="header">
      <div className="logo-section">
        <img 
          src={process.env.PUBLIC_URL + '/images/FulfillLogo.png'} 
          alt="Fulfill NJ Logo" 
          className="header-logo" 
        />
        <div className="title-container">
          <h1>Fulfill NJ</h1>
          <h2>Data Dashboard</h2>
        </div>
      </div>
      <nav className="nav-menu">
        <ul>
          <li className={activeItem === 'home' ? 'active' : ''}>
            <a href="#home" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>
              Home
            </a>
          </li>
          <li className={activeItem === 'data' ? 'active' : ''}>
            <a href="#data" onClick={(e) => { e.preventDefault(); onNavigate('data'); }}>
              Data Management
            </a>
          </li>
          <li className={activeItem === 'map' ? 'active' : ''}>
            <a href="#map" onClick={(e) => { e.preventDefault(); onNavigate('map'); }}>
              Map
            </a>
          </li>
        </ul>
      </nav>
      <div className="actions-section">
        {onLogout && (
          <button onClick={onLogout} className="logout-button">
            <span className="logout-icon">⏻</span> Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default Header; 