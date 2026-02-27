import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { E2ERuntimeConfig } from "@/main/e2e/runtimeConfig";
import { registerE2EControlHandlers } from "@/main/ipc/e2eControl";
import type {
    E2EControlStatus,
    E2EResolvedFixtureImage,
    E2EResolvedSceneFile,
} from "@/shared/types/E2EControl";
import { invokeIpcHandler } from "../../../support/helpers/ipcTestHelper";

const { mockCaptureWindowAreaAndSave } = vi.hoisted(() => ({
    mockCaptureWindowAreaAndSave: vi.fn(),
}));

vi.mock("electron", () => ({
    ipcMain: {
        handle: vi.fn(),
    },
    app: {
        isPackaged: false,
    },
}));

vi.mock("@/main/services/captureService", () => ({
    captureWindowAreaAndSave: mockCaptureWindowAreaAndSave,
}));

const ORIGINAL_ENV = { ...process.env };

const createConfig = (
    overrides: Partial<E2ERuntimeConfig> = {}
): E2ERuntimeConfig => ({
    enabled: false,
    artifactsDir: path.resolve("test-results", "e2e-artifacts"),
    fixturesDir: path.resolve("e2e", "fixtures"),
    projectFilePath: path.resolve(
        "test-results",
        "e2e-artifacts",
        "project.e2e.iot"
    ),
    captureFilePath: path.resolve(
        "test-results",
        "e2e-artifacts",
        "capture.e2e.png"
    ),
    exportImagePath: path.resolve(
        "test-results",
        "e2e-artifacts",
        "export.e2e.png"
    ),
    fixedNow: 1700000000000,
    randomSeed: 424242,
    ...overrides,
});

