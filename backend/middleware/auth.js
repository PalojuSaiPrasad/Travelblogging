const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        console.log('Auth header received:', authHeader);

        if (!authHeader) {
            return res.status(401).json({ message: 'No Authorization header found' });
        }

        const token = authHeader.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No token found in Authorization header' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token decoded successfully:', {
                id: decoded.id,
                email: decoded.email
            });

            if (!decoded.id) {
                throw new Error('Invalid token structure');
            }

            req.user = decoded;
            next();
        } catch (jwtError) {
            console.error('JWT verification failed:', jwtError.message);
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token has expired' });
            }
            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Invalid token' });
            }
            return res.status(401).json({ message: 'Token validation failed' });
        }
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(500).json({ message: 'Server error in auth middleware' });
    }
};