import fs from "fs";
import path from "path";
import { ipcMain, type IpcMainInvokeEvent } from "electron";

import type { E2ERuntimeConfig } from "../e2e/runtimeConfig";
import {
    captureWindowAreaAndSave,
    type CaptureTestModeOptions,
} from "../services/captureService";
import { IPC_CHANNELS } from "../../shared/ipc/channels";
import type {
    E2ECaptureRequest,
    E2EControlStatus,
    E2ELoadFixtureImageRequest,
    E2EResolvedFixtureImage,
    E2EResolvedScene,
    E2ESceneInput,
    E2EWaitStableResult,
} from "../../shared/types/E2EControl";

interface E2EControlRegistrationOptions {
    e2eConfig: E2ERuntimeConfig;
}

const SUPPORTED_IMAGE_EXTENSIONS = [
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
    ".svg",
];

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

const resolveFixtureAliasPath = (
    fixturesDir: string,
    alias: string
): string | undefined => {
    const imageDir = path.resolve(fixturesDir, "images");
    const aliasPath = path.resolve(imageDir, alias);
    const ext = path.extname(aliasPath).toLowerCase();

    if (ext.length > 0) {
        return fs.existsSync(aliasPath) ? aliasPath : undefined;
    }

    for (const candidateExt of SUPPORTED_IMAGE_EXTENSIONS) {
        const candidatePath = `${aliasPath}${candidateExt}`;
        if (fs.existsSync(candidatePath)) {
            return candidatePath;
        }
    }

    return undefined;
};

const resolveSceneSourceToAbsolutePath = (
    source: string,
    fixturesDir: string
): string => {
    const trimmedSource = source.trim();
    if (!trimmedSource) {
        throw new Error("Fixture source must not be empty.");
    }

    if (trimmedSource.startsWith("fixture:")) {
        const alias = trimmedSource.slice("fixture:".length);
        const resolvedAliasPath = resolveFixtureAliasPath(fixturesDir, alias);
        if (!resolvedAliasPath) {
            throw new Error(`Fixture alias not found: ${trimmedSource}`);
        }
        return resolvedAliasPath;
    }

    const resolvedPath = path.isAbsolute(trimmedSource)
        ? path.resolve(trimmedSource)
        : path.resolve(fixturesDir, trimmedSource);

    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Fixture path not found: ${resolvedPath}`);
    }

    return resolvedPath;
};

const resolveScene = (
    scene: E2ESceneInput,
    fixturesDir: string
): E2EResolvedScene => {
    if (!Array.isArray(scene.images)) {
        throw new Error("Scene.images must be an array.");
    }

    return {
        ...scene,
        images: scene.images.map((image) => ({
            ...image,
            path: resolveSceneSourceToAbsolutePath(image.source, fixturesDir),
        })),
    };
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
        IPC_CHANNELS.e2e.setScene,
        (_event, scene: E2ESceneInput): E2EResolvedScene => {
            assertControlPlaneEnabled(e2eConfig);
            return resolveScene(scene, e2eConfig.fixturesDir);
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
                path: resolveSceneSourceToAbsolutePath(
                    request.source,
                    e2eConfig.fixturesDir
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
