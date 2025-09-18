const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: { type: String, required: true },
  otp: { type: String },
  otpExpiry: { type: Date },
  isVerified: { type: Boolean, default: false }
}, { 
  timestamps: true,
  collection: 'users'
});

// Create indexes for better performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ isVerified: 1 });
userSchema.index({ otpExpiry: 1 }, { expireAfterSeconds: 300 }); // Auto-delete expired OTPs after 5 minutes

module.exports = mongoose.model('User', userSchema);
