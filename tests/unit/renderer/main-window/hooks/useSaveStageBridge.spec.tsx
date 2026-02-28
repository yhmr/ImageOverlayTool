/**
 * @vitest-environment happy-dom
 */
import { createRef } from "react";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Konva from "konva";

import { SAVE_STAGE_DATA_URL_BRIDGE_KEY } from "@/shared/constants/saveStageBridge";
import { useSaveStageBridge } from "@/renderer/main-window/hooks/useSaveStageBridge";

type StageExportBridgeWindow = Window & {
    [SAVE_STAGE_DATA_URL_BRIDGE_KEY]?: (
        mimeType?: "image/png" | "image/jpeg"
    ) => string | null;
};

describe("useSaveStageBridge", () => {
    it("registers stage export bridge and unregisters on unmount", () => {
        const stageRef = createRef<Konva.Stage | null>();
        const toDataURL = vi
            .fn()
            .mockReturnValue("data:image/png;base64,AAAA");
        stageRef.current = {
            toDataURL,
        } as unknown as Konva.Stage;

        const { unmount } = renderHook(() => useSaveStageBridge(stageRef));

        const windowWithBridge = window as StageExportBridgeWindow;
        const bridge = windowWithBridge[SAVE_STAGE_DATA_URL_BRIDGE_KEY];
        expect(typeof bridge).toBe("function");

        expect(bridge?.()).toBe("data:image/png;base64,AAAA");
        expect(toDataURL).toHaveBeenCalledWith({
            pixelRatio: 2,
            mimeType: undefined,
            quality: undefined,
        });

        bridge?.("image/jpeg");
        expect(toDataURL).toHaveBeenLastCalledWith({
            pixelRatio: 2,
            mimeType: "image/jpeg",
            quality: 0.9,
        });

        unmount();
        expect(windowWithBridge[SAVE_STAGE_DATA_URL_BRIDGE_KEY]).toBeUndefined();
    });
});
