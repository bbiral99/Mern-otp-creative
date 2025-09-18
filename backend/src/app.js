const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();

const app = express();

// Vercel serverless function specific settings
app.set('trust proxy', 1);

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Debug logging for all requests
app.use((req, res, next) => {
  console.log(`🌍 ${req.method} ${req.url}`);
  console.log('🔍 Origin:', req.get('Origin'));
  console.log('🔍 Host:', req.get('Host'));
  console.log('🔍 Content-Type:', req.get('Content-Type'));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body keys:', Object.keys(req.body));
  }
  next();
});

// CORS configuration
app.use(cors({
  origin: '*',  // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', (req, res) => {
  console.log('🔍 CORS Preflight request:', req.method, req.url);
  res.sendStatus(200);
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'OTP Authentication API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// Version check
app.get('/api/version', (req, res) => {
  const version = require('./utils/version');
  const emailService = require('./services/emailService');
  
  res.json({
    version,
    environment: process.env.NODE_ENV,
    emailConfig: {
      smtpConfigured: !!emailService.transporter,
      sendgridConfigured: emailService.sendgridConfigured
    }
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'POST /api/auth/signup',
      'POST /api/auth/verify-otp',
      'POST /api/auth/login',
      'POST /api/auth/resend-otp'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

module.exports = app;