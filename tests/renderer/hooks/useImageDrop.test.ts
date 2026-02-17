/**
 * @vitest-environment happy-dom
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
});
