const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        console.log('=== Auth Middleware ===');
        console.log('Headers:', req.headers);

        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            console.log('No token provided');
            return res.status(401).json({ message: 'No token provided' });
        }

        console.log('Token found, verifying...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);

        req.user = decoded;
        console.log('User attached to request:', req.user);
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};