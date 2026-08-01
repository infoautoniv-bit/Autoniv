import mongoose from 'mongoose';
import { log } from '../services/logger.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

async function connectWithRetry(uri, attempt = 1) {
  try {
    await mongoose.connect(uri, {
      maxPoolSize: 50,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
    });
    log.info('mongo_connected', { host: mongoose.connection.host, attempt });
  } catch (err) {
    if (attempt >= MAX_RETRIES) {
      log.fatal('mongo_connection_failed', { error: err.message, attempts: attempt });
      process.exit(1);
    }
    log.warn('mongo_connection_retry', { attempt, maxRetries: MAX_RETRIES, error: err.message });
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    return connectWithRetry(uri, attempt + 1);
  }
}

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    log.fatal('mongo_uri_missing');
    process.exit(1);
  }
  await connectWithRetry(uri);
}

export async function closeDb() {
  await mongoose.connection.close();
}

export default { connectDb, closeDb };
