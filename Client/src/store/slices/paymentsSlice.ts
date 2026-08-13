import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { paymentService } from '../../services/api';
import { checkAuth } from './authSlice';

interface PaymentsState {
  checkoutSession: {
    sessionId: string;
    checkoutUrl: string;
    plan: string;
    amount: number;
  } | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: PaymentsState = {
  checkoutSession: null,
  loading: false,
  error: null,
  successMessage: null,
};

export const createCheckoutSession = createAsyncThunk(
  'payments/createCheckoutSession',
  async (
    payload: { planKey: string; billingCycle?: 'monthly' | 'yearly'; provider?: 'stripe' | 'razorpay' },
    { rejectWithValue }
  ) => {
    try {
      const response = await paymentService.createCheckoutSession(payload);
      return response.data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create checkout session';
      return rejectWithValue(msg);
    }
  }
);

export const confirmPayment = createAsyncThunk(
  'payments/confirmPayment',
  async (
    payload: { planKey: string; sessionId?: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await paymentService.confirmPayment(payload);
      // Automatically refresh user auth profile after payment confirmation
      await dispatch(checkAuth());
      return response.data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to confirm payment';
      return rejectWithValue(msg);
    }
  }
);

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearPaymentState: (state) => {
      state.checkoutSession = null;
      state.loading = false;
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // createCheckoutSession
      .addCase(createCheckoutSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCheckoutSession.fulfilled, (state, action) => {
        state.loading = false;
        state.checkoutSession = action.payload;
      })
      .addCase(createCheckoutSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // confirmPayment
      .addCase(confirmPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
        state.checkoutSession = null;
      })
      .addCase(confirmPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearPaymentState } = paymentsSlice.actions;
export default paymentsSlice.reducer;
