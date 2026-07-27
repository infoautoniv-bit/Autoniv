import express from 'express';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 4000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'autoniv_hmac_secret';

// Store received webhooks in-memory for testing
const webhookLogs = [];

// Middleware to capture raw body for HMAC verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));
app.use(express.urlencoded({ extended: true }));

/**
 * HMAC SHA-256 Webhook Verification Function
 */
function verifyAutonivSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) return { valid: false, reason: 'Missing X-Autoniv-Signature header' };

  // Signature format: t=timestamp,v1=hash
  const parts = signatureHeader.split(',');
  const timestampPart = parts.find(p => p.startsWith('t='));
  const hashPart = parts.find(p => p.startsWith('v1='));

  if (!timestampPart || !hashPart) {
    return { valid: false, reason: 'Invalid header format (expected t=timestamp,v1=hash)' };
  }

  const timestamp = timestampPart.split('=')[1];
  const expectedHash = hashPart.split('=')[1];

  const signaturePayload = `${timestamp}.${rawBody}`;
  const computedHash = crypto
    .createHmac('sha256', secret || WEBHOOK_SECRET)
    .update(signaturePayload)
    .digest('hex');

  const isValid = crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(expectedHash));
  return { valid: isValid, timestamp, computedHash, expectedHash };
}

// ─── Webhook Receiver Endpoint ──────────────────────────────────────────────
app.post('/api/webhooks/autoniv', (req, res) => {
  const signatureHeader = req.headers['x-autoniv-signature'];
  const eventType = req.headers['x-autoniv-event'] || 'unknown_event';
  const verification = verifyAutonivSignature(req.rawBody || JSON.stringify(req.body), signatureHeader, WEBHOOK_SECRET);

  const webhookEntry = {
    id: Date.now(),
    receivedAt: new Date().toISOString(),
    eventType,
    signatureHeader: signatureHeader || 'None',
    verificationStatus: verification.valid ? '✅ VERIFIED (Valid HMAC)' : `❌ FAILED (${verification.reason || 'Hash mismatch'})`,
    payload: req.body
  };

  webhookLogs.unshift(webhookEntry);

  console.log('\n======================================================');
  console.log(`📥 Webhook Received [${webhookEntry.eventType}] at ${webhookEntry.receivedAt}`);
  console.log(`🛡️  HMAC Status: ${webhookEntry.verificationStatus}`);
  console.log('📦 Candidate / Call Data:', JSON.stringify(req.body, null, 2));
  console.log('======================================================\n');

  res.status(200).json({
    success: true,
    message: 'Webhook received by Test HR CRM',
    verified: verification.valid
  });
});

