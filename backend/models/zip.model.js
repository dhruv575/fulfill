const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const zipSchema = new Schema({
  geography: {
    type: String,
    required: true,
    trim: true
  },
  county: {
    type: String,
    required: true,
    trim: true
  },
  tot_pop: {
    type: Number,
    required: true
  },
  pct_food_insecure: {
    type: Number,
    required: true
  },
  number_food_insecure: {
    type: Number,
    required: true
  },
  unemployment_rate: {
    type: Number,
    required: true
  },
  pct_black: {
    type: Number,
    required: true
  },
  pct_poverty: {
    type: Number,
    required: true
  },
  pct_hispanic: {
    type: Number,
    required: true
  },
  median_income: {
    type: Number,
    required: true
  },
  pct_homeowners: {
    type: Number,
    required: true
  },
  pct_disability: {
    type: Number,
    required: true
  },
  produce: {
    type: Number,
    required: true
  },
  all: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

const Zip = mongoose.model('Zip', zipSchema);

module.exports = Zip; 