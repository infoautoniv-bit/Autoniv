import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types';
import { authService } from '../../services/api';
import { getCookie, setCookie, deleteCookie } from '../../services/cookies';

export interface DashboardStats {
  agentCount?: number;
  callCount?: number;
  minuteUsed?: number;
  leadCount?: number;
  totalUsers?: number;
  activeAgents?: number;
  callsToday?: number;
  totalMinutes?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  initialized: boolean;
  dashboardStats: DashboardStats | null;
  error: string | null;
}

function loadFromSession<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function saveToSession(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded — ignore */ }
}

const cachedUser = loadFromSession<User>('user');
const accessToken = getCookie('accessToken');

const initialState: AuthState = {
  user: cachedUser,
  token: accessToken,
  refreshToken: getCookie('refreshToken'),
  loading: false,
  initialized: !!(cachedUser && accessToken),
  dashboardStats: loadFromSession<DashboardStats>('cache:dashboardStats'),
  error: null,
};

// ── Thunks ─────────────────────────────────────────────────────────────────

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authService.me();
      return res.data.user as User;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? 'Session expired');
    }
  },
);

export const login = createAsyncThunk(
  'auth/login',
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await authService.login(email, password);

      if (res.data.requiresOtp) {
        return { requiresOtp: true, email: res.data.email, message: res.data.message };
      }

      const { accessToken, refreshToken, user } = res.data;

      setCookie('accessToken', accessToken, 1);
      if (refreshToken) setCookie('refreshToken', refreshToken, 7);
      sessionStorage.setItem('user', JSON.stringify(user));

      return { token: accessToken, refreshToken: refreshToken ?? null, user };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? 'Login failed');
    }
  },
);

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (credential: string, { rejectWithValue }) => {
    try {
      const res = await authService.googleLogin(credential);
      const { accessToken, refreshToken, user } = res.data;

      setCookie('accessToken', accessToken, 1);
      if (refreshToken) setCookie('refreshToken', refreshToken, 7);
      sessionStorage.setItem('user', JSON.stringify(user));

      return { token: accessToken, refreshToken: refreshToken ?? null, user };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? 'Google authentication failed');
    }
  },
);


export const fetchDashboardStats = createAsyncThunk(
  'auth/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authService.getDashboardStats();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? 'Failed to load dashboard stats');
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    data: {
      name: string;
      email: string;
      password: string;
      company?: string;
      phoneNumber?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await authService.register(data);

      if (res.data.requiresOtp) {
        return { requiresOtp: true, email: res.data.email, message: res.data.message };
      }

      const accessToken: string = res.data.accessToken ?? res.data.token;
      const { refreshToken, user } = res.data;

      if (!accessToken) throw new Error('No token in register response');

      setCookie('accessToken', accessToken, 1);
      if (refreshToken) setCookie('refreshToken', refreshToken, 7);
      sessionStorage.setItem('user', JSON.stringify(user));

      return { token: accessToken, refreshToken: refreshToken ?? null, user };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? 'Registration failed');
    }
  },
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (
    { email, otp, purpose }: { email: string; otp: string; purpose: 'register' | 'login' },
    { rejectWithValue },
  ) => {
    try {
      const res = await authService.verifyOtp(email, otp, purpose);
      const accessToken: string = res.data.accessToken ?? res.data.token;
      const { refreshToken, user } = res.data;

      setCookie('accessToken', accessToken, 1);
      if (refreshToken) setCookie('refreshToken', refreshToken, 7);
      sessionStorage.setItem('user', JSON.stringify(user));

      return { token: accessToken, refreshToken: refreshToken ?? null, user };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? 'Verification failed');
    }
  },
);

// ── Slice ──────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    updateChatUsed: (state, action: PayloadAction<{ chatUsed: number; chatLimit?: number }>) => {
      if (state.user) {
        state.user.chatUsed = action.payload.chatUsed;
        if (action.payload.chatLimit !== undefined) {
          state.user.chatLimit = action.payload.chatLimit;
        }
        sessionStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    updatePlan: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        Object.assign(state.user, action.payload);
        sessionStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    logout: (state) => {
      authService.logout(); // async — clears cookies/sessionStorage and calls /auth/logout
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.dashboardStats = null;
      state.error = null;
      state.initialized = false; // reset so checkAuth reruns on next login
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('cache:myStats');
      sessionStorage.removeItem('cache:myAgents');
      sessionStorage.removeItem('cache:myCalls');
      sessionStorage.removeItem('cache:dashboardStats');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── login ────────────────────────────────────────────────────────────
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        login.fulfilled,
        (
          state,
          action: PayloadAction<{
            token?: string;
            refreshToken?: string | null;
            user?: User;
            requiresOtp?: boolean;
            email?: string;
          }>,
        ) => {
          state.loading = false;
          if (action.payload.requiresOtp) {
            state.error = null;
            return;
          }
          state.token = action.payload.token!;
          state.refreshToken = action.payload.refreshToken ?? null;
          state.user = action.payload.user!;
          state.initialized = true;
          state.error = null;
          saveToSession('user', action.payload.user!);
        },
      )
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token!;
        state.refreshToken = action.payload.refreshToken ?? null;
        state.user = action.payload.user!;
        state.initialized = true;
        state.error = null;
        saveToSession('user', action.payload.user!);
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })


      // ── fetchDashboardStats ──────────────────────────────────────────────
      .addCase(fetchDashboardStats.pending, () => {
        // no loading spinner — runs silently after login
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.dashboardStats = action.payload;
        saveToSession('cache:dashboardStats', action.payload);
      })
      .addCase(fetchDashboardStats.rejected, () => {
        // failed silently — can be retried from dashboard
      })

      // ── register ─────────────────────────────────────────────────────────
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        register.fulfilled,
        (
          state,
          action: PayloadAction<{
            token?: string;
            refreshToken?: string | null;
            user?: User;
            requiresOtp?: boolean;
            email?: string;
          }>,
        ) => {
          state.loading = false;
          if (action.payload.requiresOtp) {
            state.error = null;
            return;
          }
          state.token = action.payload.token!;
          state.refreshToken = action.payload.refreshToken ?? null;
          state.user = action.payload.user!;
          state.initialized = true;
          state.error = null;
          saveToSession('user', action.payload.user!);
        },
      )
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ── verifyOtp ────────────────────────────────────────────────────────
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        state.initialized = true;
        state.error = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ── checkAuth ────────────────────────────────────────────────────────
      .addCase(checkAuth.pending, (state) => {
        // Only show loading spinner if there's no cached user
        // Prevents flash-of-loading-screen on page refresh
        if (!state.user) state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
        state.initialized = true;
        state.error = null;
        sessionStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.token = null;
        state.refreshToken = null;
        state.user = null;
        state.initialized = true;
        state.error = null; // not a user-facing error — interceptor handles redirect
        deleteCookie('accessToken');
        deleteCookie('refreshToken');
        sessionStorage.removeItem('user');
      });
  },
});

export const { logout, clearError, updateChatUsed, updatePlan } = authSlice.actions;
export default authSlice.reducer;