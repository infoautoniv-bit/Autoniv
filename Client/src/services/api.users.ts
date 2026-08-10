import api from './api.base';

export const userService = {
  getAll: (period?: string, pp?: { page?: number; limit?: number }) =>
    api.get('/users', { params: { ...(period ? { period } : {}), ...pp } }),

  create: (data: {
    name: string;
    email: string;
    password: string;
    company?: string;
    plan?: string;
    chatPlan?: string;
    voicePlan?: string;
    phoneNumber?: string;
    chatEnabled?: boolean;
    voiceEnabled?: boolean;
  }) => api.post('/users', data),

  update: (id: string, data: {
    name?: string;
    email?: string;
    company?: string;
    plan?: string;
    chatPlan?: string;
    voicePlan?: string;
    phoneNumber?: string;
    chatEnabled?: boolean;
    voiceEnabled?: boolean;
  }) => api.put(`/users/${id}`, data),

  delete: (id: string) => api.delete(`/users/${id}`),

  toggleBlock: (id: string, isActive: boolean) =>
    api.put(`/users/${id}/block`, { isActive }),

  upgradePlan: (id: string, plan: string, chatPlan?: string, voicePlan?: string) =>
    api.put(`/users/${id}/plan`, { plan, chatPlan, voicePlan }),
};
