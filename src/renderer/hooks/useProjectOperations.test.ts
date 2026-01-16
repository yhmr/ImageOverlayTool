/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProjectOperations } from "./useProjectOperations";
import { useAppStore } from "../store/useAppStore";

// Mock Electron API
const mockLoadProject = vi.fn();
const mockLoadProjectFromPath = vi.fn();
const mockSaveProject = vi.fn();
const mockSaveProjectAs = vi.fn();
const mockSetWindowRect = vi.fn();
const mockSaveWindowColor = vi.fn();

window.electronAPI = {
    loadProject: mockLoadProject,
    loadProjectFromPath: mockLoadProjectFromPath,
    saveProject: mockSaveProject,
    saveProjectAs: mockSaveProjectAs,
    setWindowRect: mockSetWindowRect,
    saveWindowColor: mockSaveWindowColor,
    updateImageSets: vi.fn(),
    updateUnitFactor: vi.fn(),
    log: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
} as any;

describe("useProjectOperations", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAppStore.getState().resetAll(); // Reset store
    });

    it("handleNewProject should reset store and file path", async () => {
        // Setup initial state
        const { result } = renderHook(() => useProjectOperations());

        act(() => {
            useAppStore.getState().setImageSets([
                {
                    id: "test",
                    path: "test.png",
                    transparency: 1,
                    rotation: 0,
                    init_anchor_pos: null,
                    current_anchor_pos: null,
                },
            ]);
            // currentFilePath is local state in hook, so we can't easily set it from outside without calling open/save.
            // But handleNewProject checks logic.
        });

        await act(async () => {
            await result.current.handleNewProject();
        });

        const state = useAppStore.getState();
        // Reset should set imageSets to default (1 empty set)
        expect(state.imageSets).toHaveLength(1);
        expect(state.imageSets[0].path).toBe("");
        expect(result.current.currentFilePath).toBeNull();
    });

    it("handleOpenProject should load project data", async () => {
        const mockProjectData = {
            version: "1.0.0",
            window: { width: 800, height: 600, x: 0, y: 0, color: "#111111" },
            settings: { unitFactor: 2.0 },
            canvas: { x: 10, y: 10, scale: 1.5 },
            images: [
                {
                    id: "loaded-img",
                    path: "loaded.png",
                    transparency: 0.5,
                    rotation: 90,
                    init_anchor_pos: null,
                    current_anchor_pos: null,
                },
            ],
            dimensionLines: [],
        };

        mockLoadProject.mockResolvedValue({
            project: mockProjectData,
            filePath: "C:/path/to/project.json",
        });

        const { result } = renderHook(() => useProjectOperations());

        await act(async () => {
            await result.current.handleOpenProject();
        });

        const state = useAppStore.getState();
        expect(state.unitFactor).toBe(2.0);
        expect(state.windowColor).toBe("#111111");
        expect(state.canvas).toEqual({ x: 10, y: 10, scale: 1.5 });
        expect(state.imageSets[0].id).toBe("loaded-img");
        expect(result.current.currentFilePath).toBe("C:/path/to/project.json");

        // Verify window restoration
        expect(mockSetWindowRect).toHaveBeenCalledWith({
            x: 0,
            y: 0,
            width: 800,
            height: 600,
        });
    });

    it("handleSaveProjectAs should save and update path", async () => {
        mockSaveProjectAs.mockResolvedValue("C:/new/path/project.json");
        const { result } = renderHook(() => useProjectOperations());

        await act(async () => {
            await result.current.handleSaveProjectAs();
        });

        expect(mockSaveProjectAs).toHaveBeenCalledWith(
            expect.objectContaining({
                version: "1.0.0",
                settings: expect.objectContaining({ unitFactor: 1.0 }),
            })
        );
        expect(result.current.currentFilePath).toBe("C:/new/path/project.json");
    });
});
