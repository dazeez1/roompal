const RoommateRequest = require('../models/RoommateRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/responseHandler');
const { validationResult } = require('express-validator');

/**
 * Send a roommate request
 */
const sendRequest = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { recipientId, message } = req.body;
    const requesterId = req.user.userId;

    // Prevent self-requests
    if (requesterId.toString() === recipientId) {
      return sendErrorResponse(res, 400, 'You cannot send a request to yourself');
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return sendErrorResponse(res, 404, 'Recipient not found');
    }

    // Check if there's already a pending request
    const existingRequest = await RoommateRequest.findOne({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending',
    });

    if (existingRequest) {
      return sendErrorResponse(
        res,
        409,
        'You have already sent a request to this user'
      );
    }

    // Check if there's a reverse pending request (they requested you)
    const reverseRequest = await RoommateRequest.findOne({
      requester: recipientId,
      recipient: requesterId,
      status: 'pending',
    });

    if (reverseRequest) {
      // Auto-accept the reverse request
      reverseRequest.status = 'accepted';
      await reverseRequest.save();

      return sendSuccessResponse(
        res,
        200,
        'Request accepted automatically (they requested you first)',
        { request: reverseRequest }
      );
    }

    // Create new request
    const request = await RoommateRequest.create({
      requester: requesterId,
      recipient: recipientId,
      message: message || undefined,
      status: 'pending',
    });

    await request.populate('requester', 'fullName email');
    await request.populate('recipient', 'fullName email');

    // Create notification for recipient
    const requester = await User.findById(requesterId);
    await Notification.create({
      user: recipientId,
      type: 'roommate_request',
      title: 'New Roommate Request',
      message: `${requester.fullName} wants to be your roommate!`,
      relatedUser: requesterId,
      relatedRequest: request._id,
      isRead: false,
    });

    console.log('✅ Roommate request sent:', {
      requester: requesterId,
      recipient: recipientId,
      requestId: request._id,
    });

    sendSuccessResponse(res, 201, 'Roommate request sent successfully', {
      request,
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendErrorResponse(
        res,
        409,
        'You have already sent a request to this user'
      );
    }
    next(error);
  }
};

/**
 * Get all requests for current user (sent and received)
 */
const getMyRequests = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const [sentRequests, receivedRequests] = await Promise.all([
      RoommateRequest.find({ requester: userId })
        .populate('recipient', 'fullName email')
        .sort('-createdAt')
        .lean(),
      RoommateRequest.find({ recipient: userId })
        .populate('requester', 'fullName email')
        .sort('-createdAt')
        .lean(),
    ]);

    sendSuccessResponse(res, 200, 'Requests retrieved successfully', {
      sent: sentRequests,
      received: receivedRequests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept a roommate request
 */
const acceptRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;

    const request = await RoommateRequest.findById(requestId);

    if (!request) {
      return sendErrorResponse(res, 404, 'Request not found');
    }

    // Verify user is the recipient
    if (request.recipient.toString() !== userId.toString()) {
      return sendErrorResponse(
        res,
        403,
        'You are not authorized to accept this request'
      );
    }

    if (request.status !== 'pending') {
      return sendErrorResponse(
        res,
        400,
        `Request is already ${request.status}`
      );
    }

    request.status = 'accepted';
    await request.save();

    await request.populate('requester', 'fullName email');
    await request.populate('recipient', 'fullName email');

    // Create notification for requester
    const recipient = await User.findById(request.recipient);
    await Notification.create({
      user: request.requester,
      type: 'roommate_request_accepted',
      title: 'Roommate Request Accepted',
      message: `${recipient.fullName} accepted your roommate request!`,
      relatedUser: request.recipient,
      relatedRequest: request._id,
      isRead: false,
    });

    console.log('✅ Roommate request accepted:', requestId);

    sendSuccessResponse(res, 200, 'Roommate request accepted', {
      request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a roommate request
 */
const rejectRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;

    const request = await RoommateRequest.findById(requestId);

    if (!request) {
      return sendErrorResponse(res, 404, 'Request not found');
    }

    // Verify user is the recipient
    if (request.recipient.toString() !== userId.toString()) {
      return sendErrorResponse(
        res,
        403,
        'You are not authorized to reject this request'
      );
    }

    if (request.status !== 'pending') {
      return sendErrorResponse(
        res,
        400,
        `Request is already ${request.status}`
      );
    }

    request.status = 'rejected';
    await request.save();

    console.log('✅ Roommate request rejected:', requestId);

    sendSuccessResponse(res, 200, 'Roommate request rejected', {
      request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a sent request
 */
const cancelRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;

    const request = await RoommateRequest.findById(requestId);

    if (!request) {
      return sendErrorResponse(res, 404, 'Request not found');
    }

    // Verify user is the requester
    if (request.requester.toString() !== userId.toString()) {
      return sendErrorResponse(
        res,
        403,
        'You are not authorized to cancel this request'
      );
    }

    if (request.status !== 'pending') {
      return sendErrorResponse(
        res,
        400,
        `Request is already ${request.status}`
      );
    }

    request.status = 'cancelled';
    await request.save();

    console.log('✅ Roommate request cancelled:', requestId);

    sendSuccessResponse(res, 200, 'Roommate request cancelled', {
      request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if there's a request between two users
 */
const checkRequestStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    const request = await RoommateRequest.findOne({
      $or: [
        { requester: currentUserId, recipient: userId },
        { requester: userId, recipient: currentUserId },
      ],
    })
      .populate('requester', 'fullName email')
      .populate('recipient', 'fullName email')
      .lean();

    if (!request) {
      return sendSuccessResponse(res, 200, 'No request found', {
        request: null,
      });
    }

    sendSuccessResponse(res, 200, 'Request status retrieved', {
      request,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendRequest,
  getMyRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  checkRequestStatus,
};
