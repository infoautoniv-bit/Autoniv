import { createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import type { AddOnCatalogEntry, UserAddOn } from '../../types';
import { addOnService, type PaginationParams } from '../../services/api';
import { STATIC_ADDON_CATALOG } from '../../data/addOnCatalog';
import type { PaginationMeta } from '../../components/Pagination';

interface AddOnsState {
  catalog: AddOnCatalogEntry[];
  my: UserAddOn[];
  all: UserAddOn[];
  pagination: PaginationMeta;
  myPagination: PaginationMeta;
  loading: boolean;
  error: string | null;
}

const defaultPagination: PaginationMeta = { total: 0, page: 1, limit: 20, totalPages: 1, hasNext: false, hasPrev: false };

const initialState: AddOnsState = {
  catalog: STATIC_ADDON_CATALOG,
  my: [],
  all: [],
  pagination: defaultPagination,
  myPagination: defaultPagination,
  loading: false,
  error: null,
};

export const fetchAddOnCatalog = createAsyncThunk('addOns/fetchCatalog', async () => {
  const res = await addOnService.getCatalog();
  const fromApi = res.data.addOns as AddOnCatalogEntry[];
  return fromApi.length > 0 ? fromApi : STATIC_ADDON_CATALOG;
});

export const fetchMyAddOns = createAsyncThunk(
  'addOns/fetchMy',
  async (pp?: PaginationParams) => {
    const res = await addOnService.getMy(pp);
    return { items: res.data.items as UserAddOn[], pagination: res.data.pagination as PaginationMeta };
  }
);

export const requestAddOn = createAsyncThunk(
  'addOns/request',
  async ({ addOnId, notes }: { addOnId: string; notes?: string }) => {
    const res = await addOnService.request(addOnId, notes);
    return res.data.userAddOn as UserAddOn;
  }
);

export const cancelAddOn = createAsyncThunk('addOns/cancel', async (id: string) => {
  await addOnService.cancel(id);
  return id;
});

export const fetchAllAddOns = createAsyncThunk(
  'addOns/fetchAll',
  async ({ status, page, limit }: { status?: string; page?: number; limit?: number }) => {
    const res = await addOnService.getAll(status, { page, limit });
    return { items: res.data.items as UserAddOn[], pagination: res.data.pagination as PaginationMeta };
  }
);

export const processAddOn = createAsyncThunk(
  'addOns/process',
  async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
    const res = await addOnService.process(id, status);
    return res.data.userAddOn as UserAddOn;
  }
);

export const createCatalogEntry = createAsyncThunk(
  'addOns/createCatalog',
  async (data: { id: string; icon?: string; title: string; price: string; category?: string; description?: string; type?: 'chat' | 'voice' }) => {
    const res = await addOnService.createCatalogEntry(data);
    return res.data.addOn as AddOnCatalogEntry;
  }
);

const addOnsSlice = createSlice({
  name: 'addOns',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAddOnCatalog.fulfilled, (state, action) => {
        state.catalog = action.payload;
      })
      .addCase(fetchMyAddOns.fulfilled, (state, action) => {
        state.my = action.payload.items;
        state.myPagination = action.payload.pagination;
      })
      .addCase(requestAddOn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestAddOn.fulfilled, (state, action) => {
        state.loading = false;
        state.my.unshift(action.payload);
      })
      .addCase(requestAddOn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to request add-on';
      })
      .addCase(cancelAddOn.fulfilled, (state, action) => {
        state.my = state.my.filter((m) => m.id !== action.payload);
      })
      .addCase(fetchAllAddOns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllAddOns.fulfilled, (state, action) => {
        state.loading = false;
        state.all = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllAddOns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch add-on requests';
      })
      .addCase(processAddOn.fulfilled, (state, action) => {
        const idx = state.all.findIndex((a) => a.id === action.payload.id);
        if (idx !== -1) state.all[idx] = action.payload;
        const myIdx = state.my.findIndex((a) => a.id === action.payload.id);
        if (myIdx !== -1) state.my[myIdx] = action.payload;
      })
      .addCase(createCatalogEntry.fulfilled, (state, action) => {
        state.catalog.push(action.payload);
      });
  },
});

export default addOnsSlice.reducer;
