import { configureStore, combineReducers, type Reducer } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

// ── Static reducers (needed on every page) ──────────────────────────────────
const staticReducers = {
  auth: authReducer,
} as const;

// ── Dynamic reducer registry ────────────────────────────────────────────────
// Admin/dashboard slices are loaded only when their route is accessed.
const asyncReducerMap: Record<string, Reducer> = {};

function createReducer(existingReducers: Record<string, Reducer>) {
  return combineReducers({
    ...existingReducers,
    ...asyncReducerMap,
  });
}

let rootReducer = createReducer(staticReducers);

export const store = configureStore({
  reducer: rootReducer,
  devTools: !import.meta.env.PROD,
});

/**
 * Inject a reducer at runtime. Call this before mounting components that need it.
 */
export function injectReducer(key: string, reducer: Reducer) {
  if (asyncReducerMap[key]) return;
  asyncReducerMap[key] = reducer;
  rootReducer = createReducer(staticReducers);
  store.replaceReducer(rootReducer);
}

// Lazy-load admin slices — called by ProtectedRoute when auth is confirmed
let adminLoaded = false;
export async function loadAdminSlices() {
  if (adminLoaded) return;
  adminLoaded = true;

  const [agents, calls, leads, users, analytics, upgradeRequests, appointments, addOns, bulkCalls] =
    await Promise.all([
      import('./slices/agentsSlice'),
      import('./slices/callsSlice'),
      import('./slices/leadsSlice'),
      import('./slices/usersSlice'),
      import('./slices/analyticsSlice'),
      import('./slices/upgradeRequestsSlice'),
      import('./slices/appointmentsSlice'),
      import('./slices/addOnsSlice'),
      import('./slices/bulkCallsSlice'),
    ]);

  injectReducer('agents', agents.default);
  injectReducer('calls', calls.default);
  injectReducer('leads', leads.default);
  injectReducer('users', users.default);
  injectReducer('analytics', analytics.default);
  injectReducer('upgradeRequests', upgradeRequests.default);
  injectReducer('appointments', appointments.default);
  injectReducer('addOns', addOns.default);
  injectReducer('bulkCalls', bulkCalls.default);
}

// ── Full RootState type (all slices, even dynamically loaded) ────────────────
// Used by useAppSelector across the app including admin pages.
import type { AuthState } from './slices/authSlice';
import type { AgentsState } from './slices/agentsSlice';
import type { CallsState } from './slices/callsSlice';
import type { LeadsState } from './slices/leadsSlice';
import type { UsersState } from './slices/usersSlice';
import type { AnalyticsState } from './slices/analyticsSlice';
import type { UpgradeRequestsState } from './slices/upgradeRequestsSlice';
import type { AppointmentsState } from './slices/appointmentsSlice';
import type { AddOnsState } from './slices/addOnsSlice';
import type { BulkCallsState } from './slices/bulkCallsSlice';

export interface RootState {
  auth: AuthState;
  agents: AgentsState;
  calls: CallsState;
  leads: LeadsState;
  users: UsersState;
  analytics: AnalyticsState;
  upgradeRequests: UpgradeRequestsState;
  appointments: AppointmentsState;
  addOns: AddOnsState;
  bulkCalls: BulkCallsState;
}

export type AppDispatch = typeof store.dispatch;
