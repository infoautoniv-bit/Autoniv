async function setWebhook() {
  const token = '8779809778:AAEc2wnFA4K_rAeL3RbffhZrU9sVCUXpVBU';
  const webhookUrl = 'https://mgery-49-43-6-103.run.pinggy-free.link/api/webhooks/telegram/6a5b165ff0f4f39a80d8efa1';
  const url = `https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('--- TELEGRAM SET WEBHOOK RESULT ---');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to set webhook:', err.message);
  }
}
setWebhook();
