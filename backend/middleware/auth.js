// Authentication middleware to check if the user is authenticated

const authenticate = (req, res, next) => {
  // Log cookie information for debugging
  console.log('Auth middleware called');
  console.log('All cookies:', req.cookies);
  console.log('Signed cookies:', req.signedCookies);
  console.log('Auth cookie value:', req.signedCookies.auth);
  
  const password = req.signedCookies.auth;
  
  if (password !== 'MonmouthAndOcean') {
    console.log('Authentication failed - password mismatch or missing');
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }
  
  console.log('Authentication successful');
  next();
};

module.exports = authenticate; 