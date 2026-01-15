// @vitest-environment happy-dom
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { syncMiddleware } from "./syncMiddleware";
import { setImageSets, syncImageSets } from "./imageSetsSlice";
import { configureStore } from "@reduxjs/toolkit";
import { imageSetsSlice } from "./imageSetsSlice";
import { projectSlice } from "./projectSlice";

// Mock Electron API
const updateImageSetsMock = vi.fn();

beforeEach(() => {
  updateImageSetsMock.mockClear();
  vi.stubGlobal("window", {
    electronAPI: {
      updateImageSets: updateImageSetsMock,
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("syncMiddleware", () => {
  const store = configureStore({
    reducer: {
      imageSets: imageSetsSlice.reducer,
      project: projectSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(syncMiddleware),
  });

  it("should call updateImageSets API when imageSets/setImageSets is dispatched", () => {
    store.dispatch(setImageSets([]));
    expect(updateImageSetsMock).toHaveBeenCalled();
  });

  it("should NOT call updateImageSets API when imageSets/syncImageSets is dispatched", () => {
    store.dispatch(syncImageSets([]));
    expect(updateImageSetsMock).not.toHaveBeenCalled();
  });

  it("should NOT call updateImageSets API for unrelated actions", () => {
    store.dispatch({ type: "some/other/action" });
    expect(updateImageSetsMock).not.toHaveBeenCalled();
  });
});
