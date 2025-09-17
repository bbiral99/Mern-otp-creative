const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️  Email credentials not configured. OTPs will be logged to console only.');
      return;
    }

    try {
      const transportConfig = {
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      };

      // Configure based on email service
      if (process.env.EMAIL_SERVICE === 'yahoo') {
        transportConfig.host = process.env.EMAIL_HOST || 'smtp.mail.yahoo.com';
        transportConfig.port = parseInt(process.env.EMAIL_PORT) || 587;
        transportConfig.secure = false; // true for 465, false for other ports
        transportConfig.requireTLS = true;
      } else if (process.env.EMAIL_SERVICE === 'gmail') {
        transportConfig.service = 'gmail';
        transportConfig.secure = false; // true for 465, false for other ports
        transportConfig.requireTLS = true;
      } else {
        // Default to Gmail
        transportConfig.service = process.env.EMAIL_SERVICE || 'gmail';
      }

      this.transporter = nodemailer.createTransport(transportConfig);

      console.log(`✅ Email service (${process.env.EMAIL_SERVICE || 'gmail'}) initialized successfully`);
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
    }
  }

  async sendOTP(email, otp) {
    // Always log to console for development
    console.log(`📧 OTP for ${email}: ${otp}`);

    // If no transporter configured, only log to console
    if (!this.transporter) {
      console.log('📝 Email service not configured. OTP logged to console only.');
      return { success: true, method: 'console' };
    }

    try {
      const mailOptions = {
        from: {
          name: 'OTP Authentication App',
          address: process.env.EMAIL_USER
        },
        to: email,
        subject: 'Your OTP Verification Code - Secure Login',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #4285f4 0%, #34a853 50%, #ea4335 100%); padding: 20px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; text-align: center; margin: 0;">🔐 OTP Verification</h1>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
              <h2 style="color: #333; text-align: center;">Your Verification Code</h2>
              <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px dashed #4285f4;">
                <h1 style="font-size: 36px; letter-spacing: 8px; margin: 0; color: #4285f4; font-family: 'Courier New', monospace;">${otp}</h1>
              </div>
              <p style="color: #666; text-align: center; margin: 20px 0;">
                This code will expire in <strong>10 minutes</strong>. Please do not share this code with anyone.
              </p>
              <div style="background: #e8f0fe; border: 1px solid #4285f4; border-radius: 4px; padding: 12px; margin: 20px 0;">
                <p style="color: #1565c0; margin: 0; font-size: 14px; text-align: center;">
                  ✉️ Sent securely via Gmail SMTP
                </p>
              </div>
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #888; font-size: 14px;">
                  If you didn't request this verification code, please ignore this email.
                </p>
              </div>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully to:', email);
      console.log('📧 Message ID:', result.messageId);
      return { success: true, method: 'email', messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send email to:', email);
      console.error('❌ Error details:', error.message);
      console.log('📝 Falling back to console logging only.');
      return { success: true, method: 'console', error: error.message };
    }
  }

  async testConnection() {
    if (!this.transporter) {
      return { success: false, message: 'Email service not configured' };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'Email service is ready' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = new EmailService();