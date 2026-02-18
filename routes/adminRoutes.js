const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

router.get('/admin-dashboard', 
  authMiddleware, 
  roleMiddleware([ROLES.ADMIN]), 
  (req, res) => {
    res.json({ success: true, message: `Welcome Admin ${req.user.name}` });
});

module.exports = router;
