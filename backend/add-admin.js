import dotenv from 'dotenv';
dotenv.config();

import { connectDb, closeDb } from './db/connection.js';
import User from './db/models/User.js';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askPassword() {
  return new Promise((resolve) => {
    rl.question('Enter admin password: ', (password) => {
      rl.close();
      resolve(password);
    });
  });
}

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
  const password = process.env.ADMIN_PASSWORD || await askPassword();
  if (!password || password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  await connectDb();

  const existing = await User.findOne({ email: NEW_ADMIN.email });
  if (existing) {
    console.log(`${NEW_ADMIN.email} already exists. Skipping.`);
  } else {
    const hashedPassword = await bcrypt.hash(password, 12);
    await User.create({ ...NEW_ADMIN, password: hashedPassword });
    console.log(`Admin created: ${NEW_ADMIN.email}`);
  }

  await closeDb();
}

main()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error('Failed:', err);
    try { await closeDb(); } catch {}
    process.exit(1);
  });
