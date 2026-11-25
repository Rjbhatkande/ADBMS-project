const mongoose = require('mongoose');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const {
  VALID_PAYMENT_METHODS,
  VALID_PAYMENT_STATUSES
} = require('../utils/validators');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatRegistration(doc, eventMap) {
  const ev = eventMap.get(doc.eventId);
  return {
    id: String(doc._id),
    ticketId: doc.ticketId,
    eventId: doc.eventId,
    eventCode: doc.eventId,
    eventTitle: ev?.title || 'Campus Event',
    eventDate: ev?.date || doc.registrationDate,
    venue: ev?.venue || '',
    organizerClub: ev?.organizerClub || '',
    userId: String(doc.userId),
    studentId: doc.studentId,
    studentName: doc.studentName,
    department: doc.department,
    year: doc.year,
    registrationDate: doc.registrationDate,
    checkInStatus: Boolean(doc.checkInStatus),
    checkedInAt: doc.checkedInAt,
    paymentDetails: {
      method: doc.paymentDetails?.method || 'UPI',
      amountPaid: Number(doc.paymentDetails?.amountPaid || 0),
      status: doc.paymentDetails?.status || 'Completed'
    }
  };
}

async function hydrateRegistrations(regs) {
  if (regs.length === 0) return [];
  const eventIds = [...new Set(regs.map((r) => r.eventId))];
  const events = await Event.find({ _id: { $in: eventIds } })
    .select('title date venue organizerClub')
    .lean();
  const eventMap = new Map(events.map((e) => [e._id, e]));
  return regs.map((r) => formatRegistration(r, eventMap));
}

const listRegistrations = asyncHandler(async (req, res) => {
  const { department, eventId, checkInStatus, search } = req.query;
  const filter = {};

  if (department && department !== 'All') {
    filter.department = department;
  }
  if (eventId && eventId !== 'All') {
    filter.eventId = String(eventId).trim().toUpperCase();
  }
  if (checkInStatus === 'true' || checkInStatus === 'false') {
    filter.checkInStatus = checkInStatus === 'true';
  }
  if (search && search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), 'i');
    const matchingEvents = await Event.find({ title: regex }).select('_id').lean();
    const matchingEventIds = matchingEvents.map((e) => e._id);
    filter.$or = [
      { ticketId: regex },
      { studentId: regex },
      { studentName: regex },
      ...(matchingEventIds.length > 0 ? [{ eventId: { $in: matchingEventIds } }] : [])
    ];
  }

  const regs = await Registration.find(filter).sort({ registrationDate: -1 }).lean();
  const hydrated = await hydrateRegistrations(regs);

  res.json({
    success: true,
    count: hydrated.length,
    registrations: hydrated
  });
});

const getMyRegistrations = asyncHandler(async (req, res) => {
  const regs = await Registration.find({ userId: req.user._id })
    .sort({ registrationDate: -1 })
    .lean();
  const hydrated = await hydrateRegistrations(regs);

  res.json({
    success: true,
    registrations: hydrated
  });
});

const createRegistration = asyncHandler(async (req, res) => {
  const eventId = String(req.body.eventId || '').trim().toUpperCase();
  if (!eventId) {
    throw new AppError(400, 'A valid eventId is required.');
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError(404, 'Event not found.');
  }

  const existing = await Registration.findOne({ eventId, userId: req.user._id });
  if (existing) {
    throw new AppError(409, 'You already have a ticket for this event.');
  }

  const entryFee = Number(event.entryFee);
  const requestedMethod = req.body.paymentMethod || (entryFee === 0 ? 'Free' : 'UPI');
  if (!VALID_PAYMENT_METHODS.includes(requestedMethod)) {
    throw new AppError(400, 'Invalid payment method.', {
      paymentMethod: `Method must be one of: ${VALID_PAYMENT_METHODS.join(', ')}.`
    });
  }
  const paymentMethod =
    entryFee === 0 ? 'Free' : requestedMethod === 'Free' ? 'UPI' : requestedMethod;

  // Atomic conditional seat decrement using MongoDB $inc (Task 3)
  const decremented = await Event.findOneAndUpdate(
    { _id: eventId, seatsAvailable: { $gt: 0 } },
    { $inc: { seatsAvailable: -1 } },
    { new: true }
  );

  if (!decremented) {
    throw new AppError(409, 'Sorry, this event is sold out.');
  }

  const totalCount = await Registration.countDocuments();
  const seq = String(totalCount + 1).padStart(3, '0');
  const randomSuffix = Math.floor(10 + Math.random() * 89);
  const ticketId = `TICK-2026-${seq}-${randomSuffix}`;

  let created;
  try {
    created = await Registration.create({
      ticketId,
      eventId,
      userId: req.user._id,
      studentId: req.user.studentId,
      studentName: (req.body.studentName || req.user.name).trim(),
      department: (req.body.department || req.user.department).trim(),
      year: Number(req.body.year || req.user.year),
      registrationDate: new Date(),
      checkInStatus: false,
      checkedInAt: null,
      paymentDetails: {
        method: paymentMethod,
        amountPaid: entryFee,
        status: 'Completed'
      }
    });
  } catch (err) {
    // Compensating increment if registration insert fails
    await Event.updateOne({ _id: eventId }, { $inc: { seatsAvailable: 1 } });
    throw err;
  }

  const [hydrated] = await hydrateRegistrations([created.toObject()]);
  res.status(201).json({
    success: true,
    message: 'Ticket booked successfully!',
    registration: hydrated
  });
});

