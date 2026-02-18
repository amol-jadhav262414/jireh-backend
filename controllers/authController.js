const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT));
    const user = await User.create({ name, email, password: hashedPassword, role });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// Get current logged-in user
exports.getMe = async (req, res) => {
  try {
    res.json({ success: true, user: req.user }); // req.user is set by authMiddleware
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update current logged-in user
exports.updateMe = async (req, res) => {
  try {
    const updates = {};
    const { name, email } = req.body;

    if (name) updates.name = name;
    if (email) updates.email = email;

    // Optional: Add validation for email format or uniqueness

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');

    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
