import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Lead } from '../../types';
import { leadService, type PaginationParams } from '../../services/api';
import type { PaginationMeta } from '../../components/Pagination';

interface LeadsState {
  items: Lead[];
  myLeads: Lead[];
  publicLeads: Lead[];
  pagination: PaginationMeta;
  myPagination: PaginationMeta;
  publicPagination: PaginationMeta;
  loading: boolean;
  error: string | null;
}

const defaultPagination: PaginationMeta = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

const initialState: LeadsState = {
  items: [],
  myLeads: [],
  publicLeads: [],
  pagination: defaultPagination,
  myPagination: defaultPagination,
  publicPagination: defaultPagination,
  loading: false,
  error: null,
};

// Admin: all user/call leads (excludes dummy userId)
export const fetchAllLeads = createAsyncThunk(
  'leads/fetchAll',
  async (pp?: PaginationParams) => {
    const res = await leadService.getAll(pp);
    return {
      items: res.data.items as Lead[],
      pagination: res.data.pagination as PaginationMeta,
    };
  }
);

// Admin: AI assistant / public widget leads (dummy userId only)
export const fetchPublicLeads = createAsyncThunk(
  'leads/fetchPublic',
  async (pp?: PaginationParams) => {
    const res = await leadService.getPublic(pp);
    return {
      items: res.data.items as Lead[],
      pagination: res.data.pagination as PaginationMeta,
    };
  }
);

// User: their own leads
export const fetchMyLeads = createAsyncThunk(
  'leads/fetchMy',
  async (pp?: PaginationParams) => {
    const res = await leadService.getMy(pp);
    return {
      items: res.data.items as Lead[],
      pagination: res.data.pagination as PaginationMeta,
    };
  }
);

export const createLead = createAsyncThunk(
  'leads/create',
  async (data: {
    agentId?: string;
    callId?: string;
    name?: string;
    phone?: string;
    email?: string;
    purpose?: string;
    notes?: string;
  }) => {
    const res = await leadService.create(data);
    return res.data.lead as Lead;
  }
);

export const updateLead = createAsyncThunk(
  'leads/update',
  async ({ id, data }: { id: string; data: { notes?: string; status?: string } }) => {
    const res = await leadService.update(id, data);
    return res.data.lead as Lead;
  }
);

export const exportLeads = createAsyncThunk('leads/export', async () => {
  const res = await leadService.export();
  return res.data as Blob;
});

const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchAllLeads
      .addCase(fetchAllLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items ?? [];
        state.pagination = action.payload.pagination ?? defaultPagination;
      })
      .addCase(fetchAllLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch leads';
      })

      // fetchPublicLeads
      .addCase(fetchPublicLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.publicLeads = action.payload.items ?? [];
        state.publicPagination = action.payload.pagination ?? defaultPagination;
      })
      .addCase(fetchPublicLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch public leads';
      })

      // fetchMyLeads
      .addCase(fetchMyLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.myLeads = action.payload.items ?? [];
        state.myPagination = action.payload.pagination ?? defaultPagination;
      })
      .addCase(fetchMyLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch leads';
      })

      // createLead — only add to myLeads/items (never publicLeads)
      .addCase(createLead.fulfilled, (state, action) => {
        state.myLeads.unshift(action.payload);
        state.items.unshift(action.payload);
      })

      // updateLead
      .addCase(updateLead.fulfilled, (state, action) => {
        const inMy = state.myLeads.findIndex((l) => l.id === action.payload.id);
        if (inMy !== -1) state.myLeads[inMy] = action.payload;

        const inAll = state.items.findIndex((l) => l.id === action.payload.id);
        if (inAll !== -1) state.items[inAll] = action.payload;
      });
  },
});

export default leadsSlice.reducer;