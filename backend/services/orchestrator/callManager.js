import { log } from '../logger.js';

class CallManager {
  constructor() {
    this.activeCalls = new Map(); // agentId → Set<callSid>
    this.totalCalls = 0;
    this.maxTotalCalls = 50; // global limit
    this.waitQueue = []; // pending call requests
  }

  canAcceptCall(agentId, maxConcurrent = 1) {
    const agentCalls = this.activeCalls.get(agentId) || new Set();
    if (agentCalls.size >= maxConcurrent) {
      log.warn('concurrent_call_limit_reached', { agentId, active: agentCalls.size, limit: maxConcurrent });
      return false;
    }
    if (this.totalCalls >= this.maxTotalCalls) {
      log.warn('global_call_limit_reached', { total: this.totalCalls, limit: this.maxTotalCalls });
      return false;
    }
    return true;
  }

  registerCall(agentId, callSid) {
    if (!this.activeCalls.has(agentId)) {
      this.activeCalls.set(agentId, new Set());
    }
    this.activeCalls.get(agentId).add(callSid);
    this.totalCalls++;
    log.info('call_registered', { agentId, callSid, agentActive: this.activeCalls.get(agentId).size, totalActive: this.totalCalls });
  }

  unregisterCall(agentId, callSid) {
    const agentCalls = this.activeCalls.get(agentId);
    if (agentCalls) {
      agentCalls.delete(callSid);
      if (agentCalls.size === 0) {
        this.activeCalls.delete(agentId);
      }
    }
    this.totalCalls = Math.max(0, this.totalCalls - 1);
    log.info('call_unregistered', { agentId, callSid, totalActive: this.totalCalls });
  }

  getActiveCallCount(agentId) {
    const agentCalls = this.activeCalls.get(agentId);
    return agentCalls ? agentCalls.size : 0;
  }

  getTotalActiveCalls() {
    return this.totalCalls;
  }

  getStats() {
    const stats = { total: this.totalCalls, perAgent: {} };
    for (const [agentId, calls] of this.activeCalls) {
      stats.perAgent[agentId] = calls.size;
    }
    return stats;
  }
}

export const callManager = new CallManager();
