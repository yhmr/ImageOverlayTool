/**
 * @vitest-environment happy-dom
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useImageDrop } from "@/renderer/hooks/useImageDrop";
import {
    resetIPCService,
    setIPCService,
} from "@/renderer/services/ipcService";
import { useAppStore } from "@/renderer/store/useAppStore";
import { MockIPCService } from "../../mocks/MockIPCService";

describe("useImageDrop", () => {
    beforeEach(() => {
        useAppStore.getState().resetAll();
        resetIPCService();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("adds image when file path is resolved via getPathForFile", () => {
        const mockService = new MockIPCService();
        mockService.getPathForFile = vi
            .fn()
            .mockReturnValue("C:/tmp/from-drop.png");
        setIPCService(mockService);

        const { result } = renderHook(() => useImageDrop());

        const file = new File(["dummy"], "from-drop.png", {
            type: "image/png",
        });
        const event = {
            preventDefault: vi.fn(),
            dataTransfer: {
                files: [file],
                getData: vi.fn().mockReturnValue(""),
                dropEffect: "none",
            },
        } as unknown as React.DragEvent<HTMLElement>;

        act(() => {
            result.current.onDrop(event);
        });

        const imageSets = useAppStore.getState().imageSets;
        expect(imageSets).toHaveLength(1);
        expect(imageSets[0].path).toBe("local-file://C:/tmp/from-drop.png");
    });

    it("sets dropEffect to copy on drag over", () => {
        const mockService = new MockIPCService();
        setIPCService(mockService);
        const { result } = renderHook(() => useImageDrop());
        const event = {
            preventDefault: vi.fn(),
            dataTransfer: {
                dropEffect: "none",
            },
        } as unknown as React.DragEvent<HTMLElement>;

        act(() => {
            result.current.onDragOver(event);
        });

        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(event.dataTransfer.dropEffect).toBe("copy");
    });

    it("ignores non-image files", () => {
        const mockService = new MockIPCService();
        mockService.getPathForFile = vi.fn().mockReturnValue("C:/tmp/not-image.txt");
        setIPCService(mockService);

        const { result } = renderHook(() => useImageDrop());

        const file = new File(["dummy"], "not-image.txt", {
            type: "text/plain",
        });
        const event = {
            preventDefault: vi.fn(),
            dataTransfer: {
                files: [file],
                getData: vi.fn().mockReturnValue(""),
                dropEffect: "none",
            },
        } as unknown as React.DragEvent<HTMLElement>;

        act(() => {
            result.current.onDrop(event);
        });

        const imageSets = useAppStore.getState().imageSets;
        expect(imageSets).toHaveLength(1);
        expect(imageSets[0].path).toBe("");
    });

    it("prefers file.path when present and skips getPathForFile for that file", () => {
        const mockService = new MockIPCService();
        mockService.getPathForFile = vi.fn().mockReturnValue("C:/tmp/unused.png");
        setIPCService(mockService);

        const { result } = renderHook(() => useImageDrop());

        const file = Object.assign(
            new File(["dummy"], "from-file-path.png", { type: "image/png" }),
            { path: "C:/tmp/from-file-path.png" }
        );
        const event = {
            preventDefault: vi.fn(),
            dataTransfer: {
                files: [file],
                getData: vi.fn().mockReturnValue(""),
                dropEffect: "none",
            },
        } as unknown as React.DragEvent<HTMLElement>;

        act(() => {
            result.current.onDrop(event);
        });

        expect(mockService.getPathForFile).not.toHaveBeenCalled();
        const imageSets = useAppStore.getState().imageSets;
        expect(imageSets).toHaveLength(1);
        expect(imageSets[0].path).toBe("local-file://C:/tmp/from-file-path.png");
    });

    it("falls back to text/uri-list file URLs", () => {
        const mockService = new MockIPCService();
        mockService.getPathForFile = vi.fn(() => {
            throw new Error("no path");
        });
        setIPCService(mockService);

        const { result } = renderHook(() => useImageDrop());

        const file = new File(["dummy"], "uri-image.png", {
            type: "image/png",
        });
        const event = {
            preventDefault: vi.fn(),
            dataTransfer: {
                files: [file],
                getData: vi
                    .fn()
                    .mockImplementation((format: string) =>
                        format === "text/uri-list"
                            ? "file:///C:/tmp/uri-image.png"
                            : ""
                    ),
                dropEffect: "none",
            },
        } as unknown as React.DragEvent<HTMLElement>;

        act(() => {
            result.current.onDrop(event);
        });

        const imageSets = useAppStore.getState().imageSets;
        expect(imageSets).toHaveLength(1);
        expect(imageSets[0].path).toBe("local-file://C:/tmp/uri-image.png");
    });

    it("ignores invalid URI entries and keeps valid file URLs", () => {
        const mockService = new MockIPCService();
        mockService.getPathForFile = vi.fn(() => {
            throw new Error("no path");
        });
        setIPCService(mockService);

        const { result } = renderHook(() => useImageDrop());
        const event = {
            preventDefault: vi.fn(),
            dataTransfer: {
                files: [new File(["dummy"], "uri-image.png", { type: "image/png" })],
                getData: vi.fn().mockImplementation((format: string) =>
                    format === "text/uri-list"
                        ? "not-a-valid-url\nfile:///C:/tmp/uri-image.png"
                        : ""
                ),
                dropEffect: "none",
            },
        } as unknown as React.DragEvent<HTMLElement>;

        act(() => {
            result.current.onDrop(event);
        });

        const imageSets = useAppStore.getState().imageSets;
        expect(imageSets).toHaveLength(1);
        expect(imageSets[0].path).toBe("local-file://C:/tmp/uri-image.png");
    });

    it("handles uri-list protocol and drive format edge cases", () => {
        const mockService = new MockIPCService();
        mockService.getPathForFile = vi.fn(() => {
            throw new Error("no path");
        });
        setIPCService(mockService);

        const { result } = renderHook(() => useImageDrop());
        const event = {
            preventDefault: vi.fn(),
            dataTransfer: {
                files: [new File(["dummy"], "uri-image.png", { type: "image/png" })],
                getData: vi.fn().mockImplementation((format: string) =>
                    format === "text/uri-list"
                        ? [
                              "https://example.com/not-file.png",
                              "file:",
                              "file://c/tmp/colonless.png",
                          ].join("\n")
                        : ""
                ),
                dropEffect: "none",
            },
        } as unknown as React.DragEvent<HTMLElement>;

        act(() => {
            result.current.onDrop(event);
        });

        const imageSets = useAppStore.getState().imageSets;
        expect(imageSets).toHaveLength(1);
        expect(imageSets[0].path).toBe("local-file://c:/tmp/colonless.png");
    });

    it("returns null when parsed file URL has empty resolved path", () => {
        class EmptyPathUrlMock {
            protocol = "file:";
            host = "";
            pathname = "";
        }
        vi.stubGlobal("URL", EmptyPathUrlMock as any);

        const mockService = new MockIPCService();
        mockService.getPathForFile = vi.fn(() => {
            throw new Error("no path");
        });
        setIPCService(mockService);

        const { result } = renderHook(() => useImageDrop());
        const event = {
            preventDefault: vi.fn(),
            dataTransfer: {
                files: [new File(["dummy"], "uri-image.png", { type: "image/png" })],
                getData: vi.fn().mockImplementation((format: string) =>
                    format === "text/uri-list" ? "file:///should-not-resolve.png" : ""
                ),
                dropEffect: "none",
            },
        } as unknown as React.DragEvent<HTMLElement>;

        act(() => {
            result.current.onDrop(event);
        });

        const imageSets = useAppStore.getState().imageSets;
        expect(imageSets).toHaveLength(1);
        expect(imageSets[0].path).toBe("");
    });
});
