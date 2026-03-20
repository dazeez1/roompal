const express = require('express');
const { body, query, param } = require('express-validator');
const {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  approveProperty,
  flagProperty,
  getMyProperties,
} = require('../controllers/propertyController');
const { protectRoute, restrictTo } = require('../middleware/authMiddleware');
const { uploadPropertyImages, handleMulterError } = require('../middleware/uploadMiddleware');
const validateRequest = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules
const createPropertyValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 20, max: 5000 })
    .withMessage('Description must be between 20 and 5000 characters'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('apartmentType')
    .notEmpty()
    .withMessage('Apartment type is required')
    .isIn([
      'Apartments / Flats',
      'Self-contained rooms',
      'Shared Apartments',
      'Detached Houses',
      'Semi-detached Houses',
      'Duplexes',
      'Bungalows',
      'Serviced Apartments',
    ])
    .withMessage('Invalid apartment type'),
  body('bedrooms').optional().isInt({ min: 0 }).withMessage('Bedrooms must be a non-negative integer'),
  body('bathrooms').optional().isInt({ min: 0 }).withMessage('Bathrooms must be a non-negative integer'),
  body('totalArea').optional().isFloat({ min: 0 }).withMessage('Total area must be a positive number'),
];

const updatePropertyValidation = [
  body('title').optional().trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('description').optional().trim().isLength({ min: 20, max: 5000 }).withMessage('Description must be between 20 and 5000 characters'),
  body('location').optional().trim().isLength({ max: 200 }).withMessage('Location cannot exceed 200 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('apartmentType')
    .optional()
    .isIn([
      'Apartments / Flats',
      'Self-contained rooms',
      'Shared Apartments',
      'Detached Houses',
      'Semi-detached Houses',
      'Duplexes',
      'Bungalows',
      'Serviced Apartments',
    ])
    .withMessage('Invalid apartment type'),
];

const queryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  query('bedrooms').optional().isInt({ min: 0 }).withMessage('Bedrooms must be a non-negative integer'),
  query('bathrooms').optional().isInt({ min: 0 }).withMessage('Bathrooms must be a non-negative integer'),
];

const paramValidation = [
  param('id').isMongoId().withMessage('Invalid property ID'),
];

// Routes

// Public routes
router.get('/', queryValidation, validateRequest, getAllProperties);
router.get('/:id', paramValidation, validateRequest, getPropertyById);

// Protected routes (require authentication)
// SIMPLIFIED: Removed validation middleware for now to debug
router.post(
  '/',
  protectRoute,
  uploadPropertyImages,
  handleMulterError,
  createProperty
);

router.get('/my/properties', protectRoute, getMyProperties);

router.put(
  '/:id',
  protectRoute,
  paramValidation,
  uploadPropertyImages,
  handleMulterError,
  updatePropertyValidation,
  validateRequest,
  updateProperty
);

router.delete('/:id', protectRoute, paramValidation, validateRequest, deleteProperty);

// Admin routes
router.put(
  '/:id/approve',
  protectRoute,
  restrictTo('admin'),
  paramValidation,
  validateRequest,
  approveProperty
);

router.put(
  '/:id/flag',
  protectRoute,
  restrictTo('admin'),
  paramValidation,
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  validateRequest,
  flagProperty
);

module.exports = router;
