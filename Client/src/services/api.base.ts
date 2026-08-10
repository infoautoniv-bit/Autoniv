import axios from 'axios';
import { getCookie, setCookie, deleteCookie } from './cookies';
import { API_BASE_URL } from '../config/api';

const REQUEST_TIMEOUT_MS = 30000;
const TOKEN_REFRESH_BUFFER_MS = 30_000;

const BASE_URL = API_BASE_URL;

// ─── CSRF Token Management ──────────────────────────────────────────────────
let csrfToken: string | null = null;
let csrfTokenExpiry: number = 0;
let pendingCsrfPromise: Promise<string> | null = null;

export function resetCsrfToken() {
  csrfToken = null;
  csrfTokenExpiry = 0;
  pendingCsrfPromise = null;
}

async function fetchCsrfToken(forceRefresh = false): Promise<string> {
  if (forceRefresh) {
    resetCsrfToken();
  } else {
    if (csrfToken && Date.now() < csrfTokenExpiry) {
      return csrfToken;
    }
    if (pendingCsrfPromise) {
      return pendingCsrfPromise;
    }
  }

  pendingCsrfPromise = (async () => {
    try {
      const headers: Record<string, string> = {};
      const accessToken = getCookie('accessToken');
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const { data } = await axios.get(
        `${BASE_URL}/csrf-token`,
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

export { fetchCsrfToken };

const api = axios.create({
  baseURL: BASE_URL,
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
  resetCsrfToken();
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
        const newToken = await fetchCsrfToken(true); // force refresh of CSRF token
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
      } catch {
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
      // Process queue first, then clear session and redirect
      clearSession();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ── Shared types ───────────────────────────────────────────────────────────
export type PaginationParams = { page?: number; limit?: number };

// Expose BASE_URL for public services that bypass interceptors
export { BASE_URL };

export default api;
