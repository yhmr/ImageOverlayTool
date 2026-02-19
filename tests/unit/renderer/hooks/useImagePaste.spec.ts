/**
 * @vitest-environment happy-dom
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useImagePaste } from "@/renderer/hooks/useImagePaste";

const { mockUseIpcService, mockUseAppStore, mockPasteImage, mockAddImageSet } =
    vi.hoisted(() => ({
        mockUseIpcService: vi.fn(),
        mockUseAppStore: vi.fn(),
        mockPasteImage: vi.fn(),
        mockAddImageSet: vi.fn(),
    }));

vi.mock("@/renderer/providers/IpcServiceProvider", () => ({
    useIpcService: mockUseIpcService,
}));

vi.mock("@/renderer/store/useAppStore", () => ({
    useAppStore: mockUseAppStore,
}));

describe("useImagePaste", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseIpcService.mockReturnValue({
            pasteImage: mockPasteImage,
        });
        mockUseAppStore.mockImplementation((selector: any) =>
            selector({
                addImageSetWithPath: mockAddImageSet,
            })
        );
    });

    it("does nothing when IPC returns null/empty path", async () => {
        const { result } = renderHook(() => useImagePaste());

        mockPasteImage.mockResolvedValueOnce(null);
        await act(async () => {
            await result.current.pasteImage();
        });

        mockPasteImage.mockResolvedValueOnce("");
        await act(async () => {
            await result.current.pasteImage();
        });

        expect(mockAddImageSet).not.toHaveBeenCalled();
    });

    it("adds pasted image with cache source type when path is returned", async () => {
        const { result } = renderHook(() => useImagePaste());
        mockPasteImage.mockResolvedValue("C:/tmp/pasted.png");

        await act(async () => {
            await result.current.pasteImage();
        });

        expect(mockAddImageSet).toHaveBeenCalledWith("C:/tmp/pasted.png", {
            sourceType: "cache",
        });
    });

    it("rethrows IPC errors", async () => {
        const { result } = renderHook(() => useImagePaste());
        mockPasteImage.mockRejectedValue(new Error("paste failed"));

        await expect(result.current.pasteImage()).rejects.toThrow("paste failed");
        expect(mockAddImageSet).not.toHaveBeenCalled();
    });
});
