import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Appointment } from '../../types';
import { appointmentService, type PaginationParams } from '../../services/api';
import type { PaginationMeta } from '../../components/Pagination';

interface AppointmentsState {
  items: Appointment[];
  myAppointments: Appointment[];
  pagination: PaginationMeta;
  myPagination: PaginationMeta;
  loading: boolean;
  error: string | null;
}

const defaultPagination: PaginationMeta = { total: 0, page: 1, limit: 20, totalPages: 1, hasNext: false, hasPrev: false };

const initialState: AppointmentsState = {
  items: [],
  myAppointments: [],
  pagination: defaultPagination,
  myPagination: defaultPagination,
  loading: false,
  error: null,
};

export const fetchAllAppointments = createAsyncThunk(
  'appointments/fetchAll',
  async (pp?: PaginationParams) => {
    const res = await appointmentService.getAll(pp);
    return { items: res.data.items as Appointment[], pagination: res.data.pagination as PaginationMeta };
  }
);

export const fetchMyAppointments = createAsyncThunk(
  'appointments/fetchMy',
  async (pp?: PaginationParams) => {
    const res = await appointmentService.getMy(pp);
    return { items: res.data.items as Appointment[], pagination: res.data.pagination as PaginationMeta };
  }
);

export const updateAppointment = createAsyncThunk(
  'appointments/update',
  async ({ id, data }: { id: string; data: { name?: string; phone?: string; service?: string; preferredDate?: string; preferredTime?: string; status?: string } }) => {
    const res = await appointmentService.update(id, data);
    return res.data.appointment as Appointment;
  }
);

export const notifyAppointmentWhatsApp = createAsyncThunk(
  'appointments/notifyWhatsApp',
  async (id: string) => {
    const res = await appointmentService.notifyWhatsApp(id);
    return res.data;
  }
);

const appointmentsSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch appointments';
      })
      .addCase(fetchMyAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.myAppointments = action.payload.items;
        state.myPagination = action.payload.pagination;
      })
      .addCase(fetchMyAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch appointments';
      })
      .addCase(updateAppointment.fulfilled, (state, action) => {
        const idx = state.myAppointments.findIndex((a) => a.id === action.payload.id);
        if (idx !== -1) state.myAppointments[idx] = action.payload;
        const idx2 = state.items.findIndex((a) => a.id === action.payload.id);
        if (idx2 !== -1) state.items[idx2] = action.payload;
      });
  },
});

export default appointmentsSlice.reducer;
