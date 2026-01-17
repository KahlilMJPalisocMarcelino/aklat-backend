const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// ================== CORS CONFIGURATION ==================
// Use this simple CORS config that actually works:

// Allow ALL origins for now (fix CORS issues)
app.use(cors({
    origin: '*', // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-auth-token', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-Total-Count']
}));

// Explicitly handle preflight requests
app.options('*', cors()); // Enable preflight for all routes

// ================== MIDDLEWARE ==================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin || 'No Origin'}`);
    next();
});

// ================== DATABASE CONNECTION ==================
console.log('Connecting to database...');
connectDB().then(() => {
    console.log('Database connected successfully');
}).catch((error) => {
    console.error('Failed to connect to database:', error);
});

// ================== ROUTES ==================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));

// ================== HEALTH CHECK ==================
app.get('/api/health', (req, res) => {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Set CORS headers explicitly
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    res.json({
        status: 'OK',
        message: 'Aklat API is running',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        cors: 'enabled'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.json({
        message: 'Welcome to Aklat Backend API',
        documentation: 'Use /api endpoints',
        health: '/api/health',
        auth: '/api/auth',
        books: '/api/books',
        environment: process.env.NODE_ENV || 'development',
        cors: 'enabled'
    });
});

// ================== ERROR HANDLING ==================
// 404 handler
app.use('/api/*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.status(404).json({
        success: false,
        message: `API endpoint ${req.originalUrl} not found`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    
    // Always set CORS headers on errors
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (err.message.includes('CORS')) {
        return res.status(403).json({
            success: false,
            message: 'CORS error',
            details: 'CORS is configured to allow all origins'
        });
    }
    
    res.status(err.status || 500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Please try again later'
    });
});

// ================== START SERVER ==================
app.listen(PORT, () => {
    console.log(`🚀 Aklat Backend Server running on port ${PORT}`);
    console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📍 CORS: Enabled for all origins (*)`);
    console.log(`📍 Your Vercel frontend: https://aklat-para-sa-lahat.vercel.app`);
});

module.exports = app;
