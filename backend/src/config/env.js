const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_events',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_campus_event_hub_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};

module.exports = env;
