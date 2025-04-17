import { API_URL } from '../config';

// Helper function for making API requests
const apiRequest = async (endpoint, method = 'GET', data = null, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  const config = {
    method,
    headers,
    credentials: 'include', // include cookies with requests
    ...options,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    let response;
    
    try {
      response = await fetch(url, config);
    } catch (networkError) {
      throw new Error(`Network error: Unable to connect to the server. Please ensure the backend is running and accessible at ${API_URL}. Details: ${networkError.message}`);
    }
    
    // For CSV responses, return the raw response
    if (response.headers.get('Content-Type')?.includes('text/csv')) {
      return response;
    }
    
    // For JSON responses, parse the JSON
    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      throw new Error(`Failed to parse response as JSON. The server might not be returning valid JSON. Status: ${response.status} ${response.statusText}`);
    }
    
    if (!response.ok) {
      throw new Error(responseData.error || `Server returned error ${response.status}: ${response.statusText}`);
    }
    
    return responseData;
  } catch (error) {
    
    // Check if it's a CORS error (typically appears as a TypeError)
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(`Network error: This might be a CORS issue or the server is unavailable. Details: ${error.message}`);
    }
    
    throw error;
  }
};

// Authentication services
export const authService = {
  login: (password) => {
    return apiRequest('/auth/login', 'POST', { password });
  },
  checkAuth: () => {
    return apiRequest('/auth/check');
  },
  logout: () => {
    return apiRequest('/auth/logout', 'POST');
  }
};

// Location services
export const locationService = {
  getAll: () => {
    return apiRequest('/locations');
  },
  getById: (id) => {
    return apiRequest(`/locations/${id}`);
  },
  create: (data) => {
    return apiRequest('/locations', 'POST', data);
  },
  update: (id, data) => {
    return apiRequest(`/locations/${id}`, 'PUT', data);
  },
  delete: (id) => {
    return apiRequest(`/locations/${id}`, 'DELETE');
  },
  deleteAll: () => {
    return apiRequest('/locations', 'DELETE');
  },
  exportCSV: () => {
    return apiRequest('/csv/export/locations');
  },
  getTemplate: () => {
    return apiRequest('/csv/template/location');
  },
  updateCoordinates: (id, coordinates) => {
    return apiRequest(`/locations/${id}/coordinates`, 'PUT', coordinates);
  }
};

// Supplier services
export const supplierService = {
  getAll: () => {
    return apiRequest('/suppliers');
  },
  getById: (id) => {
    return apiRequest(`/suppliers/${id}`);
  },
  create: (data) => {
    return apiRequest('/suppliers', 'POST', data);
  },
  update: (id, data) => {
    return apiRequest(`/suppliers/${id}`, 'PUT', data);
  },
  delete: (id) => {
    return apiRequest(`/suppliers/${id}`, 'DELETE');
  },
  deleteAll: () => {
    return apiRequest('/suppliers', 'DELETE');
  },
  exportCSV: () => {
    return apiRequest('/csv/export/suppliers');
  },
  getTemplate: () => {
    return apiRequest('/csv/template/supplier');
  },
  updateCoordinates: (id, coordinates) => {
    return apiRequest(`/suppliers/${id}/coordinates`, 'PUT', coordinates);
  }
};

// Zip services
export const zipService = {
  getAll: () => {
    return apiRequest('/zips');
  },
  getByGeography: (geography) => {
    return apiRequest(`/zips/${geography}`);
  },
  create: (data) => {
    return apiRequest('/zips', 'POST', data);
  },
  update: (geography, data) => {
    return apiRequest(`/zips/${geography}`, 'PUT', data);
  },
  delete: (geography) => {
    return apiRequest(`/zips/${geography}`, 'DELETE');
  },
  deleteAll: () => {
    return apiRequest('/zips', 'DELETE');
  },
  exportCSV: () => {
    return apiRequest('/csv/export/zips');
  },
  getTemplate: () => {
    return apiRequest('/csv/template/zip');
  }
}; 