const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5500;

const MONGO_URI = 'mongodb://localhost:27017/Travel_Tales';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Use Routes
app.use('/api/auth', authRoutes); // Make sure this line is present and correct

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
