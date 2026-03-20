const Property = require('../models/Property');
const { AppError } = require('../utils/errorHandler');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/responseHandler');

/**
 * Create a new property - SIMPLIFIED VERSION
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const createProperty = async (req, res, next) => {
  try {
    console.log('=== CREATE PROPERTY REQUEST ===');
    console.log('User ID:', req.user?.userId);
    console.log('Body:', req.body);
    console.log('Files:', req.files ? req.files.map(f => ({ name: f.originalname, path: f.path })) : 'No files');

    // Extract data from request body
    const {
      title,
      description,
      location,
      price,
      apartmentType,
      bedrooms,
      bathrooms,
      totalArea,
      amenities,
      contactPhone,
    } = req.body;

    // Validate required fields
    if (!title || !description || !location || !price || !apartmentType) {
      return sendErrorResponse(
        res,
        400,
        'Missing required fields: title, description, location, price, and apartmentType are required.'
      );
    }

    // Get image URLs from uploaded files
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map((file) => file.path || file.url || file.secure_url);
      console.log('Image URLs:', imageUrls);
    }

    // Validate at least one image
    if (imageUrls.length === 0) {
      return sendErrorResponse(res, 400, 'At least one property image is required.');
    }

    // Prepare property data
    const propertyData = {
      owner: req.user.userId,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      price: parseFloat(price),
      apartmentType: apartmentType.trim(),
      bedrooms: bedrooms ? parseInt(bedrooms) : 0,
      bathrooms: bathrooms ? parseInt(bathrooms) : 0,
      images: imageUrls,
      isApproved: true, // Auto-approved for immediate listing
    };

    // Add optional fields if provided
    if (totalArea) {
      propertyData.totalArea = parseFloat(totalArea);
    }
    if (amenities) {
      // Handle both array and string formats
      propertyData.amenities = Array.isArray(amenities) ? amenities : [amenities];
    }
    if (contactPhone) {
      propertyData.contactPhone = contactPhone.trim();
    }

    console.log('Creating property with data:', propertyData);

    // Create property
    const newProperty = await Property.create(propertyData);

    // Populate owner info
    await newProperty.populate('owner', 'fullName email');

    console.log('Property created successfully:', newProperty._id);

    sendSuccessResponse(
      res,
      201,
      'Property listed successfully! Your property is now live.',
      {
        property: newProperty,
      }
    );
  } catch (error) {
    console.error('Error creating property:', error);
    next(error);
  }
};

/**
 * Get all properties (public - only approved)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getAllProperties = async (req, res, next) => {
  try {
    const {
      location,
      minPrice,
      maxPrice,
      apartmentType,
      bedrooms,
      bathrooms,
      page = 1,
      limit = 12,
      sort = '-createdAt',
    } = req.query;

    // Build query - only show approved, non-flagged properties
    // isAvailable is optional (defaults to true, but we don't filter by it to show all approved)
    const query = {
      isApproved: true,
      isFlagged: false,
    };
    
    // Only filter by isAvailable if explicitly requested
    // This allows all approved properties to show by default

    // Apply filters
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (apartmentType) {
      query.apartmentType = apartmentType;
    }

    if (bedrooms) {
      query.bedrooms = { $gte: parseInt(bedrooms) };
    }

    if (bathrooms) {
      query.bathrooms = { $gte: parseInt(bathrooms) };
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const properties = await Property.find(query)
      .populate('owner', 'fullName email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Property.countDocuments(query);

    sendSuccessResponse(res, 200, 'Properties retrieved successfully.', {
      properties,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalProperties: total,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single property by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getPropertyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id).populate('owner', 'fullName email phone phoneNumber');

    if (!property) {
      return sendErrorResponse(res, 404, 'Property not found.');
    }

    // Check if property is public or user is owner/admin
    const isOwner = req.user && property.owner._id.toString() === req.user.userId;
    const isAdmin = req.user && req.user.role === 'admin';

    if (!property.isPublic() && !isOwner && !isAdmin) {
      return sendErrorResponse(
        res,
        403,
        'This property is not available or is pending approval.'
      );
    }

    sendSuccessResponse(res, 200, 'Property retrieved successfully.', {
      property,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update property
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const updateProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find property
    const property = await Property.findById(id);

    if (!property) {
      return sendErrorResponse(res, 404, 'Property not found.');
    }

    // Check if user is owner or admin
    const isOwner = property.owner.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return sendErrorResponse(
        res,
        403,
        'You do not have permission to update this property.'
      );
    }

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const newImageUrls = req.files.map((file) => file.path);
      updateData.images = [...(property.images || []), ...newImageUrls].slice(0, 10); // Max 10 images
    }

    // Remove owner from update data (cannot change owner)
    delete updateData.owner;

    // If non-admin updates, reset approval status
    if (!isAdmin && updateData.isApproved !== undefined) {
      delete updateData.isApproved;
    }

    // Update property
    const updatedProperty = await Property.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('owner', 'fullName email');

    // If property was updated by owner (not admin), reset approval
    if (!isAdmin) {
      updatedProperty.isApproved = false;
      await updatedProperty.save();
    }

    sendSuccessResponse(res, 200, 'Property updated successfully.', {
      property: updatedProperty,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete property
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const deleteProperty = async (req, res, next) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id);

    if (!property) {
      return sendErrorResponse(res, 404, 'Property not found.');
    }

    // Check if user is owner or admin
    const isOwner = property.owner.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return sendErrorResponse(
        res,
        403,
        'You do not have permission to delete this property.'
      );
    }

    // TODO: Delete images from Cloudinary (optional cleanup)

    await Property.findByIdAndDelete(id);

    sendSuccessResponse(res, 200, 'Property deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Approve property
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const approveProperty = async (req, res, next) => {
  try {
    const { id } = req.params;

    const property = await Property.findByIdAndUpdate(
      id,
      {
        isApproved: true,
        isFlagged: false,
        flaggedReason: undefined,
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate('owner', 'fullName email');

    if (!property) {
      return sendErrorResponse(res, 404, 'Property not found.');
    }

    sendSuccessResponse(res, 200, 'Property approved successfully.', {
      property,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Flag property
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const flagProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const property = await Property.findByIdAndUpdate(
      id,
      {
        isFlagged: true,
        flaggedReason: reason || 'Property flagged by admin',
        isApproved: false,
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate('owner', 'fullName email');

    if (!property) {
      return sendErrorResponse(res, 404, 'Property not found.');
    }

    sendSuccessResponse(res, 200, 'Property flagged successfully.', {
      property,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's own properties
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getMyProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({ owner: req.user.userId })
      .populate('owner', 'fullName email')
      .sort('-createdAt')
      .lean();

    sendSuccessResponse(res, 200, 'Your properties retrieved successfully.', {
      properties,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  approveProperty,
  flagProperty,
  getMyProperties,
};
