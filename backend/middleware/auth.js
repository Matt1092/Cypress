import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    console.log('No token provided in request headers');
    return res.status(401).json({ success: false, message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    console.log('Attempting to verify token:', token.substring(0, 15) + '...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', decoded);
    
    // Make sure we have a valid user object with id
    if (!decoded.id) {
      console.error('Token does not contain user ID');
      return res.status(401).json({ success: false, message: 'Invalid token structure' });
    }
    
    // Set the user object on the request
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    res.status(401).json({ success: false, message: 'Token is not valid' });
  }
};

export default auth; 