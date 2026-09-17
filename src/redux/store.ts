import { configureStore } from "@reduxjs/toolkit";
import appReducer from "./slices/appSlice";
import onboardingReducer from "./slices/onboardingSlice";
import authReducer from "./slices/authSlice";
import { apiSlice } from "@/lib/api/apiSlice";

const store = configureStore({
  reducer: {
    app: appReducer,
    onboarding: onboardingReducer,
    auth: authReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;