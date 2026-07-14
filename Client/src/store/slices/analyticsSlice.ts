import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Stats, MyStats, TrendPoint, PeriodOverview } from '../../types';
import { analyticsService } from '../../services/api';

interface AnalyticsState {
  overview: Stats | null;
  myStats: MyStats | null;
  usage: Array<{ id: string; name: string; plan: string; minutesUsed: number; minutesLimit: number; callCount: number; calcMinutes: number }>;
  trends: TrendPoint[];
  periodOverview: PeriodOverview | null;
  loading: boolean;
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

const initialState: AnalyticsState = {
  overview: null,
  myStats: loadFromSession<MyStats>('cache:myStats'),
  usage: [],
  trends: [],
  periodOverview: null,
  loading: false,
  error: null,
};

export const fetchOverview = createAsyncThunk('analytics/fetchOverview', async () => {
  const res = await analyticsService.overview();
  return res.data as Stats;
});

export const fetchMyStats = createAsyncThunk('analytics/fetchMyStats', async () => {
  const res = await analyticsService.myStats();
  return res.data as MyStats;
});

export const fetchUsage = createAsyncThunk(
  'analytics/fetchUsage',
  async (period?: '7d' | '30d' | '90d') => {
    const res = await analyticsService.usage(period);
    return res.data.usage as AnalyticsState['usage'];
  }
);

export const fetchTrends = createAsyncThunk(
  'analytics/fetchTrends',
  async (period?: '7d' | '30d' | '90d') => {
    const res = await analyticsService.trends(period);
    return res.data.trends as TrendPoint[];
  }
);

export const fetchPeriodOverview = createAsyncThunk(
  'analytics/fetchPeriodOverview',
  async (period?: '7d' | '30d' | '90d') => {
    const res = await analyticsService.periodOverview(period);
    return res.data as PeriodOverview;
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOverview.fulfilled, (state, action: PayloadAction<Stats>) => {
        state.loading = false;
        state.overview = action.payload;
      })
      .addCase(fetchOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch overview';
      })
      .addCase(fetchMyStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyStats.fulfilled, (state, action: PayloadAction<MyStats>) => {
        state.loading = false;
        state.myStats = action.payload;
        saveToSession('cache:myStats', action.payload);
      })
      .addCase(fetchMyStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch stats';
      })
      .addCase(fetchUsage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsage.fulfilled, (state, action: PayloadAction<AnalyticsState['usage']>) => {
        state.loading = false;
        state.usage = action.payload;
      })
      .addCase(fetchUsage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch usage';
      })
      .addCase(fetchTrends.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrends.fulfilled, (state, action: PayloadAction<TrendPoint[]>) => {
        state.loading = false;
        state.trends = action.payload;
      })
      .addCase(fetchTrends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch trends';
      })
      .addCase(fetchPeriodOverview.fulfilled, (state, action: PayloadAction<PeriodOverview>) => {
        state.periodOverview = action.payload;
      });
  },
});

export default analyticsSlice.reducer;
