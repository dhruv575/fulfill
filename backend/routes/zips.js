const router = require('express').Router();
const {
  getZips,
  getZip,
  createZip,
  updateZip,
  deleteZip,
  deleteAllZips
} = require('../controllers/zip.controller');

// Get all zips
router.get('/', getZips);

// Get a single zip by geography (zip code)
router.get('/:geography', getZip);

// Create a new zip
router.post('/', createZip);

// Update a zip
router.put('/:geography', updateZip);

// Delete a zip
router.delete('/:geography', deleteZip);

// Delete all zips
router.delete('/', deleteAllZips);

module.exports = router; 