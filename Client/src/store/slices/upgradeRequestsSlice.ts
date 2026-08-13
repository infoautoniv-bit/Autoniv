import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { UpgradeRequest } from '../../types';
import { upgradeRequestService } from '../../services/api.upgradeRequests';
import type { PaginationParams } from '../../services/api.base';
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
  async ({ id, status }: { id: string; status: 'approved' | 'rejected' }, { rejectWithValue }) => {
    try {
      const res = await upgradeRequestService.process(id, status);
      return res.data.request as UpgradeRequest;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to process request');
    }
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
        if (state.all.length === 0) {
          state.loading = true;
        }
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
      .addCase(processUpgradeRequest.pending, (state, action) => {
        const targetId = String(action.meta.arg.id);
        const target = state.all.find((r) => String(r.id) === targetId || String((r as any)._id) === targetId);
        if (target) {
          target.status = action.meta.arg.status;
        }
        const myTarget = state.my.find((r) => String(r.id) === targetId || String((r as any)._id) === targetId);
        if (myTarget) {
          myTarget.status = action.meta.arg.status;
        }
      })
      .addCase(processUpgradeRequest.fulfilled, (state, action) => {
        const updated = action.payload;
        const targetId = String(updated?.id || (updated as any)?._id || action.meta.arg.id);
        const index = state.all.findIndex((r) => String(r.id) === targetId || String((r as any)._id) === targetId);
        if (index !== -1) {
          state.all[index] = { ...state.all[index], ...updated, status: updated?.status || action.meta.arg.status };
        }
        const myIndex = state.my.findIndex((r) => String(r.id) === targetId || String((r as any)._id) === targetId);
        if (myIndex !== -1) {
          state.my[myIndex] = { ...state.my[myIndex], ...updated, status: updated?.status || action.meta.arg.status };
        }
      });
  },
});

export default upgradeRequestsSlice.reducer;
