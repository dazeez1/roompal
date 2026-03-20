const cloudinary = require('cloudinary').v2;

/**
 * Configure Cloudinary
 */
const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Cloudinary configured');
  }
};

module.exports = configureCloudinary;
