import fs from "fs";
import os from "os";
import path from "path";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { ipcMain } from "electron";

import type { E2ERuntimeConfig } from "@/main/e2e/runtimeConfig";
import { registerE2EControlHandlers } from "@/main/ipc/e2eControl";
import { invokeIpcHandler } from "../utils/ipcTestHelper";

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

const createConfig = (overrides: Partial<E2ERuntimeConfig> = {}): E2ERuntimeConfig => ({
    enabled: false,
    artifactsDir: path.resolve("test-results", "e2e-artifacts"),
    fixturesDir: path.resolve("e2e", "fixtures"),
    projectFilePath: path.resolve("test-results", "e2e-artifacts", "project.e2e.iot"),
    captureFilePath: path.resolve("test-results", "e2e-artifacts", "capture.e2e.png"),
    exportImagePath: path.resolve("test-results", "e2e-artifacts", "export.e2e.png"),
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

    it("registers e2e control channels", () => {
        registerE2EControlHandlers({ e2eConfig: createConfig() });

        expect(ipcMain.handle).toHaveBeenCalledWith(
            "e2e:getStatus",
            expect.any(Function)
        );
        expect(ipcMain.handle).toHaveBeenCalledWith(
            "e2e:setScene",
            expect.any(Function)
        );
        expect(ipcMain.handle).toHaveBeenCalledWith(
            "e2e:loadFixtureImage",
            expect.any(Function)
        );
        expect(ipcMain.handle).toHaveBeenCalledWith(
            "e2e:waitStable",
            expect.any(Function)
        );
        expect(ipcMain.handle).toHaveBeenCalledWith(
            "e2e:capture",
            expect.any(Function)
        );
    });

    it("returns disabled status when e2e flag is off", async () => {
        registerE2EControlHandlers({ e2eConfig: createConfig({ enabled: false }) });

        const status = await invokeIpcHandler("e2e:getStatus");
        expect(status.enabled).toBe(false);
        expect(status.reason).toContain("--e2e");
    });

    it("returns disabled status when IOT_E2E_MODE is off", async () => {
        registerE2EControlHandlers({ e2eConfig: createConfig({ enabled: true }) });

        const status = await invokeIpcHandler("e2e:getStatus");
        expect(status.enabled).toBe(false);
        expect(status.reason).toContain("IOT_E2E_MODE");
    });

    it("returns enabled status when control plane is fully enabled", async () => {
        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({ e2eConfig: createConfig({ enabled: true }) });

        const status = await invokeIpcHandler("e2e:getStatus");
        expect(status.enabled).toBe(true);
        expect(status.reason).toBeUndefined();
    });

    it("rejects scene operation when IOT_E2E_MODE is missing", async () => {
        registerE2EControlHandlers({ e2eConfig: createConfig({ enabled: true }) });

        await expect(
            invokeIpcHandler("e2e:setScene", {}, { images: [] })
        ).rejects.toThrow("IOT_E2E_MODE");
    });

    it("rejects scene payload when images is not an array", async () => {
        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({ e2eConfig: createConfig({ enabled: true }) });

        await expect(
            invokeIpcHandler("e2e:setScene", {}, { images: {} })
        ).rejects.toThrow("Scene.images must be an array");
    });

    it("resolves fixture alias in enabled e2e mode", async () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "iot-e2e-fixtures-"));
        const imageDir = path.join(tempRoot, "images");
        fs.mkdirSync(imageDir, { recursive: true });
        const fixturePath = path.join(imageDir, "placeholder.png");
        fs.writeFileSync(fixturePath, "fixture-bytes");

        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({
            e2eConfig: createConfig({ enabled: true, fixturesDir: tempRoot }),
        });

        const resolved = await invokeIpcHandler(
            "e2e:loadFixtureImage",
            {},
            { source: "fixture:placeholder" }
        );
        expect(resolved.path).toBe(fixturePath);
    });

    it("resolves fixture alias with explicit extension when file exists", async () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "iot-e2e-fixtures-"));
        const imageDir = path.join(tempRoot, "images");
        fs.mkdirSync(imageDir, { recursive: true });
        const fixturePath = path.join(imageDir, "exact.png");
        fs.writeFileSync(fixturePath, "fixture-bytes");

        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({
            e2eConfig: createConfig({ enabled: true, fixturesDir: tempRoot }),
        });

        const resolved = await invokeIpcHandler(
            "e2e:loadFixtureImage",
            {},
            { source: "fixture:exact.png" }
        );
        expect(resolved.path).toBe(fixturePath);
    });

    it("resolves scene image sources for fixture alias, relative path and absolute path", async () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "iot-e2e-fixtures-"));
        const imageDir = path.join(tempRoot, "images");
        const sceneDir = path.join(tempRoot, "scenes");
        fs.mkdirSync(imageDir, { recursive: true });
        fs.mkdirSync(sceneDir, { recursive: true });

        const fixturePath = path.join(imageDir, "fixture-image.png");
        const relativePath = path.join(sceneDir, "relative.png");
        const absolutePath = path.join(tempRoot, "absolute.png");
        fs.writeFileSync(fixturePath, "fixture");
        fs.writeFileSync(relativePath, "relative");
        fs.writeFileSync(absolutePath, "absolute");

        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({
            e2eConfig: createConfig({ enabled: true, fixturesDir: tempRoot }),
        });

        const resolved = await invokeIpcHandler("e2e:setScene", {}, {
            images: [
                { id: "img-a", source: "fixture:fixture-image" },
                { id: "img-b", source: "scenes/relative.png" },
                { id: "img-c", source: absolutePath },
            ],
        });

        expect(resolved.images[0].path).toBe(fixturePath);
        expect(resolved.images[1].path).toBe(relativePath);
        expect(resolved.images[2].path).toBe(absolutePath);
    });

    it("rejects fixture alias that escapes fixtures/images", async () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "iot-e2e-fixtures-"));
        const scenesDir = path.join(tempRoot, "scenes");
        fs.mkdirSync(scenesDir, { recursive: true });
        fs.writeFileSync(path.join(scenesDir, "outside.png"), "fixture-bytes");

        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({
            e2eConfig: createConfig({ enabled: true, fixturesDir: tempRoot }),
        });

        await expect(
            invokeIpcHandler("e2e:loadFixtureImage", {}, { source: "fixture:../scenes/outside" })
        ).rejects.toThrow("escapes fixtures/images");
    });

    it("rejects fixture alias with unsupported explicit extension", async () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "iot-e2e-fixtures-"));
        const imageDir = path.join(tempRoot, "images");
        fs.mkdirSync(imageDir, { recursive: true });
        fs.writeFileSync(path.join(imageDir, "sample.txt"), "not-image");

        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({
            e2eConfig: createConfig({ enabled: true, fixturesDir: tempRoot }),
        });

        await expect(
            invokeIpcHandler("e2e:loadFixtureImage", {}, { source: "fixture:sample.txt" })
        ).rejects.toThrow("Unsupported fixture alias extension");
    });

    it("rejects empty fixture alias", async () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "iot-e2e-fixtures-"));
        fs.mkdirSync(path.join(tempRoot, "images"), { recursive: true });

        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({
            e2eConfig: createConfig({ enabled: true, fixturesDir: tempRoot }),
        });

        await expect(
            invokeIpcHandler("e2e:loadFixtureImage", {}, { source: "fixture:   " })
        ).rejects.toThrow("Fixture alias must not be empty");
    });

    it("rejects unsupported fixture alias when no file matches candidate extensions", async () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "iot-e2e-fixtures-"));
        fs.mkdirSync(path.join(tempRoot, "images"), { recursive: true });

        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({
            e2eConfig: createConfig({ enabled: true, fixturesDir: tempRoot }),
        });

        await expect(
            invokeIpcHandler("e2e:loadFixtureImage", {}, { source: "fixture:not-found" })
        ).rejects.toThrow("Fixture alias not found");
    });

    it("rejects fixture alias with explicit supported extension when file does not exist", async () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "iot-e2e-fixtures-"));
        fs.mkdirSync(path.join(tempRoot, "images"), { recursive: true });

        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({
            e2eConfig: createConfig({ enabled: true, fixturesDir: tempRoot }),
        });

        await expect(
            invokeIpcHandler("e2e:loadFixtureImage", {}, { source: "fixture:ghost.png" })
        ).rejects.toThrow("Fixture alias not found");
    });

    it("rejects empty fixture source", async () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "iot-e2e-fixtures-"));
        fs.mkdirSync(path.join(tempRoot, "images"), { recursive: true });

        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({
            e2eConfig: createConfig({ enabled: true, fixturesDir: tempRoot }),
        });

        await expect(
            invokeIpcHandler("e2e:loadFixtureImage", {}, { source: "   " })
        ).rejects.toThrow("Fixture source must not be empty");
    });

    it("rejects non-fixture path when file does not exist", async () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "iot-e2e-fixtures-"));
        fs.mkdirSync(path.join(tempRoot, "images"), { recursive: true });

        process.env.IOT_E2E_MODE = "1";
        registerE2EControlHandlers({
            e2eConfig: createConfig({ enabled: true, fixturesDir: tempRoot }),
        });

        await expect(
            invokeIpcHandler("e2e:loadFixtureImage", {}, { source: "scenes/missing.png" })
        ).rejects.toThrow("Fixture path not found");
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
