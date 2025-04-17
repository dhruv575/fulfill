import React from 'react';

const HomePage = ({ navigateTo }) => {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Fulfill NJ Data Dashboard</h1>
          <p className="subtitle">Visualizing food distribution across Monmouth and Ocean Counties</p>
        </div>
      </section>

      <section className="project-description">
        <div className="container">
          <h2>About This Project</h2>
          <p>
            Fulfill NJ provides essential services including food distribution to people in Monmouth and Ocean Counties of New Jersey. 
            This data dashboard helps visualize which zip codes are most in need and which areas are currently underserved.
          </p>
          <p>
            The dashboard combines demographic information, food distribution data, service locations, and supplier information to create
            a comprehensive view of Fulfill's impact and identify opportunities for expansion.
          </p>
        </div>
      </section>

      <section className="map-features">
        <div className="container">
          <h2>Map Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📍</div>
              <h3>Interactive Map</h3>
              <p>Explore Monmouth and Ocean Counties with an interactive map that visualizes data by zip code.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Demographic Insights</h3>
              <p>View demographic information including population, food insecurity rates, and socioeconomic factors.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏢</div>
              <h3>Service Locations</h3>
              <p>See all of Fulfill's service locations color-coded by category with detailed information on hover.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3>Supply Chain</h3>
              <p>Visualize the network of suppliers that donate food to Fulfill's distribution locations.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Zip Code Focus</h3>
              <p>Click on any zip code to lock focus and see detailed statistics about that area.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Need Analysis</h3>
              <p>Color-coded visualization showing areas of highest need based on demographic and distribution data.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="get-started">
        <div className="container">
          <h2>Getting Started</h2>
          <p>Use the navigation menu above to explore the dashboard. You can:</p>
          <ul>
            <li>View the interactive map</li>
            <li>Manage data through the Data Management tab</li>
            <li>Import or export data as CSV files</li>
            <li>Filter and customize your view based on specific criteria</li>
          </ul>
          <div className="cta-container">
            <button 
              className="cta-button map-btn" 
              onClick={() => navigateTo('map')}
            >
              View Map Dashboard
            </button>
            <button 
              className="cta-button data-btn" 
              onClick={() => navigateTo('data')}
            >
              Manage Data
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 