import 'dotenv/config';
import WebSocket from 'ws';
import { signMediaStreamToken } from '../services/mediaStreamToken.js';

async function testDeployedFix() {
  const agentId = '6a47da20d4526af213bb25a8';
  // Sign a valid token locally
  const token = signMediaStreamToken(agentId);
  if (!token) {
    console.error('❌ Failed to sign media stream token locally (check JWT_SECRET)');
    return;
  }

  // Construct URL with literal &amp;token (to test the amp;token key parsing)
  const url = `wss://autonivweb-1.onrender.com/media-stream?agentId=${agentId}&amp;token=${token}`;
  console.log('Connecting to:', url);

  const ws = new WebSocket(url);

  ws.on('open', () => {
    console.log('✅ SUCCESS: Connection accepted! The deployed server is running the updated orchestrator code.');
    ws.close();
  });

  ws.on('unexpected-response', (req, res) => {
    console.log(`❌ FAILED: Unexpected response status = ${res.statusCode}`);
    if (res.statusCode === 401) {
      console.log('👉 Render is still running the OLD orchestrator code (token validation failed).');
    }
  });

  ws.on('error', (err) => {
    console.error('Connection error:', err.message);
  });

  ws.on('close', (code, reason) => {
    console.log(`Connection closed: Code = ${code}, Reason = ${reason}`);
  });
}

testDeployedFix().catch(console.error);
