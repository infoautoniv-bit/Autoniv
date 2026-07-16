import axios from 'axios';
import { getCookie, setCookie, deleteCookie } from './cookies';

const REQUEST_TIMEOUT_MS = 30000;
const TOKEN_REFRESH_BUFFER_MS = 30_000;

// ─── CSRF Token Management ──────────────────────────────────────────────────
let csrfToken: string | null = null;
let csrfTokenExpiry: number = 0;
let pendingCsrfPromise: Promise<string> | null = null;

async function fetchCsrfToken(): Promise<string> {
  if (csrfToken && Date.now() < csrfTokenExpiry) {
    return csrfToken;
  }
  if (pendingCsrfPromise) {
    return pendingCsrfPromise;
  }

  pendingCsrfPromise = (async () => {
    try {
      const headers: Record<string, string> = {};
      const accessToken = getCookie('accessToken');
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/csrf-token`,
        { 
          withCredentials: true,
          headers
        }
      );
      csrfToken = data.csrfToken;
      csrfTokenExpiry = Date.now() + 55 * 60 * 1000; // 55 minutes
      return csrfToken ?? '';
    } catch {
      return '';
    } finally {
      pendingCsrfPromise = null;
    }
  })();

  return pendingCsrfPromise;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
});

// ── Proactive token refresh — refresh before expiry to avoid 401 delays ────
let refreshTimeout: ReturnType<typeof setTimeout> | null = null;

function parseJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

function scheduleRefresh() {
  if (refreshTimeout) { clearTimeout(refreshTimeout); refreshTimeout = null; }

  const accessToken = getCookie('accessToken');
  if (!accessToken) return;

  const exp = parseJwtExp(accessToken);
  if (!exp) return;

  // Refresh 30 seconds before expiry (minimum 5s from now)
  const msUntilRefresh = Math.max((exp * 1000) - Date.now()) - TOKEN_REFRESH_BUFFER_MS;
  const delay = Math.max(msUntilRefresh, 5_000);

  refreshTimeout = setTimeout(async () => {
    const refreshToken = getCookie('refreshToken');
    if (!refreshToken) return;
    try {
      const { data } = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } },
      );
      const newAccessToken: string = data.accessToken ?? data.token;
      const newRefreshToken: string | undefined = data.refreshToken;
      setCookie('accessToken', newAccessToken, 1);
      if (newRefreshToken) setCookie('refreshToken', newRefreshToken, 7);
      api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
      scheduleRefresh(); // schedule next refresh
    } catch {
      // Refresh failed — will be caught by response interceptor on next request
    }
  }, delay);
}

// Kick off proactive refresh on module load (page load / tab refocus)
scheduleRefresh();

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') scheduleRefresh();
};
document.addEventListener('visibilitychange', handleVisibilityChange);

// Cleanup function for when app unmounts (e.g., for testing or HMR)
export function cleanupApiListeners() {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
    refreshTimeout = null;
  }
}

// ── Request interceptor — attach access token and CSRF token ────────────────
api.interceptors.request.use(async (config) => {
  const accessToken = getCookie('accessToken');
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;

  // Add CSRF token for unsafe methods
  if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
    const token = await fetchCsrfToken();
    if (token && config.headers) {
      delete config.headers['X-CSRF-Token'];
      delete config.headers['x-csrf-token'];
      delete config.headers['X-Csrf-Token'];
      if (typeof config.headers.set === 'function') {
        config.headers.set('X-CSRF-Token', token);
      } else {
        config.headers['X-CSRF-Token'] = token;
      }
    }
  }

  return config;
});

// ── Response interceptor — silent token refresh on 401 ────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error || !token ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
}

function clearSession() {
  deleteCookie('accessToken');
  deleteCookie('refreshToken');
  sessionStorage.removeItem('user');
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle CSRF token invalidation / refresh retry
    if (
      error.response?.status === 403 &&
      error.response?.data?.message === 'Invalid or missing CSRF token' &&
      !originalRequest._csrfRetry
    ) {
      originalRequest._csrfRetry = true;
      try {
        csrfToken = null; // force fetch of a new token
        const newToken = await fetchCsrfToken();
        if (newToken && originalRequest.headers) {
          delete originalRequest.headers['X-CSRF-Token'];
          delete originalRequest.headers['x-csrf-token'];
          delete originalRequest.headers['X-Csrf-Token'];
          if (typeof originalRequest.headers.set === 'function') {
            originalRequest.headers.set('X-CSRF-Token', newToken);
          } else {
            originalRequest.headers['X-CSRF-Token'] = newToken;
          }
          return api(originalRequest);
        }
      } catch (csrfErr) {
        return Promise.reject(error);
      }
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register')) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/auth/refresh')) {
      clearSession();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    const refreshToken = getCookie('refreshToken');
    if (!refreshToken) {
      clearSession();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } },
      );

      const newAccessToken: string = data.accessToken ?? data.token;
      const newRefreshToken: string | undefined = data.refreshToken;

      setCookie('accessToken', newAccessToken, 1);
      if (newRefreshToken) setCookie('refreshToken', newRefreshToken, 7);

      api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      scheduleRefresh(); // restart proactive refresh cycle
      processQueue(null, newAccessToken);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearSession();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ── Auth ───────────────────────────────────────────────────────────────────
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

  logout: async () => {
    const refreshToken = getCookie('refreshToken');
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // Ignore — clear session regardless
    } finally {
      clearSession();
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

// ── Shared types ───────────────────────────────────────────────────────────
export type PaginationParams = { page?: number; limit?: number };

// ── Users ──────────────────────────────────────────────────────────────────
export const userService = {
  getAll: (period?: string, pp?: PaginationParams) =>
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

// ── Agents ─────────────────────────────────────────────────────────────────
export const agentService = {
  getAll: (pp?: PaginationParams) =>
    api.get('/agents', { params: pp }),

  getMy: (pp?: PaginationParams) =>
    api.get('/agents/my', { params: pp }),

  create: (data: {
    name: string;
    type: string;
    prompt?: string;
    language?: string;
    voiceId?: string;
    useCustomEngine?: boolean;
    customEngineModel?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
  }) => api.post('/agents', data),

  update: (id: string, data: {
    name: string;
    type?: string;
    prompt?: string;
    isActive: boolean;
    language?: string;
    voiceId?: string;
    useCustomEngine?: boolean;
    customEngineModel?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
  }) => api.put(`/agents/${id}`, data),

  toggleActive: (id: string, isActive: boolean) =>
    api.put(`/agents/${id}`, { isActive }),

  delete: (id: string) => api.delete(`/agents/${id}`),

  assignPhone: (id: string, phoneNumberId: string, phoneNumber?: string, twilioAccountSid?: string, twilioAuthToken?: string) =>
    api.post(`/agents/${id}/assign-phone`, { phoneNumberId, phoneNumber, twilioAccountSid, twilioAuthToken }),

  getPhoneNumbers: () =>
    api.get('/agents/phone-numbers'),

  createPhoneNumber: (data: {
    provider: string;
    number: string;
    assistantId?: string;
    name?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioApiKey?: string;
    twilioApiSecret?: string;
    vonageApiKey?: string;
    vonageApiSecret?: string;
    telnyxApiKey?: string;
    sipGateway?: string;
    sipUsername?: string;
    sipPassword?: string;
    sipTransport?: string;
  }) => api.post('/agents/phone-numbers', data),

  unlinkPhone: (id: string) =>
    api.post(`/agents/${id}/unlink-phone`),
};

// ── Chatbots ───────────────────────────────────────────────────────────────
// export const chatbotService = {
//   getMy: (pp?: PaginationParams) =>
//     api.get('/chatbots/my', { params: pp }),

//   create: (data: {
//     name: string;
//     type: string;
//     prompt?: string;
//     language?: string;
//     useCustomEngine?: boolean;
//     customEngineModel?: string;
//   }) => api.post('/chatbots', data),

//   update: (id: string, data: {
//     name?: string;
//     type?: string;
//     prompt?: string;
//     isActive?: boolean;
//     language?: string;
//     useCustomEngine?: boolean;
//     customEngineModel?: string;
//   }) => api.put(`/chatbots/${id}`, data),

//   toggleActive: (id: string, isActive: boolean) =>
//     api.put(`/chatbots/${id}`, { isActive }),

//   delete: (id: string) => api.delete(`/chatbots/${id}`),
// };

// ── Calls ──────────────────────────────────────────────────────────────────
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

// ── Leads ──────────────────────────────────────────────────────────────────
export const leadService = {
  /** Admin: all real-user / call leads (excludes AI-assistant public leads) */
  getAll: (pp?: PaginationParams) =>
    api.get('/leads', { params: pp }),

  /** Admin: AI-assistant widget leads only (dummy userId) */
  getPublic: (pp?: PaginationParams) =>
    api.get('/leads/public-leads', { params: pp }),   // ← fixed: was '/leads/public'

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

// ── Public Lead (no auth) ──────────────────────────────────────────────────
// Used by the AI Assistant chat widget on the public-facing site.
// Posts to /leads/public which is registered BEFORE authenticate middleware.
// Never sends an auth token — stored under dummyUserId, visible to admin only.
export const publicLeadService = {
  submit: (data: {
    name: string;
    phone: string;
    email: string;
    purpose: string;
    notes?: string;
  }) =>
    axios.post(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/leads/public`,
      data,
      { headers: { 'Content-Type': 'application/json' } },
    ),
};

// ── Contact ────────────────────────────────────────────────────────────────
export const contactService = {
  submit: (data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    message: string;
  }) =>
    axios.post(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/contact`,
      data,
      { headers: { 'Content-Type': 'application/json' } },
    ),
};

// ── Analytics ──────────────────────────────────────────────────────────────
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

// ── Upgrade requests ───────────────────────────────────────────────────────
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

// ── Appointments ───────────────────────────────────────────────────────────
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

// ── Add-ons ────────────────────────────────────────────────────────────────
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

// ── Chat ───────────────────────────────────────────────────────────────────
export const chatService = {
  send: (message: string) => api.post('/chat', { message }),
};

export const agentChatService = {
  send: (message: string) => api.post('/agent-chat', { message }),
};

export const userChatService = {
  send: (
    message: string,
    context?: any,
    history?: { role: string; text: string }[],
  ) => api.post('/user-chat', { message, context, history }),
};

// ── Chat History ─────────────────────────────────────────────────────────
export interface ChatSessionSummary {
  id: string;
  title: string;
  messageCount: number;
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export interface ChatSessionDetail {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export const chatHistoryService = {
  list: () => api.get<{ sessions: ChatSessionSummary[] }>('/chat-history'),
  get: (id: string) => api.get<ChatSessionDetail>(`/chat-history/${id}`),
  create: (data: { title?: string; messages?: ChatMessage[] }) =>
    api.post<ChatSessionDetail>('/chat-history', data),
  update: (id: string, data: { title?: string; messages?: ChatMessage[] }) =>
    api.put<ChatSessionDetail>(`/chat-history/${id}`, data),
  delete: (id: string) => api.delete(`/chat-history/${id}`),
};

// ── Public Demo Agent (no auth) ─────────────────────────────────────────────
export const publicDemoService = {
  getAgent: () =>
    axios.get(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/agents/public/demo`,
    ),
};

// ── API Key Management ─────────────────────────────────────────────────────
export const apiKeyService = {
  get: () => api.get('/users/api-key'),
  regenerate: () => api.post('/users/api-key/regenerate'),
};

// ── TTS ────────────────────────────────────────────────────────────────────
export const ttsService = {
  preview: (voiceId: string, language: string, text?: string, raw?: boolean) =>
    api.post('/tts/preview', { voiceId, language, text, raw }, { responseType: 'blob' }),
};

export default api;