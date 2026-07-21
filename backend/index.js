import 'dotenv/config'; // reload env

import express from 'express';
import compression from 'compression';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import WebSocket from 'ws';

import { connectDb } from './db/connection.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import agentRoutes from './routes/agents.js';
// import chatbotRoutes from './routes/chatbots.js';
import callRoutes from './routes/calls.js';
import leadRoutes from './routes/leads.js';
import webhookRoutes from './routes/webhooks.js';
import analyticsRoutes from './routes/analytics.js';
import upgradeRequestRoutes from './routes/upgradeRequests.js';
import appointmentRoutes from './routes/appointments.js';
import addOnRoutes from './routes/addOns.js';
import chatRoutes from './routes/chat.js';
import agentChatRoutes from './routes/agentChat.js';
import userChatRoutes from './routes/userChat.js';
import vapiProxy from './services/vapiProxy.js';
import publicLeadRoutes from './routes/publicLead.js';
import publicDemoRoutes from './routes/publicDemo.js';
import contactRoutes from './routes/contact.js';
import supportRoutes from './routes/support.js';
import chatbotRoutes from './routes/chatbots.js';
import chatbotWidgetRoutes from './routes/chatbotWidget.js';
import reportRoutes from './routes/reports.js';
import chatHistoryRoutes from './routes/chatHistory.js';
import widgetRoutes from './routes/widget.js';
import ttsRoutes from './routes/tts.js';
import whatsappWebhookRoutes from './routes/whatsappWebhook.js';
import whatsappConnectRoutes from './routes/whatsappConnect.js';
import bulkCallRoutes from './routes/bulkCalls.js';
import phoneNumberRoutes from './routes/phoneNumbers.js';
import { initOrchestrator } from './services/orchestrator.js';
import { syncWebhookUrls } from './services/vapi.js';
import { registerPlanWs } from './services/planNotifier.js';
import { verifyAccessToken } from './services/tokenService.js';

import {
  buildCors,
  buildHelmet,
  mongoSanitizer,
  hppGuard,
  csrfProtection,
  csrfTokenEndpoint,
} from './middleware/security.js';
import { globalLimiter } from './middleware/rateLimiters.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestIdMiddleware } from './services/crypto.js';
import { requestLogger } from './middleware/requestLogger.js';
import { IS_PROD, log } from './services/logger.js';
import './services/orchestratorHandlers.js';

const PORT = Number(process.env.PORT) || 3000;
const app = express();

if (process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

function assertSecret(name) {
  const v = process.env[name];
  if (!v && IS_PROD) {
    log.fatal('startup_missing_secret', { secret: name });
    process.exit(1);
  }
  return v;
}

assertSecret('JWT_SECRET');
assertSecret('MONGODB_URI');
assertSecret('VAPI_API_KEY');

app.disable('x-powered-by');
app.disable('etag');

app.use(requestIdMiddleware());

// Prevent search bots from indexing API endpoints
app.use((req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  next();
});

app.use(buildHelmet());
app.use(buildCors());
app.options('*', buildCors());

// Routes that need the raw request body (for provider signature verification).
const RAW_BODY_PATHS = new Set(['/api/webhooks/vapi', '/api/webhooks/whatsapp']);

app.use((req, res, next) => {
  if (RAW_BODY_PATHS.has(req.path)) {
    return express.text({ type: '*/*', limit: '1mb' })(req, res, () => {
      try {
        if (typeof req.body === 'string' && req.body.length > 0) {
          req.rawBody = Buffer.from(req.body, 'utf8');
          req.body = JSON.parse(req.body);
        }
        // ✅ removed the else — don't wipe req.body if it's already parsed
        next();
      } catch (e) {
        return res.status(400).json({ message: 'Invalid JSON body' });
      }
    });
  }
  return express.json({ limit: '256kb', strict: true })(req, res, next);
});

app.use(express.urlencoded({ extended: false, limit: '32kb' }));
app.use(cookieParser());
app.use(compression());

app.use(mongoSanitizer);
app.use(hppGuard);
app.use(globalLimiter);
app.use(csrfProtection);

app.use('/api', (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
  }
  next();
});

app.use(requestLogger());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Vapi API' });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.get('/api/csrf-token', csrfTokenEndpoint);

app.use('/api/recordings', express.static('recordings'));
app.use('/api/vapi', vapiProxy);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/agents/public/demo', publicDemoRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/leads/public', publicLeadRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/webhooks/whatsapp', whatsappWebhookRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upgrade-requests', upgradeRequestRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/add-ons', addOnRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/agent-chat', agentChatRoutes);
app.use('/api/user-chat', userChatRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/chatbots', chatbotRoutes);
app.use('/api/whatsapp', whatsappConnectRoutes);
app.use('/api/chatbot-widget', chatbotWidgetRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chat-history', chatHistoryRoutes);
app.use('/api/widget', widgetRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/bulk-calls', bulkCallRoutes);
app.use('/api/phone-numbers', phoneNumberRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

(async () => {
  try {
    await connectDb();

    // Sync VAPI assistant webhook URLs on startup
    try {
      const syncResult = await syncWebhookUrls();
      log.info('vapi_webhook_sync_result', syncResult);
    } catch (err) {
      log.warn('vapi_webhook_sync_startup_failed', { error: err.message });
    }

    const server = app.listen(PORT, () => {
      log.info('server_started', { port: PORT, env: process.env.NODE_ENV || 'development' });

      // Initialize custom voice orchestrator (WebSocket handlers)
      try {
        initOrchestrator(server);
        log.info('orchestrator_initialized', { endpoints: ['/media-stream', '/web-call'] });
      } catch (err) {
        log.warn('orchestrator_init_failed', { error: err.message });
      }

      // Plan update WebSocket — /ws/plan?token=<jwt>
      const planWss = new WebSocket.Server({ noServer: true });
      planWss.on('connection', (ws, req) => {
        const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
        const token = parsedUrl.searchParams.get('token');
        try {
          const decoded = verifyAccessToken(token);
          if (!decoded || !decoded.userId) {
            ws.close(4401, 'Unauthorized');
            return;
          }
          registerPlanWs(ws, decoded.userId);
        } catch {
          ws.close(4401, 'Unauthorized');
        }
      });

      server.on('upgrade', (request, socket, head) => {
        const { pathname } = new URL(request.url, `http://${request.headers.host}`);
        if (pathname === '/ws/plan') {
          planWss.handleUpgrade(request, socket, head, (ws) => {
            planWss.emit('connection', ws, request);
          });
        }
      });

      log.info('plan_ws_initialized', { endpoint: '/ws/plan' });
    });

    function shutdown(signal) {
      log.info('shutdown', { signal });
      server.close(() => {
        mongoose.connection.close().finally(() => process.exit(0));
      });
      setTimeout(() => process.exit(1), 10000).unref();
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (err) => {
      log.fatal('unhandled_rejection', { error: err?.message });
    });
    process.on('uncaughtException', (err) => {
      log.fatal('uncaught_exception', { error: err?.message });
    });
  } catch (err) {
    log.fatal('startup_failed', { error: err.message });
    process.exit(1);
  }
})();
