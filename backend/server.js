const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Environment determination
const isProduction = process.env.NODE_ENV === 'production';

// Clean the frontend URL (remove trailing slash if present)
const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : '';

// Define allowed origins
const allowedOrigins = isProduction
  ? [
      frontendUrl,
      'https://fulfill-theta.vercel.app',
      'https://fulfill-dashboard.vercel.app', 
      'https://fulfill-dashboard-git-main.vercel.app'
    ].filter(Boolean) // Remove empty strings
  : 'http://localhost:3000';

// Log allowed origins in production for debugging
if (isProduction) {
  console.log('Allowed origins:', allowedOrigins);
}

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (isProduction) {
      // If we're in production mode, check against the allowed origins array
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        console.log('Origin not allowed by CORS:', origin);
        callback(null, true); // Still allow all origins for now (debugging)
      }
    } else {
      // In development, just allow localhost
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

// MongoDB connection
const uri = process.env.ATLAS_URI;
mongoose.connect(uri)
  .then(() => console.log('MongoDB connection established successfully'))
  .catch(err => console.log('Error connecting to MongoDB:', err));

// Authentication routes (unprotected)
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

// Health check endpoint (unprotected)
app.get('/api/health', (req, res) => {
  console.log('Health check request received');
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Server is running' 
  });
});

// Authentication middleware
const authenticate = require('./middleware/auth');

// Protected routes
const locationsRouter = require('./routes/locations');
const suppliersRouter = require('./routes/suppliers');
const zipsRouter = require('./routes/zips');
const csvRouter = require('./routes/csv');

app.use('/api/locations', authenticate, locationsRouter);
app.use('/api/suppliers', authenticate, suppliersRouter);
app.use('/api/zips', authenticate, zipsRouter);
app.use('/api/csv', authenticate, csvRouter);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
}); 