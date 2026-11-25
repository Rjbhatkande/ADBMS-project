const express = require('express');
const clubsController = require('../controllers/clubsController');
const { authenticate, optionalAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, clubsController.listClubs);
router.get('/:id', optionalAuth, clubsController.getClubById);

router.post('/', authenticate, requireRole('organizer', 'admin'), clubsController.createClub);
router.put('/:id', authenticate, requireRole('organizer', 'admin'), clubsController.updateClub);
router.delete('/:id', authenticate, requireRole('organizer', 'admin'), clubsController.deleteClub);

router.post('/:id/join', authenticate, clubsController.joinClub);
router.delete('/:id/leave', authenticate, clubsController.leaveClub);

module.exports = router;
