const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
// For Vercel (serverless): connect on first request
// For Render (traditional): connect on startup
if (process.env.VERCEL) {
    // Serverless: connect on first API call
    app.use(async (req, res, next) => {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState === 0) {
            await connectDB();
        }
        next();
    });
} else {
    // Traditional hosting: connect on startup
    connectDB();
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Aklat API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Something went wrong!', 
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Start server (only if not in serverless environment like Vercel)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Aklat Backend Server running on port ${PORT}`);
        console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
    });
}

// Export for Vercel serverless
module.exports = app;
