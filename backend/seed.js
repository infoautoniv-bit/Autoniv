import dotenv from 'dotenv';
dotenv.config();

import { connectDb, closeDb } from './db/connection.js';
import AddOn from './db/models/AddOn.js';
import User, { hashApiKey, generateApiKey } from './db/models/User.js';

const ADDONS = [
  { id: 'whatsapp-channel',   icon: '💬', title: 'WhatsApp Channel',   price: '₹2,499 / month', category: 'recurring', description: 'Native WhatsApp Business API with template support.', type: 'chat' },
  { id: 'advanced-analytics', icon: '📊', title: 'Advanced Analytics',  price: '₹1,499 / month', category: 'recurring', description: 'Funnel analysis, CSAT scores, and conversation heatmaps.', type: 'chat' },
  { id: 'priority-support',   icon: '🎧', title: 'Priority Support',   price: '₹4,999 / month', category: 'recurring', description: 'Dedicated Slack channel, 2-hour SLA, and onboarding specialist.', type: 'chat' },

  { id: 'monthly-performance-report', icon: '📊', title: 'Monthly Performance Report', price: '₹3,999–₹6,999 / month', category: 'recurring', description: 'Branded PDF with call quality scores, script performance, A/B outcomes, and industry benchmarks.', type: 'voice' },
  { id: 'script-ab-testing', icon: '🧪', title: 'Script A/B Testing', price: '₹8,999 / month', category: 'recurring', description: 'Run two scripts simultaneously. Analyze conversion rates and receive an optimized version monthly.', type: 'voice' },
  { id: 'whatsapp-followup', icon: '💬', title: 'WhatsApp Follow-Up Sequences', price: '₹4,999 / month', category: 'recurring', description: 'Automated post-call WhatsApp flows: reminders, no-show follow-ups, requalification messages.', type: 'voice' },
  { id: 'regional-language-agent', icon: '🌐', title: 'Regional Language Agent', price: '₹8,000 / month per language', category: 'recurring', description: 'Hindi, Tamil, Telugu, Bengali — reach Tier 2/3 city leads in their native language.', type: 'voice' },
  { id: 'reactivation-campaigns', icon: '🔁', title: 'Reactivation Campaigns', price: '₹14,999 / campaign', category: 'one-time', description: 'We call your dormant lead database quarterly. New pipeline with zero new ad spend.', type: 'voice' },
  { id: 'white-label-reseller', icon: '🏷️', title: 'White-Label Reseller', price: '₹49,999 setup + revenue share', category: 'one-time', description: 'Agencies and consultants: resell Autoniv under your brand with full support.', type: 'voice' }
];

const USERS = [
  {
    email: 'user@autoniv.ai',
    password: '$2a$12$hyy/4PQn/LPfgaChXlT6fuL6JJG8y6n6y3MXvCpz7TCgDxFmGmqPm',
    name: 'User',
    phoneNumber: '8921001100',
    role: 'user',
    company: 'user',
    plan: 'both_starter',
    isActive: true,
    isVerified: false,
    chatEnabled: true,
    chatPlan: 'chat_starter',
    voiceEnabled: true,
    voicePlan: 'voice_starter',
    apiKey: hashApiKey('ak_de0080bc576599ec6a05d54fb82f6b7905a8adc3c8f9b817'),
  },
  {
    email: 'admin@autoniv.ai',
    password: '$2a$12$XQ3Oj.C7NWuHjdF1DcTYLOYi0GwOn/WPCVUH0qMbr9Xs5CVy3dC0y',
    name: 'Admin',
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
  },
  {
    email: 'bhanupratap7530@gmail.com',
    password: '$2a$10$2DcaEhH8hnrdhHTf7qjSZOF3QSCOV3hagY6ZY7miU2OAfXrqp0Zwm',
    name: 'test01',
    phoneNumber: '7987656754',
    role: 'user',
    company: 'test01.com',
    plan: 'voice_free',
    isActive: true,
    isVerified: true,
    chatEnabled: false,
    chatPlan: 'chat_free',
    voiceEnabled: true,
    voicePlan: 'voice_free',
  },
  {
    email: 'tanu@gmail.com',
    password: '$2a$10$.jFOPrG/Rwq0jJa8Y9EAver3v3ThEBy6aDeEMHdprQ.r5djYPO6xS',
    name: 'tanu',
    phoneNumber: '7451211212',
    role: 'user',
    company: 'new',
    plan: 'free',
    isActive: true,
    isVerified: true,
    chatEnabled: true,
    chatPlan: 'chat_free',
    voiceEnabled: true,
    voicePlan: 'voice_free',
  },
  {
    email: 'tanishaborana970@gmail.com',
    password: '$2a$10$EgKlNkjYFfWmJZzkTZW6YeFdxVNVof40tLDe/Gz7LIpKgeXjJp2HS',
    name: 'tanu',
    phoneNumber: '7894554554',
    role: 'user',
    company: '',
    plan: 'free',
    isActive: true,
    isVerified: true,
    chatEnabled: true,
    chatPlan: 'chat_free',
    voiceEnabled: true,
    voicePlan: 'voice_free',
  },
  {
    email: 'admin2@autoniv.ai',
    password: '$2a$12$XQ3Oj.C7NWuHjdF1DcTYLOYi0GwOn/WPCVUH0qMbr9Xs5CVy3dC0y',
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
  },
  {
    email: 'vikasprasad2903@gmail.com',
    password: '$2a$10$NPZFwq.xP6gAvtav.jqn7u.zutYOTm33.TUDXQQIU5vZfMto5Cc8G',
    name: 'Vikas',
    phoneNumber: '7048922570',
    role: 'user',
    company: 'vikas',
    plan: 'chat_free',
    isActive: true,
    isVerified: false,
    chatEnabled: true,
    chatPlan: 'chat_free',
    voiceEnabled: false,
    voicePlan: 'none',
  }
];

async function seedAddOns() {
  console.log('🌱 Clearing existing add-ons...');
  await AddOn.deleteMany({});
  console.log('🌱 Seeding add-ons...');
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const addon of ADDONS) {
    const existing = await AddOn.findOne({ id: addon.id });
    if (!existing) {
      await AddOn.create(addon);
      inserted++;
      console.log(`  ➕ inserted: ${addon.id}`);
    } else {
      const dirty =
        existing.icon        !== addon.icon        ||
        existing.title       !== addon.title       ||
        existing.price       !== addon.price       ||
        existing.category    !== addon.category    ||
        existing.type        !== addon.type        ||
        existing.description !== addon.description;
      if (dirty) {
        await AddOn.updateOne({ id: addon.id }, { $set: addon });
        updated++;
        console.log(`  ✏️  updated:  ${addon.id}`);
      } else {
        skipped++;
        console.log(`  ⏭  unchanged: ${addon.id}`);
      }
    }
  }

  const total = await AddOn.countDocuments();
  console.log(`\n✅ AddOns done. Inserted: ${inserted}, Updated: ${updated}, Unchanged: ${skipped}, Total in DB: ${total}`);
}

async function seedUsers() {
  console.log('\n👤 Clearing existing users...');
  await User.deleteMany({});
  console.log('👤 Seeding users...');

  for (const user of USERS) {
    await User.create(user);
    console.log(`  ➕ inserted: ${user.email}`);
  }

  const total = await User.countDocuments();
  console.log(`\n✅ Users done. Total in DB: ${total}`);
}

async function main() {
  await connectDb();
  await seedAddOns();
  await seedUsers();
  await closeDb();
}

main()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error('❌ Seed failed:', err);
    try { await closeDb(); } catch {}
    process.exit(1);
  });
