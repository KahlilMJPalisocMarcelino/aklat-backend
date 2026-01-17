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
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'your_super_secret_jwt_key', {
        expiresIn: '7d'
    });
};

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

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
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
            user: user.toJSON()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
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
                message: 'Account is deactivated'
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
            user: user.toJSON()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            user: req.user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
    try {
        const { name, address, phone } = req.body;
        const user = await User.findById(req.user._id);

        if (name) user.name = name;
        if (address) user.address = address;
        if (phone) user.phone = phone;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: user.toJSON()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
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

        const user = await User.findOne({ email: email.toLowerCase() });
        
        // Always return success for security (don't reveal if email exists)
        res.json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error processing request',
            error: error.message
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
            // Note: This is less secure but allows OAuth2 flow
            userPayload = {
                sub: googleId,
                email: email.toLowerCase(),
                name: name || email.split('@')[0],
                picture: picture || null
            };
        } else {
            return res.status(400).json({
                success: false,
                message: 'Google credential or user info is required'
            });
        }

        const { sub: userId, email: userEmail, name: userName, picture: userPicture } = userPayload;

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
            }
            // Update name if provided and different
            if (userName && user.name !== userName) {
                user.name = userName;
            }
            await user.save();
        } else {
            // Create new user
            user = new User({
                name: userName,
                email: userEmail.toLowerCase(),
                googleId: userId,
                provider: 'google',
                isActive: true
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
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Google OAuth error:', error);
        res.status(500).json({
            success: false,
            message: 'Error with Google authentication',
            error: error.message
        });
    }
});

module.exports = router;
