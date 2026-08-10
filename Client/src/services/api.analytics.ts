import api from './api.base';

export const analyticsService = {
  overview: () => api.get('/analytics/overview'),

  myStats: () => api.get('/analytics/my-stats'),

  usage: (period?: '7d' | '30d' | '90d') =>
    api.get('/analytics/usage', { params: { period } }),

  trends: (period?: '7d' | '30d' | '90d') =>
    api.get('/analytics/trends', { params: { period } }),

  periodOverview: (period?: '7d' | '30d' | '90d') =>
    api.get('/analytics/period-overview', { params: { period } }),
};
