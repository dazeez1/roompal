const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authenticate socket connection using JWT
 * @param {string} token - JWT token
 * @returns {Object} - User object or null
 */
const authenticateSocket = async (token) => {
  try {
    if (!token) {
      return null;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user
    const user = await User.findById(decoded.userId).select('fullName email isActive');
    
    if (!user || !user.isActive) {
      return null;
    }

    return {
      userId: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
    };
  } catch (error) {
    return null;
  }
};

module.exports = {
  authenticateSocket,
};
