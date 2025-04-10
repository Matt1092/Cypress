import express from 'express';
import {
  registerUser,
  loginUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updateProfile
} from '../controllers/auth.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginUser);

// @route   GET /api/auth/verify-email/:token
// @desc    Verify email
// @access  Public
router.get('/verify-email/:token', verifyEmail);

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', forgotPassword);

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
router.post('/reset-password/:token', resetPassword);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, updateProfile);

// @route   GET /api/auth/check
// @desc    Check if user is authenticated
// @access  Private
router.get('/check', auth, (req, res) => {
  res.json({ success: true, message: 'User is authenticated', userId: req.user.id });
});

export default router; 