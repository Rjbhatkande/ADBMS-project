const mongoose = require('mongoose');
const { AppError } = require('../middleware/errorHandler');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar'];
const VALID_ROLES = ['student', 'organizer', 'admin'];
const VALID_PAYMENT_METHODS = ['UPI', 'Card', 'Free', 'Cash'];
const VALID_PAYMENT_STATUSES = ['Completed', 'Pending', 'Refunded'];

function isNonEmptyString(val) {
  return typeof val === 'string' && val.trim().length > 0;
}

function throwIfErrors(errors, message = 'Validation failed. Please check your input.') {
  if (Object.keys(errors).length > 0) {
    throw new AppError(400, message, errors);
  }
}

function validateRegisterInput(body) {
  const errors = {};
  if (!isNonEmptyString(body.studentId) || body.studentId.trim().length < 3) {
    errors.studentId = 'Student ID must be at least 3 characters.';
  }
  if (!isNonEmptyString(body.name) || body.name.trim().length < 2) {
    errors.name = 'Full name must be at least 2 characters.';
  }
  if (!isNonEmptyString(body.email) || !EMAIL_REGEX.test(body.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  if (typeof body.password !== 'string' || body.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }
  if (!isNonEmptyString(body.department)) {
    errors.department = 'Department is required.';
  }
  const year = Number(body.year);
  if (!Number.isInteger(year) || year < 1 || year > 6) {
    errors.year = 'Year must be a whole number between 1 and 6.';
  }
  if (body.role && !['student', 'organizer'].includes(body.role)) {
    errors.role = 'Role must be either student or organizer.';
  }
  throwIfErrors(errors);
}

function validateLoginInput(body) {
  const errors = {};
  if (!isNonEmptyString(body.email) || !EMAIL_REGEX.test(body.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!isNonEmptyString(body.password)) {
    errors.password = 'Password is required.';
  }
  throwIfErrors(errors);
}

function validateEventInput(body, isUpdate = false) {
  const errors = {};
  if (!isUpdate || body.title !== undefined) {
    if (!isNonEmptyString(body.title) || body.title.trim().length < 3) {
      errors.title = 'Event title must be at least 3 characters.';
    }
  }
  if (!isUpdate || body.description !== undefined) {
    if (!isNonEmptyString(body.description) || body.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters.';
    }
  }
  if (!isUpdate || body.category !== undefined) {
    if (!VALID_CATEGORIES.includes(body.category)) {
      errors.category = `Category must be one of: ${VALID_CATEGORIES.join(', ')}.`;
    }
  }
  if (!isUpdate || body.clubId !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(String(body.clubId || ''))) {
      errors.clubId = 'Please select an organizing club.';
    }
  }
  if (!isUpdate || body.venue !== undefined) {
    if (!isNonEmptyString(body.venue)) {
      errors.venue = 'Venue is required.';
    }
  }
  if (!isUpdate || body.eventDate !== undefined) {
    const parsed = new Date(body.eventDate);
    if (!body.eventDate || Number.isNaN(parsed.getTime())) {
      errors.eventDate = 'Please provide a valid event date and time.';
    }
  }
  if (!isUpdate || body.capacity !== undefined) {
    const cap = Number(body.capacity);
    if (!Number.isInteger(cap) || cap < 1 || cap > 50000) {
      errors.capacity = 'Capacity must be an integer between 1 and 50,000.';
    }
  }
  if (!isUpdate || body.entryFee !== undefined) {
    const fee = Number(body.entryFee);
    if (Number.isNaN(fee) || fee < 0 || fee > 100000) {
      errors.entryFee = 'Entry fee must be 0 or a positive amount.';
    }
  }
  if (body.coordinators !== undefined) {
    if (!Array.isArray(body.coordinators)) {
      errors.coordinators = 'Coordinators must be a list.';
    } else {
      for (const coord of body.coordinators) {
        if (!isNonEmptyString(coord?.name) || !isNonEmptyString(coord?.contact)) {
          errors.coordinators = 'Each coordinator requires a name and contact.';
          break;
        }
      }
    }
  }
  throwIfErrors(errors);
}

function validateClubInput(body, isUpdate = false) {
  const errors = {};
  if (!isUpdate || body.name !== undefined) {
    if (!isNonEmptyString(body.name) || body.name.trim().length < 2) {
      errors.name = 'Club name must be at least 2 characters.';
    }
  }
  if (!isUpdate || body.category !== undefined) {
    if (!isNonEmptyString(body.category)) {
      errors.category = 'Club category is required.';
    }
  }
  if (!isUpdate || body.description !== undefined) {
    if (!isNonEmptyString(body.description) || body.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters.';
    }
  }
  if (!isUpdate || body.leadName !== undefined) {
    if (!isNonEmptyString(body.leadName)) {
      errors.leadName = 'Club lead name is required.';
    }
  }
  if (!isUpdate || body.leadEmail !== undefined) {
    if (!isNonEmptyString(body.leadEmail) || !EMAIL_REGEX.test(body.leadEmail.trim())) {
      errors.leadEmail = 'Please enter a valid club lead email.';
    }
  }
  throwIfErrors(errors);
}

module.exports = {
  EMAIL_REGEX,
  VALID_CATEGORIES,
  VALID_ROLES,
  VALID_PAYMENT_METHODS,
  VALID_PAYMENT_STATUSES,
  isNonEmptyString,
  throwIfErrors,
  validateRegisterInput,
  validateLoginInput,
  validateEventInput,
  validateClubInput
};
