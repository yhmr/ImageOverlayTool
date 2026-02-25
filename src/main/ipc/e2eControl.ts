import { ipcMain, type IpcMainInvokeEvent } from "electron";
import path from "path";

import type { E2ERuntimeConfig } from "../e2e/runtimeConfig";
import {
    captureWindowAreaAndSave,
    type CaptureTestModeOptions,
} from "../services/captureService";
import { IPC_CHANNELS } from "../../shared/ipc/channels";
import { parseE2ESceneExtensions } from "../repositories/e2eSceneExtensions";
import { loadResolvedSceneDocumentFromPath } from "../repositories/sceneLoader";
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

export const registerE2EControlHandlers = ({
    e2eConfig,
}: E2EControlRegistrationOptions): void => {
    const e2eImagePathAliases = {
        fixtures: path.resolve(e2eConfig.fixturesDir, "images"),
    };

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
            const sceneDocument = await loadResolvedSceneDocumentFromPath(
                scenePath.trim(),
                {
                    imagePathAliases: e2eImagePathAliases,
                }
            );
            const extensions: E2ESceneExtensions = parseE2ESceneExtensions(
                sceneDocument.source
            );

            return {
                ...sceneDocument.resolvedScene,
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
                        imagePathAliases: e2eImagePathAliases,
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
