import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { UpgradeRequest } from '../../types';
import { upgradeRequestService, type PaginationParams } from '../../services/api';
import type { PaginationMeta } from '../../components/Pagination';

interface UpgradeRequestsState {
  my: UpgradeRequest[];
  all: UpgradeRequest[];
  pagination: PaginationMeta;
  myPagination: PaginationMeta;
  loading: boolean;
  error: string | null;
}

const defaultPagination: PaginationMeta = { total: 0, page: 1, limit: 20, totalPages: 1, hasNext: false, hasPrev: false };

const initialState: UpgradeRequestsState = {
  my: [],
  all: [],
  pagination: defaultPagination,
  myPagination: defaultPagination,
  loading: false,
  error: null,
};

export const createUpgradeRequest = createAsyncThunk(
  'upgradeRequests/create',
  async (requestedPlan: string) => {
    const res = await upgradeRequestService.create(requestedPlan);
    return res.data.request as UpgradeRequest;
  }
);

export const fetchMyUpgradeRequests = createAsyncThunk(
  'upgradeRequests/fetchMy',
  async (pp?: PaginationParams) => {
    const res = await upgradeRequestService.getMy(pp);
    return { items: res.data.items as UpgradeRequest[], pagination: res.data.pagination as PaginationMeta };
  }
);

export const fetchAllUpgradeRequests = createAsyncThunk(
  'upgradeRequests/fetchAll',
  async ({ status, page, limit }: { status?: string; page?: number; limit?: number }) => {
    const res = await upgradeRequestService.getAll(status, { page, limit });
    return { items: res.data.items as UpgradeRequest[], pagination: res.data.pagination as PaginationMeta };
  }
);

export const processUpgradeRequest = createAsyncThunk(
  'upgradeRequests/process',
  async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
    const res = await upgradeRequestService.process(id, status);
    return res.data.request as UpgradeRequest;
  }
);

const upgradeRequestsSlice = createSlice({
  name: 'upgradeRequests',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createUpgradeRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUpgradeRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.my.unshift(action.payload);
      })
      .addCase(createUpgradeRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to request upgrade';
      })
      .addCase(fetchMyUpgradeRequests.fulfilled, (state, action) => {
        state.my = action.payload.items;
        state.myPagination = action.payload.pagination;
      })
      .addCase(fetchAllUpgradeRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUpgradeRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.all = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllUpgradeRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch upgrade requests';
      })
      .addCase(processUpgradeRequest.fulfilled, (state, action) => {
        const idx = state.all.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) state.all[idx] = action.payload;
        const myIdx = state.my.findIndex((r) => r.id === action.payload.id);
        if (myIdx !== -1) state.my[myIdx] = action.payload;
      });
  },
});

export default upgradeRequestsSlice.reducer;
