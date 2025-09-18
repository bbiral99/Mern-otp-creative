// Vercel serverless entry point
const app = require('../src/app');

// Handle Vercel serverless function
const handler = async (req, res) => {
  try {
    // Log incoming requests in Vercel
    console.log(`[Vercel] ${req.method} ${req.url}`);
    
    // Forward the request to our Express app
    return app(req, res);
  } catch (error) {
    console.error('[Vercel Error]', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

module.exports = handler;