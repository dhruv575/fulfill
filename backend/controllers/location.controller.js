const Location = require('../models/location.model');

// Get all locations
const getLocations = async (req, res) => {
  try {
    const locations = await Location.find();
    res.json(locations);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
};

// Get a single location
const getLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json('Location not found');
    }
    res.json(location);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
};

// Create a new location
const createLocation = async (req, res) => {
  try {
    const { name, address, category, latitude, longitude } = req.body;
    const newLocationData = { name, address, category };

    // Optionally add coordinates if provided
    if (latitude !== undefined && longitude !== undefined) {
      newLocationData.latitude = latitude;
      newLocationData.longitude = longitude;
    }

    const newLocation = new Location(newLocationData);
    
    const savedLocation = await newLocation.save();
    res.status(201).json(savedLocation);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
};

// Update a location
const updateLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json('Location not found');
    }
    
    location.name = req.body.name || location.name;
    location.address = req.body.address || location.address;
    location.category = req.body.category || location.category;
    
    const updatedLocation = await location.save();
    res.json(updatedLocation);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
};

// Delete a location
const deleteLocation = async (req, res) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id);
    if (!location) {
      return res.status(404).json('Location not found');
    }
    res.json('Location deleted successfully');
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
};

// Delete all locations
const deleteAllLocations = async (req, res) => {
  try {
    await Location.deleteMany({});
    res.json('All locations deleted successfully');
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
};

// Update location coordinates using findByIdAndUpdate to avoid full validation
const updateLocationCoordinates = async (req, res) => {
  const { id } = req.params;
  const { latitude, longitude } = req.body;

  console.log(`updateLocationCoordinates: Received request for ID: ${id}`);
  console.log('updateLocationCoordinates: Received body:', { latitude, longitude });

  // Validate coordinates before attempting update
  if (latitude === undefined || longitude === undefined || typeof latitude !== 'number' || typeof longitude !== 'number') {
    console.error('updateLocationCoordinates: Invalid or missing coordinates.', { latitude, longitude });
    return res.status(400).json('Error: Valid latitude and longitude (numbers) are required.');
  }

  try {
    const updatedLocation = await Location.findByIdAndUpdate(
      id,
      { $set: { latitude: latitude, longitude: longitude } }, // Use $set to only update these fields
      { new: true, runValidators: false } // Return the updated doc, skip full validation on update
    );

    if (!updatedLocation) {
      console.warn(`updateLocationCoordinates: Location not found for ID: ${id}`);
      return res.status(404).json('Location not found');
    }

    console.log(`updateLocationCoordinates: Successfully updated coords for ID: ${id}`);
    res.json(updatedLocation);
  } catch (err) {
    console.error(`updateLocationCoordinates: Error updating coordinates for ID ${id}:`, err);
    res.status(500).json('Error updating coordinates: ' + err.message); // Use 500 for unexpected server errors
  }
};

module.exports = {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  deleteAllLocations,
  updateLocationCoordinates
}; 