const API_KEY = process.env.API_KEY || 'ak_8adf33bf37b805ed344317164f4e0cc969e16396ebcac4df';
const AGENT_ID = process.env.AGENT_ID || '6a648ccef2c53f9fd777e409';
const PHONE = process.env.PHONE || '+917489010144';
const NAME = process.env.NAME || 'Ankit Sharma';
const AUTONIV_URL = process.env.AUTONIV_URL || 'http://localhost:3000/api/widget/call';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:4000/api/webhooks/autoniv';

async function triggerCall() {
  console.log('🚀 Triggering test candidate screening call via Autoniv API...');
  console.log(`📞 Candidate Phone: ${PHONE}`);
  console.log(`👤 Candidate Name:  ${NAME}`);
  console.log(`🔑 API Key:         ${API_KEY}`);
  console.log(`🤖 Agent ID:        ${AGENT_ID}`);
  console.log(`🌐 Target Endpoint: ${AUTONIV_URL}\n`);

  try {
    const response = await fetch(AUTONIV_URL, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agentId: AGENT_ID,
        phone: PHONE,
        name: NAME,
        context: {
          jobRole: 'Senior React Developer',
          experience: '4 years'
        },
        webhookUrl: WEBHOOK_URL
      })
    });

    const status = response.status;
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch (_) { data = text; }

    console.log(`STATUS CODE: ${status}`);
    console.log('RESPONSE:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Call successfully queued/initiated!');
      console.log(`📥 Post-call results will be delivered to: ${WEBHOOK_URL}`);
    } else {
      console.log('\n❌ Call initiation failed. Check error above.');
    }
  } catch (error) {
    console.error('\n❌ Network or Connection Error:', error.message);
  }
}

triggerCall();
