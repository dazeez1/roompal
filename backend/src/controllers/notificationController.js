const Notification = require('../models/Notification');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/responseHandler');

/**
 * Get all notifications for current user
 */
const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { unreadOnly = false } = req.query;

    const query = { user: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('relatedUser', 'fullName email')
      .sort('-createdAt')
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      user: userId,
      isRead: false,
    });

    sendSuccessResponse(res, 200, 'Notifications retrieved successfully', {
      notifications,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return sendErrorResponse(res, 404, 'Notification not found');
    }

    // Verify user owns the notification
    if (notification.user.toString() !== userId.toString()) {
      return sendErrorResponse(
        res,
        403,
        'You are not authorized to mark this notification as read'
      );
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    sendSuccessResponse(res, 200, 'Notification marked as read', {
      notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    sendSuccessResponse(res, 200, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete notification
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return sendErrorResponse(res, 404, 'Notification not found');
    }

    // Verify user owns the notification
    if (notification.user.toString() !== userId.toString()) {
      return sendErrorResponse(
        res,
        403,
        'You are not authorized to delete this notification'
      );
    }

    await Notification.findByIdAndDelete(notificationId);

    sendSuccessResponse(res, 200, 'Notification deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
