const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Club = require('../models/Club');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

async function seedDatabase() {
  await connectDB();
  console.log('Connected to MongoDB (campus_events). Seeding data...');

  const passwordHash = await bcrypt.hash('Campus@2026', 10);

  const seedUsers = [
    {
      studentId: 'ADMIN001',
      name: 'Aarav Sharma',
      email: 'aarav@college.edu',
      passwordHash,
      department: 'Computer Science',
      year: 4,
      role: 'admin'
    },
    {
      studentId: 'ORG101',
      name: 'Riya Sen',
      email: 'riya@college.edu',
      passwordHash,
      department: 'Performing Arts',
      year: 3,
      role: 'organizer'
    },
    {
      studentId: 'STU8821',
      name: 'Priya Verma',
      email: 'priya@college.edu',
      passwordHash,
      department: 'Computer Science',
      year: 3,
      role: 'student'
    },
    {
      studentId: 'STU4412',
      name: 'Rohan Gupta',
      email: 'rohan@college.edu',
      passwordHash,
      department: 'Electrical Engineering',
      year: 2,
      role: 'student'
    },
    {
      studentId: 'STU9903',
      name: 'Ananya Roy',
      email: 'ananya@college.edu',
      passwordHash,
      department: 'Computer Science',
      year: 4,
      role: 'student'
    }
  ];

  const userMap = new Map();
  for (const u of seedUsers) {
    const doc = await User.findOneAndUpdate(
      { email: u.email },
      { $set: u },
      { upsert: true, new: true }
    );
    userMap.set(u.email, doc);
  }
  console.log(`Seeded ${userMap.size} users (demo password: Campus@2026).`);

  const priya = userMap.get('priya@college.edu');
  const rohan = userMap.get('rohan@college.edu');
  const ananya = userMap.get('ananya@college.edu');
  const aarav = userMap.get('aarav@college.edu');

  const seedClubs = [
    {
      name: 'Coding Club',
      category: 'Technical',
      description:
        'Organizes hackathons, competitive programming contests, and full-stack bootcamps.',
      leadName: 'Aarav Sharma',
      leadEmail: 'aarav@college.edu',
      createdBy: aarav._id,
      members: [
        { user: priya._id, memberRole: 'member' },
        { user: ananya._id, memberRole: 'member' }
      ]
    },
    {
      name: 'Music Society',
      category: 'Cultural',
      description: 'Campus live concerts, acoustic nights, and inter-college battle of bands.',
      leadName: 'Riya Sen',
      leadEmail: 'riya@college.edu',
      createdBy: aarav._id,
      members: [{ user: priya._id, memberRole: 'member' }]
    },
    {
      name: 'Robotics Club',
      category: 'Technical',
      description: 'Hands-on autonomous bots, embedded systems, and AI hardware workshops.',
      leadName: 'Karan Patel',
      leadEmail: 'karan@college.edu',
      createdBy: aarav._id,
      members: [{ user: rohan._id, memberRole: 'coordinator' }]
    },
    {
      name: 'Design & Innovation Guild',
      category: 'Workshop',
      description: 'UI/UX sprints, product design critiques, and campus digital showcase.',
      leadName: 'Meera Iyer',
      leadEmail: 'meera@college.edu',
      createdBy: aarav._id,
      members: []
    }
  ];

  const clubMap = new Map();
  for (const c of seedClubs) {
    const doc = await Club.findOneAndUpdate(
      { name: c.name },
      { $setOnInsert: c },
      { upsert: true, new: true }
    );
    clubMap.set(c.name, doc);
  }
  console.log(`Seeded ${clubMap.size} clubs.`);

  const seedEvents = [
    {
      _id: 'EVT101',
      title: 'HackCampus 2026',
      description:
        'A 24-hour inter-department collegiate hackathon building smart campus solutions with mentorship and cash prizes.',
      category: 'Technical',
      clubId: clubMap.get('Coding Club')._id,
      organizerClub: 'Coding Club',
      venue: 'Auditorium A',
      date: new Date('2026-10-15T09:00:00Z'),
      capacity: 200,
      seatsAvailable: 45,
      entryFee: 150,
      tags: ['hackathon', 'coding', 'prizes'],
      coordinators: [{ name: 'Aarav Sharma', contact: 'aarav@college.edu' }],
      sponsors: ['TechCorp', 'DevStudio', 'CloudInc'],
      createdBy: aarav._id
    },
    {
      _id: 'EVT102',
      title: 'Annual Music Night',
      description:
        'Open-air evening concert featuring student bands, classical fusion ensembles, and headline acoustic acts.',
      category: 'Cultural',
      clubId: clubMap.get('Music Society')._id,
      organizerClub: 'Music Society',
      venue: 'Open Air Theatre',
      date: new Date('2026-10-20T18:00:00Z'),
      capacity: 500,
      seatsAvailable: 120,
      entryFee: 0,
      tags: ['music', 'concert', 'night'],
      coordinators: [{ name: 'Riya Sen', contact: 'riya@college.edu' }],
      sponsors: [],
      createdBy: aarav._id
    },
    {
      _id: 'EVT103',
      title: 'AI & Robotics Workshop',
      description:
        'Practical lab workshop covering computer vision on edge devices and PID motor control.',
      category: 'Workshop',
      clubId: clubMap.get('Robotics Club')._id,
      organizerClub: 'Robotics Club',
      venue: 'Lab 3',
      date: new Date('2026-11-05T10:00:00Z'),
      capacity: 60,
      seatsAvailable: 10,
      entryFee: 50,
      tags: ['ai', 'robotics', 'workshop'],
      coordinators: [{ name: 'Karan Patel', contact: 'karan@college.edu' }],
      sponsors: ['RoboLabs'],
      createdBy: aarav._id
    },
    {
      _id: 'EVT104',
      title: 'Open Source & Cloud Sprint',
      description:
        'Free weekend coding sprint helping students ship their first pull requests and deploy full-stack apps.',
      category: 'Technical',
      clubId: clubMap.get('Coding Club')._id,
      organizerClub: 'Coding Club',
      venue: 'Innovation Center 204',
      date: new Date('2026-12-12T10:00:00Z'),
      capacity: 150,
      seatsAvailable: 95,
      entryFee: 0,
      tags: ['coding', 'opensource', 'cloud'],
      coordinators: [{ name: 'Aarav Sharma', contact: 'aarav@college.edu' }],
      sponsors: ['CloudInc'],
      createdBy: aarav._id
    }
  ];

  for (const ev of seedEvents) {
    await Event.findOneAndUpdate(
      { _id: ev._id },
      { $setOnInsert: ev },
      { upsert: true, new: true }
    );
  }
  console.log(`Seeded ${seedEvents.length} events.`);

  const seedRegs = [
    {
      ticketId: 'TICK-2026-001',
      eventId: 'EVT101',
      userId: priya._id,
      studentId: 'STU8821',
      studentName: 'Priya Verma',
      department: 'Computer Science',
      year: 3,
      registrationDate: new Date('2026-09-12T14:30:00Z'),
      checkInStatus: false,
      checkedInAt: null,
      paymentDetails: { method: 'UPI', amountPaid: 150, status: 'Completed' }
    },
    {
      ticketId: 'TICK-2026-002',
      eventId: 'EVT102',
      userId: priya._id,
      studentId: 'STU8821',
      studentName: 'Priya Verma',
      department: 'Computer Science',
      year: 3,
      registrationDate: new Date('2026-09-13T10:00:00Z'),
      checkInStatus: true,
      checkedInAt: new Date('2026-10-20T18:10:00Z'),
      paymentDetails: { method: 'Free', amountPaid: 0, status: 'Completed' }
    },
    {
      ticketId: 'TICK-2026-003',
      eventId: 'EVT101',
      userId: rohan._id,
      studentId: 'STU4412',
      studentName: 'Rohan Gupta',
      department: 'Electrical Engineering',
      year: 2,
      registrationDate: new Date('2026-09-14T11:20:00Z'),
      checkInStatus: true,
      checkedInAt: new Date('2026-10-15T09:15:00Z'),
      paymentDetails: { method: 'Card', amountPaid: 150, status: 'Completed' }
    },
    {
      ticketId: 'TICK-2026-004',
      eventId: 'EVT103',
      userId: ananya._id,
      studentId: 'STU9903',
      studentName: 'Ananya Roy',
      department: 'Computer Science',
      year: 4,
      registrationDate: new Date('2026-09-15T16:45:00Z'),
      checkInStatus: false,
      checkedInAt: null,
      paymentDetails: { method: 'UPI', amountPaid: 50, status: 'Completed' }
    }
  ];

  for (const reg of seedRegs) {
    await Registration.findOneAndUpdate(
      { ticketId: reg.ticketId },
      { $setOnInsert: reg },
      { upsert: true, new: true }
    );
  }
  console.log(`Seeded ${seedRegs.length} registrations.`);
  console.log('=== MONGODB SEEDING COMPLETED ===');
  await mongoose.disconnect();
}

seedDatabase().catch(async (err) => {
  console.error('MongoDB seed failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
