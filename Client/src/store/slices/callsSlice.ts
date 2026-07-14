import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Call } from '../../types';
import { callService, type PaginationParams } from '../../services/api';
import type { PaginationMeta } from '../../components/Pagination';

interface CallsState {
  items: Call[];
  myCalls: Call[];
  pagination: PaginationMeta;
  myPagination: PaginationMeta;
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

const defaultPagination: PaginationMeta = { total: 0, page: 1, limit: 20, totalPages: 1, hasNext: false, hasPrev: false };

const initialState: CallsState = {
  items: [],
  myCalls: loadFromSession<Call[]>('cache:myCalls') ?? [],
  pagination: defaultPagination,
  myPagination: defaultPagination,
  loading: false,
  error: null,
};

const normalize = (call: any): Call => ({
  ...call,
  id: call._id?.toString() ?? call.id,
  agentId: call.agentId?.toString() ?? null,
  userId: call.userId?.toString() ?? null,
});

const normalizeList = (calls: any[]): Call[] => calls.map(normalize);

export const fetchAllCalls = createAsyncThunk(
  'calls/fetchAll',
  async (params?: { status?: string; limit?: number } & PaginationParams) => {
    const res = await callService.getAll(params);
    return { items: normalizeList(res.data.items), pagination: res.data.pagination as PaginationMeta };
  }
);

export const fetchMyCalls = createAsyncThunk(
  'calls/fetchMy',
  async (params?: { status?: string; limit?: number } & PaginationParams) => {
    const res = await callService.getMy(params);
    return { items: normalizeList(res.data.items), pagination: res.data.pagination as PaginationMeta };
  }
);

export const syncCalls = createAsyncThunk('calls/sync', async () => {
  await callService.sync();
  const res = await callService.getAll();
  return normalizeList(res.data.items);
});

export const syncMyCalls = createAsyncThunk('calls/syncMy', async () => {
  await callService.syncMy();
  const res = await callService.getMy();
  return normalizeList(res.data.items);
});

export const deleteCall = createAsyncThunk('calls/delete', async (callId: string) => {
  await callService.delete(callId);
  return callId;
});

const callsSlice = createSlice({
  name: 'calls',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllCalls.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCalls.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllCalls.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch calls';
      })
      .addCase(fetchMyCalls.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyCalls.fulfilled, (state, action) => {
        state.loading = false;
        state.myCalls = action.payload.items;
        state.myPagination = action.payload.pagination;
        saveToSession('cache:myCalls', action.payload.items);
      })
      .addCase(fetchMyCalls.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch calls';
      })
      .addCase(syncCalls.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(syncCalls.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(syncCalls.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to sync calls';
      })
      .addCase(syncMyCalls.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(syncMyCalls.fulfilled, (state, action) => {
        state.loading = false;
        state.myCalls = action.payload;
        saveToSession('cache:myCalls', action.payload);
      })
      .addCase(syncMyCalls.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to sync calls';
      })
      .addCase(deleteCall.fulfilled, (state, action) => {
        state.myCalls = state.myCalls.filter(c => c.id !== action.payload);
        state.items = state.items.filter(c => c.id !== action.payload);
      });
  },
});

export default callsSlice.reducer;
