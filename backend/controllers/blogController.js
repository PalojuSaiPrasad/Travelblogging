const Blog = require('../models/Blog');
const path = require('path');

// Create Blog
exports.createBlog = async (req, res) => {
    const { title, location, country, content, date } = req.body;

    try {
        const newBlog = new Blog({
            user: req.user, // Retrieved from middleware
            title,
            location,
            country,
            content,
            date,
            image: req.file ? req.file.filename : null, // Save image filename if uploaded
        });
        z
        await newBlog.save();
        res.status(201).json({ message: 'Blog created successfully', blog: newBlog });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get All Blogs
exports.getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find()
            .populate('user', 'username email') // Populate username and email from the User model
            .sort({ createdAt: -1 }); // Sort blogs by latest
        res.json(blogs);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};