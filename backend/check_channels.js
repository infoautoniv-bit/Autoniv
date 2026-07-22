import 'dotenv/config';
import { connectDb } from './db/connection.js';
import Chatbot from './db/models/Chatbot.js';

async function run() {
  await connectDb();
  const chatbot = await Chatbot.findById('6a5b165ff0f4f39a80d8efa1').lean();
  if (chatbot) {
    console.log('--- CHATBOT CHANNELS CONFIG ---');
    console.log('Telegram config:', JSON.stringify(chatbot.channels?.telegram || {}, null, 2));
    console.log('Facebook config:', JSON.stringify(chatbot.channels?.facebook || {}, null, 2));
    console.log('WhatsApp config:', JSON.stringify(chatbot.channels?.whatsapp || {}, null, 2));
  } else {
    console.error('Chatbot not found!');
  }
  process.exit(0);
}
run();
