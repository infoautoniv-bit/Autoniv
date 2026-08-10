import api, { type PaginationParams } from './api.base';

export const bulkCallService = {
  create: (data: { agentId: string; name: string; numbers: { phone: string; name?: string }[]; concurrency?: number; delayMs?: number }) =>
    api.post('/bulk-calls', data),

  getMy: (params?: PaginationParams) =>
    api.get('/bulk-calls/my', { params }),

  getOne: (id: string) => api.get(`/bulk-calls/${id}`),

  start: (id: string) => api.post(`/bulk-calls/${id}/start`),

  pause: (id: string) => api.post(`/bulk-calls/${id}/pause`),

  cancel: (id: string) => api.post(`/bulk-calls/${id}/cancel`),

  delete: (id: string) => api.delete(`/bulk-calls/${id}`),
};