describe("e2e control ipc handlers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env = { ...ORIGINAL_ENV };
    });

    afterEach(() => {
        process.env = { ...ORIGINAL_ENV };
    });

    it("returns disabled status when e2e flag is off", async () => {
        registerE2EControlHandlers({ e2eConfig: createConfig({ enabled: false }) });

        const status = await invokeIpcHandler<E2EControlStatus>("e2e:getStatus");
        expect(status.enabled).toBe(false);
        expect(status.reason).toContain("--e2e");
    });

    it("returns disabled status when IOT_E2E_MODE is off", async () => {
        registerE2EControlHandlers({ e2eConfig: createConfig({ enabled: true }) });

        const status = await invokeIpcHandler<E2EControlStatus>("e2e:getStatus");
        expect(status.enabled).toBe(false);
        expect(status.reason).toContain("IOT_E2E_MODE");
    });

    it("returns enabled status when control plane is fully enabled", async () => {
        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({ e2eConfig: createConfig({ enabled: true }) });

        const status = await invokeIpcHandler<E2EControlStatus>("e2e:getStatus");
        expect(status.enabled).toBe(true);
        expect(status.reason).toBeUndefined();
    });

    it("rejects setSceneFromPath when IOT_E2E_MODE is missing", async () => {
        registerE2EControlHandlers({ e2eConfig: createConfig({ enabled: true }) });

        await expect(
            invokeIpcHandler("e2e:setSceneFromPath", {}, "scene.scene.json")
        ).rejects.toThrow("IOT_E2E_MODE");
    });

    it("resolves @fixtures alias in enabled e2e mode", async () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "iot-e2e-fixtures-"));
        const imageDir = path.join(tempRoot, "images");
        fs.mkdirSync(imageDir, { recursive: true });
        const fixturePath = path.join(imageDir, "placeholder.png");
        fs.writeFileSync(fixturePath, "fixture-bytes");

        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({
            e2eConfig: createConfig({ enabled: true, fixturesDir: tempRoot }),
        });

        const resolved = await invokeIpcHandler<E2EResolvedFixtureImage>(
            "e2e:loadFixtureImage",
            {},
            { source: "@fixtures/placeholder.png" }
        );
        expect(resolved.path).toBe(fixturePath);
    });

    it("resolves relative path in enabled e2e mode", async () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "iot-e2e-fixtures-"));
        const imageDir = path.join(tempRoot, "images");
        fs.mkdirSync(imageDir, { recursive: true });
        const fixturePath = path.join(imageDir, "exact.png");
        fs.writeFileSync(fixturePath, "fixture-bytes");

        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({
            e2eConfig: createConfig({ enabled: true, fixturesDir: tempRoot }),
        });

        const resolved = await invokeIpcHandler<E2EResolvedFixtureImage>(
            "e2e:loadFixtureImage",
            {},
            { source: "images/exact.png" }
        );
        expect(resolved.path).toBe(fixturePath);
    });

    it("loads versioned scene from path with @fixtures alias, relative path, alias path and absolute path", async () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "iot-e2e-fixtures-"));
        const imageDir = path.join(tempRoot, "images");
        const aliasedImageDir = path.join(tempRoot, "aliased-images");
        const sceneDir = path.join(tempRoot, "scenes");
        fs.mkdirSync(imageDir, { recursive: true });
        fs.mkdirSync(aliasedImageDir, { recursive: true });
        fs.mkdirSync(sceneDir, { recursive: true });

        const fixturePath = path.join(imageDir, "fixture-image.png");
        const aliasedPath = path.join(aliasedImageDir, "aliased.png");
        const relativePath = path.join(sceneDir, "relative.png");
        const absolutePath = path.join(tempRoot, "absolute.png");
        fs.writeFileSync(fixturePath, "fixture");
        fs.writeFileSync(aliasedPath, "aliased");
        fs.writeFileSync(relativePath, "relative");
        fs.writeFileSync(absolutePath, "absolute");

        const scenePath = path.join(sceneDir, "versioned.scene.json");
        fs.writeFileSync(
            scenePath,
            JSON.stringify({
                version: "1.0.0",
                name: "versioned-scene",
                interactionMode: "dimension_select",
                selectedImageId: "img-b",
                selectedDimensionLineId: null,
                uiHidden: true,
                window: { color: "#00000000" },
                unitFactor: 3,
                unit: "mm",
                imagePathAliases: {
                    fixtures: "../images",
                    assets: "../aliased-images",
                },
                images: [
                    { id: "img-a", source: "@fixtures/fixture-image.png" },
                    { id: "img-b", source: "./relative.png" },
                    { id: "img-d", source: "@assets/aliased.png" },
                    { id: "img-c", source: absolutePath },
                ],
            })
        );

        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({
            e2eConfig: createConfig({ enabled: true, fixturesDir: tempRoot }),
        });

        const resolved = await invokeIpcHandler<E2EResolvedSceneFile>(
            "e2e:setSceneFromPath",
            {},
            scenePath
        );
        expect(resolved.unitFactor).toBe(3);
        expect(resolved.unit).toBe("mm");
        expect(resolved.name).toBe("versioned-scene");
        expect(resolved.interactionMode).toBe("dimension_select");
        expect(resolved.selectedImageId).toBe("img-b");
        expect(resolved.selectedDimensionLineId).toBeNull();
        expect(resolved.uiHidden).toBe(true);
        expect(resolved.window?.color).toBe("#00000000");
        expect(resolved.images[0].path).toBe(fixturePath);
        expect(resolved.images[1].path).toBe(relativePath);
        expect(resolved.images[2].path).toBe(aliasedPath);
        expect(resolved.images[3].path).toBe(absolutePath);
    });

    it("rejects invalid e2e extension fields in scene file", async () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "iot-e2e-fixtures-"));
        const imageDir = path.join(tempRoot, "images");
        const sceneDir = path.join(tempRoot, "scenes");
        fs.mkdirSync(imageDir, { recursive: true });
        fs.mkdirSync(sceneDir, { recursive: true });

        const fixturePath = path.join(imageDir, "fixture-image.png");
        fs.writeFileSync(fixturePath, "fixture");

        const scenePath = path.join(sceneDir, "invalid-extension.scene.json");
        fs.writeFileSync(
            scenePath,
            JSON.stringify({
                version: "1.0.0",
                interactionMode: "invalid-mode",
                imagePathAliases: {
                    fixtures: "../images",
                },
                images: [{ source: "@fixtures/fixture-image.png" }],
            })
        );

        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({
            e2eConfig: createConfig({ enabled: true, fixturesDir: tempRoot }),
        });

        await expect(
            invokeIpcHandler("e2e:setSceneFromPath", {}, scenePath)
        ).rejects.toThrow(
            "interactionMode must be one of default/dimension_add/dimension_select"
        );
    });

    it("rejects invalid scenePath payload for setSceneFromPath", async () => {
        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({
            e2eConfig: createConfig({ enabled: true }),
        });

        await expect(
            invokeIpcHandler("e2e:setSceneFromPath", {}, "   ")
        ).rejects.toThrow("Invalid payload for e2e:setSceneFromPath");
    });

    it("rejects undefined image alias for loadFixtureImage", async () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "iot-e2e-fixtures-"));
        fs.mkdirSync(path.join(tempRoot, "images"), { recursive: true });

        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({
            e2eConfig: createConfig({ enabled: true, fixturesDir: tempRoot }),
        });

        await expect(
            invokeIpcHandler("e2e:loadFixtureImage", {}, { source: "@assets/sample.png" })
        ).rejects.toThrow("Scene image alias is not defined");
    });

    it("rejects invalid alias source syntax for loadFixtureImage", async () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "iot-e2e-fixtures-"));
        fs.mkdirSync(path.join(tempRoot, "images"), { recursive: true });

        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({
            e2eConfig: createConfig({ enabled: true, fixturesDir: tempRoot }),
        });

        await expect(
            invokeIpcHandler("e2e:loadFixtureImage", {}, { source: "@fixtures/" })
        ).rejects.toThrow("Invalid scene image source alias syntax");
    });

    it("rejects @fixtures alias path when file does not exist", async () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "iot-e2e-fixtures-"));
        fs.mkdirSync(path.join(tempRoot, "images"), { recursive: true });

        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({
            e2eConfig: createConfig({ enabled: true, fixturesDir: tempRoot }),
        });

        await expect(
            invokeIpcHandler("e2e:loadFixtureImage", {}, { source: "@fixtures/ghost.png" })
        ).rejects.toThrow("Scene image file not found");
    });

    it("rejects empty source for loadFixtureImage", async () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "iot-e2e-fixtures-"));
        fs.mkdirSync(path.join(tempRoot, "images"), { recursive: true });

        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({
            e2eConfig: createConfig({ enabled: true, fixturesDir: tempRoot }),
        });

        await expect(
            invokeIpcHandler("e2e:loadFixtureImage", {}, { source: "   " })
        ).rejects.toThrow("Scene image source must not be empty");
    });

    it("rejects non-alias path when file does not exist", async () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "iot-e2e-fixtures-"));
        fs.mkdirSync(path.join(tempRoot, "images"), { recursive: true });

        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({
            e2eConfig: createConfig({ enabled: true, fixturesDir: tempRoot }),
        });

        await expect(
            invokeIpcHandler("e2e:loadFixtureImage", {}, { source: "scenes/missing.png" })
        ).rejects.toThrow("Scene image file not found");
    });

    it("waitStable returns stable result when enabled", async () => {
        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({
            e2eConfig: createConfig({ enabled: true }),
        });

        const result = await invokeIpcHandler("e2e:waitStable");
        expect(result).toEqual({ stable: true, elapsedMs: 0 });
    });

    it("capture delegates with hide=true when mode is screen", async () => {
        process.env.IOT_E2E_MODE = "1";
        mockCaptureWindowAreaAndSave.mockResolvedValue({
            filePath: "capture.png",
            width: 10,
            height: 10,
        });

        const cfg = createConfig({ enabled: true });
        registerE2EControlHandlers({ e2eConfig: cfg });

        const event = { sender: { id: 1 } };
        await invokeIpcHandler("e2e:capture", event, { mode: "screen" });

        expect(mockCaptureWindowAreaAndSave).toHaveBeenCalledWith(
            event,
            true,
            expect.objectContaining({
                enabled: true,
                captureFilePath: cfg.captureFilePath,
                exportImagePath: cfg.exportImagePath,
                fixedNow: cfg.fixedNow,
            })
        );
    });

    it("capture delegates with hide=false by default", async () => {
        process.env.IOT_E2E_MODE = "1";
        mockCaptureWindowAreaAndSave.mockResolvedValue({
            filePath: "capture.png",
            width: 10,
            height: 10,
        });

        registerE2EControlHandlers({
            e2eConfig: createConfig({ enabled: true }),
        });

        const event = { sender: { id: 2 } };
        await invokeIpcHandler("e2e:capture", event, undefined);

        expect(mockCaptureWindowAreaAndSave).toHaveBeenCalledWith(
            event,
            false,
            expect.objectContaining({ enabled: true })
        );
    });
});
