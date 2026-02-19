/**
 * @vitest-environment happy-dom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useImageFileStatus } from "@/renderer/hooks/useImageFileStatus";
import {
    resetIPCService,
    setIPCService,
} from "@/renderer/services/ipcService";
import type { ImageSet } from "@/shared/types/ImageSet";
import { MockIPCService } from "../../support/mocks/MockIPCService";

const createImageSet = (id: string, path: string): ImageSet => ({
    id,
    path,
    sourceType: "file",
    transparency: 0,
    rotation: 0,
    initAnchorPos: null,
    currentAnchorPos: null,
    locked: false,
    visible: true,
    filters: {
        binarization: { enabled: false, threshold: 128 },
        hsv: { enabled: false, h: 0, s: 0, v: 0 },
    },
});

describe("useImageFileStatus", () => {
    beforeEach(() => {
        resetIPCService();
    });

    it("counts missing images from IPC results", async () => {
        const mockService = new MockIPCService();
        vi.spyOn(mockService, "getImageInfo").mockImplementation(async (path) =>
            path.includes("missing")
                ? { exists: false }
                : { exists: true, width: 10, height: 10 }
        );
        setIPCService(mockService);

        const imageSets = [
            createImageSet("ok-1", "local-file://C:/tmp/a.png"),
            createImageSet("missing-1", "local-file://C:/tmp/missing.png"),
            createImageSet("empty", ""),
        ];

        const { result } = renderHook(() => useImageFileStatus(imageSets));

        await waitFor(() => {
            expect(result.current.missingCount).toBe(1);
        });
        expect(result.current.statusById["missing-1"]).toMatchObject({
            checked: true,
            exists: false,
        });
    });

    it("reuses cached path status for unchanged paths", async () => {
        const mockService = new MockIPCService();
        const getImageInfoSpy = vi
            .spyOn(mockService, "getImageInfo")
            .mockResolvedValue({ exists: true, width: 20, height: 20 });
        setIPCService(mockService);

        const imageSets = [createImageSet("img-1", "local-file://C:/tmp/a.png")];
        const { rerender } = renderHook(
            ({ sets }) => useImageFileStatus(sets),
            {
                initialProps: { sets: imageSets },
            }
        );

        await waitFor(() => {
            expect(getImageInfoSpy).toHaveBeenCalledTimes(1);
        });

        rerender({ sets: [createImageSet("img-1", "local-file://C:/tmp/a.png")] });

        await waitFor(() => {
            expect(getImageInfoSpy).toHaveBeenCalledTimes(1);
        });
    });
});

