/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { useCapture } from "@/renderer/hooks/useCapture";
import { useProjectOperations } from "@/renderer/hooks/useProjectOperations";
import { useProjectDataSyncBridge } from "@/renderer/hooks/useProjectDataSyncBridge";
import { useAppStore } from "@/renderer/store/useAppStore";

const mockIPC = vi.hoisted(() => ({
    log: {
        debug: vi.fn().mockResolvedValue(undefined),
        info: vi.fn().mockResolvedValue(undefined),
        warn: vi.fn().mockResolvedValue(undefined),
        error: vi.fn().mockResolvedValue(undefined),
    },
    switchWindowSize: vi.fn().mockResolvedValue(true),
    setWindowRect: vi.fn().mockResolvedValue(undefined),
    closeWindow: vi.fn().mockResolvedValue(undefined),
    loadSetting: vi.fn().mockResolvedValue({ language: "ja" }),
    saveSetting: vi.fn().mockResolvedValue(undefined),
    loadWindowColor: vi.fn().mockResolvedValue("#00000000"),
    saveWindowColor: vi.fn().mockResolvedValue(undefined),
    saveProjectAs: vi.fn().mockResolvedValue("C:/tmp/integration.iot"),
    saveProject: vi.fn().mockResolvedValue(true),
    loadProject: vi.fn().mockResolvedValue(null),
    loadProjectFromPath: vi.fn().mockResolvedValue(null),
    loadImage: vi.fn().mockResolvedValue(null),
    toggleImageSettingsWindow: vi.fn().mockResolvedValue(true),
    toggleDimensionSettingsWindow: vi.fn().mockResolvedValue(true),
    updateImageSets: vi.fn().mockResolvedValue(undefined),
    onImageSetsUpdated: vi.fn(() => vi.fn()),
    updateDimensionLines: vi.fn().mockResolvedValue(undefined),
    onDimensionLinesUpdated: vi.fn(() => vi.fn()),
    updateUnitFactor: vi.fn().mockResolvedValue(undefined),
    onUnitFactorUpdated: vi.fn(() => vi.fn()),
    updateUnit: vi.fn().mockResolvedValue(undefined),
    onUnitUpdated: vi.fn(() => vi.fn()),
    updateInteractionMode: vi.fn().mockResolvedValue(undefined),
    onInteractionModeUpdated: vi.fn(() => vi.fn()),
    requestInitialState: vi.fn().mockResolvedValue(undefined),
    onRequestStateSync: vi.fn(() => vi.fn()),
    onFileOpen: vi.fn(() => vi.fn()),
    getLicenseInfo: vi.fn().mockResolvedValue([]),
    getAppVersion: vi.fn().mockResolvedValue("1.0.0"),
    captureScreen: vi.fn().mockResolvedValue({
        filePath: "C:/captures/sample.png",
        width: 1920,
        height: 1080,
    }),
    captureWindow: vi.fn().mockResolvedValue({
        filePath: "C:/captures/window.png",
        width: 1280,
        height: 720,
    }),
    saveImage: vi.fn().mockResolvedValue("C:/tmp/saved.png"),
}));

vi.mock("@/renderer/services/ipcService", () => ({
    getIPCService: () => mockIPC,
    setIPCService: vi.fn(),
}));

describe("Renderer workflow: image add -> settings change -> save", () => {
    beforeEach(() => {
        useAppStore.getState().resetAll();
        vi.clearAllMocks();
    });

    it("captures image, applies setting change, and saves latest state", async () => {
        renderHook(() => useProjectDataSyncBridge());
        const { result: capture } = renderHook(() => useCapture());
        const { result: projectOps } = renderHook(() => useProjectOperations());

        await act(async () => {
            await capture.current.captureBackground();
        });

        const capturedImage = useAppStore.getState().imageSets[0];
        expect(capturedImage.path).toContain(
            "local-file://C:/captures/sample.png"
        );
        expect(mockIPC.updateImageSets).toHaveBeenCalledTimes(1);

        act(() => {
            useAppStore.getState().updateImageSet({
                index: 0,
                imageSet: {
                    ...capturedImage,
                    transparency: 35,
                    rotation: 12,
                },
            });
        });

        await act(async () => {
            await projectOps.current.saveProjectAs();
        });

        expect(mockIPC.saveProjectAs).toHaveBeenCalledTimes(1);

        const savedProject = mockIPC.saveProjectAs.mock.calls[0][0];
        expect(savedProject.images).toHaveLength(1);
        expect(savedProject.images[0].transparency).toBe(35);
        expect(savedProject.images[0].rotation).toBe(12);
        expect(savedProject.settings.unitFactor).toBe(
            useAppStore.getState().unitFactor
        );
        expect(savedProject.settings.unit).toBe(useAppStore.getState().unit);

        // capture + updateImageSet の2回で同期送信される
        expect(mockIPC.updateImageSets).toHaveBeenCalledTimes(2);
    });

    it("does not mutate image state when capture returns null", async () => {
        mockIPC.captureScreen.mockResolvedValueOnce(null);

        renderHook(() => useProjectDataSyncBridge());
        const { result: capture } = renderHook(() => useCapture());

        const before = useAppStore.getState().imageSets;

        await act(async () => {
            await capture.current.captureBackground();
        });

        const after = useAppStore.getState().imageSets;

        expect(after).toEqual(before);
        expect(mockIPC.updateImageSets).not.toHaveBeenCalled();
    });
});
