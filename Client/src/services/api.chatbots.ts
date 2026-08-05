import api, { type PaginationParams } from './api.base';

export const chatbotService = {
  list: (pp?: PaginationParams) =>
    api.get('/chatbots', { params: pp }),

  get: (id: string) =>
    api.get(`/chatbots/${id}`),

  create: (data: {
    name: string;
    description?: string;
    systemPrompt: string;
    welcomeMessage?: string;
    brandColor?: string;
    channels?: {
      whatsapp?: { enabled?: boolean; phoneNumberId?: string };
      widget?: { enabled?: boolean };
    };
  }) => api.post('/chatbots', data),

  update: (id: string, data: {
    name?: string;
    description?: string;
    systemPrompt?: string;
    welcomeMessage?: string;
    brandColor?: string;
    brandLogo?: string;
    isActive?: boolean;
    channels?: {
      whatsapp?: { enabled?: boolean; phoneNumberId?: string };
      widget?: { enabled?: boolean };
    };
  }) => api.put(`/chatbots/${id}`, data),

  delete: (id: string) => api.delete(`/chatbots/${id}`),

  conversations: (id: string, pp?: PaginationParams) =>
    api.get(`/chatbots/${id}/conversations`, { params: pp }),

  analytics: (id: string) =>
    api.get(`/chatbots/${id}/analytics`),

  connectWhatsapp: (id: string, data: { code: string; wabaId: string; phoneNumberId?: string }) =>
    api.post('/whatsapp/connect', { chatbotId: id, ...data }),

  disconnectWhatsapp: (id: string) =>
    api.post('/whatsapp/disconnect', { chatbotId: id }),
};
