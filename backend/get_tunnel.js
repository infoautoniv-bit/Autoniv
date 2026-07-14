import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Launching pinggy.link tunnel...');

const ssh = spawn('ssh', [
  '-p', '443',
  '-o', 'StrictHostKeyChecking=no',
  '-o', 'UserKnownHostsFile=NUL',
  '-o', 'ServerAliveInterval=30',
  '-R0:localhost:3000',
  'free.pinggy.io'
]);

ssh.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);

  // Look for https://....pinggy.link
  const match = output.match(/https:\/\/[a-z0-9.-]+\.pinggy-(?:free\.link|net)/);
  if (match) {
    const url = match[0];
    console.log(`\n\n🎉 Found Tunnel URL: ${url}`);
    
    // Read and update .env
    const envPath = path.resolve('.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Replace WEBHOOK_URL line
      envContent = envContent.replace(
        /WEBHOOK_URL=https:\/\/.*?\/api\/webhooks\/vapi/,
        `WEBHOOK_URL=${url}/api/webhooks/vapi`
      );
      
      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log(`✅ Updated .env with new WEBHOOK_URL: ${url}/api/webhooks/vapi`);
    } else {
      console.warn('⚠️  .env file not found!');
    }
  }
});

ssh.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

ssh.on('close', (code) => {
  console.log(`\n❌ Tunnel process exited with code ${code}`);
});
