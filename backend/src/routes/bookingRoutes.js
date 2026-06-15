const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

// Customer endpoints
router.post('/', authController.restrictTo('customer'), bookingController.createBooking);
router.get('/customer', authController.restrictTo('customer'), bookingController.getCustomerBookings);

// Provider endpoints
router.get('/provider', authController.restrictTo('provider'), bookingController.getProviderBookings);
router.patch('/:id/accept', authController.restrictTo('provider'), bookingController.acceptBooking);
router.patch('/:id/reject', authController.restrictTo('provider'), bookingController.rejectBooking);
router.patch('/:id/status', authController.restrictTo('provider'), bookingController.updateBookingStatus);

// Common endpoints (Customer / Provider / Admin)
router.get('/:id', bookingController.getBookingDetails);
router.patch('/:id/cancel', bookingController.cancelBooking);

module.exports = router;
