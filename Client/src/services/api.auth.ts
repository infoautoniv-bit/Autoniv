import api, { resetCsrfToken } from './api.base';
import { getCookie, deleteCookie } from './cookies';

export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  googleLogin: (credential: string) =>
    api.post('/auth/google', { credential }),

  register: (data: {
    name: string;
    email: string;
    password: string;
    company?: string;
    phoneNumber?: string;
  }) => api.post('/auth/register', data),

  me: () => api.get('/auth/me'),

  planStatus: () => api.get('/auth/plan-status'),

  logout: async () => {
    const refreshToken = getCookie('refreshToken');
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // Ignore — clear session regardless
    } finally {
      deleteCookie('accessToken');
      deleteCookie('refreshToken');
      sessionStorage.removeItem('user');
      resetCsrfToken();
    }
  },

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  getDashboardStats: () =>
    api.get('/auth/dashboard-stats'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (email: string, password: string, otp: string) =>
    api.post('/auth/reset-password', { email, password, otp }),

  verifyOtp: (email: string, otp: string, purpose: 'register' | 'login') =>
    api.post('/auth/verify-otp', { email, otp, purpose }),

  resendOtp: (email: string, purpose: 'register' | 'login' | 'reset_password') =>
    api.post('/auth/resend-otp', { email, purpose }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};
