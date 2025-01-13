const express = require('express');
const User = require('../models/User'); // User model
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // For generating OTPs
const { sendMail } = require('../utils/sendMail'); // Utility function to send emails
const jwt = require('jsonwebtoken');

const router = express.Router();

// Generate a random OTP
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
};

// Register a new user and send OTP
router.post('/register', async (req, res) => {
    try {
        console.log('Received registration request:', req.body);
        const { username, email, password } = req.body;

        // Enhanced validation
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [
                { email: email.toLowerCase() },
                { username: username }
            ]
        });

        if (existingUser) {
            if (existingUser.email === email.toLowerCase()) {
                return res.status(400).json({ message: 'Email already registered' });
            }
            if (existingUser.username === username) {
                return res.status(400).json({ message: 'Username already taken' });
            }
        }

        // Generate OTP
        const otp = generateOTP();
        console.log('Generated OTP for', email, ':', otp);

        try {
            // Send OTP email
            await sendMail(
                email,
                'Travel Tales - Email Verification',
                `Your verification code is: ${otp}`
            );
            console.log('OTP email sent successfully to:', email);

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new user
            const newUser = new User({
                username,
                email: email.toLowerCase(),
                password: hashedPassword,
                isVerified: false,
                otp,
                otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
            });

            await newUser.save();
            console.log('User saved successfully:', email);

            res.status(201).json({
                message: 'Registration successful! Please check your email for verification code.',
                email: email
            });

        } catch (emailError) {
            console.error('Email sending error:', emailError);
            res.status(500).json({ 
                message: 'Failed to send verification email. Please try again.' 
            });
        }

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            message: 'An error occurred during registration',
            error: error.message 
        });
    }
});

module.exports = router;

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        console.log('Verifying OTP:', { email, otp });

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found:', email);
            return res.status(400).json({ message: 'User not found' });
        }

        console.log('User found:', {
            email: user.email,
            storedOTP: user.otp,
            otpExpiry: user.otpExpiresAt,
            currentTime: new Date()
        });

        // Check if OTP is valid and not expired
        if (user.otp !== otp) {
            console.log('Invalid OTP');
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (user.otpExpiresAt < new Date()) {
            console.log('OTP expired');
            return res.status(400).json({ message: 'OTP has expired' });
        }

        // Update user to verified
        user.isVerified = true;
        user.otp = undefined; // Clear OTP
        user.otpExpiresAt = undefined; // Clear OTP expiration time
        await user.save();

        console.log('User verified successfully:', email);
        res.status(200).json({ 
            message: 'Email verified successfully! You can now login.',
            success: true
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ 
            message: 'An error occurred during OTP verification',
            error: error.message 
        });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for:', email);

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create token payload
        const payload = {
            id: user._id,
            email: user.email
        };

        // Generate token
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Generated token:', token);

        // Send response
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add this new route for resending OTP
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        console.log('Resend OTP request for:', email);

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Generate new OTP
        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await user.save();

        // Send new OTP
        await sendMail(
            email,
            'Travel Tales - New OTP',
            `Your new OTP code is ${otp}. It will expire in 10 minutes.`
        );

        res.json({ message: 'New OTP sent successfully' });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ message: 'Failed to resend OTP' });
    }
});