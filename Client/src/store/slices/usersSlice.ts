import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { User } from '../../types';
import { userService } from '../../services/api';
import type { PaginationMeta } from '../../components/Pagination';

interface UsersState {
  items: User[];
  pagination: PaginationMeta;
  loading: boolean;
  error: string | null;
}

const defaultPagination: PaginationMeta = { total: 0, page: 1, limit: 20, totalPages: 1, hasNext: false, hasPrev: false };

const initialState: UsersState = {
  items: [],
  pagination: defaultPagination,
  loading: false,
  error: null,
};

export const fetchAllUsers = createAsyncThunk(
  'users/fetchAll',
  async ({ period, page, limit }: { period?: string; page?: number; limit?: number }) => {
    const res = await userService.getAll(period, { page, limit });
    return { items: res.data.items as User[], pagination: res.data.pagination as PaginationMeta };
  }
);

export const createUser = createAsyncThunk(
  'users/create',
  async (data: {
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
  }) => {
    const res = await userService.create(data);
    return res.data.user as User;
  }
);

export const updateUser = createAsyncThunk(
  'users/update',
  async ({
    id,
    data,
  }: {
    id: string;
    data: {
      name?: string;
      email?: string;
      company?: string;
      plan?: string;
      chatPlan?: string;
      voicePlan?: string;
      phoneNumber?: string;
      chatEnabled?: boolean;
      voiceEnabled?: boolean;
    };
  }) => {
    const res = await userService.update(id, data);
    return res.data.user as User;
  }
);

export const toggleBlockUser = createAsyncThunk(
  'users/toggleBlock',
  async ({ id, isActive }: { id: string; isActive: boolean }) => {
    await userService.toggleBlock(id, isActive);
    return { id, isActive };
  }
);

export const deleteUser = createAsyncThunk('users/delete', async (id: string) => {
  await userService.delete(id);
  return id;
});

export const upgradePlan = createAsyncThunk(
  'users/upgradePlan',
  async ({ id, plan, chatPlan, voicePlan }: { id: string; plan: string; chatPlan?: string; voicePlan?: string }) => {
    const res = await userService.upgradePlan(id, plan, chatPlan, voicePlan);
    return res.data.user as User;
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch users';
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const idx = state.items.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(toggleBlockUser.fulfilled, (state, action) => {
        const { id, isActive } = action.payload;
        const idx = state.items.findIndex((u) => u.id === id);
        if (idx !== -1) state.items[idx].isActive = isActive;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.items = state.items.filter((u) => u.id !== action.payload);
      })
      .addCase(upgradePlan.fulfilled, (state, action) => {
        const idx = state.items.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      });
  },
});

export default usersSlice.reducer;
