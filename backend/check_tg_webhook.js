async function check() {
  const token = '8779809778:AAEc2wnFA4K_rAeL3RbffhZrU9sVCUXpVBU';
  const url = `https://api.telegram.org/bot${token}/getWebhookInfo`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('--- TELEGRAM WEBHOOK INFO ---');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to get webhook info:', err.message);
  }
}
check();
