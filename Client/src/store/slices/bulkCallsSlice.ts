import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { BulkCampaign } from '../../types';
import { bulkCallService, type PaginationParams } from '../../services/api';
import type { PaginationMeta } from '../../components/Pagination';

interface BulkCallsState {
  myCampaigns: BulkCampaign[];
  activeCampaign: BulkCampaign | null;
  myPagination: PaginationMeta;
  loading: boolean;
  error: string | null;
}

const defaultPagination: PaginationMeta = { total: 0, page: 1, limit: 20, totalPages: 1, hasNext: false, hasPrev: false };

const initialState: BulkCallsState = {
  myCampaigns: [],
  activeCampaign: null,
  myPagination: defaultPagination,
  loading: false,
  error: null,
};

const normalize = (c: any): BulkCampaign => ({
  ...c,
  id: c._id?.toString() ?? c.id,
  agentId: c.agentId?.toString() ?? c.agentId,
});

export const fetchMyBulkCampaigns = createAsyncThunk(
  'bulkCalls/fetchMy',
  async (params?: PaginationParams) => {
    const res = await bulkCallService.getMy(params);
    return { items: (res.data.items || []).map(normalize), pagination: res.data.pagination as PaginationMeta };
  }
);

export const fetchBulkCampaign = createAsyncThunk(
  'bulkCalls/fetchOne',
  async (id: string) => {
    const res = await bulkCallService.getOne(id);
    return normalize(res.data.campaign);
  }
);

export const createBulkCampaign = createAsyncThunk(
  'bulkCalls/create',
  async (data: { agentId: string; name: string; numbers: { phone: string; name?: string }[]; concurrency?: number; delayMs?: number }) => {
    const res = await bulkCallService.create(data);
    return normalize(res.data.campaign);
  }
);

export const startBulkCampaign = createAsyncThunk(
  'bulkCalls/start',
  async (id: string) => {
    await bulkCallService.start(id);
    return id;
  }
);

export const pauseBulkCampaign = createAsyncThunk(
  'bulkCalls/pause',
  async (id: string) => {
    await bulkCallService.pause(id);
    return id;
  }
);

export const cancelBulkCampaign = createAsyncThunk(
  'bulkCalls/cancel',
  async (id: string) => {
    await bulkCallService.cancel(id);
    return id;
  }
);

export const deleteBulkCampaign = createAsyncThunk(
  'bulkCalls/delete',
  async (id: string) => {
    await bulkCallService.delete(id);
    return id;
  }
);

const bulkCallsSlice = createSlice({
  name: 'bulkCalls',
  initialState,
  reducers: {
    clearActiveCampaign(state) {
      state.activeCampaign = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyBulkCampaigns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyBulkCampaigns.fulfilled, (state, action) => {
        state.loading = false;
        state.myCampaigns = action.payload.items;
        state.myPagination = action.payload.pagination;
      })
      .addCase(fetchMyBulkCampaigns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch campaigns';
      })
      .addCase(fetchBulkCampaign.fulfilled, (state, action) => {
        state.activeCampaign = action.payload;
      })
      .addCase(createBulkCampaign.fulfilled, (state, action) => {
        state.myCampaigns.unshift(action.payload);
      })
      .addCase(startBulkCampaign.fulfilled, (state, action) => {
        const idx = state.myCampaigns.findIndex(c => c.id === action.payload);
        if (idx !== -1) state.myCampaigns[idx].status = 'running';
        if (state.activeCampaign?.id === action.payload) state.activeCampaign.status = 'running';
      })
      .addCase(pauseBulkCampaign.fulfilled, (state, action) => {
        const idx = state.myCampaigns.findIndex(c => c.id === action.payload);
        if (idx !== -1) state.myCampaigns[idx].status = 'paused';
        if (state.activeCampaign?.id === action.payload) state.activeCampaign.status = 'paused';
      })
      .addCase(cancelBulkCampaign.fulfilled, (state, action) => {
        const idx = state.myCampaigns.findIndex(c => c.id === action.payload);
        if (idx !== -1) state.myCampaigns[idx].status = 'cancelled';
        if (state.activeCampaign?.id === action.payload) state.activeCampaign.status = 'cancelled';
      })
      .addCase(deleteBulkCampaign.fulfilled, (state, action) => {
        state.myCampaigns = state.myCampaigns.filter(c => c.id !== action.payload);
      });
  },
});

export const { clearActiveCampaign } = bulkCallsSlice.actions;
export default bulkCallsSlice.reducer;
