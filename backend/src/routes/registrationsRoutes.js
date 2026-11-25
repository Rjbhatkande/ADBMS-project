const express = require('express');
const registrationsController = require('../controllers/registrationsController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/my', authenticate, registrationsController.getMyRegistrations);
router.get('/', authenticate, requireRole('organizer', 'admin'), registrationsController.listRegistrations);
router.post('/', authenticate, registrationsController.createRegistration);
router.put('/:id', authenticate, requireRole('organizer', 'admin'), registrationsController.updateRegistration);
router.patch(
  '/:ticketId/checkin',
  authenticate,
  requireRole('organizer', 'admin'),
  registrationsController.checkInTicket
);
router.delete('/:id', authenticate, registrationsController.deleteRegistration);

module.exports = router;
