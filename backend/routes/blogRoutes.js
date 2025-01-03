const express = require('express');
const Blog = require('../models/Blog');
const auth = require('../middleware/auth');
const router = express.Router();

// Create a new blog post
router.post('/', auth, async (req, res) => {
    const { title, location, country, content } = req.body;

    try {
        const blog = new Blog({
            title,
            location,
            country,
            date,
            content,
            user: req.user
        });

        await blog.save();
        res.status(201).json(blog);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all blog posts
router.get('/', async (req, res) => {
    try {
        const blogs = await Blog.find().populate('user', 'username');
        res.status(200).json(blogs);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a single blog post by ID
router.get('/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('user', 'username');
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        res.status(200).json(blog);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a blog post
router.put('/:id', auth, async (req, res) => {
    const { title, location, country, content } = req.body;

    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        if (blog.user.toString() !== req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        blog.title = title;
        blog.location = location;
        blog.country = country;
        blog.content = content;

        await blog.save();
        res.status(200).json(blog);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a blog post
router.delete('/:id', auth, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        if (blog.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        await blog.remove();
        res.status(200).json({ message: 'Blog deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;