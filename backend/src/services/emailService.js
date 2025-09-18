const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    this.transporter = null;
    this.sendgridConfigured = false;
    this.initializeEmailService();
  }

  initializeEmailService() {
    console.log('📧 Initializing Email Service for Vercel...');
    console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
    console.log('📧 EMAIL_PASS configured:', !!process.env.EMAIL_PASS);
    console.log('📧 EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);
    console.log('📧 SENDGRID_API_KEY configured:', !!process.env.SENDGRID_API_KEY);
    
    // CRITICAL: Gmail app passwords must be without spaces!
    if (process.env.EMAIL_PASS && process.env.EMAIL_PASS.includes(' ')) {
      console.log('🚨 CRITICAL: EMAIL_PASS contains spaces! Gmail app passwords must be without spaces.');
      console.log('🚨 Expected format: vsoxgqdjwfwkokjl (not: vsox gqdj wfwk okjl)');
    }
    
    // Priority 1: Try Gmail SMTP first (as requested)
    this.initializeGmailSMTP();
    
    // Priority 2: Initialize SendGrid as fallback ONLY
    if (process.env.SENDGRID_API_KEY) {
      this.initializeSendGrid();
    } else {
      console.log('⚠️  No SendGrid API key found - SMTP only mode');
    }
  }

  initializeGmailSMTP() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️  Gmail SMTP unavailable - missing credentials:');
      console.log('⚠️  EMAIL_USER configured:', !!process.env.EMAIL_USER);
      console.log('⚠️  EMAIL_PASS configured:', !!process.env.EMAIL_PASS);
      if (process.env.EMAIL_USER && !process.env.EMAIL_PASS) {
        console.log('🚨 CRITICAL: EMAIL_PASS (Gmail app password) not set in Vercel environment variables!');
        console.log('🚨 Please add EMAIL_PASS to Vercel backend environment variables');
      }
      return;
    }

    try {
      console.log('📧 Configuring Gmail SMTP for Vercel...');
      console.log('📧 SMTP Host: smtp.gmail.com');
      console.log('📧 SMTP Port: 587');
      console.log('📧 SMTP User:', process.env.EMAIL_USER);
      
      // Clean the app password by removing any spaces (common mistake)
      const cleanEmailPass = process.env.EMAIL_PASS.replace(/\s+/g, '');
      console.log('📧 Original EMAIL_PASS length:', process.env.EMAIL_PASS.length);
      console.log('📧 Cleaned EMAIL_PASS length:', cleanEmailPass.length);
      
      if (cleanEmailPass.length !== 16) {
        console.log('⚠️  Warning: Gmail app password should be 16 characters. Current length:', cleanEmailPass.length);
      }

      // Vercel-optimized Gmail SMTP configuration
      const transportConfig = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use STARTTLS
        requireTLS: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: cleanEmailPass // Use cleaned password without spaces
        },
        // Vercel serverless optimizations
        connectionTimeout: 60000, // 60 seconds for Vercel cold starts
        greetingTimeout: 30000,    // 30 seconds for server greeting
        socketTimeout: 60000,      // 60 seconds for socket operations
        pool: false,               // Disable pooling for serverless
        maxConnections: 1,         // Single connection for serverless
        maxMessages: 1,            // One message per connection
        // Additional Vercel compatibility
        tls: {
          rejectUnauthorized: true,
          minVersion: 'TLSv1.2'
        },
        // Enable detailed logging in development
        logger: process.env.NODE_ENV === 'development',
        debug: process.env.NODE_ENV === 'development'
      };

      this.transporter = nodemailer.createTransport(transportConfig);
      console.log('✅ Gmail SMTP configured for Vercel');
      
    } catch (error) {
      console.error('❌ Failed to configure Gmail SMTP:', error.message);
      this.transporter = null;
    }
  }

  initializeSendGrid() {
    try {
      console.log('📧 Configuring SendGrid (fallback)...');
      
      if (!process.env.SENDGRID_API_KEY) {
        console.log('⚠️  No SendGrid API key - SMTP primary mode');
        return;
      }
      
      const apiKey = process.env.SENDGRID_API_KEY.trim().replace(/["'\n\r\t]/g, '');
      
      if (apiKey.length < 32) {
        console.log('⚠️  SendGrid API key invalid - using SMTP only');
        return;
      }
      
      sgMail.setApiKey(apiKey);
      this.sendgridConfigured = true;
      
      console.log('✅ SendGrid configured as fallback');
      
    } catch (error) {
      console.error('❌ SendGrid fallback failed:', error.message);
      this.sendgridConfigured = false;
    }
  }

  async sendOTP(email, otp) {
    console.log(`📧 Sending OTP to: ${email}`);
    console.log(`🔑 OTP Code: ${otp}`);

    // Priority 1: Try Gmail SMTP first (as requested by user)
    if (this.transporter) {
      console.log('📧 Attempting Gmail SMTP first...');
      const smtpResult = await this.sendViaGmailSMTP(email, otp);
      if (smtpResult.success) {
        return smtpResult;
      }
      console.log('⚠️  Gmail SMTP failed, trying SendGrid fallback...');
    }
    
    // Priority 2: Fallback to SendGrid
    if (this.sendgridConfigured) {
      return await this.sendViaSendGrid(email, otp);
    }

    // Last resort - throw error
    throw new Error('No email service available. Configure Gmail SMTP or SendGrid.');
  }

  async sendViaGmailSMTP(email, otp) {
    if (!this.transporter) {
      return {
        success: false,
        method: 'smtp-not-configured',
        error: 'Gmail SMTP not configured'
      };
    }

    try {
      console.log('🔍 Verifying Gmail SMTP connection...');
      await this.transporter.verify();
      console.log('✅ Gmail SMTP connection verified');
      
      const mailOptions = {
        from: {
          name: 'OTP Authentication',
          address: process.env.EMAIL_USER
        },
        to: email,
        subject: 'Your OTP Verification Code',
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
            <div style="background: linear-gradient(135deg, #4285f4 0%, #34a853 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 600;">🔐 Verification Code</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Delivered via Gmail SMTP on Vercel</p>
            </div>
            
            <div style="background: white; padding: 50px 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              <h2 style="color: #333; text-align: center; margin: 0 0 30px 0; font-size: 24px; font-weight: 500;">Your Security Code</h2>
              
              <div style="background: linear-gradient(135deg, #e8f0fe 0%, #f3e5f5 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 40px 0; border: 2px solid #4285f4; position: relative;">
                <div style="font-size: 48px; letter-spacing: 16px; margin: 0; color: #4285f4; font-weight: bold; font-family: 'Courier New', monospace; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${otp}</div>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <p style="color: #856404; margin: 0; font-size: 16px; font-weight: 500;">
                    ⏰ <strong>Expires in 5 minutes</strong>
                  </p>
                </div>
                
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <p style="color: #721c24; margin: 0; font-size: 14px;">
                    🔒 <strong>Security Notice:</strong> Never share this code with anyone
                  </p>
                </div>
              </div>
              
              <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #155724; margin: 0; font-size: 14px; font-weight: 500;">
                  ✨ Sent securely via Gmail SMTP on Vercel
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 50px; padding-top: 30px; border-top: 1px solid #e9ecef;">
                <p style="color: #6c757d; font-size: 12px; margin: 0; line-height: 1.5;">
                  If you didn't request this verification code, please ignore this email.<br>
                  This is an automated message, please do not reply.
                </p>
              </div>
            </div>
          </div>
        `
      };
      
      console.log('📧 Sending via Gmail SMTP (Vercel)...');
      console.log('📧 From:', process.env.EMAIL_USER);
      console.log('📧 To:', email);
      
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully via Gmail SMTP!');
      console.log('📧 Message ID:', result.messageId);
      
      return {
        success: true,
        method: 'gmail-smtp',
        messageId: result.messageId,
        email,
        timestamp: new Date().toISOString(),
        platform: 'vercel'
      };
    } catch (error) {
      console.error('❌ Gmail SMTP failed:', error.message);
      console.error('❌ SMTP error details:', error);
      return {
        success: false,
        method: 'gmail-smtp-failed',
        error: error.message,
        email,
        otp
      };
    }
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
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 600;">🔐 Verification Code</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">SendGrid Fallback Service</p>
            </div>
            
            <div style="background: white; padding: 50px 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              <h2 style="color: #333; text-align: center; margin: 0 0 30px 0; font-size: 24px; font-weight: 500;">Your Security Code</h2>
              
              <div style="background: linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 40px 0; border: 2px solid #667eea;">
                <div style="font-size: 48px; letter-spacing: 16px; margin: 0; color: #667eea; font-weight: bold; font-family: 'Courier New', monospace;">${otp}</div>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <p style="color: #856404; margin: 0; font-size: 16px; font-weight: 500;">
                    ⏰ <strong>Expires in 5 minutes</strong>
                  </p>
                </div>
              </div>
              
              <div style="background: #d1ecf1; border-left: 4px solid #bee5eb; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #0c5460; margin: 0; font-size: 14px; font-weight: 500;">
                  ✨ Delivered via SendGrid (fallback)
                </p>
              </div>
            </div>
          </div>
        `
      };

      console.log('📧 Sending via SendGrid (fallback)...');
      console.log('📧 From:', msg.from.email);
      console.log('📧 To:', email);
      
      const response = await sgMail.send(msg);
      console.log('✅ Email sent successfully via SendGrid!');
      console.log('📧 SendGrid response status:', response[0]?.statusCode);
      
      return {
        success: true,
        method: 'sendgrid-fallback',
        email,
        statusCode: response[0]?.statusCode,
        timestamp: new Date().toISOString(),
        platform: 'vercel'
      };
    } catch (error) {
      console.error('❌ SendGrid fallback failed:', error.message);
      console.error('❌ SendGrid error code:', error.code);
      
      throw new Error(`All email services failed. Last error: ${error.message}`);
    }
  }

  async testConnection() {
    console.log('🔍 Testing email service connection for Vercel...');
    console.log('🔍 EMAIL_USER:', process.env.EMAIL_USER);
    console.log('🔍 EMAIL_PASS configured:', !!process.env.EMAIL_PASS);
    console.log('🔍 EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);
    console.log('🔍 SENDGRID_API_KEY configured:', !!process.env.SENDGRID_API_KEY);
    
    // Test Gmail SMTP first with detailed diagnostics
    if (this.transporter) {
      try {
        console.log('🔍 Testing Gmail SMTP connection...');
        console.log('🔍 SMTP Config - Host: smtp.gmail.com, Port: 587');
        console.log('🔍 Auth User:', process.env.EMAIL_USER);
        
        // Attempt connection with timeout
        const verifyPromise = this.transporter.verify();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000)
        );
        
        await Promise.race([verifyPromise, timeoutPromise]);
        console.log('✅ Gmail SMTP connection verified!');
        return { 
          success: true, 
          method: 'gmail-smtp', 
          details: 'Connection successful',
          smtp: {
            host: 'smtp.gmail.com',
            port: 587,
            user: process.env.EMAIL_USER,
            secure: false
          }
        };
      } catch (error) {
        console.error('❌ Gmail SMTP test failed:', error.message);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error response:', error.response);
        
        let errorDetails = {
          code: error.code,
          message: error.message,
          response: error.response
        };
        
        if (error.code === 'EAUTH') {
          errorDetails.fix = 'Check EMAIL_PASS in Vercel environment - ensure it is a valid Gmail App Password';
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
          errorDetails.fix = 'Vercel may be blocking SMTP ports - try configuring Vercel project settings';
        }
        
        // Instead of silently falling back to SendGrid, throw the Gmail error
        throw new Error(JSON.stringify({
          error: 'Gmail SMTP connection failed',
          details: errorDetails,
          smtp: {
            host: 'smtp.gmail.com',
            port: 587,
            user: process.env.EMAIL_USER,
            secure: false
          }
        }));
      }
    } else {
      console.log('❌ Gmail SMTP transporter not initialized');
      if (!process.env.EMAIL_PASS) {
        throw new Error('Gmail SMTP not initialized - EMAIL_PASS missing from environment variables');
      }
      throw new Error('Gmail SMTP transporter failed to initialize');
    }
  }

}

module.exports = new EmailService();