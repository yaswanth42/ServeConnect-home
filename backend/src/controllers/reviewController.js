const Review = require('../models/Review');
const Booking = require('../models/Booking');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.createReview = catchAsync(async (req, res, next) => {
  const { bookingId, rating, comment } = req.body;

  if (!bookingId || !rating || !comment) {
    return next(new AppError('Please provide bookingId, rating, and comment', 400));
  }

  const booking = await Booking.findOne({ _id: bookingId, customer: req.user._id });
  if (!booking) {
    return next(new AppError('No booking found with that ID belonging to you', 404));
  }

  if (booking.status !== 'Completed') {
    return next(new AppError('You can only review services that are completed', 400));
  }

  // Check if review already exists
  const existingReview = await Review.findOne({ booking: bookingId });
  if (existingReview) {
    return next(new AppError('You have already reviewed this booking', 400));
  }

  if (!booking.provider) {
    return next(new AppError('This booking does not have an assigned provider to review', 400));
  }

  const review = await Review.create({
    customer: req.user._id,
    provider: booking.provider,
    booking: bookingId,
    rating,
    comment
  });

  res.status(201).json({
    status: 'success',
    data: { review }
  });
});

exports.getProviderReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({ provider: req.params.providerId })
    .populate('customer', 'name avatar')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { reviews }
  });
});

exports.getCustomerReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({ customer: req.user._id })
    .populate('provider', 'name avatar')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { reviews }
  });
});
