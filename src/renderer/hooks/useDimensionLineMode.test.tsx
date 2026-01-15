// @vitest-environment happy-dom
import { renderHook, act } from "@testing-library/react";
import { useDimensionLineMode } from "./useDimensionLineMode";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useProjectStore } from "../store/useProjectStore";
import Konva from "konva";

// Mock crypto.randomUUID
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: () => "test-uuid",
  },
});

describe("useDimensionLineMode", () => {
  // Mock Stage Ref
  const mockStage = {
    getPointerPosition: vi.fn(),
    getAbsoluteTransform: vi.fn(() => ({
      copy: () => ({
        copy: () => ({
          invert: vi.fn(), // Mock invert
          point: (p: { x: number; y: number }) => p, // Identity transform for simplicity
        }),
        invert: vi.fn(),
        point: (p: { x: number; y: number }) => p,
      }),
      invert: vi.fn(),
      point: (p: { x: number; y: number }) => p,
    })),
    on: vi.fn(),
    draggable: vi.fn(),
  };
  const stageRef = { current: mockStage as unknown as Konva.Stage };

  beforeEach(() => {
    useProjectStore.setState(useProjectStore.getInitialState());
    vi.clearAllMocks();
  });

  it("should initialize correctly", () => {
    const { result } = renderHook(() => useDimensionLineMode(stageRef));

    expect(result.current.isDimensionMode).toBe(false);
    expect(result.current.selectedDimensionLineId).toBeNull();
  });

  it("should toggle dimension mode", () => {
    const { result } = renderHook(() => useDimensionLineMode(stageRef));

    act(() => {
      result.current.setIsDimensionMode(true);
    });
    expect(result.current.isDimensionMode).toBe(true);
  });

  it("should create a new dimension line on mouse down", () => {
    const { result } = renderHook(() => useDimensionLineMode(stageRef));

    // Enable mode
    act(() => {
      result.current.setIsDimensionMode(true);
    });

    // Mock pointer position
    mockStage.getPointerPosition.mockReturnValue({ x: 10, y: 10 });

    // Simulate Mouse Down (Left click)
    act(() => {
      result.current.onMouseDown({
        evt: { button: 0 },
      } as Konva.KonvaEventObject<MouseEvent>);
    });

    // Check state
    expect(result.current.selectedDimensionLineId).toBe("test-uuid");

    // Check Store state
    const state = useProjectStore.getState();
    expect(state.dimensionLines).toHaveLength(1);
    expect(state.dimensionLines[0]).toEqual({
      id: "test-uuid",
      start: { x: 10, y: 10 },
      end: { x: 10, y: 10 },
    });
  });

  it("should delete short line on mouse up", () => {
    const { result } = renderHook(() => useDimensionLineMode(stageRef));

    act(() => {
      result.current.setIsDimensionMode(true);
    });
    mockStage.getPointerPosition.mockReturnValue({ x: 10, y: 10 });
    act(() => {
      result.current.onMouseDown({
        evt: { button: 0 },
      } as Konva.KonvaEventObject<MouseEvent>);
    });

    // Mouse Up immediately (length 0)
    act(() => {
      result.current.onMouseUp();
    });

    // Check line is removed
    const state = useProjectStore.getState();
    expect(state.dimensionLines).toHaveLength(0);
    expect(result.current.selectedDimensionLineId).toBeNull();
  });

  it("should keep long line on mouse up", () => {
    const { result } = renderHook(() => useDimensionLineMode(stageRef));

    act(() => {
      result.current.setIsDimensionMode(true);
    });

    // Start at 10,10
    mockStage.getPointerPosition.mockReturnValue({ x: 10, y: 10 });
    act(() => {
      result.current.onMouseDown({
        evt: { button: 0 },
      } as Konva.KonvaEventObject<MouseEvent>);
    });

    // Move to 100,100
    mockStage.getPointerPosition.mockReturnValue({ x: 100, y: 100 });
    act(() => {
      result.current.onMouseMove();
    });

    // Mouse Up
    act(() => {
      result.current.onMouseUp();
    });

    // Check line is kept
    const state = useProjectStore.getState();
    expect(state.dimensionLines).toHaveLength(1);
    expect(state.dimensionLines[0].end).toEqual({ x: 100, y: 100 });
    expect(result.current.selectedDimensionLineId).toBe("test-uuid");
  });
});
