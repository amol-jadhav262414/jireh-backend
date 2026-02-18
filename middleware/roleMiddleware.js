const { MESSAGES } = require('../config/constants');

module.exports = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ success: false, message: MESSAGES.NO_ROLE });
    }

    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: MESSAGES.INSUFFICIENT_ROLE });
    }

    next();
  };
};
