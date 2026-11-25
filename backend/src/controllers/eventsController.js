const mongoose = require('mongoose');
const Event = require('../models/Event');
const Club = require('../models/Club');
const Registration = require('../models/Registration');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { validateEventInput, isNonEmptyString } = require('../utils/validators');

function normalizeStringArray(items) {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  const result = [];
  for (const raw of items) {
    const cleaned = String(raw || '').trim();
    if (cleaned && !seen.has(cleaned.toLowerCase())) {
      seen.add(cleaned.toLowerCase());
      result.push(cleaned);
    }
  }
  return result;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatEvent(doc, myTicketMap = new Map()) {
  return {
    id: doc._id,
    eventCode: doc._id,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    clubId: String(doc.clubId),
    organizerClub: doc.organizerClub,
    venue: doc.venue,
    eventDate: doc.date,
    capacity: doc.capacity,
    seatsAvailable: doc.seatsAvailable,
    entryFee: doc.entryFee,
    tags: doc.tags || [],
    coordinators: (doc.coordinators || []).map((c) => ({
      id: String(c._id),
      name: c.name,
      contact: c.contact
    })),
    sponsors: doc.sponsors || [],
    myTicket: myTicketMap.get(doc._id) || null,
    createdAt: doc.createdAt
  };
}

async function getMyTicketsMap(userId, eventIds) {
  const map = new Map();
  if (!userId || eventIds.length === 0) return map;

  const regs = await Registration.find({
    userId,
    eventId: { $in: eventIds }
  })
    .select('eventId ticketId checkInStatus')
    .lean();

  for (const r of regs) {
    map.set(r.eventId, {
      ticketId: r.ticketId,
      checkInStatus: Boolean(r.checkInStatus)
    });
  }
  return map;
}

async function generateNextEventCode() {
  const events = await Event.find({}, { _id: 1 }).lean();
  let maxNum = 100;
  for (const ev of events) {
    const match = /^EVT(\d+)$/i.exec(ev._id);
    if (match) {
      maxNum = Math.max(maxNum, Number(match[1]));
    }
  }
  return `EVT${maxNum + 1}`;
}

const listEvents = asyncHandler(async (req, res) => {
  const { search, category, freeOnly, minSeats, tag, tags, clubId, sort } = req.query;
  const filter = {};

  if (category && category !== 'All') {
    filter.category = category;
  }

  if (clubId && mongoose.Types.ObjectId.isValid(String(clubId))) {
    filter.clubId = new mongoose.Types.ObjectId(String(clubId));
  }

  if (freeOnly === 'true') {
    filter.entryFee = 0;
  }

  if (minSeats !== undefined && minSeats !== '') {
    const seats = Number(minSeats);
    if (!Number.isNaN(seats)) {
      filter.seatsAvailable = { $gt: seats };
    }
  }

  const tagFilter = tags || tag;
  if (tagFilter) {
    const tagList = String(tagFilter)
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (tagList.length > 0) {
      filter.tags = { $in: tagList };
    }
  }

  if (search && search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [
      { _id: regex },
      { title: regex },
      { venue: regex },
      { organizerClub: regex },
      { tags: regex }
    ];
  }

  let sortObj = { date: 1 };
  if (sort === 'date_desc') sortObj = { date: -1 };
  else if (sort === 'seats_desc') sortObj = { seatsAvailable: -1 };
  else if (sort === 'fee_asc') sortObj = { entryFee: 1 };
  else if (sort === 'newest') sortObj = { createdAt: -1 };

  const docs = await Event.find(filter).sort(sortObj).lean();
  const ticketMap = await getMyTicketsMap(
    req.user?._id || null,
    docs.map((d) => d._id)
  );

  const events = docs.map((d) => formatEvent(d, ticketMap));
  res.json({
    success: true,
    count: events.length,
    events
  });
});

const getEventById = asyncHandler(async (req, res) => {
  const eventCode = String(req.params.id || '').trim().toUpperCase();
  const doc = await Event.findById(eventCode).lean();
  if (!doc) {
    throw new AppError(404, 'Event not found.');
  }

  const ticketMap = await getMyTicketsMap(req.user?._id || null, [doc._id]);
  res.json({
    success: true,
    event: formatEvent(doc, ticketMap)
  });
});

const createEvent = asyncHandler(async (req, res) => {
  validateEventInput(req.body, false);

  const club = await Club.findById(req.body.clubId);
  if (!club) {
    throw new AppError(404, 'Selected organizing club does not exist.');
  }

  const eventCode = isNonEmptyString(req.body.eventCode)
    ? req.body.eventCode.trim().toUpperCase()
    : await generateNextEventCode();

  const existing = await Event.findById(eventCode);
  if (existing) {
    throw new AppError(409, `Event code "${eventCode}" already exists.`, {
      eventCode: 'Please choose a unique event code.'
    });
  }

  const capacity = Number(req.body.capacity);
  const seatsAvailable =
    req.body.seatsAvailable !== undefined
      ? Math.min(capacity, Math.max(0, Number(req.body.seatsAvailable)))
      : capacity;

  const created = await Event.create({
    _id: eventCode,
    title: req.body.title.trim(),
    description: req.body.description.trim(),
    category: req.body.category,
    clubId: club._id,
    organizerClub: club.name,
    venue: req.body.venue.trim(),
    date: new Date(req.body.eventDate),
    capacity,
    seatsAvailable,
    entryFee: Number(req.body.entryFee),
    tags: normalizeStringArray(req.body.tags || []).map((t) => t.toLowerCase()),
    coordinators:
      Array.isArray(req.body.coordinators) && req.body.coordinators.length > 0
        ? req.body.coordinators.map((c) => ({
            name: c.name.trim(),
            contact: c.contact.trim()
          }))
        : [{ name: req.user.name, contact: req.user.email }],
    sponsors: normalizeStringArray(req.body.sponsors || []),
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    message: 'Event created successfully.',
    event: formatEvent(created.toObject())
  });
});

const updateEvent = asyncHandler(async (req, res) => {
  validateEventInput(req.body, true);
  const eventCode = String(req.params.id || '').trim().toUpperCase();

  const current = await Event.findById(eventCode);
  if (!current) {
    throw new AppError(404, 'Event not found.');
  }

  const bookedSeats = current.capacity - current.seatsAvailable;
  const nextCapacity =
    req.body.capacity !== undefined ? Number(req.body.capacity) : current.capacity;

  if (nextCapacity < bookedSeats) {
    throw new AppError(
      400,
      `Capacity cannot be less than already booked seats (${bookedSeats}).`,
      { capacity: `Minimum capacity is ${bookedSeats}.` }
    );
  }

  let nextSeatsAvailable = current.seatsAvailable;
  if (req.body.seatsAvailable !== undefined) {
    nextSeatsAvailable = Math.min(nextCapacity, Math.max(0, Number(req.body.seatsAvailable)));
  } else if (req.body.capacity !== undefined) {
    nextSeatsAvailable = nextCapacity - bookedSeats;
  }

  let clubId = current.clubId;
  let organizerClub = current.organizerClub;
  if (req.body.clubId !== undefined) {
    const club = await Club.findById(req.body.clubId);
    if (!club) {
      throw new AppError(404, 'Selected organizing club does not exist.');
    }
    clubId = club._id;
    organizerClub = club.name;
  }

  const updateFields = {
    title: req.body.title !== undefined ? req.body.title.trim() : current.title,
    description:
      req.body.description !== undefined ? req.body.description.trim() : current.description,
    category: req.body.category !== undefined ? req.body.category : current.category,
    clubId,
    organizerClub,
    venue: req.body.venue !== undefined ? req.body.venue.trim() : current.venue,
    date: req.body.eventDate !== undefined ? new Date(req.body.eventDate) : current.date,
    capacity: nextCapacity,
    seatsAvailable: nextSeatsAvailable,
    entryFee:
      req.body.entryFee !== undefined ? Number(req.body.entryFee) : current.entryFee
  };

  if (req.body.tags !== undefined) {
    updateFields.tags = normalizeStringArray(req.body.tags).map((t) => t.toLowerCase());
  }
  if (req.body.coordinators !== undefined) {
    updateFields.coordinators = req.body.coordinators.map((c) => ({
      name: c.name.trim(),
      contact: c.contact.trim()
    }));
  }
  if (req.body.sponsors !== undefined) {
    updateFields.sponsors = normalizeStringArray(req.body.sponsors);
  }

  const updated = await Event.findByIdAndUpdate(
    eventCode,
    { $set: updateFields },
    { new: true }
  ).lean();

  const ticketMap = await getMyTicketsMap(req.user._id, [updated._id]);
  res.json({
    success: true,
    message: 'Event updated successfully.',
    event: formatEvent(updated, ticketMap)
  });
});

const deleteEvent = asyncHandler(async (req, res) => {
  const eventCode = String(req.params.id || '').trim().toUpperCase();
  const deleted = await Event.findByIdAndDelete(eventCode);

  if (!deleted) {
    throw new AppError(404, 'Event not found.');
  }

  await Registration.deleteMany({ eventId: eventCode });

  res.json({
    success: true,
    message: 'Event and its associated registrations deleted.'
  });
});

const addSponsor = asyncHandler(async (req, res) => {
  const eventCode = String(req.params.id || '').trim().toUpperCase();
  const sponsorName = String(req.body.sponsorName || '').trim();

  if (!sponsorName) {
    throw new AppError(400, 'Sponsor name is required.', {
      sponsorName: 'Please enter a sponsor name.'
    });
  }

  const updated = await Event.findByIdAndUpdate(
    eventCode,
    { $addToSet: { sponsors: sponsorName } },
    { new: true }
  ).lean();

  if (!updated) {
    throw new AppError(404, 'Event not found.');
  }

  res.status(201).json({
    success: true,
    message: `Sponsor "${sponsorName}" added to event.`,
    sponsors: updated.sponsors
  });
});

const removeSponsor = asyncHandler(async (req, res) => {
  const eventCode = String(req.params.id || '').trim().toUpperCase();
  const sponsorName = decodeURIComponent(req.params.sponsorName || '').trim();

  const updated = await Event.findByIdAndUpdate(
    eventCode,
    { $pull: { sponsors: sponsorName } },
    { new: true }
  ).lean();

  if (!updated) {
    throw new AppError(404, 'Event not found.');
  }

  res.json({
    success: true,
    message: 'Sponsor removed.',
    sponsors: updated.sponsors
  });
});

module.exports = {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  addSponsor,
  removeSponsor
};
