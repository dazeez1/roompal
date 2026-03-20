/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle MongoDB duplicate key errors
 * @param {Error} error - MongoDB error
 * @returns {AppError}
 */
const handleDuplicateKeyError = (error) => {
  const field = Object.keys(error.keyPattern)[0];
  const message = `${field} already exists. Please use a different ${field}.`;
  return new AppError(message, 400);
};

/**
 * Handle MongoDB validation errors
 * @param {Error} error - MongoDB validation error
 * @returns {AppError}
 */
const handleValidationError = (error) => {
  const errors = Object.values(error.errors).map((err) => err.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Handle JWT errors
 * @param {Error} error - JWT error
 * @returns {AppError}
 */
const handleJWTError = (error) => {
  if (error.message === 'Token has expired') {
    return new AppError('Your token has expired. Please login again.', 401);
  }
  return new AppError('Invalid token. Please login again.', 401);
};

/**
 * Global error handler middleware
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const globalErrorHandler = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    return res.status(error.statusCode).json({
      success: false,
      status: error.status,
      message: error.message,
      error: error,
      stack: error.stack,
    });
  }

  // Handle specific error types
  if (error.name === 'MongoServerError' && error.code === 11000) {
    error = handleDuplicateKeyError(error);
  }

  if (error.name === 'ValidationError') {
    error = handleValidationError(error);
  }

  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    error = handleJWTError(error);
  }

  // Send error response
  res.status(error.statusCode).json({
    success: false,
    status: error.status,
    message: error.message || 'Something went wrong!',
  });
};

module.exports = {
  AppError,
  globalErrorHandler,
  handleDuplicateKeyError,
  handleValidationError,
  handleJWTError,
};
