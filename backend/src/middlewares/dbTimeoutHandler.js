const mongoose = require('mongoose');

const dbTimeoutHandler = async (req, res, next) => {
    try {
        // Set a timeout for all database operations in this request
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Database operation timed out')), 5000);
        });

        // Add the timeout promise to the request object
        req.dbTimeout = timeoutPromise;
        
        next();
    } catch (error) {
        console.error('Database middleware error:', error);
        res.status(500).json({
            message: 'Database error',
            error: error.message
        });
    }
};

module.exports = dbTimeoutHandler;