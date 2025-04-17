const Zip = require('../models/zip.model');

// Get all zips
const getZips = async (req, res) => {
  try {
    const zips = await Zip.find();
    res.json(zips);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
};

// Get a single zip by geography (zip code)
const getZip = async (req, res) => {
  try {
    const zip = await Zip.findOne({ geography: req.params.geography });
    if (!zip) {
      return res.status(404).json('Zip not found');
    }
    res.json(zip);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
};

// Create a new zip
const createZip = async (req, res) => {
  try {
    const { 
      geography, county, tot_pop, pct_food_insecure, number_food_insecure,
      unemployment_rate, pct_black, pct_poverty, pct_hispanic, median_income,
      pct_homeowners, pct_disability, produce, all
    } = req.body;
    
    const newZip = new Zip({ 
      geography, county, tot_pop, pct_food_insecure, number_food_insecure,
      unemployment_rate, pct_black, pct_poverty, pct_hispanic, median_income,
      pct_homeowners, pct_disability, produce, all
    });
    
    const savedZip = await newZip.save();
    res.status(201).json(savedZip);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
};

// Update a zip
const updateZip = async (req, res) => {
  try {
    const zip = await Zip.findOne({ geography: req.params.geography });
    if (!zip) {
      return res.status(404).json('Zip not found');
    }
    
    // Update all fields that are present in the request
    const fields = [
      'county', 'tot_pop', 'pct_food_insecure', 'number_food_insecure',
      'unemployment_rate', 'pct_black', 'pct_poverty', 'pct_hispanic', 
      'median_income', 'pct_homeowners', 'pct_disability', 'produce', 'all'
    ];
    
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        zip[field] = req.body[field];
      }
    });
    
    const updatedZip = await zip.save();
    res.json(updatedZip);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
};

// Delete a zip
const deleteZip = async (req, res) => {
  try {
    const zip = await Zip.findOneAndDelete({ geography: req.params.geography });
    if (!zip) {
      return res.status(404).json('Zip not found');
    }
    res.json('Zip deleted successfully');
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
};

// Delete all zips
const deleteAllZips = async (req, res) => {
  try {
    await Zip.deleteMany({});
    res.json('All zips deleted successfully');
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
};

module.exports = {
  getZips,
  getZip,
  createZip,
  updateZip,
  deleteZip,
  deleteAllZips
}; 