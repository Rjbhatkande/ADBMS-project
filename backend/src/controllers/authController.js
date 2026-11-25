const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const {
  validateRegisterInput,
  validateLoginInput,
  isNonEmptyString,
  throwIfErrors
} = require('../utils/validators');

function signToken(user) {
  return jwt.sign(
    { userId: String(user._id), role: user.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
}

function sanitizeUser(doc) {
  return {
    id: String(doc._id),
    studentId: doc.studentId,
    name: doc.name,
    email: doc.email,
    department: doc.department,
    year: doc.year,
    role: doc.role,
    createdAt: doc.createdAt
  };
}

const register = asyncHandler(async (req, res) => {
  validateRegisterInput(req.body);

  const studentId = req.body.studentId.trim().toUpperCase();
  const name = req.body.name.trim();
  const email = req.body.email.trim().toLowerCase();
  const department = req.body.department.trim();
  const year = Number(req.body.year);
  const role = req.body.role === 'organizer' ? 'organizer' : 'student';

  const existing = await User.find({
    $or: [{ email }, { studentId }]
  }).lean();

  if (existing.length > 0) {
    const errors = {};
    if (existing.some((u) => u.email === email)) {
      errors.email = 'An account with this email already exists.';
    }
    if (existing.some((u) => u.studentId === studentId)) {
      errors.studentId = 'This Student ID is already registered.';
    }
    throw new AppError(409, 'Account already exists.', errors);
  }

  const passwordHash = await bcrypt.hash(req.body.password, 10);
  const createdUser = await User.create({
    studentId,
    name,
    email,
    passwordHash,
    department,
    year,
    role
  });

  const token = signToken(createdUser);

  res.status(201).json({
    success: true,
    message: 'Registration successful!',
    token,
    user: sanitizeUser(createdUser)
  });
});

const login = asyncHandler(async (req, res) => {
  validateLoginInput(req.body);

  const email = req.body.email.trim().toLowerCase();
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(401, 'Invalid email or password.');
  }

  const isMatch = await bcrypt.compare(req.body.password, user.passwordHash);
  if (!isMatch) {
    throw new AppError(401, 'Invalid email or password.');
  }

  const token = signToken(user);

  res.json({
    success: true,
    message: 'Logged in successfully.',
    token,
    user: sanitizeUser(user)
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: sanitizeUser(req.user)
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const errors = {};
  const name = req.body.name !== undefined ? String(req.body.name).trim() : req.user.name;
  const department =
    req.body.department !== undefined
      ? String(req.body.department).trim()
      : req.user.department;
  const year = req.body.year !== undefined ? Number(req.body.year) : req.user.year;

  if (!isNonEmptyString(name) || name.length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }
  if (!isNonEmptyString(department)) {
    errors.department = 'Department is required.';
  }
  if (!Number.isInteger(year) || year < 1 || year > 6) {
    errors.year = 'Year must be between 1 and 6.';
  }
  throwIfErrors(errors);

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { name, department, year } },
    { new: true }
  ).select('-passwordHash');

  res.json({
    success: true,
    message: 'Profile updated successfully.',
    user: sanitizeUser(updated)
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};
