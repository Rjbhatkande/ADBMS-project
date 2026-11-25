const Club = require('../models/Club');
const Event = require('../models/Event');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { validateClubInput } = require('../utils/validators');

const listClubs = asyncHandler(async (req, res) => {
  const currentUserId = req.user?._id ? String(req.user._id) : null;

  const [clubs, eventCounts] = await Promise.all([
    Club.find().sort({ name: 1 }).lean(),
    Event.aggregate([{ $group: { _id: '$clubId', count: { $sum: 1 } } }])
  ]);

  const countMap = new Map(eventCounts.map((e) => [String(e._id), e.count]));

  res.json({
    success: true,
    clubs: clubs.map((c) => ({
      id: String(c._id),
      name: c.name,
      category: c.category,
      description: c.description,
      leadName: c.leadName,
      leadEmail: c.leadEmail,
      memberCount: (c.members || []).length,
      eventCount: countMap.get(String(c._id)) || 0,
      isMember: currentUserId
        ? (c.members || []).some((m) => String(m.user) === currentUserId)
        : false,
      createdAt: c.createdAt
    }))
  });
});

const getClubById = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id)
    .populate('members.user', 'studentId name email department year')
    .lean();

  if (!club) {
    throw new AppError(404, 'Club not found.');
  }

  res.json({
    success: true,
    club: {
      id: String(club._id),
      name: club.name,
      category: club.category,
      description: club.description,
      leadName: club.leadName,
      leadEmail: club.leadEmail,
      createdAt: club.createdAt,
      members: (club.members || [])
        .filter((m) => m.user)
        .map((m) => ({
          id: String(m._id),
          userId: String(m.user._id),
          studentId: m.user.studentId,
          name: m.user.name,
          email: m.user.email,
          department: m.user.department,
          year: m.user.year,
          memberRole: m.memberRole,
          joinedAt: m.joinedAt
        }))
    }
  });
});

const createClub = asyncHandler(async (req, res) => {
  validateClubInput(req.body, false);

  const created = await Club.create({
    name: req.body.name.trim(),
    category: req.body.category.trim(),
    description: req.body.description.trim(),
    leadName: req.body.leadName.trim(),
    leadEmail: req.body.leadEmail.trim().toLowerCase(),
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    message: 'Club created successfully.',
    club: {
      id: String(created._id),
      name: created.name,
      category: created.category,
      description: created.description,
      leadName: created.leadName,
      leadEmail: created.leadEmail,
      memberCount: 0,
      eventCount: 0,
      isMember: false
    }
  });
});

const updateClub = asyncHandler(async (req, res) => {
  validateClubInput(req.body, true);

  const current = await Club.findById(req.params.id);
  if (!current) {
    throw new AppError(404, 'Club not found.');
  }

  const nextName = req.body.name !== undefined ? req.body.name.trim() : current.name;
  const updated = await Club.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        name: nextName,
        category: req.body.category !== undefined ? req.body.category.trim() : current.category,
        description:
          req.body.description !== undefined
            ? req.body.description.trim()
            : current.description,
        leadName: req.body.leadName !== undefined ? req.body.leadName.trim() : current.leadName,
        leadEmail:
          req.body.leadEmail !== undefined
            ? req.body.leadEmail.trim().toLowerCase()
            : current.leadEmail
      }
    },
    { new: true }
  ).lean();

  if (nextName !== current.name) {
    await Event.updateMany({ clubId: updated._id }, { $set: { organizerClub: nextName } });
  }

  res.json({
    success: true,
    message: 'Club updated successfully.',
    club: {
      id: String(updated._id),
      name: updated.name,
      category: updated.category,
      description: updated.description,
      leadName: updated.leadName,
      leadEmail: updated.leadEmail
    }
  });
});

const deleteClub = asyncHandler(async (req, res) => {
  const linkedEvents = await Event.countDocuments({ clubId: req.params.id });
  if (linkedEvents > 0) {
    throw new AppError(
      409,
      'Cannot delete a club that still has active events. Delete or reassign its events first.'
    );
  }

  const deleted = await Club.findByIdAndDelete(req.params.id);
  if (!deleted) {
    throw new AppError(404, 'Club not found.');
  }

  res.json({
    success: true,
    message: 'Club deleted successfully.'
  });
});

const joinClub = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) {
    throw new AppError(404, 'Club not found.');
  }

  const alreadyMember = club.members.some(
    (m) => String(m.user) === String(req.user._id)
  );
  if (!alreadyMember) {
    club.members.push({ user: req.user._id, memberRole: 'member' });
    await club.save();
  }

  res.status(201).json({
    success: true,
    message: `You have joined ${club.name}!`
  });
});

const leaveClub = asyncHandler(async (req, res) => {
  await Club.findByIdAndUpdate(req.params.id, {
    $pull: { members: { user: req.user._id } }
  });

  res.json({
    success: true,
    message: 'You have left the club.'
  });
});

module.exports = {
  listClubs,
  getClubById,
  createClub,
  updateClub,
  deleteClub,
  joinClub,
  leaveClub
};
