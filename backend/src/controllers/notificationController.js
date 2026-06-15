const Notification = require('../models/Notification');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getMyNotifications = catchAsync(async (req, res, next) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: notifications.length,
    data: { notifications }
  });
});

exports.markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });

  if (!notification) {
    return next(new AppError('No notification found with that ID', 404));
  }

  notification.isRead = true;
  await notification.save();

  res.status(250).json({
    status: 'success',
    data: { notification }
  });
});

exports.markAllAsRead = catchAsync(async (req, res, next) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { $set: { isRead: true } });

  res.status(250).json({
    status: 'success',
    message: 'All notifications marked as read'
  });
});
