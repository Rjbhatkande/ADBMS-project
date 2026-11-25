const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { AppError, asyncHandler } = require('./errorHandler');

/**
 * Verify JWT bearer token and attach fresh user document to req.user.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'Authentication required. Please log in.');
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new AppError(401, 'Authentication token is missing.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwt.secret);
  } catch (_err) {
    throw new AppError(401, 'Session expired or invalid token. Please log in again.');
  }

  const user = await User.findById(decoded.userId).select('-passwordHash');
  if (!user) {
    throw new AppError(401, 'User account no longer exists.');
  }

  req.user = user;
  next();
});

/**
 * Optional authentication: attaches req.user if token is valid, otherwise continues anonymously.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (user) {
      req.user = user;
    }
  } catch (_err) {
    // Ignore invalid optional token
  }
  next();
});

/**
 * Restrict endpoint access to specific user roles.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required.'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(403, 'You do not have permission to perform this action.')
      );
    }
    next();
  };
}

module.exports = {
  authenticate,
  optionalAuth,
  requireRole
};
