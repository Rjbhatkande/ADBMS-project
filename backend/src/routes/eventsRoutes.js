const express = require('express');
const eventsController = require('../controllers/eventsController');
const { authenticate, optionalAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, eventsController.listEvents);
router.get('/:id', optionalAuth, eventsController.getEventById);

router.post('/', authenticate, requireRole('organizer', 'admin'), eventsController.createEvent);
router.put('/:id', authenticate, requireRole('organizer', 'admin'), eventsController.updateEvent);
router.delete('/:id', authenticate, requireRole('organizer', 'admin'), eventsController.deleteEvent);

router.post(
  '/:id/sponsors',
  authenticate,
  requireRole('organizer', 'admin'),
  eventsController.addSponsor
);
router.delete(
  '/:id/sponsors/:sponsorName',
  authenticate,
  requireRole('organizer', 'admin'),
  eventsController.removeSponsor
);

module.exports = router;
