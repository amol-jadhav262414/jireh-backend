const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { MESSAGES } = require('../config/constants');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: MESSAGES.NO_TOKEN });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ success: false, message: MESSAGES.INVALID_TOKEN });
    }

    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err.message);
    res.status(401).json({ success: false, message: MESSAGES.INVALID_TOKEN });
  }
};

module.exports = authMiddleware;
