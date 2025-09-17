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
      // Gmail SMTP configuration optimized for cloud deployment
      const transportConfig = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // use TLS
        requireTLS: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        // Cloud deployment optimizations
        connectionTimeout: 30000, // 30 seconds
        greetingTimeout: 10000, // 10 seconds
        socketTimeout: 30000, // 30 seconds
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
      console.log('   Secure: false');
      console.log('   Auth User:', process.env.EMAIL_USER);
      console.log('   Password Length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);

      this.transporter = nodemailer.createTransport(transportConfig);
      console.log('✅ Email transporter created successfully');
      
      // Test the connection immediately
      this.testConnection().then(result => {
        if (result.success) {
          console.log('✅ Initial email connection test passed');
        } else {
          console.error('❌ Initial email connection test failed:', result.message);
        }
      }).catch(err => {
        console.error('❌ Error during initial connection test:', err.message);
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Try alternative configuration for cloud environments
      console.log('🔄 Trying alternative cloud-optimized configuration...');
      try {
        const altConfig = {
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          },
          tls: {
            rejectUnauthorized: false
          }
        };
        
        this.transporter = nodemailer.createTransport(altConfig);
        console.log('✅ Alternative email configuration applied');
      } catch (altError) {
        console.error('❌ Alternative configuration also failed:', altError.message);
      }
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
      console.log('❌ No transporter available for testing');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      console.log('🔍 Starting Gmail SMTP connection test...');
      console.log('📧 Testing connection to: smtp.gmail.com:587');
      console.log('📧 Auth user:', process.env.EMAIL_USER);
      
      // Use a shorter timeout for faster feedback
      const testResult = await Promise.race([
        this.transporter.verify(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection test timeout after 15 seconds')), 15000)
        )
      ]);
      
      console.log('✅ Gmail SMTP connection verification successful!');
      return { success: true, message: 'Gmail SMTP connection is ready' };
    } catch (error) {
      console.error('❌ Gmail SMTP connection verification failed');
      console.error('❌ Error details:');
      console.error('   Code:', error.code);
      console.error('   Message:', error.message);
      console.error('   Command:', error.command);
      
      // Provide specific guidance based on error type
      let guidance = '';
      if (error.code === 'ETIMEDOUT') {
        guidance = 'Network timeout - check if Gmail SMTP is accessible from your deployment environment';
      } else if (error.code === 'EAUTH') {
        guidance = 'Authentication failed - check your Gmail app password';
      } else if (error.code === 'ECONNECTION') {
        guidance = 'Connection refused - check network connectivity';
      }
      
      console.error('   Guidance:', guidance);
      return { success: false, message: error.message, code: error.code, guidance };
    }
  }
}

module.exports = new EmailService();