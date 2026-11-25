const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', authenticate, analyticsController.getAnalyticsOverview);

module.exports = router;
