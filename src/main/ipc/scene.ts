import fs from "fs";
import path from "path";
import { ipcMain } from "electron";

import { IPC_CHANNELS } from "../../shared/ipc/channels";
import type { ResolvedSceneFile } from "../../shared/types/SceneFile";
import type { SceneFile } from "../../shared/types/SceneFile";
import { parseSceneFile } from "../repositories/sceneSchema";
import { isSupportedImagePath } from "../../shared/constants/imageFormats";
import log from "../logger";

const resolveSceneSourcePath = (
    source: string,
    sceneDirectory: string
): string => {
    const trimmedSource = source.trim();
    if (!trimmedSource) {
        throw new Error("Scene image source must not be empty.");
    }

    const resolvedPath = path.isAbsolute(trimmedSource)
        ? path.resolve(trimmedSource)
        : path.resolve(sceneDirectory, trimmedSource);

    if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
        throw new Error(`Scene image file not found: ${resolvedPath}`);
    }

    if (!isSupportedImagePath(resolvedPath)) {
        throw new Error(`Unsupported scene image format: ${resolvedPath}`);
    }

    return resolvedPath;
};

const resolveScene = (
    scene: SceneFile,
    scenePath: string
): ResolvedSceneFile => {
    const sceneDirectory = path.dirname(scenePath);

    return {
        ...scene,
        images: scene.images.map((image) => ({
            path: resolveSceneSourcePath(image.source, sceneDirectory),
            id: image.id,
            transparency: image.transparency,
            rotation: image.rotation,
            locked: image.locked,
            visible: image.visible,
            filters: image.filters,
        })),
    };
};

export const registerSceneHandlers = (): void => {
    ipcMain.handle(
        IPC_CHANNELS.scene.loadFromPath,
        async (_event, scenePath: string): Promise<ResolvedSceneFile> => {
            log.debug(`[IPC] scene:loadFromPath called for: ${scenePath}`);

            if (!scenePath || typeof scenePath !== "string") {
                throw new Error("Invalid payload for scene:loadFromPath");
            }

            const normalizedScenePath = path.resolve(scenePath);
            const rawText = await fs.promises.readFile(
                normalizedScenePath,
                "utf-8"
            );
            const parsed = parseSceneFile(JSON.parse(rawText) as unknown);
            const resolved = resolveScene(parsed, normalizedScenePath);

            log.info(
                `[IPC] scene:loadFromPath completed: ${normalizedScenePath}`
            );
            return resolved;
        }
    );
};
