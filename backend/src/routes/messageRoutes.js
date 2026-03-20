const express = require('express');
const { body } = require('express-validator');
const messageController = require('../controllers/messageController');
const { protectRoute } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules
const messageValidation = [
  body('receiverId')
    .notEmpty()
    .withMessage('Receiver ID is required')
    .isMongoId()
    .withMessage('Invalid receiver ID'),
  body('content')
    .notEmpty()
    .withMessage('Message content is required')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters'),
];

// All routes require authentication
router.use(protectRoute);

// Routes
router.get('/conversations', messageController.getConversations);
router.get('/unread/count', messageController.getUnreadCount);
router.get('/:conversationId', messageController.getMessages);
router.post('/', messageValidation, validate, messageController.sendMessage);
router.put('/:id/read', messageController.markAsRead);

module.exports = router;
