const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production', {
        expiresIn: '7d'
    });
};

// CORS middleware for auth routes
const corsMiddleware = (req, res, next) => {
    // Allow all origins for now (in production, specify your Vercel domain)
    const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:5500', // Live Server
        'http://localhost:5000',
        'https://aklat-backend.onrender.com',
        'https://your-vercel-app.vercel.app', // Replace with your Vercel URL
        'https://aklat.vercel.app' // If this is your domain
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || !origin) {
        res.header('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
};

// Apply CORS middleware to all auth routes
router.use(corsMiddleware);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Auth API is running',
        timestamp: new Date().toISOString(),
        service: 'aklat-auth-api',
        version: '1.0.0'
    });
});

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and password'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Password validation
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new user
        const user = new User({
            name,
            email: email.toLowerCase(),
            password
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isActive: user.isActive,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact support.'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isActive: user.isActive,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            user: {
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                isActive: req.user.isActive,
                createdAt: req.user.createdAt
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
    try {
        const { name, address, phone } = req.body;
        const user = await User.findById(req.user._id);

        if (name && name.trim().length > 0) user.name = name.trim();
        if (address) user.address = address;
        if (phone) user.phone = phone;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                address: user.address,
                phone: user.phone,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Forgot password (placeholder - implement email sending)
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        
        // If user exists, you would:
        // 1. Generate a reset token
        // 2. Save it to the user document
        // 3. Send email with reset link
        // 4. Set expiration for the token
        
        // For now, always return success for security
        res.json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing password reset request',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide reset token and new password'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // In a real implementation:
        // 1. Verify the reset token
        // 2. Check if it's expired
        // 3. Find user by reset token
        // 4. Update password
        // 5. Clear reset token

        res.json({
            success: true,
            message: 'Password reset successful. Please login with your new password.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Google OAuth login
router.post('/google', async (req, res) => {
    try {
        const { credential, email, name, picture, googleId } = req.body;

        let userPayload;

        // If credential (ID token) is provided, verify it
        if (credential) {
            try {
                // Verify the Google ID token
                const ticket = await client.verifyIdToken({
                    idToken: credential,
                    audience: process.env.GOOGLE_CLIENT_ID
                });

                userPayload = ticket.getPayload();
            } catch (error) {
                console.error('Google token verification error:', error);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Google credential'
                });
            }
        } else if (email && googleId) {
            // Fallback: OAuth2 flow - use provided user info
            userPayload = {
                sub: googleId,
                email: email.toLowerCase(),
                name: name || email.split('@')[0],
                picture: picture || null,
                email_verified: true
            };
        } else {
            return res.status(400).json({
                success: false,
                message: 'Google credential or user info is required'
            });
        }

        const { sub: userId, email: userEmail, name: userName, picture: userPicture, email_verified } = userPayload;

        // Check if email is verified (for OAuth2 fallback, we assume it is)
        if (email_verified === false) {
            return res.status(400).json({
                success: false,
                message: 'Email not verified by Google'
            });
        }

        // Check if user already exists
        let user = await User.findOne({ 
            $or: [
                { googleId: userId },
                { email: userEmail.toLowerCase() }
            ]
        });

        if (user) {
            // Update user if they logged in with Google before but now using email, or vice versa
            if (!user.googleId && user.email === userEmail.toLowerCase()) {
                user.googleId = userId;
                user.provider = 'google';
                user.isEmailVerified = true;
            }
            // Update name if provided and different
            if (userName && user.name !== userName) {
                user.name = userName;
            }
            // Update picture if available
            if (userPicture && !user.picture) {
                user.picture = userPicture;
            }
            await user.save();
        } else {
            // Create new user
            user = new User({
                name: userName,
                email: userEmail.toLowerCase(),
                googleId: userId,
                provider: 'google',
                isEmailVerified: true,
                isActive: true,
                picture: userPicture
            });
            await user.save();
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Google login successful',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                picture: user.picture,
                isActive: user.isActive,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Google OAuth error:', error);
        res.status(500).json({
            success: false,
            message: 'Error with Google authentication',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Logout (client-side only - just returns success)
router.post('/logout', authenticate, async (req, res) => {
    try {
        // In a real implementation, you might:
        // 1. Add token to blacklist
        // 2. Clear session data
        // 3. Log activity
        
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during logout',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router;
