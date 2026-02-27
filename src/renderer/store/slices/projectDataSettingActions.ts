import {
    sanitizeUnitFactor,
    UNIT_FACTOR_DEFAULT,
} from "../../../shared/constants/unitFactor";
import type { TemporalStoreAccessor } from "../temporalHistory";
import { runAsSystemMutation } from "../temporalHistory";

import type {
    ProjectDataSlice,
    SetProjectDataWithOrigin,
} from "./projectDataSliceTypes";

interface CreateProjectDataSettingActionsParams {
    getTemporal: TemporalStoreAccessor;
    setProjectDataWithOrigin: SetProjectDataWithOrigin;
}

export const createProjectDataSettingActions = ({
    getTemporal,
    setProjectDataWithOrigin,
}: CreateProjectDataSettingActionsParams): Pick<
    ProjectDataSlice,
    | "setUnitFactor"
    | "syncUnitFactor"
    | "setUnit"
    | "syncUnit"
    | "setWindowColor"
> => ({
    setUnitFactor: (factor) => {
        setProjectDataWithOrigin("local", {
            unitFactor: sanitizeUnitFactor(factor),
            hasUnsavedChanges: true,
        });
    },

    syncUnitFactor: (factor) => {
        runAsSystemMutation(getTemporal, () => {
            setProjectDataWithOrigin("remote", {
                unitFactor: sanitizeUnitFactor(factor),
                hasUnsavedChanges: true,
            });
        });
    },

    setUnit: (unit) => {
        setProjectDataWithOrigin("local", {
            unit,
            hasUnsavedChanges: true,
        });
    },

    syncUnit: (unit) => {
        runAsSystemMutation(getTemporal, () => {
            setProjectDataWithOrigin("remote", {
                unit,
                hasUnsavedChanges: true,
            });
        });
    },

    setWindowColor: (color) => {
        setProjectDataWithOrigin("local", {
            windowColor: color,
            hasUnsavedChanges: true,
        });
    },
});

export const PROJECT_DATA_DEFAULTS = {
    unitFactor: UNIT_FACTOR_DEFAULT,
    unit: "um" as const,
    windowColor: "#00000000",
};
