import api, { type PaginationParams } from './api.base';

export const appointmentService = {
  getAll: (pp?: PaginationParams) =>
    api.get('/appointments', { params: pp }),

  getMy: (pp?: PaginationParams) =>
    api.get('/appointments/my', { params: pp }),

  update: (id: string, data: {
    name?: string;
    phone?: string;
    service?: string;
    preferredDate?: string;
    preferredTime?: string;
    status?: string;
  }) => api.put(`/appointments/${id}`, data),

  notifyWhatsApp: (id: string) =>
    api.post(`/appointments/${id}/notify-whatsapp`),
};
