const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A booking must belong to a customer']
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'A booking must specify a service']
    },
    address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
      required: [true, 'A booking must have a service address']
    },
    scheduleDate: {
      type: Date,
      required: [true, 'Please select a date for the service']
    },
    scheduleTime: {
      type: String,
      required: [true, 'Please select a time slot for the service'] // HH:MM 24h
    },
    status: {
      type: String,
      enum: [
        'Pending',    // Waiting for assignment
        'Assigned',   // Assigned to provider, waiting for provider acceptance
        'Accepted',   // Provider accepted
        'On The Way', // Provider travelling
        'Started',    // Service in progress
        'Completed',  // Service finished
        'Cancelled',  // Cancelled by customer/admin
        'Rejected'    // Provider rejected, waiting for re-assignment
      ],
      default: 'Pending'
    },
    price: {
      type: Number,
      required: [true, 'A booking must have a price']
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Razorpay'],
      default: 'Cash'
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Refunded'],
      default: 'Pending'
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    assignmentHistory: [
      {
        provider: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        assignedAt: {
          type: Date,
          default: Date.now
        },
        status: {
          type: String,
          enum: ['Offered', 'Accepted', 'Rejected', 'Expired'],
          default: 'Offered'
        }
      }
    ],
    notes: String
  },
  {
    timestamps: true
  }
);

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
