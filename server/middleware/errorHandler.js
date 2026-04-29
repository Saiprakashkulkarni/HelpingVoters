const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    console.error('❌ Error:', err.message);
  }

  const statusCode = err.statusCode || 500;

  // Sanitize error output in production — never leak internal details
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    error: isProduction && statusCode === 500
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };
