const express = require('express');
const addressController = require('../controllers/addressController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes
router.use(authController.protect);

router
  .route('/')
  .get(addressController.getAllAddresses)
  .post(addressController.createAddress);

router
  .route('/:id')
  .patch(addressController.updateAddress)
  .delete(addressController.deleteAddress);

router.patch('/:id/default', addressController.setDefaultAddress);

module.exports = router;
