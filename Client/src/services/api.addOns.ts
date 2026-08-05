import api, { type PaginationParams } from './api.base';

export const addOnService = {
  getCatalog: () => api.get('/add-ons/catalog'),

  getMy: (pp?: PaginationParams) =>
    api.get('/add-ons/my', { params: pp }),

  request: (addOnId: string, notes?: string) =>
    api.post('/add-ons', { addOnId, notes }),

  cancel: (id: string) => api.delete(`/add-ons/${id}`),

  getAll: (status?: string, pp?: PaginationParams) =>
    api.get('/add-ons', { params: { ...(status ? { status } : {}), ...pp } }),

  process: (id: string, status: 'approved' | 'rejected') =>
    api.put(`/add-ons/${id}`, { status }),

  createCatalogEntry: (data: {
    id: string;
    icon?: string;
    title: string;
    price: string;
    category?: string;
    description?: string;
    type?: 'chat' | 'voice';
  }) => api.post('/add-ons/catalog', data),
};
