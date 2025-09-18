require('dotenv').config();
const app = require('./src/app');

async function testAPI() {
  console.log('🧪 Testing API for Vercel');
  
  const PORT = 5001;
  const server = app.listen(PORT, () => {
    console.log(`🚀 Test server: http://localhost:${PORT}`);
    console.log('📋 Endpoints:');
    console.log(`  GET  /`);
    console.log(`  GET  /health`);
    console.log(`  POST /api/auth/signup`);
    console.log('⚡ Ready for Vercel!');
  });
  
  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });
}

testAPI();