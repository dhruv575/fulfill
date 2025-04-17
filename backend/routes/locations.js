const router = require('express').Router();
const {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  deleteAllLocations,
  updateLocationCoordinates
} = require('../controllers/location.controller');

// Get all locations
router.get('/', getLocations);

// Get a single location
router.get('/:id', getLocation);

// Create a new location
router.post('/', createLocation);

// Update a location
router.put('/:id', updateLocation);

// Delete a location
router.delete('/:id', deleteLocation);

// Delete all locations
router.delete('/', deleteAllLocations);

// Update location coordinates
router.put('/:id/coordinates', updateLocationCoordinates);

module.exports = router; 