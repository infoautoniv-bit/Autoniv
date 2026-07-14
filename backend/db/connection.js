import mongoose from 'mongoose';
import { log } from '../services/logger.js';

export async function connectDb() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/autoniv';
  try {
    await mongoose.connect(uri);
    log.info('mongo_connected', { host: mongoose.connection.host });
  } catch (err) {
    log.fatal('mongo_connection_failed', { error: err.message });
    process.exit(1);
  }
}

export async function closeDb() {
  await mongoose.connection.close();
}

export default { connectDb, closeDb };
