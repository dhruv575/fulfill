const Location = require('../models/location.model');
const Supplier = require('../models/supplier.model');
const Zip = require('../models/zip.model');

// Export Locations as CSV
const exportLocationsCSV = async (req, res) => {
  try {
    const locations = await Location.find();
    const csvHeader = "name,address,category\n";
    
    let csvBody = locations.map(location => {
      return `"${location.name}","${location.address}","${location.category}"`;
    }).join('\n');
    
    const csv = csvHeader + csvBody;
    
    res.header('Content-Type', 'text/csv');
    res.attachment('locations.csv');
    res.send(csv);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
};

// Export Suppliers as CSV
const exportSuppliersCSV = async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    const csvHeader = "identifier,address,partners\n";
    
    let csvBody = suppliers.map(supplier => {
      return `"${supplier.identifier}","${supplier.address}","${supplier.partners}"`;
    }).join('\n');
    
    const csv = csvHeader + csvBody;
    
    res.header('Content-Type', 'text/csv');
    res.attachment('suppliers.csv');
    res.send(csv);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
};

// Export Zips as CSV
const exportZipsCSV = async (req, res) => {
  try {
    const zips = await Zip.find();
    const csvHeader = "geography,county,tot_pop,pct_food_insecure,number_food_insecure,unemployment_rate,pct_black,pct_poverty,pct_hispanic,median_income,pct_homeowners,pct_disability,produce,all\n";
    
    let csvBody = zips.map(zip => {
      return `"${zip.geography}","${zip.county}",${zip.tot_pop},${zip.pct_food_insecure},${zip.number_food_insecure},${zip.unemployment_rate},${zip.pct_black},${zip.pct_poverty},${zip.pct_hispanic},${zip.median_income},${zip.pct_homeowners},${zip.pct_disability},${zip.produce},${zip.all}`;
    }).join('\n');
    
    const csv = csvHeader + csvBody;
    
    res.header('Content-Type', 'text/csv');
    res.attachment('zips.csv');
    res.send(csv);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
};

// Get empty CSV templates
const getLocationTemplate = (req, res) => {
  const csvTemplate = "name,address,category\n";
  res.header('Content-Type', 'text/csv');
  res.attachment('location_template.csv');
  res.send(csvTemplate);
};

const getSupplierTemplate = (req, res) => {
  const csvTemplate = "identifier,address,partners\n";
  res.header('Content-Type', 'text/csv');
  res.attachment('supplier_template.csv');
  res.send(csvTemplate);
};

const getZipTemplate = (req, res) => {
  const csvTemplate = "geography,county,tot_pop,pct_food_insecure,number_food_insecure,unemployment_rate,pct_black,pct_poverty,pct_hispanic,median_income,pct_homeowners,pct_disability,produce,all\n";
  res.header('Content-Type', 'text/csv');
  res.attachment('zip_template.csv');
  res.send(csvTemplate);
};

module.exports = {
  exportLocationsCSV,
  exportSuppliersCSV,
  exportZipsCSV,
  getLocationTemplate,
  getSupplierTemplate,
  getZipTemplate
}; 