const Supplier = require('../models/supplier.model');

// Get all suppliers
const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.json(suppliers);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
};

// Get a single supplier
const getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json('Supplier not found');
    }
    res.json(supplier);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
};

// Create a new supplier
const createSupplier = async (req, res) => {
  try {
    // Explicitly rename destructured variables to avoid scope clash
    const { identifier: reqIdentifier, address: reqAddress, partners: reqPartners, latitude, longitude } = req.body;
    
    // Build the data object explicitly
    const newSupplierData = {
      identifier: reqIdentifier,
      address: reqAddress,
      partners: reqPartners
    };

    // Optionally add coordinates if provided
    if (latitude !== undefined && longitude !== undefined) {
      newSupplierData.latitude = latitude;
      newSupplierData.longitude = longitude;
    }

    const newSupplier = new Supplier(newSupplierData);
    
    const savedSupplier = await newSupplier.save();
    res.status(201).json(savedSupplier);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
};

// Update a supplier
const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json('Supplier not found');
    }
    
    supplier.identifier = req.body.identifier || supplier.identifier;
    supplier.address = req.body.address || supplier.address;
    supplier.partners = req.body.partners || supplier.partners;
    
    const updatedSupplier = await supplier.save();
    res.json(updatedSupplier);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
};

// Delete a supplier
const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) {
      return res.status(404).json('Supplier not found');
    }
    res.json('Supplier deleted successfully');
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
};

// Delete all suppliers
const deleteAllSuppliers = async (req, res) => {
  try {
    await Supplier.deleteMany({});
    res.json('All suppliers deleted successfully');
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
};

// Update supplier coordinates using findByIdAndUpdate to avoid full validation
const updateSupplierCoordinates = async (req, res) => {
  const { id } = req.params;
  const { latitude, longitude } = req.body;

  console.log(`updateSupplierCoordinates: Received request for ID: ${id}`);
  console.log('updateSupplierCoordinates: Received body:', { latitude, longitude });

  // Validate coordinates before attempting update
  if (latitude === undefined || longitude === undefined || typeof latitude !== 'number' || typeof longitude !== 'number') {
      console.error('updateSupplierCoordinates: Invalid or missing coordinates.', { latitude, longitude });
      return res.status(400).json('Error: Valid latitude and longitude (numbers) are required.');
  }

  try {
    const updatedSupplier = await Supplier.findByIdAndUpdate(
      id,
      { $set: { latitude: latitude, longitude: longitude } }, // Use $set to only update these fields
      { new: true, runValidators: false } // Return the updated doc, skip full validation on update
    );

    if (!updatedSupplier) {
      console.warn(`updateSupplierCoordinates: Supplier not found for ID: ${id}`);
      return res.status(404).json('Supplier not found');
    }

    console.log(`updateSupplierCoordinates: Successfully updated coords for ID: ${id}`);
    res.json(updatedSupplier);
  } catch (err) {
    console.error(`updateSupplierCoordinates: Error updating coordinates for ID ${id}:`, err);
    res.status(500).json('Error updating coordinates: ' + err.message); // Use 500 for unexpected server errors
  }
};

module.exports = {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  deleteAllSuppliers,
  updateSupplierCoordinates
}; 