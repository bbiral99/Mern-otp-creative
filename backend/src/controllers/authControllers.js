// src/controllers/authController.js
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const emailService = require('../services/emailService');
const User = require('../models/User');

// Utility function to handle timeouts
const withTimeout = async (operation) => {
    const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database operation timed out')), 5000)
    );
    return Promise.race([operation(), timeout]);
};

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
    // Ensure database connection
    await connectDB();

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array()
      });
    }
    
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user in database (unverified)
    const user = new User({
      email,
      password: hashedPassword,
      otp,
      otpExpiry,
      isVerified: false
    });
    
    await user.save();
    
    // Send OTP
    const emailResult = await sendOTP(email, otp);
    
    console.log(`📧 Email result:`, emailResult);
    
    const response = {
      message: 'OTP sent to your email. Please verify to complete registration.',
      email,
      emailSent: emailResult.success || emailResult.method === 'email'
    };
    
    console.log('📨 Sending response to frontend:', response);
    res.status(200).json(response);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.verifyOtpController = async (req, res) => {
  try {
    await connectDB();
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }
    
    // Get user from database
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'User not found. Please sign up.' });
    }
    
    // Check if OTP expired
    if (Date.now() > user.otpExpiry) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }
    
    // Verify OTP
    if (user.otp !== otp) {
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

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find user in database
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email first' });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
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
    console.log('📧 EMAIL_PASS configured:', !!process.env.EMAIL_PASS);
    console.log('📧 EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);
    console.log('📧 SENDGRID_API_KEY configured:', !!process.env.SENDGRID_API_KEY);
    console.log('📧 SENDGRID_API_KEY length:', process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.length : 0);
    
    const result = await emailService.testConnection();
    
    res.status(200).json({
      message: 'Email service test completed',
      configuration: {
        service: process.env.EMAIL_SERVICE,
        user: process.env.EMAIL_USER,
        emailPassConfigured: !!process.env.EMAIL_PASS,
        emailPassLength: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0,
        sendgridConfigured: !!process.env.SENDGRID_API_KEY,
        sendgridKeyLength: process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.length : 0
      },
      ...result
    });
  } catch (error) {
    console.error('❌ Email test failed:', error);
    res.status(500).json({
      message: 'Email service test failed',
      error: error.message,
      configuration: {
        service: process.env.EMAIL_SERVICE,
        user: process.env.EMAIL_USER,
        emailPassConfigured: !!process.env.EMAIL_PASS,
        sendgridConfigured: !!process.env.SENDGRID_API_KEY
      }
    });
  }
};

// Test sending actual email
exports.testSendEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    console.log(`🧪 Testing email send to: ${email}`);
    
    // Generate test OTP
    const testOtp = '123456';
    
    // Send test email
    const result = await emailService.sendOTP(email, testOtp);
    
    res.status(200).json({
      message: 'Test email send completed',
      email,
      testOtp,
      result
    });
  } catch (error) {
    console.error('❌ Test email send failed:', error);
    res.status(500).json({
      message: 'Test email send failed',
      error: error.message
    });
  }
};

// Keep the old verifyOtp for backward compatibility
exports.verifyOtp = exports.verifyOtpController;