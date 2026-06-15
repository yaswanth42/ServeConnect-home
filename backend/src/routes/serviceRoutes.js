const express = require('express');
const serviceController = require('../controllers/serviceController');
const authController = require('../controllers/authController');

const router = express.Router();

// Public Routes
router.get('/categories', serviceController.getAllCategories);
router.get('/', serviceController.getAllServices);
router.get('/:id', serviceController.getService);

// Admin-Only Routes (Protected & Restricted)
router.use(authController.protect);
router.use(authController.restrictTo('admin'));

// Admin Category Routes
router.post('/categories', serviceController.createCategory);
router.patch('/categories/:id', serviceController.updateCategory);
router.delete('/categories/:id', serviceController.deleteCategory);

// Admin Service Routes
router.post('/', serviceController.createService);
router.patch('/:id', serviceController.updateService);
router.delete('/:id', serviceController.deleteService);

module.exports = router;
