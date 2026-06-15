const express = require('express');
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes and restrict to admin role
router.use(authController.protect);
router.use(authController.restrictTo('admin'));

router.get('/users', adminController.getAllUsers);
router.patch('/providers/:profileId/verify', adminController.verifyProvider);
router.patch('/providers/documents/verify', adminController.verifyDocument);
router.patch('/users/:userId/suspend', adminController.suspendUser);
router.get('/stats', adminController.getAdminStats);

module.exports = router;
