import fs from "fs";
import os from "os";
import path from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { registerSceneHandlers } from "@/main/ipc/scene";
import {
    SCENE_FILE_VERSION,
    type ResolvedSceneFile,
} from "@/shared/types/SceneFile";
import { IPC_CHANNELS } from "@/shared/ipc/channels";
import { invokeIpcHandler } from "../../../support/helpers/ipcTestHelper";

vi.mock("electron", () => ({
    ipcMain: {
        handle: vi.fn(),
    },
}));

vi.mock("@/main/logger", () => ({
    default: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe("scene IPC handlers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        registerSceneHandlers();
    });

    it("loads scene and resolves relative image paths", async () => {
        const tempDir = await fs.promises.mkdtemp(
            path.join(os.tmpdir(), "iot-scene-")
        );
        const imagePath = path.join(tempDir, "sample.png");
        const scenePath = path.join(tempDir, "default.scene.json");

        try {
            await fs.promises.writeFile(imagePath, "png");
            await fs.promises.writeFile(
                scenePath,
                JSON.stringify({
                    version: SCENE_FILE_VERSION,
                    images: [{ source: "sample.png", transparency: 0.25 }],
                }),
                "utf-8"
            );

            const result = await invokeIpcHandler<ResolvedSceneFile>(
                IPC_CHANNELS.scene.loadFromPath,
                {},
                scenePath
            );

            expect(result).toEqual({
                version: SCENE_FILE_VERSION,
                images: [
                    {
                        path: path.resolve(imagePath),
                        transparency: 0.25,
                        id: undefined,
                        rotation: undefined,
                        locked: undefined,
                        visible: undefined,
                        filters: undefined,
                    },
                ],
                window: undefined,
                unitFactor: undefined,
                unit: undefined,
                canvas: undefined,
                imagePathAliases: undefined,
                dimensionLines: undefined,
            });
        } finally {
            await fs.promises.rm(tempDir, { recursive: true, force: true });
        }
    });

    it("loads scene and resolves image path aliases", async () => {
        const tempDir = await fs.promises.mkdtemp(
            path.join(os.tmpdir(), "iot-scene-")
        );
        const imageDir = path.join(tempDir, "images");
        const imagePath = path.join(imageDir, "sample.png");
        const scenePath = path.join(tempDir, "aliased.scene.json");

        try {
            await fs.promises.mkdir(imageDir, { recursive: true });
            await fs.promises.writeFile(imagePath, "png");
            await fs.promises.writeFile(
                scenePath,
                JSON.stringify({
                    version: SCENE_FILE_VERSION,
                    imagePathAliases: {
                        assets: "./images",
                    },
                    images: [{ source: "@assets/sample.png" }],
                }),
                "utf-8"
            );

            const result = await invokeIpcHandler<ResolvedSceneFile>(
                IPC_CHANNELS.scene.loadFromPath,
                {},
                scenePath
            );

            expect(result.images[0].path).toBe(path.resolve(imagePath));
            expect(result.imagePathAliases).toEqual({
                assets: "./images",
            });
        } finally {
            await fs.promises.rm(tempDir, { recursive: true, force: true });
        }
    });

    it("rejects invalid payload", async () => {
        await expect(
            invokeIpcHandler(IPC_CHANNELS.scene.loadFromPath, {}, 123)
        ).rejects.toThrow("Invalid payload for scene:loadFromPath");
    });

    it("rejects scene when image file is missing", async () => {
        const tempDir = await fs.promises.mkdtemp(
            path.join(os.tmpdir(), "iot-scene-")
        );
        const scenePath = path.join(tempDir, "missing.scene.json");

        try {
            await fs.promises.writeFile(
                scenePath,
                JSON.stringify({
                    version: SCENE_FILE_VERSION,
                    images: [{ source: "not-found.png" }],
                }),
                "utf-8"
            );

            await expect(
                invokeIpcHandler(
                    IPC_CHANNELS.scene.loadFromPath,
                    {},
                    scenePath
                )
            ).rejects.toThrow("Scene image file not found");
        } finally {
            await fs.promises.rm(tempDir, { recursive: true, force: true });
        }
    });

    it("rejects scene when source uses undefined image alias", async () => {
        const tempDir = await fs.promises.mkdtemp(
            path.join(os.tmpdir(), "iot-scene-")
        );
        const scenePath = path.join(tempDir, "missing-alias.scene.json");

        try {
            await fs.promises.writeFile(
                scenePath,
                JSON.stringify({
                    version: SCENE_FILE_VERSION,
                    images: [{ source: "@assets/sample.png" }],
                }),
                "utf-8"
            );

            await expect(
                invokeIpcHandler(
                    IPC_CHANNELS.scene.loadFromPath,
                    {},
                    scenePath
                )
            ).rejects.toThrow("Scene image alias is not defined");
        } finally {
            await fs.promises.rm(tempDir, { recursive: true, force: true });
        }
    });
});
