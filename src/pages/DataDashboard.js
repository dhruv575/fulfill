import React, { useState, useEffect } from 'react';
import { locationService, supplierService, zipService } from '../services/api';
import { API_URL } from '../config';

// Helper function to retry API calls with exponential backoff
const retryApiCall = async (apiCall, maxRetries = 3, initialDelay = 1000) => {
  let retries = 0;
  let delay = initialDelay;
  
  while (retries < maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      retries++;
      
      // If it's not a network error or we've exhausted retries, throw the error
      if (!error.message.includes('Network error') && !error.message.includes('Failed to fetch') || retries >= maxRetries) {
        throw error;
      }
      
      console.log(`🔄 Retry attempt ${retries}/${maxRetries} after ${delay}ms delay...`);
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
};

const DataDashboard = () => {
  const [activeTab, setActiveTab] = useState('locations');
  const [locations, setLocations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [zips, setZips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state for adding new items
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: '', address: '', category: '' });
  const [newSupplier, setNewSupplier] = useState({ identifier: '', address: '', partners: '' });
  const [newZip, setNewZip] = useState({
    geography: '', county: '', tot_pop: 0, pct_food_insecure: 0,
    number_food_insecure: 0, unemployment_rate: 0, pct_black: 0,
    pct_poverty: 0, pct_hispanic: 0, median_income: 0,
    pct_homeowners: 0, pct_disability: 0, produce: 0, all: 0
  });

  // For file uploads
  const [csvFile, setCsvFile] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Helper function to clean object keys (trim whitespace, lowercase)
  const cleanObjectKeys = (obj) => {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    const newObj = {};
    Object.keys(obj).forEach(key => {
      const cleanKey = key.trim().toLowerCase();
      // Ensure common numeric fields expected by the frontend are handled correctly
      // Preserve original _id
      if (cleanKey === '_id') {
        newObj[cleanKey] = obj[key];
      } else {
        newObj[cleanKey] = obj[key];
      }
    });
    return newObj;
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    console.log('🔍 Starting to fetch data for all tabs...');
    try {
      console.log('📊 Fetching data for locations, suppliers, and zips simultaneously...');
      const [locationsData, suppliersData, zipsData] = await Promise.all([
        retryApiCall(() => locationService.getAll()).catch(err => {
          console.error('🔴 Error fetching locations:', err);
          throw new Error(`Failed to fetch locations: ${err.message}`);
        }),
        retryApiCall(() => supplierService.getAll()).catch(err => {
          console.error('🔴 Error fetching suppliers:', err);
          throw new Error(`Failed to fetch suppliers: ${err.message}`);
        }),
        retryApiCall(() => zipService.getAll()).catch(err => {
          console.error('🔴 Error fetching zips:', err);
          throw new Error(`Failed to fetch zips: ${err.message}`);
        })
      ]);
      
      console.log(`✅ Raw data fetched successfully: ${locationsData?.length || 0} locations, ${suppliersData?.length || 0} suppliers, ${zipsData?.length || 0} zips`);
      
      // Clean the data keys before setting state
      const cleanedLocations = Array.isArray(locationsData) ? locationsData.map(cleanObjectKeys) : [];
      const cleanedSuppliers = Array.isArray(suppliersData) ? suppliersData.map(cleanObjectKeys) : [];
      const cleanedZips = Array.isArray(zipsData) ? zipsData.map(cleanObjectKeys) : [];

      console.log('🧹 Data cleaned. Setting state...');
      setLocations(cleanedLocations);
      setSuppliers(cleanedSuppliers);
      setZips(cleanedZips);
      console.log(`✅ Cleaned data set to state: ${cleanedLocations.length} locations, ${cleanedSuppliers.length} suppliers, ${cleanedZips.length} zips`);

    } catch (err) {
      console.error('🔴 Error fetching or processing data:', err);
      
      // Check if the error is related to network connectivity
      if (err.message && (
        err.message.includes('Network error') || 
        err.message.includes('Failed to fetch') ||
        err.message.includes('CORS')
      )) {
        setError(`Connection error: Unable to connect to the backend server at ${API_URL}. Please ensure the backend is running at the correct URL. Details: ${err.message}`);
      } else {
        setError(`Failed to load data: ${err.message || 'Unknown error occurred. Please try again later.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Tab handling
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // CSV Export handlers
  const handleExportCSV = async () => {
    try {
      let response;
      
      switch (activeTab) {
        case 'locations':
          response = await locationService.exportCSV();
          break;
        case 'suppliers':
          response = await supplierService.exportCSV();
          break;
        case 'zips':
          response = await zipService.exportCSV();
          break;
        default:
          return;
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${activeTab}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export CSV. Please try again.');
    }
  };

  // CSV Template Download handlers
  const handleDownloadTemplate = async () => {
    try {
      let response;
      
      switch (activeTab) {
        case 'locations':
          response = await locationService.getTemplate();
          break;
        case 'suppliers':
          response = await supplierService.getTemplate();
          break;
        case 'zips':
          response = await zipService.getTemplate();
          break;
        default:
          return;
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${activeTab}_template.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Template download error:', err);
      setError('Failed to download template. Please try again.');
    }
  };

  // File upload handler
  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  // CSV Import handler
  const handleImportCSV = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      setError('Please select a file to import');
      return;
    }

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      // This would need to be implemented on the backend
      // For now, we'll just show an alert
      alert('CSV import functionality would go here');
      // Reset the file input
      setCsvFile(null);
      // Refresh data
      fetchData();
    } catch (err) {
      console.error('Import error:', err);
      setError('Failed to import CSV. Please check the file format and try again.');
    }
  };

  // Delete all data handler
  const handleDeleteAll = async () => {
    if (!window.confirm(`Are you sure you want to delete all ${activeTab}? This action cannot be undone.`)) {
      return;
    }

    try {
      // First export the data as a backup
      await handleExportCSV();
      
      // Then delete all data
      switch (activeTab) {
        case 'locations':
          await locationService.deleteAll();
          setLocations([]);
          break;
        case 'suppliers':
          await supplierService.deleteAll();
          setSuppliers([]);
          break;
        case 'zips':
          await zipService.deleteAll();
          setZips([]);
          break;
        default:
          return;
      }
    } catch (err) {
      console.error('Delete all error:', err);
      setError(`Failed to delete all ${activeTab}. Please try again.`);
    }
  };

  // Delete single item handler
  const handleDeleteItem = async (id, type) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete this ${type}?`);
    if (!confirmDelete) return;

    setLoading(true);
    setError(null);
    
    try {
      let result;
      switch (type) {
        case 'location':
          result = await locationService.delete(id);
          break;
        case 'supplier':
          result = await supplierService.delete(id);
          break;
        case 'zip':
          result = await zipService.delete(id);
          break;
        default:
          throw new Error('Invalid type specified');
      }

      if (result.success) {
        // Refresh data after successful delete
        fetchData();
      } else {
        throw new Error(result.message || `Failed to delete ${type}`);
      }
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
      setError(`Error deleting ${type}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add new item handlers
  const handleShowAddModal = () => {
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleSubmitLocation = async (e) => {
    e.preventDefault();
    try {
      const result = await locationService.create(newLocation);
      setLocations([...locations, result]);
      setNewLocation({ name: '', address: '', category: '' });
      setShowAddModal(false);
    } catch (err) {
      console.error('Add location error:', err);
      setError('Failed to add location. Please try again.');
    }
  };

  const handleSubmitSupplier = async (e) => {
    e.preventDefault();
    try {
      const result = await supplierService.create(newSupplier);
      setSuppliers([...suppliers, result]);
      setNewSupplier({ identifier: '', address: '', partners: '' });
      setShowAddModal(false);
    } catch (err) {
      console.error('Add supplier error:', err);
      setError('Failed to add supplier. Please try again.');
    }
  };

  const handleSubmitZip = async (e) => {
    e.preventDefault();
    try {
      const result = await zipService.create(newZip);
      setZips([...zips, result]);
      setNewZip({
        geography: '', county: '', tot_pop: 0, pct_food_insecure: 0,
        number_food_insecure: 0, unemployment_rate: 0, pct_black: 0,
        pct_poverty: 0, pct_hispanic: 0, median_income: 0,
        pct_homeowners: 0, pct_disability: 0, produce: 0, all: 0
      });
      setShowAddModal(false);
    } catch (err) {
      console.error('Add zip error:', err);
      setError('Failed to add zip. Please try again.');
    }
  };

  // Change handlers for form inputs
  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setNewLocation({ ...newLocation, [name]: value });
  };

  const handleSupplierChange = (e) => {
    const { name, value } = e.target;
    setNewSupplier({ ...newSupplier, [name]: value });
  };

  const handleZipChange = (e) => {
    const { name, value } = e.target;
    setNewZip({ ...newZip, [name]: name === 'geography' ? value : Number(value) });
  };

  // Render the appropriate form based on active tab
  const renderAddForm = () => {
    switch (activeTab) {
      case 'locations':
        return (
          <form onSubmit={handleSubmitLocation} className="add-form">
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={newLocation.name}
                onChange={handleLocationChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Address:</label>
              <input
                type="text"
                name="address"
                value={newLocation.address}
                onChange={handleLocationChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Category:</label>
              <input
                type="text"
                name="category"
                value={newLocation.category}
                onChange={handleLocationChange}
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-btn">Add Location</button>
              <button type="button" className="cancel-btn" onClick={handleCloseAddModal}>Cancel</button>
            </div>
          </form>
        );
      
      case 'suppliers':
        return (
          <form onSubmit={handleSubmitSupplier} className="add-form">
            <div className="form-group">
              <label>Identifier:</label>
              <input
                type="text"
                name="identifier"
                value={newSupplier.identifier}
                onChange={handleSupplierChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Address:</label>
              <input
                type="text"
                name="address"
                value={newSupplier.address}
                onChange={handleSupplierChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Partners:</label>
              <input
                type="text"
                name="partners"
                value={newSupplier.partners}
                onChange={handleSupplierChange}
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-btn">Add Supplier</button>
              <button type="button" className="cancel-btn" onClick={handleCloseAddModal}>Cancel</button>
            </div>
          </form>
        );
      
      case 'zips':
        return (
          <form onSubmit={handleSubmitZip} className="add-form">
            <div className="form-row">
              <div className="form-group">
                <label>Geography (Zip Code):</label>
                <input
                  type="text"
                  name="geography"
                  value={newZip.geography}
                  onChange={handleZipChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>County:</label>
                <input
                  type="text"
                  name="county"
                  value={newZip.county}
                  onChange={handleZipChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Total Population:</label>
                <input
                  type="number"
                  name="tot_pop"
                  value={newZip.tot_pop}
                  onChange={handleZipChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Food Insecurity %:</label>
                <input
                  type="number"
                  step="0.01"
                  name="pct_food_insecure"
                  value={newZip.pct_food_insecure}
                  onChange={handleZipChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Number Food Insecure:</label>
                <input
                  type="number"
                  name="number_food_insecure"
                  value={newZip.number_food_insecure}
                  onChange={handleZipChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Unemployment Rate:</label>
                <input
                  type="number"
                  step="0.01"
                  name="unemployment_rate"
                  value={newZip.unemployment_rate}
                  onChange={handleZipChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Black Population %:</label>
                <input
                  type="number"
                  step="0.01"
                  name="pct_black"
                  value={newZip.pct_black}
                  onChange={handleZipChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Poverty %:</label>
                <input
                  type="number"
                  step="0.01"
                  name="pct_poverty"
                  value={newZip.pct_poverty}
                  onChange={handleZipChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Hispanic Population %:</label>
                <input
                  type="number"
                  step="0.01"
                  name="pct_hispanic"
                  value={newZip.pct_hispanic}
                  onChange={handleZipChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Median Income:</label>
                <input
                  type="number"
                  name="median_income"
                  value={newZip.median_income}
                  onChange={handleZipChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Homeowners %:</label>
                <input
                  type="number"
                  step="0.01"
                  name="pct_homeowners"
                  value={newZip.pct_homeowners}
                  onChange={handleZipChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Disability %:</label>
                <input
                  type="number"
                  step="0.01"
                  name="pct_disability"
                  value={newZip.pct_disability}
                  onChange={handleZipChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Produce (lbs):</label>
                <input
                  type="number"
                  name="produce"
                  value={newZip.produce}
                  onChange={handleZipChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>All Food (lbs):</label>
                <input
                  type="number"
                  name="all"
                  value={newZip.all}
                  onChange={handleZipChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="submit-btn">Add Zip Code</button>
              <button type="button" className="cancel-btn" onClick={handleCloseAddModal}>Cancel</button>
            </div>
          </form>
        );
      
      default:
        return null;
    }
  };

  // Render data tables based on active tab
  const renderDataTable = () => {
    if (loading) {
      return <div className="loading">Loading data...</div>;
    }
    
    const isConnectionError = error && (
      error.includes('Connection error') || 
      error.includes('Network error') || 
      error.includes('Failed to fetch')
    );

    if (error) {
      if (isConnectionError) {
        return (
          <div className="error-container">
            <div className="error-message">{error}</div>
            <button 
              className="retry-button" 
              onClick={() => fetchData(activeTab)}
            >
              <span className="retry-icon">↻</span>
              Retry Connection
            </button>
          </div>
        );
      }
      return <div className="error-container"><div className="error-message">{error}</div></div>;
    }

    switch (activeTab) {
      case 'locations':
        return (
          <div className="data-table-container">
            {locations.length === 0 ? (
              <p className="no-data">No locations found. Add some locations or import from CSV.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Category</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((location) => (
                    <tr key={location._id}>
                      <td>{location.name}</td>
                      <td>{location.address}</td>
                      <td>{location.category}</td>
                      <td>
                        <button 
                          className="delete-btn" 
                          onClick={() => handleDeleteItem(location._id, 'location')}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      
      case 'suppliers':
        return (
          <div className="data-table-container">
            {suppliers.length === 0 ? (
              <p className="no-data">No suppliers found. Add some suppliers or import from CSV.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Identifier</th>
                    <th>Address</th>
                    <th>Partners</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier) => (
                    <tr key={supplier._id}>
                      <td>{supplier.identifier}</td>
                      <td>{supplier.address}</td>
                      <td>{supplier.partners}</td>
                      <td>
                        <button 
                          className="delete-btn" 
                          onClick={() => handleDeleteItem(supplier._id, 'supplier')}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      
      case 'zips':
        return (
          <div className="data-table-container">
            {zips.length === 0 ? (
              <p className="no-data">No zip codes found. Add some zip codes or import from CSV.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Zip Code</th>
                    <th>County</th>
                    <th>Population</th>
                    <th>Food Insecure %</th>
                    <th>Food Insecure #</th>
                    <th>Unemployment %</th>
                    <th>Black %</th>
                    <th>Poverty %</th>
                    <th>Hispanic %</th>
                    <th>Median Income</th>
                    <th>Homeowners %</th>
                    <th>Disability %</th>
                    <th>Produce (lbs)</th>
                    <th>All Food (lbs)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {zips.map((zip) => (
                    <tr key={zip._id}>
                      <td>{zip.geography}</td>
                      <td>{zip.county}</td>
                      <td>{zip.tot_pop.toLocaleString()}</td>
                      <td>{(zip.pct_food_insecure * 100).toFixed(2)}%</td>
                      <td>{zip.number_food_insecure.toLocaleString()}</td>
                      <td>{(zip.unemployment_rate * 100).toFixed(2)}%</td>
                      <td>{(zip.pct_black * 100).toFixed(2)}%</td>
                      <td>{(zip.pct_poverty * 100).toFixed(2)}%</td>
                      <td>{(zip.pct_hispanic * 100).toFixed(2)}%</td>
                      <td>${zip.median_income.toLocaleString()}</td>
                      <td>{(zip.pct_homeowners * 100).toFixed(2)}%</td>
                      <td>{(zip.pct_disability * 100).toFixed(2)}%</td>
                      <td>{zip.produce.toLocaleString()}</td>
                      <td>{zip.all.toLocaleString()}</td>
                      <td>
                        <button 
                          className="delete-btn" 
                          onClick={() => handleDeleteItem(zip._id, 'zip')}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      
      default:
        return <div>Select a tab to view data</div>;
    }
  };

  return (
    <div className="data-dashboard">
      <div className="dashboard-header">
        <h1>Data Management</h1>
        <p>View, add, edit, and manage the data used in the dashboard.</p>
      </div>

      <div className="tab-container">
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'locations' ? 'active' : ''}`}
            onClick={() => handleTabChange('locations')}
          >
            Locations
          </button>
          <button 
            className={`tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
            onClick={() => handleTabChange('suppliers')}
          >
            Suppliers
          </button>
          <button 
            className={`tab-btn ${activeTab === 'zips' ? 'active' : ''}`}
            onClick={() => handleTabChange('zips')}
          >
            Zip Codes
          </button>
        </div>

        <div className="tab-actions">
          <button className="action-btn export-btn" onClick={handleExportCSV}>
            Export CSV
          </button>
          <button className="action-btn template-btn" onClick={handleDownloadTemplate}>
            Download Template
          </button>
          <button className="action-btn add-btn" onClick={handleShowAddModal}>
            Add New
          </button>
          <button className="action-btn delete-all-btn" onClick={handleDeleteAll}>
            Delete All
          </button>
        </div>

        <div className="import-form">
          <form onSubmit={handleImportCSV}>
            <div className="import-container">
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange} 
                className="file-input"
              />
              <button type="submit" className="import-btn" disabled={!csvFile}>
                Import CSV
              </button>
            </div>
          </form>
        </div>

        <div className="tab-content">
          {renderDataTable()}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New {activeTab === 'zips' ? 'Zip Code' : activeTab.slice(0, -1)}</h2>
              <button className="close-btn" onClick={handleCloseAddModal}>×</button>
            </div>
            <div className="modal-body">
              {renderAddForm()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataDashboard; 