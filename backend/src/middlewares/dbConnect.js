const mongoose = require('mongoose');

let isConnected = false;

const dbConnect = async (req, res, next) => {
    try {
        if (isConnected) {
            console.log('👌 Using existing database connection');
            return next();
        }

        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/otpmernproject';
        
        // Optimized configuration for Vercel
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4
        });

        isConnected = true;
        console.log('✅ Database connection established');
        next();
    } catch (error) {
        console.error('❌ Database connection error:', error);
        return res.status(500).json({ 
            message: 'Database connection failed', 
            error: error.message 
        });
    }
};

module.exports = dbConnect;