import { describe, it, expect, vi, beforeEach } from "vitest";
import * as path from "path";
import { app } from "electron";
import * as fs from "fs";

import { registerLicenseIpc } from "@/main/ipc/license";
import { IPC_CHANNELS } from "@/shared/ipc/channels";
import { invokeIpcHandler } from "../../../support/helpers/ipcTestHelper";

const { existsSync, readFileSync, logDebug, logInfo, logWarn, logError } =
    vi.hoisted(() => ({
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
        logDebug: vi.fn(),
        logInfo: vi.fn(),
        logWarn: vi.fn(),
        logError: vi.fn(),
    }));

vi.mock("electron", () => ({
    ipcMain: {
        handle: vi.fn(),
    },
    app: {
        isPackaged: false,
        getAppPath: vi.fn(),
        getVersion: vi.fn(),
    },
}));

vi.mock("fs", () => ({
    default: {
        existsSync,
        readFileSync,
    },
    existsSync,
    readFileSync,
}));

vi.mock("@/main/logger", () => ({
    default: {
        debug: logDebug,
        info: logInfo,
        warn: logWarn,
        error: logError,
    },
}));

const mockedApp = app as unknown as {
    isPackaged: boolean;
    getAppPath: () => string;
    getVersion: () => string;
};

const processWithResources = process as NodeJS.Process & {
    resourcesPath?: string;
};

describe("license IPC handlers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedApp.isPackaged = false;
        vi.mocked(mockedApp.getAppPath).mockReturnValue("C:\\dev\\ImageOverlayTool");
        vi.mocked(mockedApp.getVersion).mockReturnValue("1.1.0");
        processWithResources.resourcesPath = "C:\\resources\\ImageOverlayTool";
        vi.mocked(fs.existsSync).mockReturnValue(false);
        vi.mocked(fs.readFileSync).mockReturnValue("[]");

        registerLicenseIpc();
    });

    it("returns app version", async () => {
        const version = await invokeIpcHandler<string>(IPC_CHANNELS.license.appVersion);

        expect(version).toBe("1.1.0");
    });

    it("loads licenses from app path in development mode", async () => {
        const expectedPath = path.join(
            "C:\\dev\\ImageOverlayTool",
            "licenses.json"
        );
        const expectedData = [
            {
                name: "sample@1.0.0",
                licenses: "MIT",
                repository: "https://example.invalid/repo",
                publisher: "example",
                url: "https://example.invalid",
            },
        ];

        vi.mocked(fs.existsSync).mockImplementation(
            (target) => target === expectedPath
        );
        vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(expectedData));

        const result = await invokeIpcHandler(IPC_CHANNELS.license.get);

        expect(fs.existsSync).toHaveBeenCalledWith(expectedPath);
        expect(fs.readFileSync).toHaveBeenCalledWith(expectedPath, "utf-8");
        expect(result).toEqual(expectedData);
    });

    it("falls back to executable directory when resources path file is missing", async () => {
        mockedApp.isPackaged = true;
        const resourcesPath = path.join(
            processWithResources.resourcesPath ?? "",
            "licenses.json"
        );
        const executablePath = path.join(
            path.dirname(process.execPath),
            "licenses.json"
        );

        vi.mocked(fs.existsSync).mockImplementation(
            (target) => target === executablePath
        );
        vi.mocked(fs.readFileSync).mockReturnValue("[]");

        await invokeIpcHandler(IPC_CHANNELS.license.get);

        expect(fs.existsSync).toHaveBeenNthCalledWith(1, resourcesPath);
        expect(fs.existsSync).toHaveBeenNthCalledWith(2, executablePath);
        expect(fs.readFileSync).toHaveBeenCalledWith(executablePath, "utf-8");
    });

    it("returns empty licenses when candidate files do not exist", async () => {
        mockedApp.isPackaged = true;
        vi.mocked(fs.existsSync).mockReturnValue(false);

        const result = await invokeIpcHandler(IPC_CHANNELS.license.get);

        expect(result).toEqual([]);
        expect(fs.readFileSync).not.toHaveBeenCalled();
        expect(logWarn).toHaveBeenCalledTimes(1);
    });
});

