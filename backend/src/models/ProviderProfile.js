const mongoose = require('mongoose');

const providerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A provider profile must belong to a user']
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'A provider profile must have a primary category']
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    experience: {
      type: Number,
      required: [true, 'Please specify your years of experience'],
      min: [0, 'Experience cannot be negative']
    },
    rating: {
      type: Number,
      default: 5.0,
      min: [1, 'Rating must be at least 1.0'],
      max: [5, 'Rating cannot exceed 5.0'],
      set: val => Math.round(val * 10) / 10 // e.g. 4.666 -> 4.7
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'suspended'],
      default: 'pending'
    },
    workingHours: {
      start: {
        type: String,
        default: '09:00' // HH:MM 24h format
      },
      end: {
        type: String,
        default: '18:00'
      }
    },
    documents: [
      {
        type: {
          type: String,
          enum: ['identity_proof', 'certificate', 'other'],
          required: true
        },
        url: {
          type: String,
          required: true
        },
        name: String,
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending'
        }
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const ProviderProfile = mongoose.model('ProviderProfile', providerProfileSchema);

module.exports = ProviderProfile;
