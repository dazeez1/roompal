const { verifyToken } = require('../services/tokenService');
const User = require('../models/User');
const { AppError } = require('../utils/errorHandler');
const { sendErrorResponse } = require('../utils/responseHandler');

/**
 * Middleware to protect routes - verifies JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const protectRoute = async (req, res, next) => {
  try {
    // 1. Get token from header
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return sendErrorResponse(res, 401, 'You are not authorized. Please login to access this resource.');
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return sendErrorResponse(res, 401, error.message || 'Invalid or expired token. Please login again.');
    }

    // 3. Check if user still exists
    const currentUser = await User.findById(decoded.userId).select('+isActive');
    
    if (!currentUser) {
      return sendErrorResponse(res, 401, 'The user belonging to this token no longer exists.');
    }

    // 4. Check if user is active
    if (!currentUser.isActive) {
      return sendErrorResponse(res, 401, 'Your account has been deactivated. Please contact support.');
    }

    // 5. Grant access to protected route
    req.user = {
      userId: currentUser._id,
      email: currentUser.email,
      role: currentUser.role,
      fullName: currentUser.fullName,
    };

    next();
  } catch (error) {
    return sendErrorResponse(res, 500, 'Authentication failed. Please try again.');
  }
};

/**
 * Optional authentication middleware - sets req.user if token is valid, but doesn't require it
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    // 1. Get token from header
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // If no token, continue without setting req.user
    if (!token) {
      req.user = null;
      return next();
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      // Invalid token, continue without setting req.user
      req.user = null;
      return next();
    }

    // 3. Check if user still exists
    const currentUser = await User.findById(decoded.userId).select('+isActive');
    
    if (!currentUser || !currentUser.isActive) {
      // User doesn't exist or inactive, continue without setting req.user
      req.user = null;
      return next();
    }

    // 4. Set req.user if token is valid
    req.user = {
      userId: currentUser._id,
      email: currentUser.email,
      role: currentUser.role,
      fullName: currentUser.fullName,
    };

    next();
  } catch (error) {
    // On error, continue without setting req.user
    req.user = null;
    next();
  }
};

/**
 * Middleware to restrict routes to specific roles
 * @param {...string} roles - Allowed roles
 * @returns {Function} - Middleware function
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendErrorResponse(
        res,
        403,
        'You do not have permission to perform this action.'
      );
    }
    next();
  };
};

module.exports = {
  protectRoute,
  optionalAuth,
  restrictTo,
};
