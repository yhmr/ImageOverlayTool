import fs from "fs";
import path from "path";
import { ipcMain, type IpcMainInvokeEvent } from "electron";

import type { E2ERuntimeConfig } from "../e2e/runtimeConfig";
import {
    captureWindowAreaAndSave,
    type CaptureTestModeOptions,
} from "../services/captureService";
import { IPC_CHANNELS } from "../../shared/ipc/channels";
import { loadResolvedSceneFileFromPath } from "../repositories/sceneLoader";
import { resolveSceneSourcePath } from "../repositories/sceneResolver";
import type {
    E2ECaptureRequest,
    E2EControlStatus,
    E2ELoadFixtureImageRequest,
    E2EResolvedSceneFile,
    E2EResolvedFixtureImage,
    E2ESceneExtensions,
    E2EWaitStableResult,
} from "../../shared/types/E2EControl";
import type { InteractionMode } from "../../shared/types/InteractionMode";

interface E2EControlRegistrationOptions {
    e2eConfig: E2ERuntimeConfig;
}

const getDisabledReason = (e2eConfig: E2ERuntimeConfig): string => {
    if (!e2eConfig.enabled) {
        return 'E2E control plane is disabled because "--e2e" is not enabled.';
    }
    if (process.env.IOT_E2E_MODE !== "1") {
        return "E2E control plane is disabled because IOT_E2E_MODE is not enabled.";
    }
    return "";
};

const isControlPlaneEnabled = (e2eConfig: E2ERuntimeConfig): boolean => {
    return getDisabledReason(e2eConfig).length === 0;
};

const assertControlPlaneEnabled = (e2eConfig: E2ERuntimeConfig): void => {
    const reason = getDisabledReason(e2eConfig);
    if (reason.length > 0) {
        throw new Error(reason);
    }
};

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
    typeof value === "object" && value !== null;

const parseOptionalString = (
    value: unknown,
    pathLabel: string
): string | undefined => {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== "string") {
        throw new Error(`Invalid scene file: ${pathLabel} must be a string.`);
    }
    return value;
};

const parseOptionalNullableString = (
    value: unknown,
    pathLabel: string
): string | null | undefined => {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    if (typeof value !== "string") {
        throw new Error(
            `Invalid scene file: ${pathLabel} must be a string or null.`
        );
    }
    return value;
};

const parseOptionalBoolean = (
    value: unknown,
    pathLabel: string
): boolean | undefined => {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== "boolean") {
        throw new Error(`Invalid scene file: ${pathLabel} must be a boolean.`);
    }
    return value;
};

const parseOptionalInteractionMode = (
    value: unknown
): InteractionMode | undefined => {
    if (value === undefined) {
        return undefined;
    }
    if (
        value === "default" ||
        value === "dimension_add" ||
        value === "dimension_select"
    ) {
        return value;
    }
    throw new Error(
        "Invalid scene file: interactionMode must be one of default/dimension_add/dimension_select."
    );
};

const parseSceneExtensions = (value: unknown): E2ESceneExtensions => {
    if (!isRecord(value)) {
        throw new Error("Invalid scene file: root must be an object.");
    }

    const parsed: E2ESceneExtensions = {};
    const name = parseOptionalString(value.name, "name");
    const interactionMode = parseOptionalInteractionMode(value.interactionMode);
    const selectedImageId = parseOptionalNullableString(
        value.selectedImageId,
        "selectedImageId"
    );
    const selectedDimensionLineId = parseOptionalNullableString(
        value.selectedDimensionLineId,
        "selectedDimensionLineId"
    );
    const uiHidden = parseOptionalBoolean(value.uiHidden, "uiHidden");

    if (name !== undefined) {
        parsed.name = name;
    }
    if (interactionMode !== undefined) {
        parsed.interactionMode = interactionMode;
    }
    if (selectedImageId !== undefined) {
        parsed.selectedImageId = selectedImageId;
    }
    if (selectedDimensionLineId !== undefined) {
        parsed.selectedDimensionLineId = selectedDimensionLineId;
    }
    if (uiHidden !== undefined) {
        parsed.uiHidden = uiHidden;
    }
    return parsed;
};

export const registerE2EControlHandlers = ({
    e2eConfig,
}: E2EControlRegistrationOptions): void => {
    const captureTestMode: CaptureTestModeOptions = {
        enabled: true,
        captureFilePath: e2eConfig.captureFilePath,
        exportImagePath: e2eConfig.exportImagePath,
        fixedNow: e2eConfig.fixedNow,
    };

    ipcMain.handle(IPC_CHANNELS.e2e.getStatus, (): E2EControlStatus => {
        const enabled = isControlPlaneEnabled(e2eConfig);
        return {
            enabled,
            artifactsDir: e2eConfig.artifactsDir,
            fixturesDir: e2eConfig.fixturesDir,
            reason: enabled ? undefined : getDisabledReason(e2eConfig),
        };
    });

    ipcMain.handle(
        IPC_CHANNELS.e2e.setSceneFromPath,
        async (_event, scenePath: string): Promise<E2EResolvedSceneFile> => {
            assertControlPlaneEnabled(e2eConfig);
            if (
                typeof scenePath !== "string" ||
                scenePath.trim().length === 0
            ) {
                throw new Error("Invalid payload for e2e:setSceneFromPath");
            }
            const normalizedScenePath = path.resolve(scenePath.trim());
            const rawText = await fs.promises.readFile(
                normalizedScenePath,
                "utf-8"
            );
            const extensions = parseSceneExtensions(
                JSON.parse(rawText) as unknown
            );
            const resolvedScene = await loadResolvedSceneFileFromPath(
                normalizedScenePath,
                {
                    allowFixtureAlias: true,
                    fixturesDir: e2eConfig.fixturesDir,
                }
            );

            return {
                ...resolvedScene,
                ...extensions,
            };
        }
    );

    ipcMain.handle(
        IPC_CHANNELS.e2e.loadFixtureImage,
        (
            _event,
            request: E2ELoadFixtureImageRequest
        ): E2EResolvedFixtureImage => {
            assertControlPlaneEnabled(e2eConfig);
            return {
                path: resolveSceneSourcePath(
                    request.source,
                    e2eConfig.fixturesDir,
                    {
                        allowFixtureAlias: true,
                        fixturesDir: e2eConfig.fixturesDir,
                    }
                ),
            };
        }
    );

    ipcMain.handle(IPC_CHANNELS.e2e.waitStable, (): E2EWaitStableResult => {
        assertControlPlaneEnabled(e2eConfig);
        return {
            stable: true,
            elapsedMs: 0,
        };
    });

    ipcMain.handle(
        IPC_CHANNELS.e2e.capture,
        async (event: IpcMainInvokeEvent, request?: E2ECaptureRequest) => {
            assertControlPlaneEnabled(e2eConfig);
            const mode = request?.mode ?? "window";
            if (mode === "screen") {
                return captureWindowAreaAndSave(event, true, captureTestMode);
            }
            return captureWindowAreaAndSave(event, false, captureTestMode);
        }
    );
};
