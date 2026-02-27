import { createImageSetFromLocalFile } from "../../factories/imageSetFactory";
import type { TemporalStoreAccessor } from "../temporalHistory";
import { runAsSystemMutation } from "../temporalHistory";

import type {
    ProjectDataSlice,
    SetProjectDataWithOrigin,
} from "./projectDataSliceTypes";

interface CreateProjectDataImageSetActionsParams {
    getTemporal: TemporalStoreAccessor;
    setProjectDataWithOrigin: SetProjectDataWithOrigin;
}

export const createProjectDataImageSetActions = ({
    getTemporal,
    setProjectDataWithOrigin,
}: CreateProjectDataImageSetActionsParams): Pick<
    ProjectDataSlice,
    | "setImageSets"
    | "addImageSetWithPath"
    | "updateImageSet"
    | "syncImageSets"
    | "receiveImageSets"
> => ({
    setImageSets: (imageSets) => {
        setProjectDataWithOrigin("local", {
            imageSets,
            hasUnsavedChanges: true,
        });
    },

    addImageSetWithPath: (path, options) => {
        if (!path) {
            return;
        }

        setProjectDataWithOrigin("local", (state) => {
            const nextImageSet = createImageSetFromLocalFile(path, {
                sourceType: options?.sourceType ?? "file",
            });
            const nextImageSets = [...state.imageSets];

            if (nextImageSets.length === 1 && !nextImageSets[0].path) {
                nextImageSets[0] = nextImageSet;
            } else {
                nextImageSets.push(nextImageSet);
            }

            return {
                imageSets: nextImageSets,
                hasUnsavedChanges: true,
            };
        });
    },

    updateImageSet: (payload) => {
        setProjectDataWithOrigin("local", (state) => {
            const newImageSets = [...state.imageSets];
            if (payload.index !== undefined) {
                if (newImageSets.length > payload.index) {
                    newImageSets[payload.index] = payload.imageSet;
                }
            } else if (payload.id !== undefined) {
                const targetIndex = newImageSets.findIndex(
                    (s) => s.id === payload.id
                );
                if (targetIndex >= 0) {
                    newImageSets[targetIndex] = payload.imageSet;
                }
            }
            return {
                imageSets: newImageSets,
                hasUnsavedChanges: true,
            };
        });
    },

    syncImageSets: (imageSets) => {
        runAsSystemMutation(getTemporal, () => {
            setProjectDataWithOrigin("remote", {
                imageSets,
                hasUnsavedChanges: true,
            });
        });
    },

    receiveImageSets: (imageSets) => {
        setProjectDataWithOrigin("remote", {
            imageSets,
            hasUnsavedChanges: true,
        });
    },
});
