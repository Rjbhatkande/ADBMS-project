const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');

async function startServer() {
  try {
    await connectDB();
    console.log(`MongoDB connected (${env.mongoUri})`);
  } catch (err) {
    console.warn(
      'Warning: Could not connect to MongoDB at startup. Ensure mongod is running:',
      err.message
    );
  }

  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
}

startServer();
