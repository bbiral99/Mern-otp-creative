const e// Signup
router.post(
  '/signup',
  dbConnect,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  authController.signup
);

// Resend OTP
router.post('/resend-otp', dbConnect, authController.resendOtp);

// Verify OTP
router.post('/verify-otp', dbConnect, authController.verifyOtpController);

// Login
router.post('/login', dbConnect, authController.login);express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authControllers');
const dbConnect = require('../middlewares/dbConnect');
const withDatabase = require('../middlewares/withDatabase');

// Signup
router.post(
  '/signup',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  withDatabase(authController.signup)
);

// Resend OTP
router.post('/resend-otp', authController.resendOtp);

// Verify OTP
router.post('/verify-otp', authController.verifyOtpController);

// Login
router.post('/login', withDatabase(authController.login));

// Logout
router.post('/logout', authController.logout);

// Test email configuration
router.get('/test-email', authController.testEmail);

// Test send actual OTP email
router.post('/test-send-email', authController.testSendEmail);

// Test Gmail SMTP configuration
router.get('/test-gmail-smtp', async (req, res) => {
  try {
    console.log('🚀 Testing Gmail SMTP configuration...');
    const emailService = require('../services/emailService');
    
    console.log('📧 Environment Check:');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Configured' : '❌ Missing');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Configured' : '❌ Missing');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Gmail credentials missing. Please set EMAIL_USER and EMAIL_PASS environment variables.');
    }
    
    const testResult = await emailService.testConnection();
    
    res.json({
      success: true,
      message: 'Gmail SMTP test successful',
      details: testResult
    });
  } catch (error) {
    console.error('❌ Gmail SMTP test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: {
        emailUser: !!process.env.EMAIL_USER,
        emailPass: !!process.env.EMAIL_PASS
      }
    });
  }
});

module.exports = router;
