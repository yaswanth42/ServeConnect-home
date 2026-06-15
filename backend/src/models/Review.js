const mongoose = require('mongoose');
const ProviderProfile = require('./ProviderProfile');

const reviewSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a customer']
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A review must be written for a provider']
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'A review must link to a specific booking'],
      unique: true // One review per booking
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Please provide a rating between 1 and 5 stars']
    },
    comment: {
      type: String,
      required: [true, 'Please write a comment for your review'],
      trim: true,
      maxlength: [300, 'Review comment cannot exceed 300 characters']
    }
  },
  {
    timestamps: true
  }
);

// Static method to calculate average ratings
reviewSchema.statics.calcAverageRatings = async function (providerUserId) {
  const stats = await this.aggregate([
    {
      $match: { provider: providerUserId }
    },
    {
      $group: {
        _id: '$provider',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await ProviderProfile.findOneAndUpdate(
      { user: providerUserId },
      {
        rating: stats[0].avgRating,
        totalRatings: stats[0].nRating
      }
    );
  } else {
    // Default values if no reviews
    await ProviderProfile.findOneAndUpdate(
      { user: providerUserId },
      {
        rating: 5.0,
        totalRatings: 0
      }
    );
  }
};

// Call calcAverageRatings after save
reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.provider);
});

// Call calcAverageRatings after delete or updates
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.provider);
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
