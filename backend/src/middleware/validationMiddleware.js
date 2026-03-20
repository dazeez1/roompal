const { validationResult } = require('express-validator');
const { sendErrorResponse } = require('../utils/responseHandler');

/**
 * Middleware to check validation results
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
    }));

    return sendErrorResponse(res, 400, 'Validation failed', errorMessages);
  }

  next();
};

module.exports = validateRequest;
