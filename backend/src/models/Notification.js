const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A notification must belong to a user']
    },
    title: {
      type: String,
      required: [true, 'Notification must have a title'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Notification must have a message'],
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    }
  },
  {
    timestamps: true
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
