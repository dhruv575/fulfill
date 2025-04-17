const router = require('express').Router();
const {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  deleteAllSuppliers,
  updateSupplierCoordinates
} = require('../controllers/supplier.controller');

// Get all suppliers
router.get('/', getSuppliers);

// Get a single supplier
router.get('/:id', getSupplier);

// Create a new supplier
router.post('/', createSupplier);

// Update a supplier
router.put('/:id', updateSupplier);

// Delete a supplier
router.delete('/:id', deleteSupplier);

// Delete all suppliers
router.delete('/', deleteAllSuppliers);

// Update supplier coordinates
router.put('/:id/coordinates', updateSupplierCoordinates);

module.exports = router; 