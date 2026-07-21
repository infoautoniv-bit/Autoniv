import dotenv from 'dotenv';
dotenv.config();

import { connectDb, closeDb } from './db/connection.js';
import User from './db/models/User.js';
import bcrypt from 'bcryptjs';

const PLAIN_PASSWORD = 'Admin@123';

const NEW_ADMIN = {
  email: 'admin2@autoniv.ai',
  name: 'Admin2',
  phoneNumber: '',
  role: 'admin',
  company: 'My Company',
  plan: 'both_free',
  isActive: true,
  isVerified: false,
  chatEnabled: true,
  chatPlan: 'chat_free',
  voiceEnabled: true,
  voicePlan: 'voice_free',
};

async function main() {
  await connectDb();

  const existing = await User.findOne({ email: NEW_ADMIN.email });
  if (existing) {
    console.log(`⚠️  ${NEW_ADMIN.email} already exists. Skipping.`);
  } else {
    const hashedPassword = await bcrypt.hash(PLAIN_PASSWORD, 12);
    await User.create({ ...NEW_ADMIN, password: hashedPassword });
    console.log(`✅ Admin created: ${NEW_ADMIN.email} / ${PLAIN_PASSWORD}`);
  }

  await closeDb();
}

main()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error('❌ Failed:', err);
    try { await closeDb(); } catch {}
    process.exit(1);
  });
