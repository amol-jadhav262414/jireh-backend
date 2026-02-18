const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Public register route (optional if you want to allow open registration)
router.post('/register', authController.register);

// Login route
router.post('/login', authController.login);

// Get logged-in user profile
router.get('/me', authMiddleware, authController.getMe);

// Update logged-in user profile
router.put('/me', authMiddleware, authController.updateMe);

// Admin-only: Register new user (only admin can create users)
router.post('/register-admin', authMiddleware, roleMiddleware([ROLES.ADMIN]), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, role: role || ROLES.USER });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully by admin' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
