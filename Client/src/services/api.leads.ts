import api, { type PaginationParams } from './api.base';

export const leadService = {
  /** Admin: all real-user / call leads (excludes AI-assistant public leads) */
  getAll: (pp?: PaginationParams) =>
    api.get('/leads', { params: pp }),

  /** Admin: AI-assistant widget leads only (dummy userId) */
  getPublic: (pp?: PaginationParams) =>
    api.get('/leads/public-leads', { params: pp }),

  /** Authenticated user: their own leads only */
  getMy: (pp?: PaginationParams) =>
    api.get('/leads/my', { params: pp }),

  /** Authenticated user / agent call: create a call lead */
  create: (data: {
    agentId?: string;
    callId?: string;
    name?: string;
    phone?: string;
    email?: string;
    purpose?: string;
    notes?: string;
  }) => api.post('/leads', data),

  /** Authenticated user: update notes/status on their lead */
  update: (id: string, data: { notes?: string; status?: string }) =>
    api.put(`/leads/${id}`, data),

  /** Authenticated user: export their leads as CSV */
  export: () =>
    api.get('/leads/export', { responseType: 'blob' }),
};

export const publicLeadService = {
  submit: (data: {
    name: string;
    phone: string;
    email: string;
    purpose: string;
    notes?: string;
  }) =>
    import('./api.base').then(({ BASE_URL }) =>
      import('axios').then(({ default: axios }) =>
        axios.post(
          `${BASE_URL}/leads/public`,
          data,
          { headers: { 'Content-Type': 'application/json' } },
        )
      )
    ),
};
