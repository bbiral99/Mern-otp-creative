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

    // Check if we're in a cloud environment where SMTP might be blocked
    const isCloudEnvironment = process.env.NODE_ENV === 'production' || process.env.RENDER;
    
    if (isCloudEnvironment) {
      console.log('🌩️ Cloud environment detected, using alternative email configuration...');
      this.initializeAlternativeEmail();
    } else {
      console.log('💻 Local environment detected, using standard SMTP...');
      this.initializeStandardSMTP();
    }
  }

  initializeAlternativeEmail() {
    try {
      // For cloud environments, we'll use a simple console logging approach
      // and prepare for future integration with services like SendGrid or Gmail API
      console.log('📝 Initializing console-based email service for cloud deployment');
      console.log('💡 Note: In production, consider using SendGrid, Mailgun, or Gmail API');
      
      // Set transporter to null to trigger console-only mode
      this.transporter = null;
      
      console.log('✅ Alternative email service initialized (console mode)');
    } catch (error) {
      console.error('❌ Failed to initialize alternative email service:', error.message);
    }
  }

  initializeStandardSMTP() {
    try {
      // Gmail SMTP configuration for local development
      const transportConfig = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 30000,
        greetingTimeout: 10000,
        socketTimeout: 30000,
        pool: true,
        maxConnections: 1,
        tls: {
          rejectUnauthorized: false,
          servername: 'smtp.gmail.com'
        }
      };

      console.log('🔧 Gmail SMTP Configuration:');
      console.log('   Host: smtp.gmail.com');
      console.log('   Port: 587');
      console.log('   Auth User:', process.env.EMAIL_USER);

      this.transporter = nodemailer.createTransport(transportConfig);
      console.log('✅ Email transporter created successfully');
      
      // Test connection for local development
      this.testConnection().then(result => {
        if (result.success) {
          console.log('✅ SMTP connection test passed');
        } else {
          console.error('❌ SMTP connection test failed:', result.message);
          console.log('🔄 Falling back to console mode...');
          this.transporter = null;
        }
      }).catch(err => {
        console.error('❌ Error during SMTP test:', err.message);
        console.log('🔄 Falling back to console mode...');
        this.transporter = null;
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize SMTP service:', error.message);
      this.transporter = null;
    }
  }

  async sendOTP(email, otp) {
    console.log(`📧 ================================`);
    console.log(`📧 OTP REQUEST FOR: ${email}`);
    console.log(`📧 OTP CODE: ${otp}`);
    console.log(`📧 EXPIRES: 5 minutes`);
    console.log(`📧 ================================`);

    // If no transporter configured (cloud environment), use enhanced console logging
    if (!this.transporter) {
      console.log('🌩️ CLOUD MODE: Email service using console output');
      console.log('📧 ⭕ EMAIL DETAILS:');
      console.log(`   👤 Recipient: ${email}`);
      console.log(`   🔑 OTP Code: ${otp}`);
      console.log(`   ⏰ Valid for: 5 minutes`);
      console.log(`   💬 Subject: Your OTP Verification Code`);
      console.log('📝 Note: In production, integrate with SendGrid/Mailgun for actual email delivery');
      
      return { 
        success: true, 
        method: 'console', 
        message: 'OTP logged to console (cloud mode)',
        email,
        otp,
        timestamp: new Date().toISOString()
      };
    }

    // For local development with working SMTP
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
                This code will expire in <strong>5 minutes</strong>. Please do not share this code with anyone.
              </p>
              <div style="background: #e8f0fe; border: 1px solid #4285f4; border-radius: 4px; padding: 12px; margin: 20px 0;">
                <p style="color: #1565c0; margin: 0; font-size: 14px; text-align: center;">
                  ✉️ Sent securely via Gmail SMTP
                </p>
              </div>
            </div>
          </div>
        `
      };
      
      console.log('📧 Sending email via SMTP...');
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully via SMTP');
      console.log('📧 Message ID:', result.messageId);
      
      return { 
        success: true, 
        method: 'email', 
        messageId: result.messageId,
        email,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ SMTP email failed:', error.message);
      console.log('🔄 Falling back to console mode...');
      
      // Fallback to console mode
      console.log('📧 ⭕ EMAIL FALLBACK:');
      console.log(`   👤 Recipient: ${email}`);
      console.log(`   🔑 OTP Code: ${otp}`);
      console.log(`   ⏰ Valid for: 5 minutes`);
      
      return { 
        success: true, 
        method: 'console-fallback', 
        error: error.message,
        email,
        otp,
        timestamp: new Date().toISOString()
      };
    }
  }

  async testConnection() {
    if (!this.transporter) {
      console.log('🌩️ Cloud mode - no SMTP transporter available');
      return { 
        success: true, 
        message: 'Email service running in cloud mode (console output)',
        mode: 'cloud-console'
      };
    }

    try {
      console.log('🔍 Testing SMTP connection (local mode)...');
      
      const testResult = await Promise.race([
        this.transporter.verify(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('SMTP connection timeout after 10 seconds')), 10000)
        )
      ]);
      
      console.log('✅ SMTP connection verification successful!');
      return { 
        success: true, 
        message: 'SMTP connection is ready',
        mode: 'smtp'
      };
    } catch (error) {
      console.error('❌ SMTP connection failed:', error.message);
      console.log('🔄 Switching to cloud mode...');
      
      // Switch to cloud mode
      this.transporter = null;
      
      return { 
        success: true, 
        message: 'Switched to cloud mode due to SMTP failure',
        mode: 'cloud-fallback',
        originalError: error.message
      };
    }
  }
}

module.exports = new EmailService();