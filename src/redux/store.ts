import { configureStore } from "@reduxjs/toolkit";
import appReducer from "./slices/appSlice";
import onboardingReducer from "./slices/onboardingSlice";
import authReducer from "./slices/authSlice";

const store = configureStore({
  reducer: {
    app: appReducer,
    onboarding: onboardingReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;