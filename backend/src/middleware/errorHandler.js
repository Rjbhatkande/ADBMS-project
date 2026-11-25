class AppError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

function notFound(req, res, next) {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || null;

  if (err.code === 11000) {
    statusCode = 409;
    message = 'A record with these unique details already exists.';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed.';
    errors = Object.fromEntries(
      Object.entries(err.errors || {}).map(([k, v]) => [k, v.message])
    );
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid identifier for ${err.path}.`;
  } else if (err.name === 'MongoServerSelectionError') {
    statusCode = 503;
    message = 'MongoDB connection unavailable. Please verify mongod is running.';
  }

  if (statusCode >= 500 && process.env.NODE_ENV !== 'test') {
    console.error('[API Error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {})
  });
}

module.exports = {
  AppError,
  asyncHandler,
  notFound,
  errorHandler
};
