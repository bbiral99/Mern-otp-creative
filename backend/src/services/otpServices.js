const bcrypt = require('bcrypt');
const generateNumericOTP = require('../utils/generateOTP');

const OTP_LENGTH = parseInt(process.env.OTP_LENGTH, 10) || 6;
const OTP_EXPIRES_MINUTES = parseInt(process.env.OTP_EXPIRES_MINUTES, 10) || 5;
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5;

async function createOTP() {
  const plain = generateNumericOTP(OTP_LENGTH);
  const saltRounds = 10;
  const hash = await bcrypt.hash(plain, saltRounds);
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);
  return { plain, hash, expiresAt };
}

async function verifyOTP(plainOTP, hash) {
  if (!hash) return false;
  return bcrypt.compare(plainOTP, hash);
}

module.exports = {
  createOTP,
  verifyOTP,
  OTP_MAX_ATTEMPTS
};
