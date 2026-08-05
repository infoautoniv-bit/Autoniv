import api, { type PaginationParams } from './api.base';

export const agentService = {
  getAll: (pp?: PaginationParams) =>
    api.get('/agents', { params: pp }),

  getMy: (pp?: PaginationParams) =>
    api.get('/agents/my', { params: pp }),

  create: (data: {
    name: string;
    type: string;
    prompt?: string;
    language?: string;
    voiceId?: string;
    useCustomEngine?: boolean;
    customEngineModel?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
  }) => api.post('/agents', data),

  update: (id: string, data: {
    name: string;
    type?: string;
    prompt?: string;
    isActive: boolean;
    language?: string;
    voiceId?: string;
    useCustomEngine?: boolean;
    customEngineModel?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
  }) => api.put(`/agents/${id}`, data),

  toggleActive: (id: string, isActive: boolean) =>
    api.put(`/agents/${id}`, { isActive }),

  delete: (id: string) => api.delete(`/agents/${id}`),

  assignPhone: (id: string, phoneNumberId: string, phoneNumber?: string, twilioAccountSid?: string, twilioAuthToken?: string) =>
    api.post(`/agents/${id}/assign-phone`, { phoneNumberId, phoneNumber, twilioAccountSid, twilioAuthToken }),

  getPhoneNumbers: () =>
    api.get('/agents/phone-numbers'),

  createPhoneNumber: (data: {
    provider: string;
    number: string;
    assistantId?: string;
    name?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioApiKey?: string;
    twilioApiSecret?: string;
    vonageApiKey?: string;
    vonageApiSecret?: string;
    telnyxApiKey?: string;
    sipGateway?: string;
    sipUsername?: string;
    sipPassword?: string;
    sipTransport?: string;
  }) => api.post('/agents/phone-numbers', data),

  unlinkPhone: (id: string) =>
    api.post(`/agents/${id}/unlink-phone`),
};
