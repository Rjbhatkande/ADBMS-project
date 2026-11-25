const mongoose = require('mongoose');

const coordinatorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contact: { type: String, required: true, trim: true }
  },
  { _id: true }
);

const eventSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar'],
      default: 'Technical'
    },
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true
    },
    organizerClub: {
      type: String,
      required: true,
      trim: true
    },
    venue: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      required: true
    },
    capacity: {
      type: Number,
      required: true,
      min: 1
    },
    seatsAvailable: {
      type: Number,
      required: true,
      min: 0
    },
    entryFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    tags: {
      type: [String],
      default: []
    },
    coordinators: {
      type: [coordinatorSchema],
      default: []
    },
    sponsors: {
      type: [String],
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

eventSchema.index({ category: 1 });
eventSchema.index({ entryFee: 1, seatsAvailable: 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ date: 1 });

module.exports = mongoose.model('Event', eventSchema);
