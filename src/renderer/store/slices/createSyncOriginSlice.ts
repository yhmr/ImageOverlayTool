import { StateCreator } from "zustand";

export type ProjectDataChangeOrigin = "local" | "remote";

export interface SyncOriginSlice {
    projectDataChangeOrigin: ProjectDataChangeOrigin;
    setProjectDataChangeOrigin: (origin: ProjectDataChangeOrigin) => void;
}

export const createSyncOriginSlice: StateCreator<SyncOriginSlice> = (set) => ({
    projectDataChangeOrigin: "local",
    setProjectDataChangeOrigin: (origin) => {
        set({ projectDataChangeOrigin: origin });
    },
});
