import fs from "fs";
import os from "os";
import path from "path";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { ipcMain } from "electron";

import type { E2ERuntimeConfig } from "@/main/e2e/runtimeConfig";
import { registerE2EControlHandlers } from "@/main/ipc/e2eControl";
import { invokeIpcHandler } from "../utils/ipcTestHelper";

vi.mock("electron", () => ({
    ipcMain: {
        handle: vi.fn(),
    },
    app: {
        isPackaged: false,
    },
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

    it("rejects scene operation when IOT_E2E_MODE is missing", async () => {
        registerE2EControlHandlers({ e2eConfig: createConfig({ enabled: true }) });

        await expect(
            invokeIpcHandler("e2e:setScene", {}, { images: [] })
        ).rejects.toThrow("IOT_E2E_MODE");
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
});
