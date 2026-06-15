const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Address = require('../models/Address');
const User = require('../models/User');
const ProviderProfile = require('../models/ProviderProfile');
const Notification = require('../models/Notification');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { emitToUser, emitToRole } = require('../socket/socketHandler');

// ==========================================
// HELPERS
// ==========================================

const sendNotification = async (userId, title, message, bookingId) => {
  try {
    await Notification.create({
      user: userId,
      title,
      message,
      booking: bookingId
    });
    // Emit socket event for real-time toaster
    emitToUser(userId.toString(), 'notification', { title, message, bookingId });
  } catch (err) {
    console.error('Failed to create notification document:', err);
  }
};

const assignNextProvider = async (booking) => {
  const service = await Service.findById(booking.service);
  if (!service) return false;

  // Get list of already rejected providers for this booking
  const rejectedProviderIds = booking.assignmentHistory
    .filter(hist => hist.status === 'Rejected')
    .map(hist => hist.provider.toString());

  // Find providers in this category who are: approved, available, verified
  const eligibleProviders = await ProviderProfile.find({
    category: service.category,
    status: 'approved',
    isAvailable: true,
    user: { $nin: rejectedProviderIds }
  }).sort({ rating: -1 }); // sort by highest rating

  if (eligibleProviders.length === 0) {
    // No eligible providers left
    booking.provider = undefined;
    booking.status = 'Pending';
    await booking.save();

    await sendNotification(
      booking.customer,
      'No Providers Available',
      'We could not find an available provider right now. We will keep looking.',
      booking._id
    );
    emitToUser(booking.customer.toString(), 'booking-update', booking);
    return false;
  }

  // Pick the highest-rated provider
  const candidate = eligibleProviders[0];

  booking.provider = candidate.user;
  booking.status = 'Assigned';
  booking.assignmentHistory.push({
    provider: candidate.user,
    status: 'Offered',
    assignedAt: Date.now()
  });

  await booking.save();

  // Notify new provider
  await sendNotification(
    candidate.user,
    'New Booking Offer',
    `You have a new booking request for ${service.name}.`,
    booking._id
  );

  // Notify customer
  await sendNotification(
    booking.customer,
    'Provider Found',
    'A provider has been assigned. Waiting for their acceptance.',
    booking._id
  );

  // Emit real-time status updates
  emitToUser(booking.customer.toString(), 'booking-update', booking);
  emitToUser(candidate.user.toString(), 'booking-offer', booking);

  return true;
};

// ==========================================
// CONTROLLERS
// ==========================================

exports.createBooking = catchAsync(async (req, res, next) => {
  const { serviceId, addressId, scheduleDate, scheduleTime, paymentMethod, notes } = req.body;

  const service = await Service.findById(serviceId);
  if (!service) return next(new AppError('No service found with that ID', 404));

  const address = await Address.findOne({ _id: addressId, user: req.user._id });
  if (!address) return next(new AppError('No address found with that ID belonging to this user', 404));

  // Create booking in Pending status
  const booking = await Booking.create({
    customer: req.user._id,
    service: serviceId,
    address: addressId,
    scheduleDate,
    scheduleTime,
    paymentMethod,
    price: service.price,
    notes,
    status: 'Pending'
  });

  // Attempt automatic provider assignment
  await assignNextProvider(booking);

  const populated = await Booking.findById(booking._id)
    .populate('service')
    .populate('address')
    .populate('provider', 'name email avatar');

  res.status(201).json({
    status: 'success',
    data: { booking: populated }
  });
});

exports.getCustomerBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ customer: req.user._id })
    .populate('service')
    .populate('address')
    .populate('provider', 'name email avatar')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: { bookings }
  });
});

exports.getProviderBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ provider: req.user._id })
    .populate('service')
    .populate('address')
    .populate('customer', 'name email avatar')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: { bookings }
  });
});

exports.getBookingDetails = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id)
    .populate('service')
    .populate('address')
    .populate('customer', 'name email avatar')
    .populate('provider', 'name email avatar');

  if (!booking) {
    return next(new AppError('No booking found with that ID', 404));
  }

  // Ensure authorized user (customer, provider, or admin)
  if (
    req.user.role !== 'admin' &&
    booking.customer._id.toString() !== req.user._id.toString() &&
    booking.provider?._id.toString() !== req.user._id.toString()
  ) {
    return next(new AppError('You do not have permission to view this booking', 403));
  }

  res.status(200).json({
    status: 'success',
    data: { booking }
  });
});

