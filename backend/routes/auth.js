const router = require('express').Router();

// Login route
router.post('/login', (req, res) => {
  const { password } = req.body;
  
  if (password !== 'MonmouthAndOcean') {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  // Set a signed cookie that expires in 30 days
  res.cookie('auth', 'MonmouthAndOcean', {
    signed: true,
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: 'strict'
  });
  
  res.json({ success: true, message: 'Login successful' });
});

// Check if user is authenticated
router.get('/check', (req, res) => {
  const auth = req.signedCookies.auth;
  
  if (auth === 'MonmouthAndOcean') {
    return res.json({ authenticated: true });
  }
  
  res.json({ authenticated: false });
});

// Logout route
router.post('/logout', (req, res) => {
  res.clearCookie('auth');
  res.json({ success: true, message: 'Logout successful' });
});

module.exports = router; 