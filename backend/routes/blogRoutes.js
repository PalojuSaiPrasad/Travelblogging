const express = require('express');
const Blog = require('../models/Blog');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Create a new blog post
router.post('/', auth, async (req, res) => {
    try {
        console.log('Received request body:', req.body);
        console.log('Authenticated user:', req.user);

        const { title, location, country, date, category, content, image } = req.body;

        // Validate required fields
        const requiredFields = { title, location, country, date, category, content, image };
        const missingFields = Object.entries(requiredFields)
            .filter(([key, value]) => !value)
            .map(([key]) => key);

        if (missingFields.length > 0) {
            console.log('Missing fields:', missingFields);
            return res.status(400).json({
                message: 'Missing required fields',
                missingFields
            });
        }

        const blog = new Blog({
            title,
            location,
            country,
            date,
            category,
            content,
            image,
            user: req.user.id
        });

        console.log('Attempting to save blog:', blog);
        const savedBlog = await blog.save();
        console.log('Blog saved successfully:', savedBlog);

        res.status(201).json(savedBlog);
    } catch (err) {
        console.error('Blog creation error:', err);
        res.status(500).json({
            message: 'Server error while creating blog',
            error: err.message
        });
    }
});

// Fetch blogs with optional search query
router.get('/', async (req, res) => {
    const { search } = req.query;
    const query = {};

    if (search) {
        const user = await User.findOne({ username: { $regex: search, $options: 'i' } });
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } },
            { country: { $regex: search, $options: 'i' } },
            { user: user ? user._id : null },
            { category: { $regex: search, $options: 'i' } }
        ];
    }

    try {
        const blogs = await Blog.find(query).populate('user', 'username profileImage').sort({ createdAt: -1 });
        res.json(blogs);
    } catch (err) {
        console.error('Error fetching blogs:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add this route to test token validity
router.get('/test-auth', auth, (req, res) => {
    try {
        res.json({ message: 'Token is valid', user: req.user });
    } catch (error) {
        res.status(401).json({ message: 'Token validation failed' });
    }
});

module.exports = router;