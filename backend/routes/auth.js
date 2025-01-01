const express = require('express');
const User = require('../models/User'); // User model
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // For generating OTPs
const { sendMail } = require('../utils/sendMail'); // Utility function to send emails

const router = express.Router();

// Generate a random OTP
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
};

// Register a new user and send OTP
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate OTP
        const otp = generateOTP();

        // Send OTP to the email using your sendMail function
        await sendMail(
            email,
            'OTP Verification Code',
            `Your OTP code is ${otp}. It will expire in 10 minutes.`
        );

        // Temporarily save the user with unverified status
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            isVerified: false,
            otp, // Save OTP for verification
            otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // OTP valid for 10 minutes
        });
        await newUser.save();

        // Respond with success and instructions to verify OTP
        res.status(201).json({ message: 'User registered successfully. Please check your email for the OTP.' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'An error occurred during registration' });
    }
});

module.exports = router;

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Check if OTP is valid and not expired
        if (user.otp === otp && user.otpExpiresAt > Date.now()) {
            // Update user to verified
            user.isVerified = true;
            user.otp = undefined; // Clear OTP
            user.otpExpiresAt = undefined; // Clear OTP expiration time
            await user.save();

            res.status(200).json({ message: 'OTP verified successfully. Registration complete!' });
        } else {
            res.status(400).json({ message: 'Invalid or expired OTP' });
        }
    } catch (error) {
        console.error('Error during OTP verification:', error);
        res.status(500).json({ message: 'An error occurred during OTP verification' });
    }
});

// Login user
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: "Invalid password." });
        }

        if (!user.isVerified) {
            return res.status(403).json({ success: false, message: "User is not verified." });
        }

        res.json({
            success: true,
            username: user.username, // Return username to display in navbar
            profileImage: user.profileImage || "", // Optional
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error." });
    }
});