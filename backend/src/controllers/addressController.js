const Address = require('../models/Address');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllAddresses = catchAsync(async (req, res, next) => {
  const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: addresses.length,
    data: { addresses }
  });
});

exports.createAddress = catchAsync(async (req, res, next) => {
  const { title, streetAddress, city, state, zipCode, coordinates, isDefault } = req.body;

  // Check if this is the first address, if so, force it to be default
  const addressCount = await Address.countDocuments({ user: req.user._id });
  const shouldBeDefault = addressCount === 0 ? true : isDefault;

  const newAddress = await Address.create({
    user: req.user._id,
    title,
    streetAddress,
    city,
    state,
    zipCode,
    coordinates,
    isDefault: shouldBeDefault
  });

  res.status(201).json({
    status: 'success',
    data: { address: newAddress }
  });
});

exports.updateAddress = catchAsync(async (req, res, next) => {
  const { title, streetAddress, city, state, zipCode, coordinates, isDefault } = req.body;

  let address = await Address.findOne({ _id: req.params.id, user: req.user._id });

  if (!address) {
    return next(new AppError('No address found with that ID belonging to this user', 404));
  }

  // Update fields
  if (title) address.title = title;
  if (streetAddress) address.streetAddress = streetAddress;
  if (city) address.city = city;
  if (state) address.state = state;
  if (zipCode) address.zipCode = zipCode;
  if (coordinates) address.coordinates = coordinates;
  if (isDefault !== undefined) address.isDefault = isDefault;

  await address.save();

  res.status(200).json({
    status: 'success',
    data: { address }
  });
});

exports.deleteAddress = catchAsync(async (req, res, next) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!address) {
    return next(new AppError('No address found with that ID belonging to this user', 404));
  }

  // If deleted address was default, set another address as default if any exist
  if (address.isDefault) {
    const anotherAddress = await Address.findOne({ user: req.user._id });
    if (anotherAddress) {
      anotherAddress.isDefault = true;
      await anotherAddress.save();
    }
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.setDefaultAddress = catchAsync(async (req, res, next) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });

  if (!address) {
    return next(new AppError('No address found with that ID belonging to this user', 404));
  }

  address.isDefault = true;
  await address.save();

  res.status(200).json({
    status: 'success',
    data: { address }
  });
});
