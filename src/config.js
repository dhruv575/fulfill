// API URL configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Log the API URL on application startup
console.log('🔌 API URL configured as:', API_URL);

// Mapbox API key
const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGhydXZndXAiLCJhIjoiY20yZjRoaHF1MDU3ZTJvcHFydGNoemR3bSJ9.IQmyIaXEYPl2NWrZ7hHJxQ';

export { API_URL, MAPBOX_TOKEN }; 