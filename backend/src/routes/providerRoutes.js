const express = require('express');
const providerController = require('../controllers/providerController');
const authController = require('../controllers/authController');

const router = express.Router();

// Public Routes
router.get('/category/:categoryId', providerController.getProvidersByCategory);

// Protected Routes
router.use(authController.protect);

// Provider Role Restricted Routes
router.use(authController.restrictTo('provider'));

router
  .route('/profile')
  .get(providerController.getProviderProfile)
  .patch(providerController.updateProviderProfile);

router.post('/profile/documents', providerController.uploadDocument);

module.exports = router;
