const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    console.log('🔧 Initializing email transporter...');
    console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
    console.log('📧 EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
    console.log('📧 EMAIL_PASS configured:', !!process.env.EMAIL_PASS);
    
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
        // Use explicit SMTP configuration for Gmail
        transportConfig.host = 'smtp.gmail.com';
        transportConfig.port = 587;
        transportConfig.secure = false;
        transportConfig.requireTLS = true;
        // Enhanced configuration for cloud deployment
        transportConfig.connectionTimeout = 60000; // 60 seconds
        transportConfig.greetingTimeout = 30000; // 30 seconds
        transportConfig.socketTimeout = 60000; // 60 seconds
        transportConfig.tls = {
          rejectUnauthorized: false
        };
        // Don't use the 'service' property, use explicit SMTP settings
      } else {
        // Default to Gmail with explicit SMTP settings
        transportConfig.host = 'smtp.gmail.com';
        transportConfig.port = 587;
        transportConfig.secure = false;
        transportConfig.requireTLS = true;
      }

      this.transporter = nodemailer.createTransport(transportConfig);
      
      console.log('🔧 Transport config:', {
        host: transportConfig.host,
        port: transportConfig.port,
        secure: transportConfig.secure,
        requireTLS: transportConfig.requireTLS,
        user: transportConfig.auth.user,
        hasPassword: !!transportConfig.auth.pass
      });

      console.log(`✅ Email service (${process.env.EMAIL_SERVICE || 'gmail'}) initialized successfully`);
      
      // Test the connection immediately
      this.testConnection().then(result => {
        if (result.success) {
          console.log('✅ Email connection test passed');
        } else {
          console.error('❌ Email connection test failed:', result.message);
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
    }
  }

  async sendOTP(email, otp) {
    // Always log to console for development
    console.log(`📧 Attempting to send OTP to ${email}: ${otp}`);

    // If no transporter configured, only log to console
    if (!this.transporter) {
      console.log('📝 Email service not configured. OTP logged to console only.');
      return { success: true, method: 'console' };
    }

    // Test connection before sending
    try {
      console.log('🔍 Testing email connection before sending...');
      await this.transporter.verify();
      console.log('✅ Email connection verified successfully');
    } catch (verifyError) {
      console.error('❌ Email connection verification failed:', verifyError.message);
      console.log('📝 Falling back to console logging only.');
      return { success: true, method: 'console', error: verifyError.message };
    }

    try {
      console.log('📤 Preparing email with options:');
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
                This code will expire in <strong>5 minutes</strong>. Please do not share this code with anyone.
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
      
      console.log('📧 Sending email from:', mailOptions.from.address);
      console.log('📧 Sending email to:', mailOptions.to);
      console.log('📧 Email subject:', mailOptions.subject);

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully to:', email);
      console.log('📧 Message ID:', result.messageId);
      console.log('📧 Response:', result.response);
      return { success: true, method: 'email', messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send email to:', email);
      console.error('❌ Error type:', error.name);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Full error:', error);
      console.log('📝 Falling back to console logging only.');
      return { success: true, method: 'console', error: error.message };
    }
  }

  async testConnection() {
    if (!this.transporter) {
      return { success: false, message: 'Email service not configured' };
    }

    try {
      console.log('🔍 Starting email connection test...');
      console.log('📧 Testing with user:', process.env.EMAIL_USER);
      console.log('📧 Password length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);
      
      await this.transporter.verify();
      console.log('✅ Email connection verification successful');
      return { success: true, message: 'Email service is ready' };
    } catch (error) {
      console.error('❌ Email connection verification failed');
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error response:', error.response);
      return { success: false, message: error.message };
    }
  }
}

module.exports = new EmailService();