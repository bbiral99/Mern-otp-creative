const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection) {
    console.log('Using cached database connection');
    return cachedConnection;
  }

  try {
    console.log('🔌 Initializing new MongoDB connection...');
    
    // Clear any existing connections
    await mongoose.disconnect();

    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/otpmernproject';
    
    // Configure mongoose for serverless environment
    mongoose.set('bufferCommands', false); // Disable mongoose buffering
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds
      family: 4, // Use IPv4, skip trying IPv6
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1,  // Keep at least 1 socket connection
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