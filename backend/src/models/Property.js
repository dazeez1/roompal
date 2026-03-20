const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Property owner is required'],
    },
    title: {
      type: String,
      required: [true, 'Property title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Property description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    location: {
      type: String,
      required: [true, 'Property location is required'],
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Property price is required'],
      min: [0, 'Price cannot be negative'],
    },
    apartmentType: {
      type: String,
      required: [true, 'Apartment type is required'],
      enum: [
        'Apartments / Flats',
        'Self-contained rooms',
        'Shared Apartments',
        'Detached Houses',
        'Semi-detached Houses',
        'Duplexes',
        'Bungalows',
        'Serviced Apartments',
      ],
    },
    bedrooms: {
      type: Number,
      min: [0, 'Bedrooms cannot be negative'],
      default: 0,
    },
    bathrooms: {
      type: Number,
      min: [0, 'Bathrooms cannot be negative'],
      default: 0,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (images) {
          return images.length <= 10;
        },
        message: 'Cannot upload more than 10 images',
      },
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flaggedReason: {
      type: String,
      trim: true,
    },
    totalArea: {
      type: Number,
      min: [0, 'Total area cannot be negative'],
    },
    amenities: {
      type: [String],
      default: [],
    },
    availableFrom: {
      type: Date,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    contactPhone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for better query performance
propertySchema.index({ location: 1, price: 1 });
propertySchema.index({ apartmentType: 1 });
propertySchema.index({ isApproved: 1, isAvailable: 1 });
propertySchema.index({ owner: 1 });

// Instance method to check if property is visible to public
propertySchema.methods.isPublic = function () {
  return this.isApproved && !this.isFlagged && this.isAvailable;
};

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
