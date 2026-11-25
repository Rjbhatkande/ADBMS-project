const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    year: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
      default: 1
    },
    role: {
      type: String,
      enum: ['student', 'organizer', 'admin'],
      default: 'student'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
