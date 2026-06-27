import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import claimsReducer from '../features/claims/claimsSlice';
import uiReducer from '../features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    claims: claimsReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type StoreType = typeof store;
