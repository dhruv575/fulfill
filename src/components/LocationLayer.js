import { useEffect, useState, useCallback, memo } from 'react';
import { locationService } from '../services/api';
import mapboxgl from 'mapbox-gl';

// Define colors for location categories (can be moved to a config file)
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

// Mapbox Token No longer needed globally here
// const MAPBOX_TOKEN = mapboxgl.accessToken;

// Helper to create GeoJSON using latitude/longitude from item
const createGeoJSON = (data) => {
  const features = data
    // Ensure item has latitude and longitude and they are numbers
    .filter(item => typeof item.latitude === 'number' && typeof item.longitude === 'number') 
    .map(item => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        // Use longitude, latitude order for GeoJSON
        coordinates: [item.longitude, item.latitude] 
      },
      properties: { 
        Name: item.Name || item.name, // Use correct field names from model, handle both cases
        Address: item.Address || item.address, 
        Category: item.Category || item.category || 'Default', // Handle both cases + fallback
        id: item._id // Include ID for potential future use
      }
    }));
  return { type: 'FeatureCollection', features };
};

// Geocode function using direct fetch - now takes token
const geocodeAddress = async (address, token) => {
  // Max address length (arbitrary, adjust if needed)
  const MAX_ADDRESS_LENGTH = 256; // Limit total characters 
  // Max address parts (Mapbox seems to limit around 20 tokens)
  const MAX_ADDRESS_PARTS = 20; 

  if (!address) { console.warn("LL: Attempted to geocode empty address."); return { coordinates: null, county: 'Unknown' }; }
  if (!token) { console.error("LL: Mapbox token missing."); return { coordinates: null, county: 'Unknown' }; }

  let addressToGeocode = address.trim();
  const addressParts = addressToGeocode.split(/[,\s]+/); // Split by comma or space

  // Check length and parts
  if (addressToGeocode.length > MAX_ADDRESS_LENGTH || addressParts.length > MAX_ADDRESS_PARTS) {
    console.warn(`LL: Address potentially too long (${addressParts.length} parts / ${addressToGeocode.length} chars), truncating... Original:`, address);
    // Truncate by parts (more likely cause of token error)
    addressToGeocode = addressParts.slice(0, MAX_ADDRESS_PARTS).join(' '); 
    console.warn(`LL: Truncated address:`, addressToGeocode);
  }

  try {
    // Use addressToGeocode (original or truncated)
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addressToGeocode)}.json?access_token=${token}&country=US&limit=1`
    );
    if (!response.ok) {
      const errorBody = await response.text();
      // Use original address in error log for context
      console.error(`LL: Mapbox API Error (${response.status}): ${errorBody} for original address: ${address}`); 
      throw new Error(`Geocoding failed with status ${response.status}`);
    }
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const coordinates = data.features[0].center;
      const county = data.features[0].context?.find(c => c.id.includes('region'))?.text || 'Unknown'; 
      return { coordinates, county };
    } else {
      console.warn(`LL: No geocoding results for (potentially truncated): ${addressToGeocode}`);
      return { coordinates: null, county: 'Unknown' };
    }
  } catch (error) {
    console.error(`LL: Geocoding fetch failed for original address "${address}":`, error);
    return { coordinates: null, county: 'Unknown' };
  }
};

const LocationLayer = memo(({ map, popupRef, isVisible, isMapReady, token, categoryFilters = {} }) => {
  const [locations, setLocations] = useState([]); // State now holds items with lat/lng potentially
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // No longer need separate rawLocations state if we process immediately
  // const [rawLocations, setRawLocations] = useState([]); 
  const sourceId = 'locations';
  const layerId = 'locations-points';

  // Apply category filters to locations
  useEffect(() => {
    if (!locations.length) {
      setFilteredLocations([]);
      return;
    }

    // If categoryFilters prop wasn't provided, show all locations
    if (!categoryFilters || Object.keys(categoryFilters).length === 0) {
      setFilteredLocations(locations);
      return;
    }

    // Filter locations based on category filters
    const filtered = locations.filter(loc => {
      // Get category - check both uppercase and lowercase property names
      // The database field is "Category" (uppercase) but might be normalized to "category" (lowercase)
      const category = loc.Category || loc.category || 'Default';
      // Check if this category is enabled in filters
      return categoryFilters[category] === true;
    });

    console.log(`LL: Filtered locations from ${locations.length} to ${filtered.length} based on category filters`);
    setFilteredLocations(filtered);
  }, [locations, categoryFilters]);

  // Fetch and process locations (combining fetch and geocode logic)
  const fetchAndProcessLocations = useCallback(async () => {
    if (!isMapReady || !token) return; // Need map and token

    setIsLoading(true);
    try {
      const items = await locationService.getAll();
      if (!items || items.length === 0) {
          setLocations([]);
          setIsLoading(false);
          return;
      }

      const processedItems = await Promise.all(items.map(async (item) => {
        // Check if coordinates exist and are valid numbers
        if (typeof item.latitude === 'number' && typeof item.longitude === 'number') {
          return item; 
        } else {
          // Geocode if coordinates are missing
          // Get the address - handle both uppercase and lowercase property names
          const address = item.Address || item.address;
          const name = item.Name || item.name; // For logs
          
          const { coordinates, county } = await geocodeAddress(address, token);
          
          if (coordinates && coordinates.length === 2) {
            const [longitude, latitude] = coordinates;
            
            // Save coordinates to backend (fire and forget, handle errors silently for now)
            locationService.updateCoordinates(item._id, { latitude, longitude })
              .catch(err => { console.error(`LL: Failed to save coords for ${name}:`, err); });
              
            // Return item with new coordinates and county
            return { ...item, latitude, longitude, county }; 
          } else {
            // Return item without coordinates if geocoding failed
            return { ...item, latitude: null, longitude: null }; 
          }
        }
      }));
      
      // Filter out items where geocoding failed completely and coords weren't present
      const validLocations = processedItems.filter(item => typeof item.latitude === 'number' && typeof item.longitude === 'number');
      setLocations(validLocations); // Update state with processed items

    } catch (err) {
      console.error("LL: Error fetching/processing:", err);
      setLocations([]); // Clear locations on error
    } finally {
      setIsLoading(false);
    }
  }, [isMapReady, token]);

  // Effect to fetch and process data when map is ready and token available
  useEffect(() => {
    fetchAndProcessLocations();
  }, [fetchAndProcessLocations]); // Use the callback dependency

  // Effect to add/update map source and layer - now uses 'filteredLocations' state which has category filtering applied
  useEffect(() => {
    if (!isMapReady || !map || !map.isStyleLoaded()) { // Removed locations.length check here
        return;
    }

    // Handle empty locations: Remove layer and source if they exist
    if (filteredLocations.length === 0) {
        if (map.getLayer(layerId)) {
            try { map.removeLayer(layerId); } catch (e) { /* Keep error */ console.error("LL: Err removing layer", e); }
            console.log("LocationLayer: Layer removed due to empty data.");
        }
        if (map.getSource(sourceId)) {
            try { map.removeSource(sourceId); } catch (e) { /* Keep error */ console.error("LL: Err removing source", e); }
            console.log("LocationLayer: Source removed due to empty data.");
        }
        return; // Stop here if no locations
    }
    
    // If we have locations, proceed with adding/updating source and layer
    const source = map.getSource(sourceId);
    const geojsonData = createGeoJSON(filteredLocations); // Use filtered locations

    if (source) {
      try { source.setData(geojsonData); } catch (e) { /* Keep error */ console.error("LL: Err setData", e); }
    } else {
      try {
        map.addSource(sourceId, { type: 'geojson', data: geojsonData });
        // Add layer only if source was newly added and layer doesn't exist
        if (!map.getLayer(layerId)) {
            map.addLayer({
              id: layerId,
              type: 'circle',
              source: sourceId,
              paint: {
                'circle-radius': 6,
                'circle-color': [
                  'match',
                  ['get', 'Category'], 
                  'Garden', locationCategoryColors['Garden'],
                  'SFSP', locationCategoryColors['SFSP'],
                  'Benefits Assistance', locationCategoryColors['Benefits Assistance'],
                  'CACFP', locationCategoryColors['CACFP'],
                  'Backpack', locationCategoryColors['Backpack'],
                  'Group Home', locationCategoryColors['Group Home'],
                  'Day Program', locationCategoryColors['Day Program'],
                  'Shelter', locationCategoryColors['Shelter'],
                  'Senior Staples Program', locationCategoryColors['Senior Staples Program'],
                  'Afterschool', locationCategoryColors['Afterschool'],
                  'Mobile Pantry', locationCategoryColors['Mobile Pantry'],
                  locationCategoryColors['Default'] // Default color
                ],
                'circle-stroke-width': 1,
                'circle-stroke-color': '#ffffff'
              }
            });
        }
      } catch (error) { /* Keep error */ console.error("LL: Err addSource/addLayer:", error); }
    }
    
  }, [map, filteredLocations, isMapReady]); // Now depends on filteredLocations

  // Visibility Effect - Simplified Direct Approach
  useEffect(() => {
    // Check if map is ready
    if (!isMapReady || !map) {
        console.log(`LL visibility check: Map not ready (isMapReady=${isMapReady}).`);
        return; 
    }
    
    console.log(`LL visibility check: Map IS ready. Checking source/layer...`);
    
    // Check if we have data
    if (filteredLocations.length === 0) {
        console.log('LL visibility check: No location data available yet, waiting for data.');
        return;
    }

    // Check if source exists, create it if not
    const sourceExists = map.getSource(sourceId);
    if (!sourceExists) {
        console.log(`LL: Source ${sourceId} not found. Creating source and layer...`);
        const geojsonData = createGeoJSON(filteredLocations); // Use filtered locations
        try {
            // Add source
            map.addSource(sourceId, { type: 'geojson', data: geojsonData });
            console.log(`LL: Created source ${sourceId}`);
            
            // Add layer
            map.addLayer({
                id: layerId,
                type: 'circle',
                source: sourceId,
                paint: {
                    'circle-radius': 6,
                    'circle-color': [
                        'match',
                        ['get', 'Category'], 
                        'Garden', locationCategoryColors['Garden'],
                        'SFSP', locationCategoryColors['SFSP'],
                        'Benefits Assistance', locationCategoryColors['Benefits Assistance'],
                        'CACFP', locationCategoryColors['CACFP'],
                        'Backpack', locationCategoryColors['Backpack'],
                        'Group Home', locationCategoryColors['Group Home'],
                        'Day Program', locationCategoryColors['Day Program'],
                        'Shelter', locationCategoryColors['Shelter'],
                        'Senior Staples Program', locationCategoryColors['Senior Staples Program'],
                        'Afterschool', locationCategoryColors['Afterschool'],
                        'Mobile Pantry', locationCategoryColors['Mobile Pantry'],
                        locationCategoryColors['Default'] // Default color
                    ],
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#ffffff'
                }
            });
            console.log(`LL: Created layer ${layerId}`);
        } catch (error) {
            console.error('LL: Error during source/layer creation:', error);
            return; // Exit if creation failed
        }
    } else {
        // Check if layer exists, create it if not
        const layerExists = map.getLayer(layerId);
        if (!layerExists) {
            console.log(`LL: Source ${sourceId} exists but layer ${layerId} not found. Creating layer...`);
            try {
                map.addLayer({
                    id: layerId,
                    type: 'circle',
                    source: sourceId,
                    paint: {
                        'circle-radius': 6,
                        'circle-color': [
                            'match',
                            ['get', 'Category'], 
                            'Garden', locationCategoryColors['Garden'],
                            'SFSP', locationCategoryColors['SFSP'],
                            'Benefits Assistance', locationCategoryColors['Benefits Assistance'],
                            'CACFP', locationCategoryColors['CACFP'],
                            'Backpack', locationCategoryColors['Backpack'],
                            'Group Home', locationCategoryColors['Group Home'],
                            'Day Program', locationCategoryColors['Day Program'],
                            'Shelter', locationCategoryColors['Shelter'],
                            'Senior Staples Program', locationCategoryColors['Senior Staples Program'],
                            'Afterschool', locationCategoryColors['Afterschool'],
                            'Mobile Pantry', locationCategoryColors['Mobile Pantry'],
                            locationCategoryColors['Default'] // Default color
                        ],
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#ffffff'
                    }
                });
                console.log(`LL: Created layer ${layerId}`);
            } catch (error) {
                console.error('LL: Error during layer creation:', error);
                return; // Exit if creation failed
            }
        }
    }

    // Set visibility now that we know the layer exists
    console.log(`LL: Setting visibility for ${layerId} to ${isVisible ? 'visible' : 'none'}`);
    try {
        map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
        console.log('LL: Visibility setting succeeded.');
    } catch (error) {
        console.error(`LL: Error setting layout property for ${layerId}:`, error);
    }
  }, [map, isMapReady, isVisible, layerId, sourceId, filteredLocations, createGeoJSON, locationCategoryColors]);

  // Setup hover interactions (adjust property names based on createGeoJSON)
  useEffect(() => {
    if (!isMapReady || !map || !map.getLayer(layerId)) return;

    const onMouseEnter = (e) => {
      // Cursor change
      map.getCanvas().style.cursor = 'pointer';
      
      // Get clicked feature
      const feature = e.features[0];
      const { Name, Address, Category } = feature.properties;
      
      // Get coordinates
      const coordinates = feature.geometry.coordinates.slice();
      
      // Create HTML content with more details
      const html = `
        <div class="mapbox-popup location-popup">
          <h4>${Name || 'Unnamed Location'}</h4>
          <div class="popup-category" style="background-color: ${locationCategoryColors[Category] || locationCategoryColors['Default']}">
            ${Category || 'Uncategorized'}
          </div>
          <p class="popup-address">${Address || 'No address provided'}</p>
        </div>
      `;
      
      // Set popup content and location
      popupRef.current
        .setLngLat(coordinates)
        .setHTML(html)
        .addTo(map);
    };

    const onMouseLeave = () => {
      map.getCanvas().style.cursor = '';
      if (popupRef.current) { // Check if popup exists before removing
        popupRef.current.remove();
      }
    };

    map.on('mouseenter', layerId, onMouseEnter);
    map.on('mouseleave', layerId, onMouseLeave);

    // Cleanup listeners
    return () => {
       if (map && map.isStyleLoaded()) { // Ensure map is valid on cleanup
          try { // Add try-catch for safety during unmount/HMR
            map.off('mouseenter', layerId, onMouseEnter);
            map.off('mouseleave', layerId, onMouseLeave);
            // Ensure cursor is reset if mouseleave didn't fire
            map.getCanvas().style.cursor = ''; 
          } catch (e) { /* Keep warn */ console.warn("LL: Error during hover cleanup:", e); }
       }
    };
  }, [map, popupRef, isMapReady]); // Add isMapReady dependency

  // Control layer visibility (already handled in the source/layer update effect)
  // useEffect(() => {
  //   if (!isMapReady || !map || !map.getLayer(layerId)) return;
  //   map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
  // }, [map, isVisible, isMapReady]); 

  return null; 
});

export default LocationLayer; 