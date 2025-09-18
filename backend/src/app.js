const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');

const app = express();

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

// CORS configuration for both development and production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://mern-otp-creative-it-frontend.vercel.app', // Your actual frontend URL
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

console.log('🌍 CORS allowed origins:', allowedOrigins);
console.log('🌍 CLIENT_URL env var:', process.env.CLIENT_URL);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.some(allowed => 
      origin === allowed || 
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost')
    )) {
      return callback(null, true);
    }
    
    console.log('❌ CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 200
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