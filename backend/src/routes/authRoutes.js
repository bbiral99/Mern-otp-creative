const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authControllers');

// Signup
router.post(
  '/signup',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  authController.signup
);

// Resend OTP
router.post('/resend-otp', authController.resendOtp);

// Verify OTP
router.post('/verify-otp', authController.verifyOtpController);

// Login
router.post('/login', authController.login);

// Logout
router.post('/logout', authController.logout);

// Test email configuration
router.get('/test-email', authController.testEmail);

// Test send actual OTP email
router.post('/test-send-email', authController.testSendEmail);

// Test Gmail SMTP specifically
router.get('/test-gmail-smtp', authController.testGmailSMTP);

module.exports = router;
