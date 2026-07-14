// seed.js - create initial admin user
// Run with: node ./scripts/seed.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../db/models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/autoniv';

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

async function createAdmin() {
  const adminEmail = 'admin@autoniv.com';
  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    console.log('👤 Admin user already exists:', existing.email);
    return;
  }

  const plainPassword = 'ChangeMe123!'; // NOTE: change after first login
  const hashed = await bcrypt.hash(plainPassword, 10);

  const admin = new User({
    email: adminEmail,
    password: hashed,
    name: 'Administrator',
    role: 'admin',
    plan: 'chat_free',
    chatPlan: 'chat_free',
    voicePlan: 'none',
    // other required fields get defaults from schema
  });

  await admin.save();
  console.log('🛠️ Admin user created with email:', adminEmail);
  console.log('🔑 Initial password:', plainPassword);
}

(async () => {
  await connectDB();
  await createAdmin();
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
})();
