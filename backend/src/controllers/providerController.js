const ProviderProfile = require('../models/ProviderProfile');
const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getProviderProfile = catchAsync(async (req, res, next) => {
  const profile = await ProviderProfile.findOne({ user: req.user._id }).populate({
    path: 'category',
    select: 'name slug icon'
  });

  if (!profile) {
    return next(new AppError('No provider profile found for this user', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { profile }
  });
});

exports.updateProviderProfile = catchAsync(async (req, res, next) => {
  const { bio, experience, isAvailable, workingHours } = req.body;

  let profile = await ProviderProfile.findOne({ user: req.user._id });

  if (!profile) {
    return next(new AppError('No provider profile found for this user', 404));
  }

  if (bio !== undefined) profile.bio = bio;
  if (experience !== undefined) profile.experience = experience;
  if (isAvailable !== undefined) profile.isAvailable = isAvailable;
  if (workingHours !== undefined) profile.workingHours = workingHours;

  await profile.save();

  const updatedProfile = await ProviderProfile.findById(profile._id).populate({
    path: 'category',
    select: 'name slug icon'
  });

  res.status(200).json({
    status: 'success',
    data: { profile: updatedProfile }
  });
});

exports.uploadDocument = catchAsync(async (req, res, next) => {
  const { type, name, url } = req.body;

  if (!type || !url) {
    return next(new AppError('Please specify document type and document URL', 400));
  }

  let profile = await ProviderProfile.findOne({ user: req.user._id });

  if (!profile) {
    return next(new AppError('No provider profile found for this user', 404));
  }

  // Add document to list
  profile.documents.push({
    type,
    name: name || `${type.replace('_', ' ')}`,
    url,
    status: 'pending' // requires admin review
  });

  await profile.save();

  res.status(200).json({
    status: 'success',
    data: { profile }
  });
});

exports.getProvidersByCategory = catchAsync(async (req, res, next) => {
  const providers = await ProviderProfile.find({
    category: req.params.categoryId,
    status: 'approved',
    isAvailable: true
  }).populate({
    path: 'user',
    select: 'name email avatar'
  });

  res.status(200).json({
    status: 'success',
    results: providers.length,
    data: { providers }
  });
});
