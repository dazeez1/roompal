const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { AppError } = require('../utils/errorHandler');

// Configure Cloudinary if not already configured
if (!cloudinary.config().cloud_name) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Configure Cloudinary storage for multer
 */
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'roompal/properties',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        {
          width: 1200,
          height: 800,
          crop: 'limit',
          quality: 'auto',
        },
      ],
      public_id: `property_${Date.now()}_${Math.round(Math.random() * 1e9)}`,
    };
  },
});

/**
 * File filter for image uploads
 */
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = file.originalname.toLowerCase().match(/\.[0-9a-z]+$/)?.[0];

    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          'Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed.',
          400
        ),
        false
      );
    }
  } else {
    cb(new AppError('Only image files are allowed.', 400), false);
  }
};

/**
 * Multer configuration
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 10, // Maximum 10 files
  },
});

/**
 * Configure Cloudinary storage for profile images
 */
const profileImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'roompal/profiles',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        {
          width: 400,
          height: 400,
          crop: 'fill',
          gravity: 'face',
          quality: 'auto',
        },
      ],
      public_id: `profile_${Date.now()}_${Math.round(Math.random() * 1e9)}`,
    };
  },
});

const profileImageUpload = multer({
  storage: profileImageStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

/**
 * Middleware to handle multiple image uploads
 */
const uploadPropertyImages = upload.array('images', 10);

/**
 * Middleware to handle single image upload
 */
const uploadSingleImage = upload.single('image');

/**
 * Middleware to handle profile image upload
 */
const uploadProfileImage = profileImageUpload.single('image');

/**
 * Error handler for multer errors
 */
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB per image.',
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 images allowed.',
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.',
      });
    }
  }

  if (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'File upload failed.',
    });
  }

  next();
};

module.exports = {
  uploadPropertyImages,
  uploadSingleImage,
  uploadProfileImage,
  handleMulterError,
};
