const mongoose = require('mongoose');

const clubMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    memberRole: {
      type: String,
      enum: ['member', 'coordinator', 'president'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const clubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    leadName: {
      type: String,
      required: true,
      trim: true
    },
    leadEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    members: {
      type: [clubMemberSchema],
      default: []
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Club', clubSchema);
