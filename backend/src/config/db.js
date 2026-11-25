const mongoose = require('mongoose');
const env = require('./env');

async function connectDB() {
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5000
  });
  return mongoose.connection;
}

function getDbStatus() {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}

module.exports = {
  connectDB,
  getDbStatus
};
