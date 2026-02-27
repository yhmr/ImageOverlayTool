import type { TemporalStoreAccessor } from "../temporalHistory";
import { runAsSystemMutation } from "../temporalHistory";

import type {
    ProjectDataSlice,
    ProjectDataSet,
    SetProjectDataWithOrigin,
} from "./projectDataSliceTypes";

interface CreateProjectDataMetaActionsParams {
    getTemporal: TemporalStoreAccessor;
    set: ProjectDataSet;
    setProjectDataWithOrigin: SetProjectDataWithOrigin;
}

export const createProjectDataMetaActions = ({
    getTemporal,
    set,
    setProjectDataWithOrigin,
}: CreateProjectDataMetaActionsParams): Pick<
    ProjectDataSlice,
    "markProjectSaved" | "replaceImageSetsAfterSave"
> => ({
    markProjectSaved: () => {
        runAsSystemMutation(getTemporal, () => {
            set({ hasUnsavedChanges: false });
        });
    },

    replaceImageSetsAfterSave: (imageSets) => {
        runAsSystemMutation(getTemporal, () => {
            setProjectDataWithOrigin("local", {
                imageSets,
                hasUnsavedChanges: false,
            });
        });
    },
});
