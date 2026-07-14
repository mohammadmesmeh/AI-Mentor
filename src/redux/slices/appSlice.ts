import { createSlice } from "@reduxjs/toolkit";

const appSlice = createSlice({
  name: "app",
  initialState: {
    theme: "dark",
  },
  reducers: {},
});

export default appSlice.reducer;