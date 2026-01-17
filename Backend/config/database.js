const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Check if already connected
        if (mongoose.connection.readyState === 1) {
            console.log('✅ MongoDB already connected');
            return;
        }

        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aklat';
        
        if (!mongoURI || mongoURI === 'mongodb://localhost:27017/aklat') {
            console.warn('⚠️  Using default MongoDB URI. Set MONGODB_URI environment variable for production.');
        }

        const conn = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️  MongoDB disconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        // Don't exit in serverless environments
        if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
            console.error('Continuing without database connection (serverless mode)');
        } else {
            process.exit(1);
        }
    }
};

module.exports = connectDB;
