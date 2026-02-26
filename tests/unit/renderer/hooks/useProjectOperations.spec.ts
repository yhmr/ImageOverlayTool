/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProjectOperations } from "@/renderer/hooks/useProjectOperations";
import { useAppStore } from "@/renderer/store/useAppStore";

const mockIPC = vi.hoisted(() => ({
    loadProject: vi.fn(),
    loadProjectFromPath: vi.fn(),
    saveProject: vi.fn(),
    saveProjectAs: vi.fn(),
    setWindowRect: vi.fn(),
    showConfirmDialog: vi.fn().mockResolvedValue(true),
    saveWindowColor: vi.fn(),
    updateUnit: vi.fn(),
    onUnitUpdated: vi.fn(() => vi.fn()),
    updateImageSets: vi.fn(),
    updateUnitFactor: vi.fn(),
    log: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock("@/renderer/services/ipcService", () => ({
    getIPCService: () => mockIPC,
    setIPCService: vi.fn(),
}));

describe("useProjectOperations", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAppStore.getState().resetAll();
        vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    });

    it("newProject should reset store and file path", async () => {
        const { result } = renderHook(() => useProjectOperations());

        act(() => {
            useAppStore.getState().setImageSets([
                {
                    id: "test",
                    path: "test.png",
                    transparency: 1,
                    rotation: 0,
                    initAnchorPos: null,
                    currentAnchorPos: null,
                },
            ]);
        });

        await act(async () => {
            await result.current.newProject();
        });

        const state = useAppStore.getState();
        expect(state.imageSets).toHaveLength(1);
        expect(state.imageSets[0].path).toBe("");
        expect(result.current.currentProjectFilePath).toBeNull();
    });

    it("openProject should load project data", async () => {
        const mockProjectData = {
            version: "1.0.0",
            window: { width: 800, height: 600, x: 0, y: 0, color: "#111111" },
            settings: { unitFactor: 2.0, unit: "um" as const },
            canvas: { x: 10, y: 10, scale: 1.5 },
            images: [
                {
                    id: "loaded-img",
                    path: "loaded.png",
                    transparency: 0.5,
                    rotation: 90,
                    initAnchorPos: null,
                    currentAnchorPos: null,
                },
            ],
            dimensionLines: [],
        };

        mockIPC.loadProject.mockResolvedValue({
            project: mockProjectData,
            filePath: "C:/path/to/project.json",
        });

        const { result } = renderHook(() => useProjectOperations());

        await act(async () => {
            await result.current.openProject();
        });

        const state = useAppStore.getState();
        expect(state.unitFactor).toBe(2.0);
        expect(state.windowColor).toBe("#111111");
        expect(state.canvas).toEqual({ x: 10, y: 10, scale: 1.5 });
        expect(state.imageSets[0].id).toBe("loaded-img");
        expect(result.current.currentProjectFilePath).toBe(
            "C:/path/to/project.json"
        );

        expect(mockIPC.setWindowRect).toHaveBeenCalledWith({
            x: 0,
            y: 0,
            width: 800,
            height: 600,
        });
    });

    it("openProject should clear undo and redo history", async () => {
        const mockProjectData = {
            version: "1.0.0",
            window: { width: 800, height: 600, x: 0, y: 0, color: "#111111" },
            settings: { unitFactor: 2.0, unit: "um" as const },
            canvas: { x: 10, y: 10, scale: 1.5 },
            images: [
                {
                    id: "loaded-img",
                    path: "loaded.png",
                    transparency: 0.5,
                    rotation: 90,
                    initAnchorPos: null,
                    currentAnchorPos: null,
                },
            ],
            dimensionLines: [],
        };

        mockIPC.loadProject.mockResolvedValue({
            project: mockProjectData,
            filePath: "C:/path/to/project.json",
        });

        act(() => {
            useAppStore.getState().setImageSets([
                {
                    id: "img-1",
                    path: "a.png",
                    transparency: 0,
                    rotation: 0,
                    initAnchorPos: null,
                    currentAnchorPos: null,
                },
            ]);
            useAppStore.getState().setImageSets([
                {
                    id: "img-2",
                    path: "b.png",
                    transparency: 0,
                    rotation: 0,
                    initAnchorPos: null,
                    currentAnchorPos: null,
                },
            ]);
            useAppStore.temporal.getState().undo();
        });

        expect(
            useAppStore.temporal.getState().pastStates.length
        ).toBeGreaterThan(0);
        expect(
            useAppStore.temporal.getState().futureStates.length
        ).toBeGreaterThan(0);

        const { result } = renderHook(() => useProjectOperations());

        await act(async () => {
            await result.current.openProject();
        });

        expect(useAppStore.temporal.getState().pastStates.length).toBe(0);
        expect(useAppStore.temporal.getState().futureStates.length).toBe(0);
    });

    it("saveProjectAs should save and update path", async () => {
        mockIPC.saveProjectAs.mockResolvedValue("C:/new/path/project.json");
        const { result } = renderHook(() => useProjectOperations());

        await act(async () => {
            await result.current.saveProjectAs();
        });

        expect(mockIPC.saveProjectAs).toHaveBeenCalledWith(
            expect.objectContaining({
                version: "1.0.0",
                settings: expect.objectContaining({ unitFactor: 1.0 }),
            })
        );
        expect(result.current.currentProjectFilePath).toBe(
            "C:/new/path/project.json"
        );
    });

    it("openProjectFromPath should load project data from specific path", async () => {
        const mockProjectData = {
            version: "1.0.0",
            window: { width: 800, height: 600, x: 0, y: 0, color: "#000000" },
            settings: { unitFactor: 1.0, unit: "um" as const },
            canvas: { x: 0, y: 0, scale: 1.0 },
            images: [],
            dimensionLines: [],
        };
        mockIPC.loadProjectFromPath.mockResolvedValue({
            project: mockProjectData,
            filePath: "C:/direct/path.json",
        });

        const { result } = renderHook(() => useProjectOperations());

        await act(async () => {
            await result.current.openProjectFromPath("C:/direct/path.json");
        });

        expect(mockIPC.loadProjectFromPath).toHaveBeenCalledWith(
            "C:/direct/path.json"
        );
        expect(result.current.currentProjectFilePath).toBe(
            "C:/direct/path.json"
        );
    });

    it("saveProject should overwrite existing file", async () => {
        mockIPC.loadProject.mockResolvedValue({
            project: {
                version: "1.0.0",
                window: {
                    width: 800,
                    height: 600,
                    x: 0,
                    y: 0,
                    color: "#000000",
                },
                settings: { unitFactor: 1.0, unit: "um" as const },
                canvas: { x: 0, y: 0, scale: 1.0 },
                images: [],
                dimensionLines: [],
            },
            filePath: "C:/existing/project.json",
        });

        const { result } = renderHook(() => useProjectOperations());

        await act(async () => {
            await result.current.openProject();
        });

        await act(async () => {
            await result.current.saveProject();
        });

        expect(mockIPC.saveProject).toHaveBeenCalledWith(
            "C:/existing/project.json",
            expect.objectContaining({ version: "1.0.0" }),
            undefined
        );
    });

    it("saveProject should call SaveAs if no path exists", async () => {
        mockIPC.saveProjectAs.mockResolvedValue("C:/saved/via/as.json");
        const { result } = renderHook(() => useProjectOperations());

        await act(async () => {
            await result.current.saveProject();
        });

        expect(mockIPC.saveProjectAs).toHaveBeenCalled();
        expect(result.current.currentProjectFilePath).toBe(
            "C:/saved/via/as.json"
        );
    });
});
