const express = require('express');
const Blog = require('../models/blog');
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

// Get all blogs
router.get('/', async (req, res) => {
    try {
        const blogs = await Blog.find().populate('user', 'username profileImage');
        res.json(blogs);
    } catch (err) {
        console.error('Error fetching blogs:', err);
        res.status(500).json({ message: 'Error fetching blogs' });
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