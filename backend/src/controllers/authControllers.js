// src/controllers/authController.js
const crypto = require('crypto');
const emailService = require('../services/emailService');

// In-memory storage for demo (use Redis or database in production)
const otpStorage = new Map();
const userStorage = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP using email service
const sendOTP = async (email, otp) => {
  const result = await emailService.sendOTP(email, otp);
  return result;
};

exports.signup = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Check if user already exists
    if (userStorage.has(email)) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    
    // Store user data temporarily (pending verification)
    otpStorage.set(email, {
      otp,
      otpExpiry,
      password, // In production, hash this password
      verified: false
    });
    
    // Send OTP
    const emailResult = await sendOTP(email, otp);
    
    res.status(200).json({ 
      message: 'OTP sent to your email. Please verify to complete registration.',
      email,
      emailSent: emailResult.method === 'email'
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.verifyOtpController = (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }
    
    // Get stored OTP data
    const storedData = otpStorage.get(email);
    
    if (!storedData) {
      return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
    }
    
    // Check if OTP expired
    if (Date.now() > storedData.otpExpiry) {
      otpStorage.delete(email);
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }
    
    // Verify OTP
    if (storedData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    
    // OTP verified - create user account
    userStorage.set(email, {
      email,
      password: storedData.password,
      verified: true,
      createdAt: new Date()
    });
    
    // Remove OTP data
    otpStorage.delete(email);
    
    // Generate simple token (use JWT in production)
    const token = crypto.randomBytes(32).toString('hex');
    
    res.status(200).json({ 
      message: 'Email verified successfully! Account created.',
      token,
      user: { email }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.login = (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Check if user exists
    const user = userStorage.get(email);
    
    if (!user) {
      return res.status(400).json({ message: 'User not found. Please sign up first.' });
    }
    
    // Verify password (use bcrypt in production)
    if (user.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate simple token (use JWT in production)
    const token = crypto.randomBytes(32).toString('hex');
    
    res.status(200).json({ 
      message: 'Login successful',
      token,
      user: { email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Check if there's pending OTP data
    const storedData = otpStorage.get(email);
    
    if (!storedData) {
      return res.status(400).json({ message: 'No pending verification found. Please sign up again.' });
    }
    
    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    
    // Update stored data with new OTP
    otpStorage.set(email, {
      ...storedData,
      otp,
      otpExpiry
    });
    
    // Send new OTP
    const emailResult = await sendOTP(email, otp);
    
    res.status(200).json({ 
      message: 'New OTP sent to your email',
      emailSent: emailResult.method === 'email'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.logout = (req, res) => {
  res.status(200).json({ message: 'Logout successful' });
};

// Test email configuration
exports.testEmail = async (req, res) => {
  try {
    console.log('🧪 Testing email configuration...');
    console.log('📧 Email service:', process.env.EMAIL_SERVICE);
    console.log('📧 Email user:', process.env.EMAIL_USER);
    console.log('📧 SMTP host:', process.env.EMAIL_HOST);
    console.log('📧 SMTP port:', process.env.EMAIL_PORT);
    
    const result = await emailService.testConnection();
    
    res.status(200).json({
      message: 'Email service test completed',
      configuration: {
        service: process.env.EMAIL_SERVICE,
        user: process.env.EMAIL_USER,
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT
      },
      ...result
    });
  } catch (error) {
    console.error('❌ Email test failed:', error);
    res.status(500).json({
      message: 'Email service test failed',
      error: error.message
    });
  }
};

// Keep the old verifyOtp for backward compatibility
exports.verifyOtp = exports.verifyOtpController;