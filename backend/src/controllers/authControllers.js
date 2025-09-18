// src/controllers/authController.js
const crypto = require('crypto');
const { validationResult } = require('express-validator');
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
    if (userStorage.has(email)) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    
    console.log(`📧 Generated OTP for ${email}: ${otp}`);
    
    // Store user data temporarily (pending verification)
    otpStorage.set(email, {
      otp,
      otpExpiry,
      password, // In production, hash this password
      verified: false
    });
    
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

// Test Gmail SMTP specifically
exports.testGmailSMTP = async (req, res) => {
  try {
    console.log('🧪 Testing Gmail SMTP directly...');
    console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
    console.log('📧 EMAIL_PASS configured:', !!process.env.EMAIL_PASS);
    console.log('📧 EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);
    
    // Force Gmail SMTP test
    if (emailService.transporter) {
      try {
        console.log('🔍 Attempting Gmail SMTP verification...');
        await emailService.transporter.verify();
        console.log('✅ Gmail SMTP verification successful!');
        
        res.status(200).json({
          message: 'Gmail SMTP connection successful',
          service: 'gmail-smtp',
          host: 'smtp.gmail.com',
          port: 587,
          user: process.env.EMAIL_USER,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Gmail SMTP verification failed:', error.message);
        console.error('❌ Error details:', error);
        
        res.status(500).json({
          message: 'Gmail SMTP connection failed',
          error: error.message,
          code: error.code,
          response: error.response,
          emailUser: process.env.EMAIL_USER,
          emailPassLength: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0
        });
      }
    } else {
      console.log('❌ Gmail SMTP transporter not initialized');
      res.status(500).json({
        message: 'Gmail SMTP transporter not initialized',
        emailPassConfigured: !!process.env.EMAIL_PASS,
        emailUser: process.env.EMAIL_USER
      });
    }
  } catch (error) {
    console.error('❌ Gmail SMTP test failed:', error);
    res.status(500).json({
      message: 'Gmail SMTP test failed',
      error: error.message
    });
  }
};