// ─── Direct Trigger Call Proxy Endpoint ────────────────────────────────────
app.post('/api/trigger-test-call', async (req, res) => {
  const { apiKey, agentId, phone, name, context } = req.body;
  const targetUrl = req.body.targetUrl || 'http://localhost:3000/api/widget/call';

  try {
    const payload = {
      agentId: agentId || '6a648ccef2c53f9fd777e409',
      phone: phone || '+917489010144',
      name: name || 'Ankit Sharma',
      context: context || { jobRole: 'Senior React Developer', experience: '4 years' },
      webhookUrl: `http://localhost:${PORT}/api/webhooks/autoniv`
    };

    const apiRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey || 'ak_8adf33bf37b805ed344317164f4e0cc969e16396ebcac4df',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await apiRes.json();
    res.status(apiRes.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── API to get logs ────────────────────────────────────────────────────────
app.get('/api/logs', (req, res) => {
  res.json(webhookLogs);
});

// ─── Interactive Web Dashboard ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test HR CRM - Autoniv Integration</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen p-8 font-sans">
  <div class="max-w-5xl mx-auto space-y-8">
    <div class="flex items-center justify-between border-b border-slate-800 pb-6">
      <div>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          🏦 Mock HR CRM Testing Dashboard
        </h1>
        <p class="text-slate-400 text-sm mt-1">Testing endpoint: <code class="bg-slate-800 text-cyan-300 px-2 py-1 rounded">http://localhost:${PORT}/api/webhooks/autoniv</code></p>
      </div>
      <span class="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live Webhook Listener Active
      </span>
    </div>

    <!-- Quick Trigger Card -->
    <div class="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 shadow-xl space-y-4">
      <h2 class="text-xl font-semibold text-slate-200">📞 Trigger Outbound Candidate Screening Call</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-400 uppercase mb-1">API Key</label>
          <input id="apiKey" value="ak_8adf33bf37b805ed344317164f4e0cc969e16396ebcac4df" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-400 uppercase mb-1">Agent ID</label>
          <input id="agentId" value="6a648ccef2c53f9fd777e409" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-400 uppercase mb-1">Candidate Phone</label>
          <input id="phone" value="+917489010144" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-400 uppercase mb-1">Candidate Name</label>
          <input id="name" value="Ankit Sharma" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200">
        </div>
      </div>
      <button onclick="triggerCall()" class="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium py-2.5 rounded-lg transition-all shadow-lg shadow-blue-500/20 active:scale-[0.99]">
        🚀 Send Screening Call Request to Autoniv
      </button>
      <div id="triggerResult" class="hidden text-sm p-3 rounded-lg border"></div>
    </div>

    <!-- Webhook Logs Section -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-slate-200">📥 Post-Call Webhook Results Received</h2>
        <button onclick="fetchLogs()" class="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300">
          🔄 Refresh Logs
        </button>
      </div>
      <div id="logsContainer" class="space-y-3">
        <div class="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
          No webhooks received yet. Trigger a call above or use cURL to test.
        </div>
      </div>
    </div>
  </div>

  <script>
    async function triggerCall() {
      const resBox = document.getElementById('triggerResult');
      resBox.className = "text-sm p-3 rounded-lg border bg-slate-800 text-slate-300 border-slate-700 block";
      resBox.innerHTML = "Sending request...";
      try {
        const res = await fetch('/api/trigger-test-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: document.getElementById('apiKey').value,
            agentId: document.getElementById('agentId').value,
            phone: document.getElementById('phone').value,
            name: document.getElementById('name').value,
          })
        });
        const data = await res.json();
        resBox.className = res.ok ? "text-sm p-3 rounded-lg border bg-emerald-950/40 border-emerald-500/30 text-emerald-300 block" : "text-sm p-3 rounded-lg border bg-rose-950/40 border-rose-500/30 text-rose-300 block";
        resBox.innerHTML = "<strong>Response (" + res.status + "):</strong><pre class='mt-1 text-xs overflow-x-auto'>" + JSON.stringify(data, null, 2) + "</pre>";
      } catch (err) {
        resBox.className = "text-sm p-3 rounded-lg border bg-rose-950/40 border-rose-500/30 text-rose-300 block";
        resBox.innerHTML = "Error: " + err.message;
      }
    }

    async function fetchLogs() {
      try {
        const res = await fetch('/api/logs');
        const logs = await res.json();
        const container = document.getElementById('logsContainer');
        if (!logs.length) return;
        container.innerHTML = logs.map(function(item) {
          var isVerified = item.verificationStatus && item.verificationStatus.indexOf('VERIFIED') !== -1;
          var badgeClass = isVerified ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
          return '<div class="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-3">' +
            '<div class="flex items-center justify-between text-xs border-b border-slate-700/60 pb-3">' +
              '<span class="font-mono text-cyan-400">' + item.receivedAt + '</span>' +
              '<span class="font-semibold px-2 py-0.5 rounded ' + badgeClass + '">' + item.verificationStatus + '</span>' +
            '</div>' +
            '<div class="text-xs text-slate-400 font-mono">Signature Header: ' + item.signatureHeader + '</div>' +
            '<pre class="bg-slate-900 p-4 rounded-lg text-xs text-emerald-400 overflow-x-auto font-mono">' + JSON.stringify(item.payload, null, 2) + '</pre>' +
          '</div>';
        }).join('');
      } catch (_) {}
    }

    setInterval(fetchLogs, 3000);
    fetchLogs();
  </script>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log(`
┌────────────────────────────────────────────────────────────┐
│ 🚀 Mock HR CRM Testing Server Running!                    │
│                                                            │
│ 🌐 Dashboard: http://localhost:${PORT}                       │
│ 📥 Webhook Endpoint: http://localhost:${PORT}/api/webhooks/autoniv
└────────────────────────────────────────────────────────────┘
  `);
});
