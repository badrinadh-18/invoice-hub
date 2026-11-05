export const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.url}:`, err);

  // Mongoose duplicate key error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_KEY',
        message: `A record with this ${field} already exists.`
      }
    });
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: {
        code: 'INVALID_ID',
        message: 'Resource not found or invalid identifier format.'
      }
    });
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const firstMsg = Object.values(err.errors)[0]?.message || 'Validation failed.';
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: firstMsg
      }
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred on the server.'
    : (err.message || 'Server error');

  res.status(statusCode).json({
    error: {
      code: err.code || 'SERVER_ERROR',
      message
    }
  });
};
