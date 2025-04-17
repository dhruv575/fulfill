import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { zipService } from '../services/api';
import LocationLayer from '../components/LocationLayer';
import SupplierLayer from '../components/SupplierLayer';

// Import the GeoJSON zip code data
// The file path is relative to the src directory
const zipCodeData = require('../data/filtered_nj_zip_codes.min.json');

// Set Mapbox token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGhydXZndXAiLCJhIjoiY20yZjRoaHF1MDU3ZTJvcHFydGNoemR3bSJ9.IQmyIaXEYPl2NWrZ7hHJxQ';
mapboxgl.accessToken = MAPBOX_TOKEN;

// Define bounds for Monmouth/Ocean County area
const NJ_BOUNDS = [
  [-74.0000, 39.700000], // Southwest coordinates
  [-73.800000, 40.200000]  // Northeast coordinates
];

// Define location category colors (same as in LocationLayer for consistency)
const locationCategoryColors = {
  'Garden': '#2ecc71',        // green
  'SFSP': '#e74c3c',          // red
  'Benefits Assistance': '#000080',  // navy
  'CACFP': '#9b59b6',         // purple
  'Backpack': '#00ffff',      // cyan
  'Group Home': '#ffff00',    // yellow
  'Day Program': '#ffc0cb',   // pink
  'Shelter': '#808080',       // gray
  'Senior Staples Program': '#a52a2a', // brown
  'Afterschool': '#c0c0c0',   // silver
  'Mobile Pantry': '#ffd700',  // gold
  'Default': '#3498db'        // blue for any others
};

const MapPage = () => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null); 
  const popupRef = useRef(new mapboxgl.Popup({ closeButton: false, closeOnClick: false }));
  
  // --- State ---
  const [isMapReady, setIsMapReady] = useState(false); // Track map readiness
  const [selectedZip, setSelectedZip] = useState(null);
  const [zipData, setZipData] = useState(null);
  const [loadingZipData, setLoadingZipData] = useState(false);
  const [zipDataError, setZipDataError] = useState(null);
  const [showZipBoundaries, setShowZipBoundaries] = useState(true);
  const [showLocations, setShowLocations] = useState(true);
  const [showSuppliers, setShowSuppliers] = useState(true);
  
  // Category filters state - default to all visible
  const [categoryFilters, setCategoryFilters] = useState({
    'Garden': true,
    'SFSP': true,
    'Benefits Assistance': true,
    'CACFP': true,
    'Backpack': true,
    'Group Home': true,
    'Day Program': true,
    'Shelter': true,
    'Senior Staples Program': true,
    'Afterschool': true,
    'Mobile Pantry': true,
    'Default': true
  });

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current) return;
    if (!mapContainerRef.current) { console.error("Map container missing"); return; }
    
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-74.1224415, 40.000000],
      zoom: 12,
      maxBounds: NJ_BOUNDS,
      minZoom: 8
    });
    mapInstanceRef.current = map;

    // --- Modified Load Logic ---
    const onMapLoad = () => {
      const currentMap = mapInstanceRef.current;
      if (!currentMap) return; 
      console.log("Map Loaded Event Fired.");

      // Add essential controls and sources immediately on load
      currentMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
      if (!currentMap.getSource('zip-boundaries')) {
        currentMap.addSource('zip-boundaries', { type: 'geojson', data: zipCodeData });
      }
      // Add zip layers immediately
      if (!currentMap.getLayer('zip-fills')) {
        currentMap.addLayer({ id: 'zip-fills', type: 'fill', source: 'zip-boundaries', paint: { 'fill-color': '#3498db', 'fill-opacity': 0.3 } });
      }
      if (!currentMap.getLayer('zip-borders')) {
        currentMap.addLayer({ id: 'zip-borders', type: 'line', source: 'zip-boundaries', paint: { 'line-color': '#2c3e50', 'line-width': 1 } });
      }
      if (!currentMap.getLayer('zip-labels')) {
        currentMap.addLayer({ id: 'zip-labels', type: 'symbol', source: 'zip-boundaries', layout: { 'text-field': ['get', 'ZCTA5CE10'], 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'], 'text-size': 10, 'text-allow-overlap': false }, paint: { 'text-color': '#333', 'text-halo-color': 'rgba(255,255,255,0.8)', 'text-halo-width': 1 } });
      }
      
      // Add interactivity listeners
      currentMap.on('click', 'zip-fills', async (e) => {
        if (e.features.length > 0) {
          const feature = e.features[0];
          const zipCode = feature.properties.ZCTA5CE10;
          setSelectedZip(zipCode);
          fetchZipData(zipCode);
          popupRef.current.remove(); // Remove existing popup
        }
      });
      
      currentMap.fitBounds(NJ_BOUNDS, { padding: 20, duration: 0 });

      // Define the function to set map ready state
      const setMapAsReady = () => {
        // Check if map still exists (might have unmounted)
        if (mapInstanceRef.current) { 
          console.log("Map Style Data Loaded. Marking map as ready.");
          setIsMapReady(true); 
        }
      };

      // Wait for the style to be fully loaded/rendered
      if (currentMap.isStyleLoaded()) {
          // If style is already loaded when 'load' fires, set ready immediately
          setMapAsReady();
      } else {
          // Otherwise, wait for the 'styledata' event
          console.log("Map Load fired, but style not fully loaded. Waiting for 'styledata'...");
          currentMap.once('styledata', setMapAsReady);
      }
    };

    map.on('load', onMapLoad);
    map.on('error', (e) => { console.error('Mapbox Map Error:', e); });

    // Cleanup function
    return () => {
      console.log("Running map cleanup...");
      setIsMapReady(false); // Mark map as not ready on cleanup
      if (mapInstanceRef.current) {
        // Remove listeners explicitly if needed, though map.remove() should handle most
        mapInstanceRef.current.off('load', onMapLoad);
        // Note: Removing 'styledata' listener isn't strictly necessary for 'once', but good practice if logic changes
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        console.log("Map instance removed.");
      }
    };
  }, []); // Runs once

  // Fetch data for a specific zip code
  const fetchZipData = async (zipCode) => {
    setLoadingZipData(true);
    setZipDataError(null);
    try {
      const response = await zipService.getByGeography(zipCode);
      // *** Potential Data Cleaning Needed Here for Zip Data ***
      // Example: Ensure keys match expected format (e.g., trim spaces)
      const cleanedData = {};
      for (const key in response) {
        cleanedData[key.trim()] = response[key];
      }
      setZipData(cleanedData);
    } catch (err) {
      setZipDataError(`Failed to load data for zip code ${zipCode}`);
      setZipData(null);
    } finally {
      setLoadingZipData(false);
    }
  };

  // Format numbers with commas (e.g., 1,234,567)
  const formatNumber = (num) => {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString();
  };

  // Format percentages
  const formatPercent = (decimal) => {
    if (decimal === undefined || decimal === null) return 'N/A';
    return `${(decimal * 100).toFixed(2)}%`;
  };

  // Handlers for checkboxes (keep as is)
  const handleZipBoundariesToggle = () => setShowZipBoundaries(!showZipBoundaries);
  const handleLocationsToggle = () => setShowLocations(!showLocations);
  const handleSuppliersToggle = () => setShowSuppliers(!showSuppliers);
  
  // New handler for category filters
  const handleCategoryToggle = (category) => {
    setCategoryFilters(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Render ZIP code information
  const renderZipInfo = () => {
    if (loadingZipData) return <div className="zip-loading">Loading...</div>;
    if (zipDataError) return <div className="zip-error">{zipDataError}</div>;
    if (!zipData) return <p>Click on a zip code to see its data.</p>;
    
    // Use bracket notation for potentially spaced keys
    return (
      <div className="zip-details">
        <div className="zip-stat-group">
          <div className="zip-stat"><span className="stat-label">County:</span><span className="stat-value">{zipData.county || 'N/A'}</span></div>
          <div className="zip-stat"><span className="stat-label">Population:</span><span className="stat-value">{formatNumber(zipData['tot_pop'])}</span></div>
        </div>
        <div className="zip-stat-group"><h4>Food Insecurity</h4>
          <div className="zip-stat"><span className="stat-label">% Insecure:</span><span className="stat-value">{formatPercent(zipData.pct_food_insecure)}</span></div>
          <div className="zip-stat"><span className="stat-label"># Insecure:</span><span className="stat-value">{formatNumber(zipData['number_food_insecure'])}</span></div>
        </div>
        <div className="zip-stat-group"><h4>Demographics</h4>
          <div className="zip-stat"><span className="stat-label">Unemployment:</span><span className="stat-value">{formatPercent(zipData.unemployment_rate)}</span></div>
          <div className="zip-stat"><span className="stat-label">Poverty Rate:</span><span className="stat-value">{formatPercent(zipData.pct_poverty)}</span></div>
          <div className="zip-stat"><span className="stat-label">Black:</span><span className="stat-value">{formatPercent(zipData.pct_black)}</span></div>
          <div className="zip-stat"><span className="stat-label">Hispanic:</span><span className="stat-value">{formatPercent(zipData.pct_hispanic)}</span></div>
          <div className="zip-stat"><span className="stat-label">Homeowners:</span><span className="stat-value">{formatPercent(zipData.pct_homeowners)}</span></div>
          <div className="zip-stat"><span className="stat-label">Disability:</span><span className="stat-value">{formatPercent(zipData.pct_disability)}</span></div>
        </div>
        <div className="zip-stat-group"><h4>Economic</h4>
          <div className="zip-stat"><span className="stat-label">Median Income:</span><span className="stat-value">${formatNumber(zipData['median_income'])}</span></div>
        </div>
        <div className="zip-stat-group"><h4>Food Distribution</h4>
          <div className="zip-stat"><span className="stat-label">Produce (lbs):</span><span className="stat-value">{formatNumber(zipData.Produce)}</span></div>
          <div className="zip-stat"><span className="stat-label">All Food (lbs):</span><span className="stat-value">{formatNumber(zipData.all)}</span></div>
        </div>
      </div>
    );
  };

  return (
    <div className="mapbox-container">
      <div className="mapbox-sidebar">
        <div className="sidebar-content">
          <h2>Map Filters</h2>
          <p>Toggle layers and click zip codes.</p>
          
          <div className="filter-section">
            <h3>Zip Codes</h3>
            <div className="filter-options">
              <label className="filter-checkbox">
                <input type="checkbox" checked={showZipBoundaries} onChange={handleZipBoundariesToggle} />
                <span>Show Boundaries</span>
              </label>
              {/* Add other zip filters later */}
            </div>
          </div>
          
          {selectedZip && (
            <div className="selected-zip-info">
              <h3>Selected Zip: {selectedZip}</h3>
              {renderZipInfo()}
            </div>
          )}
          
          <div className="filter-section">
            <h3>Locations</h3>
            <div className="filter-options">
              <label className="filter-checkbox">
                <input type="checkbox" checked={showLocations} onChange={handleLocationsToggle} />
                <span>Show Locations</span>
              </label>
              
              {/* Category filters */}
              {showLocations && (
                <div className="category-filters">
                  <h4>Categories</h4>
                  {Object.keys(categoryFilters).map(category => (
                    <label key={category} className="filter-checkbox category-filter">
                      <input 
                        type="checkbox" 
                        checked={categoryFilters[category]} 
                        onChange={() => handleCategoryToggle(category)} 
                      />
                      <span className="color-indicator" style={{ backgroundColor: locationCategoryColors[category] }}></span>
                      <span>{category}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="filter-section">
            <h3>Suppliers</h3>
            <div className="filter-options">
              <label className="filter-checkbox">
                <input type="checkbox" checked={showSuppliers} onChange={handleSuppliersToggle} />
                <span>Show Suppliers</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div className="mapbox-view">
        <div ref={mapContainerRef} className="mapbox-element">
          {/* Render Layer Components when map is ready */} 
          {isMapReady && mapInstanceRef.current && (
            <>
              <LocationLayer 
                  map={mapInstanceRef.current} 
                  popupRef={popupRef} 
                  isVisible={showLocations} 
                  isMapReady={isMapReady}
                  token={MAPBOX_TOKEN}
                  categoryFilters={categoryFilters}
              />
              <SupplierLayer 
                  map={mapInstanceRef.current} 
                  popupRef={popupRef} 
                  isVisible={showSuppliers} 
                  isMapReady={isMapReady}
                  token={MAPBOX_TOKEN}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPage; 