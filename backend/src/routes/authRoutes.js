const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { signupSchema, loginSchema } = require('../validators/authValidator');
const Category = require('../models/Category');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

router.get('/categories', catchAsync(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.status(200).json({
    status: 'success',
    data: {
      categories
    }
  });
}));

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// Get current user profile details
router.get('/me', authController.protect, (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

module.exports = router;
