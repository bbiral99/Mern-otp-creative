require('dotenv').config();
const emailService = require('./src/services/emailService');

async function testGmailSMTPForVercel() {
  console.log('🚀 Gmail SMTP + Vercel Test');
  console.log('=============================');
  
  const testEmail = 'bhotkabilai@yahoo.com';
  const testOTP = '123456';
  
  console.log('\n📝 Environment Check:');
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Configured' : '❌ Missing');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Configured' : '❌ Missing');
  console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ Available (fallback)' : '⚠️  Not set (will use SMTP only)');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('\n❌ CRITICAL: Gmail credentials required');
    console.error('1. Go to Google Account → Security → 2-Step Verification');
    console.error('2. Generate App Password for "Mail"');
    console.error('3. Set EMAIL_USER and EMAIL_PASS environment variables');
    process.exit(1);
  }
  
  try {
    console.log('\n🔍 Testing Email Service Connection...');
    const connectionTest = await emailService.testConnection();
    console.log('✅ Connection Test Result:', connectionTest);
    
    console.log('\n📧 Sending test OTP email via Gmail SMTP...');
    const result = await emailService.sendOTP(testEmail, testOTP);
    
    if (result.success) {
      console.log('\n🎉 SUCCESS! Email sent successfully');
      console.log('📧 Method used:', result.method);
      console.log('📧 Platform:', result.platform);
      if (result.messageId) {
        console.log('📧 Message ID:', result.messageId);
      }
      console.log('📧 Timestamp:', result.timestamp);
      console.log('\n✅ Your Gmail SMTP is ready for Vercel deployment!');
    } else {
      console.error('\n❌ Email sending failed:', result);
    }
    
  } catch (error) {
    console.error('\n💥 ERROR:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.error('\n🔧 SOLUTION: Gmail Authentication Issue');
      console.error('1. Ensure 2-Factor Authentication is enabled');
      console.error('2. Use App Password, not regular password');
      console.error('3. Check EMAIL_USER and EMAIL_PASS are correct');
    } else if (error.message.includes('connection')) {
      console.error('\n🔧 SOLUTION: Connection Issue');
      console.error('1. Check internet connection');
      console.error('2. Verify Gmail SMTP settings');
      console.error('3. Try again in a few seconds');
    }
    
    process.exit(1);
  }
}

// Run the test
testGmailSMTPForVercel();