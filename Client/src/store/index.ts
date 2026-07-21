import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import agentsReducer from './slices/agentsSlice';
import callsReducer from './slices/callsSlice';
import leadsReducer from './slices/leadsSlice';
import usersReducer from './slices/usersSlice';
import analyticsReducer from './slices/analyticsSlice';
import upgradeRequestsReducer from './slices/upgradeRequestsSlice';
import appointmentsReducer from './slices/appointmentsSlice';
import addOnsReducer from './slices/addOnsSlice';
import bulkCallsReducer from './slices/bulkCallsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    agents: agentsReducer,
    calls: callsReducer,
    leads: leadsReducer,
    users: usersReducer,
    analytics: analyticsReducer,
    upgradeRequests: upgradeRequestsReducer,
    appointments: appointmentsReducer,
    addOns: addOnsReducer,
    bulkCalls: bulkCallsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;