const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { getDbStatus } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const eventsRoutes = require('./routes/eventsRoutes');
const clubsRoutes = require('./routes/clubsRoutes');
const registrationsRoutes = require('./routes/registrationsRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  const dbStatus = getDbStatus();
  res.status(dbStatus === 'connected' ? 200 : 503).json({
    success: dbStatus === 'connected',
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    service: 'Smart Campus Event Engine & Ticket Hub API',
    database: dbStatus
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/clubs', clubsRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
