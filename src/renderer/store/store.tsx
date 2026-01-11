import { configureStore } from "@reduxjs/toolkit";
import {
  useSelector as rawUseSelector,
  TypedUseSelectorHook,
} from "react-redux";

import { imageSetsSlice } from "./imageSetsSlice";
import { projectSlice } from "./projectSlice";
import { syncMiddleware } from "./syncMiddleware";

export const store = configureStore({
  reducer: {
    project: projectSlice.reducer,
    imageSets: imageSetsSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(syncMiddleware),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useSelector: TypedUseSelectorHook<RootState> = rawUseSelector;
