const express = require('express');
const { body } = require('express-validator');
const roommateRequestController = require('../controllers/roommateRequestController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.protectRoute);

// Validation rules
const sendRequestValidation = [
  body('recipientId')
    .notEmpty()
    .withMessage('Recipient ID is required')
    .isMongoId()
    .withMessage('Invalid recipient ID'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters'),
];

// Routes
router.post(
  '/',
  sendRequestValidation,
  validate,
  roommateRequestController.sendRequest
);

router.get('/me', roommateRequestController.getMyRequests);

router.get('/status/:userId', roommateRequestController.checkRequestStatus);

router.put('/:requestId/accept', roommateRequestController.acceptRequest);

router.put('/:requestId/reject', roommateRequestController.rejectRequest);

router.put('/:requestId/cancel', roommateRequestController.cancelRequest);

module.exports = router;
