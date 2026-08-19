import { WebSocketServer } from 'ws';
import { handleTwilioStream } from './twilioHandler.js';
import { handleExotelStream } from './exotelHandler.js';
import { handleWebCall } from './webCallHandler.js';
import { handleTelnyxStream } from './telnyxHandler.js';
import { handlePlivoStream } from './plivoHandler.js';
import { handleAsteriskStream } from './asteriskAriHandler.js';
import { verifyMediaStreamToken } from '../auth/mediaStreamToken.js';
import { log } from '../logger.js';
import { callManager } from './callManager.js';
import { llmQueue } from './llmQueue.js';
import { getTTSCacheStats } from '../speech/ttsCache.js';

export function initOrchestrator(server) {
  const wss = new WebSocketServer({ server, maxPayload: 64 * 1024 });

  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.isAlive === false) {
        log.warn('websocket_heartbeat_timeout_closing_gracefully');
        try {
          if (ws.readyState === 1) {
            ws.close(1000, 'Ping timeout');
          } else {
            ws.terminate();
          }
        } catch (_) {}
        continue;
      }
      ws.isAlive = false;
      try { ws.ping(); } catch (_) {}
    }
  }, 30000);
  if (typeof heartbeat.unref === 'function') heartbeat.unref();
  wss.on('close', () => clearInterval(heartbeat));

  wss.on('connection', async (ws, req) => {
    ws.isAlive = true;
    ws.on('ping', () => { ws.isAlive = true; });
    ws.on('pong', () => { ws.isAlive = true; });
    ws.on('message', () => { ws.isAlive = true; });

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const urlPath = parsedUrl.pathname;
    const agentId = parsedUrl.searchParams.get('agentId');
    log.info('websocket_connection_request', { path: urlPath, agentId });

    if (urlPath === '/media-stream') {
      const token = parsedUrl.searchParams.get('token') || parsedUrl.searchParams.get('amp;token');
      log.info('websocket_debug', { agentId: agentId || 'deferred_in_start_event', hasToken: Boolean(token), path: urlPath });
      if (agentId && token && !verifyMediaStreamToken(agentId, token)) {
        log.warn('websocket_token_verification_failed_deferred', { agentId });
      }
      handleTwilioStream(ws, agentId);
    } else if (urlPath === '/web-call') {
      handleWebCall(ws, req);
    } else if (urlPath === '/exotel-stream') {
      handleExotelStream(ws);
    } else if (urlPath === '/telnyx-stream') {
      handleTelnyxStream(ws, agentId);
    } else if (urlPath === '/plivo-stream') {
      handlePlivoStream(ws, agentId);
    } else if (urlPath === '/asterisk-stream') {
      handleAsteriskStream(ws, agentId);
    } else {
      ws.close(4004, 'Not Found');
    }
  });

  log.info('orchestrator_initialized', {
    handlers: ['/media-stream', '/web-call', '/exotel-stream', '/telnyx-stream', '/plivo-stream', '/asterisk-stream'],
  });
}

export function getOrchestratorStats() {
  return {
    calls: callManager.getStats(),
    llmQueue: llmQueue.getStats(),
    ttsCache: getTTSCacheStats(),
    websocketConnections: 0,
  };
}
