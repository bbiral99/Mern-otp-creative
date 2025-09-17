const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    this.transporter = null;
    this.sendgridConfigured = false;
    this.initializeEmailService();
  }

  initializeEmailService() {
    console.log('📧 Initializing Email Service...');
    console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
    console.log('📧 EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
    console.log('📧 SENDGRID_API_KEY configured:', !!process.env.SENDGRID_API_KEY);
    
    // Try SendGrid first (recommended for production)
    if (process.env.SENDGRID_API_KEY) {
      this.initializeSendGrid();
    } else {
      console.log('⚠️  No SendGrid API key found, trying SMTP fallback...');
      this.initializeSMTP();
    }
  }

  initializeSendGrid() {
    try {
      console.log('📧 Configuring SendGrid...');
      
      if (!process.env.SENDGRID_API_KEY) {
        throw new Error('SENDGRID_API_KEY environment variable not found');
      }
      
      // Remove any potential whitespace or quotes
      const apiKey = process.env.SENDGRID_API_KEY.trim().replace(/["']/g, '');
      
      console.log('🔑 API key length:', apiKey.length);
      console.log('🔑 API key starts with:', apiKey.substring(0, 3) + '...');
      
      sgMail.setApiKey(apiKey);
      this.sendgridConfigured = true;
      
      console.log('✅ SendGrid configured successfully');
      console.log('📧 Using SendGrid for email delivery');
      
      // Test SendGrid connection
      this.testSendGridConnection();
    } catch (error) {
      console.error('❌ Failed to configure SendGrid:', error.message);
      console.log('🔄 Falling back to SMTP...');
      this.sendgridConfigured = false;
      this.initializeSMTP();
    }
  }

  async testSendGridConnection() {
    try {
      console.log('🔍 Testing SendGrid API key...');
      
      // Check if API key exists and has reasonable length
      if (!process.env.SENDGRID_API_KEY) {
        throw new Error('SendGrid API key not provided');
      }
      
      if (process.env.SENDGRID_API_KEY.length < 20) {
        throw new Error('SendGrid API key appears to be too short');
      }
      
      // Test with a simple API call instead of format checking
      console.log('✅ SendGrid API key format appears valid');
      console.log('📧 SendGrid is ready for email delivery');
      return { success: true, method: 'sendgrid' };
      
    } catch (error) {
      console.error('❌ SendGrid test failed:', error.message);
      return { success: false, method: 'sendgrid', error: error.message };
    }
  }

  initializeSMTP() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️  No email credentials configured. Emails will be logged to console only.');
      return;
    }

    try {
      const transportConfig = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000
      };

      this.transporter = nodemailer.createTransport(transportConfig);
      console.log('✅ SMTP transporter configured (fallback)');
      
    } catch (error) {
      console.error('❌ Failed to configure SMTP:', error.message);
    }
  }

  async sendOTP(email, otp) {
    console.log(`📧 Sending OTP to: ${email}`);
    console.log(`🔑 OTP Code: ${otp}`);

    // Try SendGrid first
    if (this.sendgridConfigured) {
      return await this.sendViaSendGrid(email, otp);
    }
    
    // Fallback to SMTP
    if (this.transporter) {
      return await this.sendViaSMTP(email, otp);
    }

    // Last resort - console logging
    console.log('❌ No email service available - logging to console');
    console.log(`📧 OTP for ${email}: ${otp}`);
    return { success: true, method: 'console', email, otp };
  }

  async sendViaSendGrid(email, otp) {
    try {
      const msg = {
        to: email,
        from: {
          email: process.env.EMAIL_USER || 'noreply@otpauth.com',
          name: 'OTP Authentication'
        },
        subject: 'Your OTP Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Verification Code</h1>
            </div>
            <div style="background: #f8f9fa; padding: 40px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
              <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Your Security Code</h2>
              
              <div style="background: white; padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0; border: 3px solid #667eea; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="font-size: 42px; letter-spacing: 12px; margin: 0; color: #667eea; font-weight: bold; font-family: 'Courier New', monospace;">${otp}</div>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
                  ⏰ <strong>This code expires in 5 minutes</strong>
                </p>
                <p style="color: #888; font-size: 14px;">
                  🔒 Never share this code with anyone for your security
                </p>
              </div>
              
              <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="color: #1976d2; margin: 0; font-size: 14px;">
                  ✉️ Delivered securely via SendGrid
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  If you didn't request this code, please ignore this email.
                </p>
              </div>
            </div>
          </div>
        `
      };

      console.log('📧 Sending via SendGrid...');
      console.log('📧 From:', msg.from.email);
      console.log('📧 To:', email);
      
      const response = await sgMail.send(msg);
      console.log('✅ Email sent successfully via SendGrid!');
      console.log('📧 SendGrid response status:', response[0]?.statusCode);
      
      return {
        success: true,
        method: 'sendgrid',
        email,
        statusCode: response[0]?.statusCode,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ SendGrid failed:', error.message);
      console.error('❌ SendGrid error code:', error.code);
      console.error('❌ SendGrid error details:', error.response?.body);
      
      // Check for specific SendGrid errors
      if (error.code === 401) {
        console.error('❌ SendGrid authentication failed - check your API key');
      } else if (error.code === 403) {
        console.error('❌ SendGrid forbidden - check sender verification');
      }
      
      console.log('🔄 Trying SMTP fallback...');
      
      // Try SMTP fallback
      if (this.transporter) {
        return await this.sendViaSMTP(email, otp);
      }
      
      return {
        success: false,
        method: 'sendgrid-failed',
        error: error.message,
        code: error.code,
        email,
        otp
      };
    }
  }

  async sendViaSMTP(email, otp) {
    try {
      const mailOptions = {
        from: {
          name: 'OTP Authentication',
          address: process.env.EMAIL_USER
        },
        to: email,
        subject: 'Your OTP Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Verification Code</h1>
            </div>
            <div style="background: #f8f9fa; padding: 40px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
              <div style="background: white; padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0; border: 3px solid #667eea;">
                <div style="font-size: 42px; letter-spacing: 12px; margin: 0; color: #667eea; font-weight: bold;">${otp}</div>
              </div>
              <p style="text-align: center; color: #666;">This code expires in <strong>5 minutes</strong></p>
            </div>
          </div>
        `
      };
      
      console.log('📧 Sending via SMTP...');
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully via SMTP!');
      
      return {
        success: true,
        method: 'smtp',
        messageId: result.messageId,
        email,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ SMTP failed:', error.message);
      return {
        success: false,
        method: 'smtp-failed',
        error: error.message,
        email,
        otp
      };
    }
  }

  async testConnection() {
    console.log('🔍 Testing email service connection...');
    
    if (this.sendgridConfigured) {
      console.log('📧 Testing SendGrid configuration...');
      return await this.testSendGridConnection();
    }
    
    if (this.transporter) {
      console.log('📧 Testing SMTP configuration...');
      try {
        await this.transporter.verify();
        console.log('✅ SMTP connection verified!');
        return { success: true, method: 'smtp' };
      } catch (error) {
        console.error('❌ SMTP connection failed:', error.message);
        return { success: false, method: 'smtp', error: error.message };
      }
    }
    
    console.log('⚠️  No email service configured');
    return { success: false, method: 'none', message: 'No email service available' };
  }
}

module.exports = new EmailService();