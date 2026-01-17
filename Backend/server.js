const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// ================== CORS CONFIGURATION ==================
// REMOVE THE DUPLICATE CORS CONFIG! Use only one:

const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5000',
    'https://aklat-backend.onrender.com',
    'https://aklat-para-sa-lahat.vercel.app/'
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, or server-to-server)
        if (!origin) return callback(null, true);
        
        // Development: allow localhost and all common dev origins
        if (process.env.NODE_ENV !== 'production') {
            // Allow all origins in development for easier testing
            if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.')) {
                return callback(null, true);
            }
        }
        
        // Check if origin is in allowed list
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // Log the blocked origin for debugging
            console.log(`CORS blocked origin: ${origin}`);
            callback(new Error(`Not allowed by CORS: ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-auth-token', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-Total-Count'],
    maxAge: 86400 // 24 hours
};

// Apply CORS middleware - ONLY ONCE!
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// ================== MIDDLEWARE ==================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log('Request body:', req.body);
    }
    next();
});

// ================== DATABASE CONNECTION ==================
// For Vercel (serverless): connect on first request
// For Render (traditional): connect on startup
const connectOnFirstRequest = process.env.VERCEL || process.env.RENDER;

if (connectOnFirstRequest) {
    // Serverless: connect on first API call
    app.use(async (req, res, next) => {
        try {
            const mongoose = require('mongoose');
            if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
                console.log('Connecting to database...');
                await connectDB();
                console.log('Database connected successfully');
            }
            next();
        } catch (error) {
            console.error('Database connection error:', error);
            res.status(500).json({
                success: false,
                message: 'Database connection failed',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    });
} else {
    // Traditional hosting: connect on startup
    console.log('Connecting to database on startup...');
    connectDB().then(() => {
        console.log('Database connected successfully on startup');
    }).catch((error) => {
        console.error('Failed to connect to database on startup:', error);
        process.exit(1);
    });
}

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
    
    res.json({
        status: 'OK',
        message: 'Aklat API is running',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Aklat Backend API',
        documentation: 'Use /api endpoints',
        health: '/api/health',
        auth: '/api/auth',
        books: '/api/books',
        environment: process.env.NODE_ENV || 'development'
    });
});

// ================== ERROR HANDLING ==================
// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `API endpoint ${req.originalUrl} not found`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', {
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.url,
        method: req.method
    });
    
    // Handle CORS errors
    if (err.message.includes('CORS')) {
        return res.status(403).json({
            success: false,
            message: 'Cross-origin request blocked',
            details: process.env.NODE_ENV === 'development' ? err.message : 'Contact support'
        });
    }
    
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }
    
    // Default error
    res.status(err.status || 500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Please try again later'
    });
});

// ================== START SERVER ==================
// Only start server if not in serverless environment (Vercel)
if (require.main === module && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Aklat Backend Server running on port ${PORT}`);
        console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
        console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
        console.log(`📍 Frontend URL: ${process.env.FRONTEND_URL || 'Not configured'}`);
        console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📍 CORS Allowed Origins: ${allowedOrigins.join(', ')}`);
    });
}

// Export for Vercel serverless
module.exports = app;
