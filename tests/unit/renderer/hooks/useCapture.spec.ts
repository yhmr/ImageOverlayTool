// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCapture } from "@/renderer/hooks/useCapture";
import { CaptureResult } from "@/shared/types/CaptureResult";
import { TITLE_BAR_HEIGHT } from "@/renderer/constants";

// vi.hoistedを使ってモック関数を定義
const { mockUseAppStore, mockGetIPCService } = vi.hoisted(() => {
    return {
        mockUseAppStore: vi.fn(),
        mockGetIPCService: vi.fn(),
    };
});

// モックのセットアップ
vi.mock("@/renderer/store/useAppStore", () => ({
    useAppStore: mockUseAppStore,
}));

vi.mock("@/renderer/services/ipcService", () => ({
    getIPCService: mockGetIPCService,
}));

vi.mock("uuidjs", () => ({
    default: {
        generate: () => "test-uuid",
    },
}));

describe("useCapture", () => {
    // ストアのモック関数
    const mockSetImageSets = vi.fn();
    const mockImageSets = [{ id: "existing-1", path: "existing" }];
    const mockCanvas = { x: 100, y: 50, scale: 2 };
    let capturedImageSets: unknown[] | null = null;

    // IPCのモック関数
    const mockCaptureScreen = vi.fn();
    const mockLogInfo = vi.fn();
    const createStoreState = (overrides?: {
        imageSets?: unknown[];
        canvas?: { x: number; y: number; scale: number };
    }) => ({
        imageSets: overrides?.imageSets ?? mockImageSets,
        setImageSets: mockSetImageSets,
        canvas: overrides?.canvas ?? mockCanvas,
    });

    beforeEach(() => {
        vi.clearAllMocks();
        capturedImageSets = null;
        mockSetImageSets.mockImplementation((nextImageSets: unknown[]) => {
            capturedImageSets = nextImageSets;
        });

        const storeState = createStoreState();
        // useAppStore(selector) と useAppStore() の両方に対応
        mockUseAppStore.mockImplementation((selector?: (s: typeof storeState) => unknown) => {
            return typeof selector === "function" ? selector(storeState) : storeState;
        });

        // getIPCServiceのモック実装
        mockGetIPCService.mockReturnValue({
            captureScreen: mockCaptureScreen,
            log: {
                info: mockLogInfo,
            },
        });
    });

    it("captureScreenが成功したとき、正しくImageSetを追加すること（座標計算の検証を含む）", async () => {
        const { result } = renderHook(() => useCapture());

        // キャプチャ結果のモック
        const captureResult: CaptureResult = {
            filePath: "C:\\tmp\\capture.png",
            width: 1920,
            height: 1080,
        };
        mockCaptureScreen.mockResolvedValue(captureResult);

        await act(async () => {
            await result.current.captureBackground();
        });

        // 1. IPCが呼ばれたか
        expect(mockCaptureScreen).toHaveBeenCalled();

        // 2. setImageSetsが呼ばれたか
        expect(mockSetImageSets).toHaveBeenCalledTimes(1);

        // 3. 追加されるImageSetの内容検証
        if (!capturedImageSets) {
            throw new Error("setImageSets should be called with image sets");
        }
        const addedImageSets = capturedImageSets;
        expect(addedImageSets).toHaveLength(2); // 既存1 + 新規1
        const newImageSet = addedImageSets[0] as {
            id: string;
            path: string;
            initAnchorPos: {
                lt: { x: number; y: number };
                rt: { x: number; y: number };
            };
        }; // unshiftなので先頭

        expect(newImageSet.id).toBe("test-uuid");
        expect(newImageSet.path).toBe("local-file://C:/tmp/capture.png");

        // 4. アンカー位置（座標計算）の詳細検証
        // MenuBarの高さ offset = TITLE_BAR_HEIGHT / scale
        const expectedOffset = TITLE_BAR_HEIGHT / mockCanvas.scale;
        const initialX = -mockCanvas.x / mockCanvas.scale; // -50
        const initialY = -mockCanvas.y / mockCanvas.scale; // -25

        expect(newImageSet.initAnchorPos.lt).toEqual({
            x: initialX,
            y: initialY - expectedOffset,
        });

        const expectedWidth =
            (captureResult.width - mockCanvas.x) / mockCanvas.scale;
        expect(newImageSet.initAnchorPos.rt.x).toBe(expectedWidth);
    });

    it("captureScreenがnullを返したとき（キャンセル）、何もしないこと", async () => {
        const { result } = renderHook(() => useCapture());
        mockCaptureScreen.mockResolvedValue(null);

        await act(async () => {
            await result.current.captureBackground();
        });

        expect(mockCaptureScreen).toHaveBeenCalled();
        expect(mockSetImageSets).not.toHaveBeenCalled();
    });

    it("初期状態が空のimageSetsの場合、0番目を置き換えるのではなくunshiftで追加されるようロジック変更を確認", async () => {
        const emptyImageSet = [{ id: "empty", path: "" }];
        const storeState = createStoreState({ imageSets: emptyImageSet });

        mockUseAppStore.mockImplementation((selector?: (s: typeof storeState) => unknown) => {
            return typeof selector === "function" ? selector(storeState) : storeState;
        });

        const { result } = renderHook(() => useCapture());
        mockCaptureScreen.mockResolvedValue({
            filePath: "test",
            width: 100,
            height: 100,
        });

        await act(async () => {
            await result.current.captureBackground();
        });

        if (!capturedImageSets) {
            throw new Error("setImageSets should be called with image sets");
        }
        const addedImageSets = capturedImageSets;
        expect(addedImageSets).toHaveLength(1);
        expect((addedImageSets[0] as { id: string }).id).toBe("test-uuid");
    });
});
