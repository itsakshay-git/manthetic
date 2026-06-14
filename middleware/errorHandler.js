const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) {
    console.error(err);
  }

  if (err.payload) {
    return res.status(statusCode).json(err.payload);
  }

  return res.status(statusCode).json({
    error: err.message || 'Server error',
  });
};

module.exports = errorHandler;
