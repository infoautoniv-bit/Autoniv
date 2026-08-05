import api, { type PaginationParams } from './api.base';

export const upgradeRequestService = {
  create: (requestedPlan: string) =>
    api.post('/upgrade-requests', { requestedPlan }),

  getMy: (pp?: PaginationParams) =>
    api.get('/upgrade-requests/my', { params: pp }),

  getAll: (status?: string, pp?: PaginationParams) =>
    api.get('/upgrade-requests', { params: { ...(status ? { status } : {}), ...pp } }),

  process: (id: string, status: 'approved' | 'rejected') =>
    api.put(`/upgrade-requests/${id}`, { status }),
};
