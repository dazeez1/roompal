const User = require('../models/User');
const { generateTokenPair } = require('../services/tokenService');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const { AppError } = require('../utils/errorHandler');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/responseHandler');
const crypto = require('crypto');

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const registerUser = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendErrorResponse(res, 400, 'User with this email already exists.');
    }

    // Create new user
    const newUser = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    // Generate email verification token
    const verificationToken = newUser.generateEmailVerificationToken();
    await newUser.save({ validateBeforeSave: false });

    // Send verification email
    try {
      await sendVerificationEmail(newUser.email, newUser.fullName, verificationToken);
    } catch (emailError) {
      // If email fails, clear the token but don't fail registration
      newUser.clearEmailVerificationToken();
      await newUser.save({ validateBeforeSave: false });
      console.error('Failed to send verification email:', emailError);
    }

    // Generate tokens
    const tokens = generateTokenPair(newUser);

    // Save refresh token to user
    newUser.refreshToken = tokens.refreshToken;
    await newUser.save({ validateBeforeSave: false });

    // Remove sensitive data from response
    const userResponse = {
      userId: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      isEmailVerified: newUser.isEmailVerified,
      role: newUser.role,
    };

    sendSuccessResponse(
      res,
      201,
      'Registration successful! Please check your email to verify your account.',
      {
        user: userResponse,
        tokens,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendErrorResponse(res, 400, 'Email and password are required.');
    }

    // Find user and include password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return sendErrorResponse(res, 401, 'Invalid email or password.');
    }

    // Check if user is active
    if (!user.isActive) {
      return sendErrorResponse(res, 401, 'Your account has been deactivated. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return sendErrorResponse(res, 401, 'Invalid email or password.');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Save refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    // Remove sensitive data from response
    const userResponse = {
      userId: user._id,
      fullName: user.fullName,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      role: user.role,
    };

    sendSuccessResponse(res, 200, 'Login successful!', {
      user: userResponse,
      tokens,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify user email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return sendErrorResponse(res, 400, 'Verification token is required.');
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this token and check expiry
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpiry: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationTokenExpiry');

    if (!user) {
      return sendErrorResponse(res, 400, 'Invalid or expired verification token.');
    }

    // Verify email
    user.isEmailVerified = true;
    user.clearEmailVerificationToken();
    await user.save();

    sendSuccessResponse(res, 200, 'Email verified successfully!');
  } catch (error) {
    next(error);
  }
};

/**
 * Resend email verification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return sendErrorResponse(res, 404, 'User not found.');
    }

    if (user.isEmailVerified) {
      return sendErrorResponse(res, 400, 'Email is already verified.');
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.fullName, verificationToken);
      sendSuccessResponse(res, 200, 'Verification email sent successfully!');
    } catch (emailError) {
      user.clearEmailVerificationToken();
      await user.save({ validateBeforeSave: false });
      return sendErrorResponse(res, 500, 'Failed to send verification email. Please try again later.');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return sendSuccessResponse(
        res,
        200,
        'If an account exists with this email, a password reset link has been sent.'
      );
    }

    // Generate password reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, user.fullName, resetToken);
      sendSuccessResponse(
        res,
        200,
        'If an account exists with this email, a password reset link has been sent.'
      );
    } catch (emailError) {
      user.clearPasswordResetToken();
      await user.save({ validateBeforeSave: false });
      return sendErrorResponse(res, 500, 'Failed to send password reset email. Please try again later.');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return sendErrorResponse(res, 400, 'Token and new password are required.');
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this token and check expiry
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetTokenExpiry: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetTokenExpiry +password');

    if (!user) {
      return sendErrorResponse(res, 400, 'Invalid or expired password reset token.');
    }

    // Update password
    user.password = newPassword;
    user.clearPasswordResetToken();
    await user.save();

    sendSuccessResponse(res, 200, 'Password reset successful! Please login with your new password.');
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return sendErrorResponse(res, 404, 'User not found.');
    }

    sendSuccessResponse(res, 200, 'User profile retrieved successfully.', {
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendErrorResponse(res, 400, 'Refresh token is required.');
    }

    // Verify refresh token
    const { verifyToken } = require('../services/tokenService');
    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch (error) {
      return sendErrorResponse(res, 401, 'Invalid or expired refresh token.');
    }

    // Find user and verify refresh token matches
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return sendErrorResponse(res, 401, 'Invalid refresh token.');
    }

    // Generate new token pair
    const tokens = generateTokenPair(user);

    // Update refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    sendSuccessResponse(res, 200, 'Token refreshed successfully.', {
      tokens,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  refreshToken,
};
