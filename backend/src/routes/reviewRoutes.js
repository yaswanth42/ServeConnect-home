const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router();

// Public review lookup
router.get('/provider/:providerId', reviewController.getProviderReviews);

// Protected review posting
router.use(authController.protect);

router.post('/', authController.restrictTo('customer'), reviewController.createReview);
router.get('/customer', authController.restrictTo('customer'), reviewController.getCustomerReviews);

module.exports = router;