exports.acceptBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findOne({ _id: req.params.id, provider: req.user._id });

  if (!booking) {
    return next(new AppError('No booking found with that ID assigned to you', 404));
  }

  if (booking.status !== 'Assigned') {
    return next(new AppError('This booking is not in a state to be accepted', 400));
  }

  booking.status = 'Accepted';
  
  // Find offered item in assignment history and set to Accepted
  const offer = booking.assignmentHistory.find(
    hist => hist.provider.toString() === req.user._id.toString() && hist.status === 'Offered'
  );
  if (offer) {
    offer.status = 'Accepted';
  }

  await booking.save();

  // Send notifications
  await sendNotification(
    booking.customer,
    'Booking Accepted',
    `${req.user.name} has accepted your booking and is assigned.`,
    booking._id
  );

  // Emit real-time status update to customer and provider
  const populated = await Booking.findById(booking._id)
    .populate('service')
    .populate('address')
    .populate('provider', 'name email avatar');

  emitToUser(booking.customer.toString(), 'booking-update', populated);
  emitToUser(req.user._id.toString(), 'booking-update', populated);

  res.status(200).json({
    status: 'success',
    data: { booking: populated }
  });
});

exports.rejectBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findOne({ _id: req.params.id, provider: req.user._id });

  if (!booking) {
    return next(new AppError('No booking found with that ID assigned to you', 404));
  }

  if (booking.status !== 'Assigned') {
    return next(new AppError('This booking cannot be rejected at this stage', 400));
  }

  // Update offer history to Rejected
  const offer = booking.assignmentHistory.find(
    hist => hist.provider.toString() === req.user._id.toString() && hist.status === 'Offered'
  );
  if (offer) {
    offer.status = 'Rejected';
  }

  booking.status = 'Rejected';
  await booking.save();

  // Attempt next assignment
  await assignNextProvider(booking);

  res.status(200).json({
    status: 'success',
    message: 'Booking rejected successfully. Searching for next provider.'
  });
});

exports.updateBookingStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['On The Way', 'Started', 'Completed'];

  if (!validStatuses.includes(status)) {
    return next(new AppError(`Invalid status transitions. Choose from: ${validStatuses.join(', ')}`, 400));
  }

  const booking = await Booking.findOne({ _id: req.params.id, provider: req.user._id });
  if (!booking) {
    return next(new AppError('No booking found with that ID assigned to you', 404));
  }

  // State machine checks
  if (status === 'On The Way' && booking.status !== 'Accepted') {
    return next(new AppError('Booking must be accepted before setting On The Way', 400));
  }
  if (status === 'Started' && booking.status !== 'On The Way') {
    return next(new AppError('Provider must be On The Way before starting service', 400));
  }
  if (status === 'Completed' && booking.status !== 'Started') {
    return next(new AppError('Service must be started before completing', 400));
  }

  booking.status = status;
  
  if (status === 'Completed') {
    if (booking.paymentMethod === 'Cash') {
      booking.paymentStatus = 'Paid';
    }
  }

  await booking.save();

  // Send notification to customer
  let message = '';
  if (status === 'On The Way') message = 'Provider is on the way to your address.';
  if (status === 'Started') message = 'Service has started.';
  if (status === 'Completed') message = 'Service has completed successfully. Please rate your experience!';

  await sendNotification(booking.customer, `Booking Status: ${status}`, message, booking._id);

  // Emit status change
  const populated = await Booking.findById(booking._id)
    .populate('service')
    .populate('address')
    .populate('provider', 'name email avatar');

  emitToUser(booking.customer.toString(), 'booking-update', populated);
  emitToUser(req.user._id.toString(), 'booking-update', populated);

  res.status(200).json({
    status: 'success',
    data: { booking: populated }
  });
});

exports.cancelBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new AppError('No booking found with that ID', 404));
  }

  // Check permissions
  if (req.user.role !== 'admin' && booking.customer.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have permission to cancel this booking', 403));
  }

  if (['Completed', 'Cancelled'].includes(booking.status)) {
    return next(new AppError(`Cannot cancel a booking that is already ${booking.status}`, 400));
  }

  booking.status = 'Cancelled';
  if (booking.paymentStatus === 'Paid') {
    booking.paymentStatus = 'Refunded'; // simulate refund
  }
  await booking.save();

  // Send notifications
  if (req.user.role === 'admin') {
    await sendNotification(booking.customer, 'Booking Cancelled', 'Your booking has been cancelled by the administrator.', booking._id);
  } else {
    await sendNotification(booking.customer, 'Booking Cancelled', 'You cancelled your booking.', booking._id);
  }

  if (booking.provider) {
    await sendNotification(
      booking.provider,
      'Booking Cancelled',
      `Booking request has been cancelled by the customer/admin.`,
      booking._id
    );
    emitToUser(booking.provider.toString(), 'booking-update', booking);
  }

  emitToUser(booking.customer.toString(), 'booking-update', booking);

  res.status(200).json({
    status: 'success',
    data: { booking }
  });
});
