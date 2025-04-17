// Authentication middleware to check if the user is authenticated

const authenticate = (req, res, next) => {
  const password = req.signedCookies.auth;
  
  if (password !== 'MonmouthAndOcean') {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }
  
  next();
};

module.exports = authenticate; 