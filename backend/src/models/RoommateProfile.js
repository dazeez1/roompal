const mongoose = require('mongoose');

const roommateProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      unique: true, // One profile per user
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
      trim: true,
    },
    preferredGender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'No Preference'],
      default: 'No Preference',
      trim: true,
    },
    budget: {
      type: Number,
      required: [true, 'Budget is required'],
      min: [0, 'Budget cannot be negative'],
    },
    preferredLocation: {
      type: String,
      required: [true, 'Preferred location is required'],
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    lifestyle: {
      type: String,
      enum: ['Quiet', 'Moderate', 'Social', 'Party', 'Flexible'],
      default: 'Flexible',
      trim: true,
    },
    cleanlinessLevel: {
      type: Number,
      min: [1, 'Cleanliness level must be at least 1'],
      max: [5, 'Cleanliness level cannot exceed 5'],
      default: 3,
    },
    smoking: {
      type: Boolean,
      default: false,
    },
    pets: {
      type: Boolean,
      default: false,
    },
    occupation: {
      type: String,
      trim: true,
      maxlength: [100, 'Occupation cannot exceed 100 characters'],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    },
    profileImage: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Indexes for performance
roommateProfileSchema.index({ user: 1 }, { unique: true });
roommateProfileSchema.index({ isActive: 1, preferredLocation: 1 });
roommateProfileSchema.index({ isActive: 1, budget: 1 });

// Instance method to check if profile is complete
roommateProfileSchema.methods.isComplete = function () {
  return (
    this.gender &&
    this.budget &&
    this.preferredLocation &&
    this.lifestyle &&
    this.cleanlinessLevel
  );
};

const RoommateProfile = mongoose.model('RoommateProfile', roommateProfileSchema);

module.exports = RoommateProfile;
