-- ============================================================================
-- Smart Campus Event Engine & Ticket Hub - Seed Helper
-- Run `cd backend && npm run seed` to initialize the database and seed
-- users (with freshly generated bcryptjs password hashes), clubs, events,
-- tags, coordinators, sponsors, memberships, and registrations.
-- ============================================================================

USE campus_events;

-- If you prefer SQL-only seeding after registering users via /api/auth/register,
-- ensure at least one club exists before inserting events:
INSERT INTO clubs (name, category, description, lead_name, lead_email) VALUES
('Coding Club', 'Technical', 'Organizes hackathons, competitive programming contests, and full-stack bootcamps.', 'Aarav Sharma', 'aarav@college.edu'),
('Music Society', 'Cultural', 'Campus live concerts, acoustic nights, and inter-college battle of bands.', 'Riya Sen', 'riya@college.edu'),
('Robotics Club', 'Technical', 'Hands-on autonomous bots, embedded systems, and AI hardware workshops.', 'Karan Patel', 'karan@college.edu')
ON DUPLICATE KEY UPDATE description = VALUES(description);
