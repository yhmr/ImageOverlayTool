// @vitest-environment happy-dom
import { expect, test, describe, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProjectOperations } from "./useProjectOperations";
import { ProjectFile } from "../../shared/types/ProjectFile";
import { useProjectStore } from "../store/useProjectStore";
import { useImageSetsStore } from "../store/useImageSetsStore";
import { ImageSet } from "../types/ImageSet";

// Mock electronAPI
const mockElectronAPI = {
  loadProject: vi.fn(),
  saveProjectAs: vi.fn(),
  saveProject: vi.fn(),
  loadWindowColor: vi.fn(),
  saveWindowColor: vi.fn(),
  setWindowRect: vi.fn(),
  loadProjectFromPath: vi.fn(),
  updateUnitFactor: vi.fn(),
  updateImageSets: vi.fn(),
} as any;

// Global window mock
Object.defineProperty(global.window, "electronAPI", {
  value: mockElectronAPI,
  writable: true,
});

describe("useProjectOperations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset stores
    useProjectStore.setState(useProjectStore.getInitialState());
    useImageSetsStore.setState(useImageSetsStore.getInitialState());
  });

  test("handleNewProject should reset stores", async () => {
    // Set some state to verify reset
    useProjectStore.setState({ unit_factor: 5 });
    useImageSetsStore.setState({
      imageSets: [{ id: "test" } as unknown as ImageSet],
    });

    const { result } = renderHook(() => useProjectOperations());

    await act(async () => {
      await result.current.handleNewProject();
    });

    const projectState = useProjectStore.getState();
    const imageState = useImageSetsStore.getState();

    expect(projectState.unit_factor).toBe(1); // Default
    expect(imageState.imageSets).toEqual([]); // Default
  });

  test("handleOpenProject should update stores when loaded", async () => {
    const mockProject: ProjectFile<ImageSet> = {
      version: "1.0.0",
      window: { width: 800, height: 600, x: 0, y: 0, color: "#FFFFFF" },
      settings: { unit_factor: 2 },
      canvas: { x: 10, y: 10, scale: 2 },
      images: [],
      dimensionLines: [],
    };
    mockElectronAPI.loadProject.mockResolvedValue({
      project: mockProject,
      filePath: "/test/path.json",
    });

    const { result } = renderHook(() => useProjectOperations());

    await act(async () => {
      await result.current.handleOpenProject();
    });

    const projectState = useProjectStore.getState();
    // Verify store updates
    expect(projectState.unit_factor).toBe(2);
    expect(projectState.canvas).toEqual({ x: 10, y: 10, scale: 2 });

    expect(mockElectronAPI.saveWindowColor).toHaveBeenCalledWith("#FFFFFF");
    expect(mockElectronAPI.setWindowRect).toHaveBeenCalled();
  });

  test("handleSaveProjectAs should call saveProjectAs API", async () => {
    const { result } = renderHook(() => useProjectOperations());

    mockElectronAPI.saveProjectAs.mockResolvedValue("/new/path.json");

    await act(async () => {
      await result.current.handleSaveProjectAs();
    });

    expect(mockElectronAPI.saveProjectAs).toHaveBeenCalled();
  });
});
