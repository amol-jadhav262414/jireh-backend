const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Test protected route
router.get('/protected', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'You have access to this protected route!',
    user: req.user
  });
});

module.exports = router;
