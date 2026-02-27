/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    mockExposeInMainWorld,
    mockCreateLogApi,
    mockCreateWindowApi,
    mockCreateSettingsApi,
    mockCreateProjectApi,
    mockCreateImageSettingsWindowApi,
    mockCreateSyncApi,
    mockCreateAppEventsApi,
    mockCreateLicenseApi,
    mockCreateCaptureApi,
} = vi.hoisted(() => ({
    mockExposeInMainWorld: vi.fn(),
    mockCreateLogApi: vi.fn(() => ({ logApi: "log" })),
    mockCreateWindowApi: vi.fn(() => ({ windowApi: "window" })),
    mockCreateSettingsApi: vi.fn(() => ({ settingsApi: "settings" })),
    mockCreateProjectApi: vi.fn(() => ({ projectApi: "project" })),
    mockCreateImageSettingsWindowApi: vi.fn(() => ({
        imageSettingsApi: "imageSettings",
    })),
    mockCreateSyncApi: vi.fn(() => ({ syncApi: "sync" })),
    mockCreateAppEventsApi: vi.fn(() => ({ appEventsApi: "appEvents" })),
    mockCreateLicenseApi: vi.fn(() => ({ licenseApi: "license" })),
    mockCreateCaptureApi: vi.fn(() => ({ captureApi: "capture" })),
}));

vi.mock("electron", () => ({
    contextBridge: {
        exposeInMainWorld: mockExposeInMainWorld,
    },
}));

vi.mock("@/preload/ipc/log", () => ({
    createLogApi: mockCreateLogApi,
}));
vi.mock("@/preload/ipc/window", () => ({
    createWindowApi: mockCreateWindowApi,
}));
vi.mock("@/preload/ipc/settings", () => ({
    createSettingsApi: mockCreateSettingsApi,
}));
vi.mock("@/preload/ipc/project", () => ({
    createProjectApi: mockCreateProjectApi,
}));
vi.mock("@/preload/ipc/imageSettingsWindow", () => ({
    createImageSettingsWindowApi: mockCreateImageSettingsWindowApi,
}));
vi.mock("@/preload/ipc/sync", () => ({
    createSyncApi: mockCreateSyncApi,
}));
vi.mock("@/preload/ipc/appEvents", () => ({
    createAppEventsApi: mockCreateAppEventsApi,
}));
vi.mock("@/preload/ipc/license", () => ({
    createLicenseApi: mockCreateLicenseApi,
}));
vi.mock("@/preload/ipc/capture", () => ({
    createCaptureApi: mockCreateCaptureApi,
}));

describe("preload/index", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("exposes merged electronAPI bridge in main world", async () => {
        await import("@/preload/index");

        expect(mockExposeInMainWorld).toHaveBeenCalledTimes(1);
        expect(mockExposeInMainWorld).toHaveBeenCalledWith("electronAPI", {
            logApi: "log",
            windowApi: "window",
            settingsApi: "settings",
            projectApi: "project",
            imageSettingsApi: "imageSettings",
            syncApi: "sync",
            appEventsApi: "appEvents",
            licenseApi: "license",
            captureApi: "capture",
        });
    });
});