const updateRegistration = asyncHandler(async (req, res) => {
  const existing = await Registration.findById(req.params.id);
  if (!existing) {
    throw new AppError(404, 'Registration not found.');
  }

  const checkInStatus =
    req.body.checkInStatus !== undefined
      ? Boolean(req.body.checkInStatus)
      : existing.checkInStatus;
  const paymentStatus = req.body.paymentStatus || existing.paymentDetails.status;

  if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
    throw new AppError(400, 'Invalid payment status.');
  }

  existing.checkInStatus = checkInStatus;
  existing.checkedInAt = checkInStatus ? existing.checkedInAt || new Date() : null;
  existing.paymentDetails.status = paymentStatus;
  if (req.body.department) existing.department = req.body.department.trim();
  if (req.body.year) existing.year = Number(req.body.year);

  await existing.save();

  const [hydrated] = await hydrateRegistrations([existing.toObject()]);
  res.json({
    success: true,
    message: 'Registration updated.',
    registration: hydrated
  });
});

const checkInTicket = asyncHandler(async (req, res) => {
  const identifier = String(req.params.ticketId || '').trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(identifier);

  const reg = isObjectId
    ? await Registration.findById(identifier)
    : await Registration.findOne({ ticketId: identifier.toUpperCase() });

  if (!reg) {
    throw new AppError(404, `Ticket "${identifier}" was not found.`);
  }

  const nextStatus =
    req.body.checkInStatus !== undefined
      ? Boolean(req.body.checkInStatus)
      : !reg.checkInStatus;

  reg.checkInStatus = nextStatus;
  reg.checkedInAt = nextStatus ? new Date() : null;
  await reg.save();

  const [hydrated] = await hydrateRegistrations([reg.toObject()]);
  res.json({
    success: true,
    message: nextStatus
      ? `Ticket ${reg.ticketId} checked in!`
      : `Ticket ${reg.ticketId} check-in reverted.`,
    registration: hydrated
  });
});

const deleteRegistration = asyncHandler(async (req, res) => {
  const reg = await Registration.findById(req.params.id);
  if (!reg) {
    throw new AppError(404, 'Registration not found.');
  }

  const isAdminOrOrg = ['admin', 'organizer'].includes(req.user.role);
  if (!isAdminOrOrg && String(reg.userId) !== String(req.user._id)) {
    throw new AppError(403, 'You can only cancel your own tickets.');
  }

  if (reg.checkInStatus && !isAdminOrOrg) {
    throw new AppError(400, 'Checked-in tickets cannot be cancelled by students.');
  }

  await Registration.deleteOne({ _id: reg._id });
  await Event.updateOne(
    { _id: reg.eventId, $expr: { $lt: ['$seatsAvailable', '$capacity'] } },
    { $inc: { seatsAvailable: 1 } }
  );

  res.json({
    success: true,
    message: 'Ticket cancelled and seat returned to pool.'
  });
});

module.exports = {
  listRegistrations,
  getMyRegistrations,
  createRegistration,
  updateRegistration,
  checkInTicket,
  deleteRegistration
};
