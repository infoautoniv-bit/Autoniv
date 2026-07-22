import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { log } from './logger.js';

const planEmitter = new EventEmitter();
planEmitter.setMaxListeners(100);

const connectedUsers = new Map();

export function registerPlanWs(ws, userId) {
  connectedUsers.set(userId, ws);
  log.info('plan_ws_connected', { userId: String(userId) });

  ws.on('close', () => {
    connectedUsers.delete(userId);
    log.info('plan_ws_disconnected', { userId: String(userId) });
  });

  ws.on('error', () => {
    connectedUsers.delete(userId);
  });
}

export function notifyPlanChange(userId, planData) {
  planEmitter.emit('planChanged', userId, planData);

  const ws = connectedUsers.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify({
        type: 'planChanged',
        plan: planData.plan,
        chatPlan: planData.chatPlan,
        voicePlan: planData.voicePlan,
        chatEnabled: planData.chatEnabled,
        voiceEnabled: planData.voiceEnabled,
        callsLimit: planData.callsLimit,
        minutesLimit: planData.minutesLimit,
        chatLimit: planData.chatLimit,
      }));
      log.info('plan_ws_notified', { userId: String(userId), plan: planData.plan });
    } catch (err) {
      log.error('plan_ws_send_error', { userId: String(userId), error: err.message });
    }
  }
}

export { planEmitter };
