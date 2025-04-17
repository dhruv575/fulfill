const router = require('express').Router();
const {
  exportLocationsCSV,
  exportSuppliersCSV,
  exportZipsCSV,
  getLocationTemplate,
  getSupplierTemplate,
  getZipTemplate
} = require('../controllers/csv.controller');

// Export routes
router.get('/export/locations', exportLocationsCSV);
router.get('/export/suppliers', exportSuppliersCSV);
router.get('/export/zips', exportZipsCSV);

// Template routes
router.get('/template/location', getLocationTemplate);
router.get('/template/supplier', getSupplierTemplate);
router.get('/template/zip', getZipTemplate);

module.exports = router; 