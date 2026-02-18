module.exports = function errorHandler(err, req, res, next) {
  console.error(err && err.stack ? err.stack : err);
  const status = err.status || 500;
  res.status(status).json({ success: false, message: err.message || 'Server Error' });
};
