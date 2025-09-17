const crypto = require('crypto');

function generateNumericOTP(length = 6) {
  // Generate a cryptographically secure numeric OTP of given length
  const digits = '0123456789';
  let otp = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    const idx = bytes[i] % digits.length;
    otp += digits[idx];
  }
  return otp;
}

module.exports = generateNumericOTP;
