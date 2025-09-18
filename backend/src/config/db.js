const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('✅ Using cached database connection');
    return cachedConnection;
  }

  try {
    console.log('🔌 Initializing new MongoDB connection...');
    
    // Clear any existing connections if not in ready state
    if (mongoose.connection.readyState !== 0) {
      console.log('💫 Cleaning up existing connection...');
      await mongoose.disconnect();
    }

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    const mongoURI = process.env.MONGODB_URI;
    console.log('🔑 MongoDB URI configured');
    
    // Configure mongoose for serverless environment
    mongoose.set('bufferCommands', false); // Disable mongoose buffering
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Increased timeout to 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds
      family: 4, // Use IPv4, skip trying IPv6
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1,  // Keep at least 1 socket connection
      retryWrites: true,
      w: 'majority',
    };

    // Connect to MongoDB
    const connection = await mongoose.connect(mongoURI, options);
    
    // Cache the connection
    cachedConnection = connection;
    
    console.log('✅ MongoDB connected successfully');
    
    // Handle connection errors
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      cachedConnection = null;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      cachedConnection = null;
    });

    return connection;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    cachedConnection = null;
    throw error;
  }
};

module.exports = connectDB;