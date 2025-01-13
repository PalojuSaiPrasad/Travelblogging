const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Enhanced error logging
const logError = (err) => {
    console.error('=== Server Error ===');
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    console.error('===================');
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create and check uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
try {
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('Created uploads directory:', uploadsDir);
    }
    // Test write permissions
    fs.accessSync(uploadsDir, fs.constants.W_OK);
    console.log('Uploads directory is writable:', uploadsDir);
} catch (error) {
    console.error('Error with uploads directory:', error);
    process.exit(1);
}

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// Database connection
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/blog', require('./routes/blogRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
    logError(err);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

const PORT = process.env.PORT || 5501;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logError(err);
    console.error('Uncaught Exception. Shutting down...');
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logError(err);
    console.error('Unhandled Promise Rejection. Shutting down...');
    process.exit(1);
});