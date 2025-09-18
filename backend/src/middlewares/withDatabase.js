const connectDB = require('../config/db');

const withDatabase = (handler) => async (req, res) => {
  try {
    // Connect to database with timeout
    await Promise.race([
      connectDB(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 8000)
      )
    ]);

    // Call the original handler
    return await handler(req, res);
  } catch (error) {
    console.error('Database middleware error:', error);
    
    // Send appropriate error response
    if (error.message.includes('timeout')) {
      return res.status(503).json({
        error: 'Database connection timeout',
        message: 'Please try again in a few moments'
      });
    }
    
    return res.status(500).json({
      error: 'Database error',
      message: 'An unexpected error occurred'
    });
  }
};

module.exports = withDatabase;