const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    eventId: {
      type: String,
      ref: 'Event',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    studentId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    studentName: {
      type: String,
      required: true,
      trim: true
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
      max: 6
    },
    registrationDate: {
      type: Date,
      default: Date.now
    },
    checkInStatus: {
      type: Boolean,
      default: false
    },
    checkedInAt: {
      type: Date,
      default: null
    },
    paymentDetails: {
      method: {
        type: String,
        enum: ['UPI', 'Card', 'Free', 'Cash'],
        default: 'UPI'
      },
      amountPaid: {
        type: Number,
        required: true,
        min: 0,
        default: 0
      },
      status: {
        type: String,
        enum: ['Completed', 'Pending', 'Refunded'],
        default: 'Completed'
      }
    }
  },
  { timestamps: true }
);

registrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });
registrationSchema.index({ department: 1 });
registrationSchema.index({ checkInStatus: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
