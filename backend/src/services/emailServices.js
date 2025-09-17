const nodemailer = require('nodemailer');

let transporter = null;

async function createTransporter() {
  if (transporter) return transporter;

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    FROM_EMAIL
  } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
    return transporter;
  }

  // Create Ethereal test account if no SMTP provided (dev convenience)
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });

  // Save the test account info for logging purposes
  transporter.testAccount = testAccount;
  return transporter;
}

async function sendOTPEmail(toEmail, otpCode) {
  const t = await createTransporter();
  const from = process.env.FROM_EMAIL || '"OTP Service" <no-reply@example.com>';

  const mailOptions = {
    from,
    to: toEmail,
    subject: 'Your verification code',
    html: `
      <div style="font-family: sans-serif; line-height: 1.5;">
        <h2>Your verification code</h2>
        <p>Use the following One-Time Password (OTP) to verify your email address.</p>
        <p style="font-size: 22px; font-weight: 700; letter-spacing: 4px;">${otpCode}</p>
        <p>This code will expire in ${process.env.OTP_EXPIRES_MINUTES || 10} minutes.</p>
        <hr />
        <p style="font-size: 12px; color: #666;">If you did not request this, you can ignore this email.</p>
      </div>
    `
  };

  const info = await t.sendMail(mailOptions);

  // If using Ethereal, we will return preview URL for convenience
  const previewUrl = nodemailer.getTestMessageUrl(info);
  return { info, previewUrl };
}

module.exports = {
  createTransporter,
  sendOTPEmail
};
