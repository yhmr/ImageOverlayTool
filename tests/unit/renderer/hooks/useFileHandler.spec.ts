/**
 * @vitest-environment happy-dom
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useFileHandler } from "@/renderer/main-window/hooks/useFileHandler";
import {
    resetIPCService,
    setIPCService,
} from "@/renderer/services/ipcService";
import { useAppStore } from "@/renderer/store/useAppStore";
import { toLocalFileUrl } from "@/shared/utils/localFileUrl";
import { MockIPCService } from "../../support/mocks/MockIPCService";

const flushAsync = (): Promise<void> =>
    new Promise((resolve) => {
        setTimeout(resolve, 0);
    });

describe("useFileHandler", () => {
    let mockService: MockIPCService;
    let fileOpenCallback: ((filePath: string, ext: string) => void) | null;
    let alertMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        useAppStore.getState().resetAll();
        resetIPCService();
        vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
        alertMock = vi.fn();
        vi.stubGlobal("alert", alertMock);

        mockService = new MockIPCService();
        fileOpenCallback = null;
        mockService.onFileOpen = vi.fn((callback) => {
            fileOpenCallback = callback;
            return () => {
                fileOpenCallback = null;
            };
        });
        mockService.loadSceneFromPath = vi.fn();
        mockService.loadProjectFromPath = vi.fn().mockResolvedValue(null);
        mockService.log.debug = vi.fn().mockResolvedValue(undefined);
        mockService.log.error = vi.fn().mockResolvedValue(undefined);

        setIPCService(mockService);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("applies scene file and marks project as clean", async () => {
        mockService.loadSceneFromPath = vi.fn().mockResolvedValue({
            version: "1.0.0",
            window: {
                color: "#11223344",
                alwaysOnTop: true,
                clickThrough: true,
                showWindowFrame: true,
            },
            unitFactor: 2,
            unit: "mm",
            canvas: { x: 10, y: 20, scale: 1.5 },
            images: [
                {
                    id: "scene-image-1",
                    path: "C:/tmp/scene-image.png",
                    transparency: 0.25,
                    rotation: 15,
                    locked: true,
                    visible: false,
                },
            ],
            dimensionLines: [
                {
                    id: "line-1",
                    start: { x: 0, y: 0 },
                    end: { x: 5, y: 5 },
                },
            ],
        });

        renderHook(() => useFileHandler());
        expect(fileOpenCallback).toBeTypeOf("function");

        await act(async () => {
            fileOpenCallback?.("C:/tmp/default.scene.json", ".json");
            await flushAsync();
        });

        const state = useAppStore.getState();

        expect(mockService.loadSceneFromPath).toHaveBeenCalledWith(
            "C:/tmp/default.scene.json"
        );
        expect(state.currentProjectFilePath).toBeNull();
        expect(state.hasUnsavedChanges).toBe(false);
        expect(state.windowColor).toBe("#11223344");
        expect(state.unitFactor).toBe(2);
        expect(state.unit).toBe("mm");
        expect(state.canvas).toEqual({ x: 10, y: 20, scale: 1.5 });
        expect(state.imageSets).toHaveLength(1);
        expect(state.imageSets[0]).toEqual(
            expect.objectContaining({
                id: "scene-image-1",
                path: toLocalFileUrl("C:/tmp/scene-image.png"),
                transparency: 0.25,
                rotation: 15,
                locked: true,
                visible: false,
            })
        );
        expect(state.dimensionLines).toEqual([
            {
                id: "line-1",
                start: { x: 0, y: 0 },
                end: { x: 5, y: 5 },
            },
        ]);
        expect(state.isAlwaysOnTopMode).toBe(true);
        expect(state.isClickThroughMode).toBe(true);
        expect(state.isWindowFrameVisible).toBe(true);
    });

    it("disables click-through when scene does not enable alwaysOnTop", async () => {
        mockService.loadSceneFromPath = vi.fn().mockResolvedValue({
            version: "1.0.0",
            window: {
                alwaysOnTop: false,
                clickThrough: true,
            },
            images: [],
        });

        renderHook(() => useFileHandler());
        expect(fileOpenCallback).toBeTypeOf("function");

        await act(async () => {
            fileOpenCallback?.("C:/tmp/click-through.scene.json", ".json");
            await flushAsync();
        });

        const state = useAppStore.getState();
        expect(state.isAlwaysOnTopMode).toBe(false);
        expect(state.isClickThroughMode).toBe(false);
    });

    it("shows alert and keeps current state when scene load fails", async () => {
        const beforeImagePath = "C:/tmp/current.png";
        act(() => {
            useAppStore.getState().addImageSetWithPath(beforeImagePath);
        });

        mockService.loadSceneFromPath = vi
            .fn()
            .mockRejectedValue(new Error("Invalid scene file"));

        renderHook(() => useFileHandler());
        expect(fileOpenCallback).toBeTypeOf("function");

        await act(async () => {
            fileOpenCallback?.("C:/tmp/invalid.scene.json", ".json");
            await flushAsync();
        });

        expect(mockService.log.error).toHaveBeenCalledWith(
            "Scene file load failed",
            expect.objectContaining({
                filePath: "C:/tmp/invalid.scene.json",
                message: "Invalid scene file",
            })
        );
        expect(alertMock).toHaveBeenCalledTimes(1);
        expect(alertMock.mock.calls[0][0]).toContain("Invalid scene file");
        expect(useAppStore.getState().imageSets[0].path).toBe(
            toLocalFileUrl(beforeImagePath)
        );
    });

    it("delegates .iot path handling to openProjectFromPath", async () => {
        renderHook(() => useFileHandler());
        expect(fileOpenCallback).toBeTypeOf("function");

        await act(async () => {
            fileOpenCallback?.("C:/tmp/sample.iot", ".iot");
            await flushAsync();
        });

        expect(mockService.loadProjectFromPath).toHaveBeenCalledWith(
            "C:/tmp/sample.iot"
        );
        expect(mockService.loadSceneFromPath).not.toHaveBeenCalled();
    });
});
