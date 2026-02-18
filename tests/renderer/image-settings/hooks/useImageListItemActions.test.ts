/**
 * @vitest-environment happy-dom
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ImageSet } from "@/shared/types/ImageSet";
import { useImageListItemActions } from "@/renderer/image-settings/hooks/useImageListItemActions";
import { useAppStore } from "@/renderer/store/useAppStore";

const { mockUseIpcService } = vi.hoisted(() => ({
    mockUseIpcService: vi.fn(),
}));

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock("@/renderer/providers/IpcServiceProvider", () => ({
    useIpcService: mockUseIpcService,
}));

const createImageSet = (overrides: Partial<ImageSet> = {}): ImageSet => ({
    id: "img-1",
    path: "local-file://C:/old.png",
    sourceType: "file",
    transparency: 10,
    rotation: 5,
    initAnchorPos: {
        lt: { x: 0, y: 0 },
        rt: { x: 10, y: 0 },
        rb: { x: 10, y: 10 },
        lb: { x: 0, y: 10 },
    },
    currentAnchorPos: {
        lt: { x: 1, y: 1 },
        rt: { x: 11, y: 1 },
        rb: { x: 11, y: 11 },
        lb: { x: 1, y: 11 },
    },
    locked: false,
    visible: true,
    filters: {
        binarization: { enabled: false, threshold: 128 },
        hsv: { enabled: false, h: 0, s: 0, v: 0 },
    },
    ...overrides,
});

describe("useImageListItemActions", () => {
    const ipcService = {
        loadImage: vi.fn(),
        getImageInfo: vi.fn(),
        saveCacheImageAs: vi.fn(),
        log: {
            debug: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
        },
    };

    const renderActions = (params?: {
        imageSet?: ImageSet;
        isMissing?: boolean;
        selectedId?: string | null;
    }) => {
        const imageSet = params?.imageSet ?? createImageSet();
        useAppStore.getState().resetAll();
        useAppStore.setState({
            imageSets: [imageSet],
            selectedImageId: params?.selectedId ?? null,
        });

        return renderHook(() =>
            useImageListItemActions({
                imageSet,
                index: 0,
                isMissing: params?.isMissing ?? false,
            })
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseIpcService.mockReturnValue(ipcService);
    });

    it("derives selected/cache/fileName/filters with defaults", () => {
        const imageSet = createImageSet({
            path: "",
            sourceType: "cache",
            filters: undefined,
        });
        const { result } = renderActions({
            imageSet,
            selectedId: imageSet.id,
        });

        expect(result.current.isSelected).toBe(true);
        expect(result.current.isCacheImage).toBe(true);
        expect(result.current.fileName).toBe("render.image_settings.no_image");
        expect(result.current.filters).toEqual({
            binarization: { enabled: false, threshold: 128 },
            hsv: { enabled: false, h: 0, s: 0, v: 0 },
        });
    });

    it("uses original path as fileName fallback when path ends with slash", () => {
        const imageSet = createImageSet({
            path: "local-file://C:/folder/",
        });
        const { result } = renderActions({ imageSet });

        expect(result.current.fileName).toBe("local-file://C:/folder/");
    });

    it("openFile returns early when load dialog is canceled", async () => {
        ipcService.loadImage.mockResolvedValue(null);
        const { result } = renderActions();

        await act(async () => {
            await result.current.openFile();
        });

        expect(ipcService.log.debug).toHaveBeenCalledWith(
            "Image loading canceled by user"
        );
        expect(useAppStore.getState().imageSets[0].path).toBe(
            "local-file://C:/old.png"
        );
    });

    it("openFile relink path handles failures and alert exceptions", async () => {
        ipcService.loadImage.mockResolvedValue("C:\\new\\img.png");
        ipcService.getImageInfo.mockRejectedValue(new Error("broken"));
        vi.stubGlobal("alert", vi.fn(() => {
            throw new Error("alert failed");
        }));

        const { result } = renderActions({ isMissing: true });
        await act(async () => {
            await result.current.openFile();
        });

        expect(ipcService.log.warn).toHaveBeenCalledWith(
            "Relink failed",
            expect.objectContaining({ index: 0 })
        );
    });

    it("guards transparency/rotation/scale/input/reset for invalid conditions", () => {
        const imageSet = createImageSet({
            currentAnchorPos: null,
            initAnchorPos: null,
        });
        const { result } = renderActions({ imageSet });

        act(() => {
            result.current.changeTransparency([Number.NaN]);
            result.current.changeRotation([40]);
            result.current.changeScale([2]);
            result.current.changeRotationInput({
                target: { value: "not-number" },
            } as any);
            result.current.changeRotationInput({
                target: { value: "30" },
            } as any);
            result.current.resetTransformation();
        });

        expect(useAppStore.getState().imageSets[0]).toMatchObject({
            transparency: 10,
            rotation: 5,
            currentAnchorPos: null,
        });
    });

    it("ignores non-finite rotation even when anchor exists", () => {
        const { result } = renderActions();

        act(() => {
            result.current.changeRotation([Number.NaN]);
        });

        expect(useAppStore.getState().imageSets[0].rotation).toBe(5);
    });

    it("toggleVisible treats undefined as visible by default", () => {
        const { result } = renderActions({
            imageSet: createImageSet({ visible: undefined }),
        });

        act(() => {
            result.current.toggleVisible();
        });

        expect(useAppStore.getState().imageSets[0].visible).toBe(false);
    });

    it("saveCacheImageAs handles non-cache/invalid/canceled/success paths", async () => {
        const nonCache = renderActions({
            imageSet: createImageSet({ sourceType: "file" }),
        });
        await act(async () => {
            await nonCache.result.current.saveCacheImageAs();
        });
        expect(ipcService.saveCacheImageAs).not.toHaveBeenCalled();
        nonCache.unmount();

        const invalidPath = renderActions({
            imageSet: createImageSet({
                sourceType: "cache",
                path: "not-local-path",
            }),
        });
        await act(async () => {
            await invalidPath.result.current.saveCacheImageAs();
        });
        expect(ipcService.saveCacheImageAs).not.toHaveBeenCalled();
        invalidPath.unmount();

        ipcService.saveCacheImageAs.mockResolvedValueOnce(null);
        const canceled = renderActions({
            imageSet: createImageSet({
                sourceType: "cache",
                path: "local-file://C:/cache.png",
            }),
        });
        await act(async () => {
            await canceled.result.current.saveCacheImageAs();
        });
        expect(useAppStore.getState().imageSets[0].sourceType).toBe("cache");
        canceled.unmount();

        ipcService.saveCacheImageAs.mockResolvedValueOnce("C:\\saved\\img.png");
        const success = renderActions({
            imageSet: createImageSet({
                sourceType: "cache",
                path: "local-file://C:/cache.png",
            }),
        });
        await act(async () => {
            await success.result.current.saveCacheImageAs();
        });
        expect(useAppStore.getState().imageSets[0]).toMatchObject({
            sourceType: "file",
            path: "local-file://C:/saved/img.png",
        });
        success.unmount();
    });

    it("relinkMissingImage handles cancel and failure paths", async () => {
        ipcService.loadImage.mockResolvedValueOnce(null);
        const canceled = renderActions({ isMissing: true });
        await act(async () => {
            await canceled.result.current.relinkMissingImage();
        });
        expect(ipcService.getImageInfo).not.toHaveBeenCalled();
        canceled.unmount();

        ipcService.loadImage.mockResolvedValueOnce("C:\\new\\img.png");
        ipcService.getImageInfo.mockRejectedValueOnce(new Error("relink failed"));
        vi.stubGlobal("alert", vi.fn());
        const failed = renderActions({ isMissing: true });
        await act(async () => {
            await failed.result.current.relinkMissingImage();
        });
        expect(ipcService.log.warn).toHaveBeenCalledWith(
            "Relink failed",
            expect.objectContaining({ index: 0 })
        );
        failed.unmount();
    });
});
