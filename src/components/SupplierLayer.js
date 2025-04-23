import { useEffect, useState, useCallback, memo } from 'react';
import { supplierService } from '../services/api';
import mapboxgl from 'mapbox-gl';

// Supplier color
const supplierColor = '#34495e'; // Dark Blue/Gray

// Helper to create GeoJSON for Suppliers using latitude/longitude from item
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
        Identifier: item.identifier, // Use correct field names from model
        Address: item.address, 
        Partners: item.partners,
        id: item._id // Include ID
      }
    }));
  return { type: 'FeatureCollection', features };
};

// Geocode function using direct fetch - accepts token
const geocodeAddress = async (address, token) => {
  // Max address length (arbitrary, adjust if needed)
  const MAX_ADDRESS_LENGTH = 256; // Limit total characters 
  // Max address parts (Mapbox seems to limit around 20 tokens)
  const MAX_ADDRESS_PARTS = 20; 

  if (!address) { console.warn("SL: Attempted to geocode empty address."); return { coordinates: null }; }
  if (!token) { console.error("SL: Mapbox token missing."); return { coordinates: null }; }

  let addressToGeocode = address.trim();
  const addressParts = addressToGeocode.split(/[,\s]+/); // Split by comma or space

  // Check length and parts
  if (addressToGeocode.length > MAX_ADDRESS_LENGTH || addressParts.length > MAX_ADDRESS_PARTS) {
    console.warn(`SL: Address potentially too long (${addressParts.length} parts / ${addressToGeocode.length} chars), truncating... Original:`, address);
    // Truncate by parts
    addressToGeocode = addressParts.slice(0, MAX_ADDRESS_PARTS).join(' '); 
    console.warn(`SL: Truncated address:`, addressToGeocode);
  }

  try {
    // Use addressToGeocode (original or truncated)
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addressToGeocode)}.json?access_token=${token}&country=US&limit=1`
    );
    if (!response.ok) {
      const errorBody = await response.text();
      // Use original address in error log
      console.error(`SL: Mapbox API Error (${response.status}): ${errorBody} for original address: ${address}`); 
      throw new Error(`Geocoding failed with status ${response.status}`);
    }
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      return { coordinates: data.features[0].center };
    } else {
      console.warn(`SL: No geocoding results for (potentially truncated): ${addressToGeocode}`);
      return { coordinates: null };
    }
  } catch (error) {
    console.error(`SL: Geocoding fetch failed for original address "${address}":`, error);
    return { coordinates: null };
  }
};

const SupplierLayer = memo(({ map, popupRef, isVisible, isMapReady, token }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const sourceId = 'suppliers';
  const layerId = 'suppliers-points';

  const fetchAndProcessSuppliers = useCallback(async () => {
    if (!isMapReady || !token) return;
    setIsLoading(true);
    try {
      const items = await supplierService.getAll();
      if (!items || items.length === 0) {
        setSuppliers([]);
        setIsLoading(false);
        return;
      }
      const processedItems = await Promise.all(items.map(async (item) => {
        if (typeof item.latitude === 'number' && typeof item.longitude === 'number') {
          return item;
        } else {
          const { coordinates } = await geocodeAddress(item.Address, token);
          if (coordinates && coordinates.length === 2) {
            const [longitude, latitude] = coordinates;
            supplierService.updateCoordinates(item._id, { latitude, longitude })
              .catch(err => console.error(`SL: Failed to save coords for ${item.Identifier}:`, err));
            return { ...item, latitude, longitude };
          } else {
            console.warn(`SL: Geocoding failed for ${item.Identifier}, skipping.`);
            return { ...item, latitude: null, longitude: null };
          }
        }
      }));
      const validSuppliers = processedItems.filter(item => typeof item.latitude === 'number' && typeof item.longitude === 'number');
      setSuppliers(validSuppliers);
    } catch (err) {
      console.error("SL: Error fetching/processing:", err);
      setSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  }, [isMapReady, token]);

  useEffect(() => {
    fetchAndProcessSuppliers();
  }, [fetchAndProcessSuppliers]);

  useEffect(() => {
    if (!isMapReady || !map || !map.isStyleLoaded()) {
      return;
    }
    if (suppliers.length === 0) {
      if (map.getLayer(layerId)) {
        try {
          map.removeLayer(layerId);
        } catch (e) {
          console.error("SL: Err removing layer", e);
        }
      }
      if (map.getSource(sourceId)) {
        try {
          map.removeSource(sourceId);
        } catch (e) {
          console.error("SL: Err removing source", e);
        }
      }
      return;
    }
    const source = map.getSource(sourceId);
    const geojsonData = createGeoJSON(suppliers);
    if (source) {
      try {
        source.setData(geojsonData);
      } catch (error) {
        console.error("SL: Error setData:", error);
      }
    } else {
      try {
        map.addSource(sourceId, { type: 'geojson', data: geojsonData });
        if (!map.getLayer(layerId)) {
          map.addLayer({
            id: layerId,
            type: 'circle',
            source: sourceId,
            paint: {
              'circle-radius': 3,
              'circle-color': supplierColor,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff'
            }
          });
        }
      } catch (error) {
        console.error("SL: Error addSource/addLayer:", error);
      }
    }
  }, [map, suppliers, isMapReady]);

  // Visibility Effect - Simplified Direct Approach
  useEffect(() => {
    // Check if map is ready
    if (!isMapReady || !map) {
        console.log(`SL visibility check: Map not ready (isMapReady=${isMapReady}).`);
        return; 
    }
    
    console.log(`SL visibility check: Map IS ready. Checking source/layer...`);
    
    // Check if we have data
    if (suppliers.length === 0) {
        console.log('SL visibility check: No supplier data available yet, waiting for data.');
        return;
    }

    // Check if source exists, create it if not
    const sourceExists = map.getSource(sourceId);
    if (!sourceExists) {
        console.log(`SL: Source ${sourceId} not found. Creating source and layer...`);
        const geojsonData = createGeoJSON(suppliers);
        try {
            // Add source
            map.addSource(sourceId, { type: 'geojson', data: geojsonData });
            console.log(`SL: Created source ${sourceId}`);
            
            // Add layer
            map.addLayer({
                id: layerId,
                type: 'circle',
                source: sourceId,
                paint: {
                    'circle-radius': 5,
                    'circle-color': supplierColor,
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#ffffff'
                }
            });
            console.log(`SL: Created layer ${layerId}`);
        } catch (error) {
            console.error('SL: Error during source/layer creation:', error);
            return; // Exit if creation failed
        }
    } else {
        // Check if layer exists, create it if not
        const layerExists = map.getLayer(layerId);
        if (!layerExists) {
            console.log(`SL: Source ${sourceId} exists but layer ${layerId} not found. Creating layer...`);
            try {
                map.addLayer({
                    id: layerId,
                    type: 'circle',
                    source: sourceId,
                    paint: {
                        'circle-radius': 5,
                        'circle-color': supplierColor,
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#ffffff'
                    }
                });
                console.log(`SL: Created layer ${layerId}`);
            } catch (error) {
                console.error('SL: Error during layer creation:', error);
                return; // Exit if creation failed
            }
        }
    }

    // Set visibility now that we know the layer exists
    console.log(`SL: Setting visibility for ${layerId} to ${isVisible ? 'visible' : 'none'}`);
    try {
        map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
        console.log('SL: Visibility setting succeeded.');
    } catch (error) {
        console.error(`SL: Error setting layout property for ${layerId}:`, error);
    }
  }, [map, isMapReady, isVisible, layerId, sourceId, suppliers, supplierColor]);

  // Hover Effect (Keep error logs)
  useEffect(() => {
    if (!isMapReady || !map || !map.getLayer(layerId)) return;
    const onMouseEnter = (e) => {
      // Cursor change
      map.getCanvas().style.cursor = 'pointer';
      
      // Get clicked feature
      const feature = e.features[0];
      const { Identifier, Address, Partners } = feature.properties;
      
      // Get coordinates
      const coordinates = feature.geometry.coordinates.slice();
      
      // Format partners list if it exists
      let partnersDisplay = 'None';
      if (Partners) {
        try {
          // Try to parse if it's a JSON string
          const partnersList = typeof Partners === 'string' ? 
            (Partners.startsWith('[') ? JSON.parse(Partners) : Partners.split(',')) : 
            Partners;
            
          if (Array.isArray(partnersList)) {
            partnersDisplay = partnersList.join(', ');
          } else {
            partnersDisplay = String(Partners);
          }
        } catch (e) {
          partnersDisplay = String(Partners);
        }
      }
      
      // Create HTML content
      const html = `
        <div class="mapbox-popup supplier-popup">
          <h4>${Identifier || 'Unnamed Supplier'}</h4>
          <p class="popup-address">${Address || 'No address provided'}</p>
          <div class="popup-partners">
            <strong>Partners:</strong> ${partnersDisplay}
          </div>
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
      if (popupRef.current) {
        popupRef.current.remove();
      }
    };

    map.on('mouseenter', layerId, onMouseEnter);
    map.on('mouseleave', layerId, onMouseLeave);

    return () => {
      if (map && map.isStyleLoaded()) {
        try {
          map.off('mouseenter', layerId, onMouseEnter);
          map.off('mouseleave', layerId, onMouseLeave);
          map.getCanvas().style.cursor = '';
        } catch (e) {
          console.warn("SL: Error during hover cleanup:", e);
        }
      }
    };
  }, [map, popupRef, isMapReady]);

  return null; 
});

export default SupplierLayer; 