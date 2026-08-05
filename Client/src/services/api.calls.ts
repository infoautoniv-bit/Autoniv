import api, { type PaginationParams } from './api.base';

export const callService = {
  getAll: (params?: { status?: string; limit?: number } & PaginationParams) =>
    api.get('/calls', { params }),

  getMy: (params?: { status?: string; limit?: number } & PaginationParams) =>
    api.get('/calls/my', { params }),

  getOne: (id: string) => api.get(`/calls/${id}`),

  sync: () => api.post('/calls/sync'),

  syncMy: () => api.post('/calls/sync-my'),

  outbound: (agentId: string, phoneNumber: string) =>
    api.post('/calls/outbound', { agentId, phoneNumber }),

  delete: (id: string) => api.delete(`/calls/${id}`),
};
