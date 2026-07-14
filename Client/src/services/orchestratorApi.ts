/**
 * Frontend API additions for custom voice engine
 */

import api from './api';

export const agentService = {
  toggleCustomEngine: (agentId: string, useCustomEngine: boolean) =>
    api.patch(`/agents/${agentId}`, { useCustomEngine }),

  testVoiceCall: (agentId: string) =>
    api.post(`/agents/${agentId}/test-call`, {}),
};

export const orchestratorService = {
  getActiveCalls: () => api.get('/orchestrator/active-calls'),

  getLiveTranscript: (callSid: string) =>
    api.get(`/orchestrator/transcript/${callSid}`),
};
