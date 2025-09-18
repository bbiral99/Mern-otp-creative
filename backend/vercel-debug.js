console.log('🔧 VERCEL DEPLOYMENT CHECKER');
console.log('============================');

// Check environment
console.log('Environment:', process.env.NODE_ENV);
console.log('Vercel Environment:', process.env.VERCEL);
console.log('Vercel URL:', process.env.VERCEL_URL);

// Check current settings
console.log('\n📋 Current Configuration:');
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

// Check if this is a Vercel deployment
if (process.env.VERCEL) {
  console.log('\n✅ Running on Vercel');
  console.log('Vercel Project URL:', `https://${process.env.VERCEL_URL}`);
} else {
  console.log('\n🏠 Running locally');
}

// Instructions based on environment
if (process.env.VERCEL) {
  console.log('\n📝 VERCEL DEPLOYMENT INSTRUCTIONS:');
  console.log('1. Your backend URL is: https://' + process.env.VERCEL_URL);
  console.log('2. Set REACT_APP_API_URL in frontend Vercel to: https://' + process.env.VERCEL_URL + '/api');
  console.log('3. Set CLIENT_URL in backend Vercel to your frontend URL');
} else {
  console.log('\n📝 LOCAL DEVELOPMENT INSTRUCTIONS:');
  console.log('1. Backend running on: http://localhost:5000');
  console.log('2. Frontend should use: http://localhost:5000/api');
  console.log('3. Make sure .env files are configured correctly');
}

module.exports = {};