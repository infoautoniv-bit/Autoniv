import 'dotenv/config';
import { connectDb } from './db/connection.js';
import Chatbot from './db/models/Chatbot.js';
import { decrypt } from './services/encryption.js';

async function fixTelegramWebhooks() {
  try {
    await connectDb();
    console.log('Connected to database');

    // Get server URL from environment or use default production URL
    const serverUrl = process.env.WEBHOOK_URL?.replace('/api/webhooks/vapi', '') || 
                     'https://autoniv-l5rl.onrender.com';
    
    console.log(`Using server URL: ${serverUrl}`);

    // Find all chatbots with Telegram enabled
    const telegramBots = await Chatbot.find({
      'channels.telegram.enabled': true,
      'channels.telegram.token': { $exists: true, $ne: null }
    });

    console.log(`Found ${telegramBots.length} Telegram bots to update`);

    for (const bot of telegramBots) {
      console.log(`\nUpdating webhook for bot: ${bot.name} (${bot._id})`);
      
      try {
        // Decrypt the token
        const encryptedToken = bot.channels.telegram.token;
        const token = decrypt(encryptedToken);
        
        if (!token) {
          console.log(`  ❌ Failed to decrypt token for ${bot.name}`);
          continue;
        }

        // Set webhook URL
        const webhookUrl = `${serverUrl}/api/webhooks/telegram/${bot._id}`;
        const setWebhookUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}`;
        
        console.log(`  Setting webhook: ${webhookUrl}`);
        
        const response = await fetch(setWebhookUrl);
        const result = await response.json();
        
        if (result.ok) {
          console.log(`  ✅ Webhook updated successfully`);
        } else {
          console.log(`  ❌ Failed to update webhook: ${result.description}`);
        }
        
        // Also get webhook info to verify
        const getWebhookUrl = `https://api.telegram.org/bot${token}/getWebhookInfo`;
        const infoResponse = await fetch(getWebhookUrl);
        const webhookInfo = await infoResponse.json();
        
        if (webhookInfo.ok) {
          console.log(`  Current webhook: ${webhookInfo.result.url}`);
          console.log(`  Pending updates: ${webhookInfo.result.pending_update_count}`);
        }
        
      } catch (err) {
        console.error(`  ❌ Error updating ${bot.name}: ${err.message}`);
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n✅ Telegram webhook update completed');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

fixTelegramWebhooks();