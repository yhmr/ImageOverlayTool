import { useEffect } from "react";

import type { CaptureResult } from "../../shared/types/CaptureResult";
import type {
    E2ECaptureRequest,
    E2EWaitStableRequest,
} from "../../shared/types/E2EControl";
import { createImageSet, toLocalFileUrl } from "../factories/imageSetFactory";
import { useIpcService } from "../providers/IpcServiceProvider";
import { applyResolvedE2ESceneFile } from "../services/e2eSceneFileApplicator";
import { waitForRendererStable } from "../services/rendererStability";
import { useAppStore } from "../store/useAppStore";

export const useE2EControlBridge = (): void => {
    const ipcService = useIpcService();

    useEffect(() => {
        let disposed = false;
        let boundApi: Window["__IOT_E2E__"] | undefined;

        const register = async (): Promise<void> => {
            const status = await ipcService.getE2EStatus();
            if (!status.enabled || disposed) {
                return;
            }

            boundApi = {
                getStatus: () => ipcService.getE2EStatus(),
                getState: () => {
                    const state = useAppStore.getState();
                    return {
                        imageCount: state.imageSets.length,
                        dimensionLineCount: state.dimensionLines.length,
                        selectedImageId: state.selectedImageId,
                        selectedDimensionLineId: state.selectedDimensionLineId,
                        interactionMode: state.interactionMode,
                        unit: state.unit,
                        unitFactor: state.unitFactor,
                        windowColor: state.windowColor,
                        isUIHidden: state.isUIHidden,
                    };
                },
                setSceneFromPath: async (scenePath: string) => {
                    const resolvedScene = await ipcService.e2eSetSceneFromPath(
                        scenePath
                    );
                    applyResolvedE2ESceneFile(resolvedScene);
                    return waitForRendererStable();
                },
                loadFixtureImage: async (source, overrides = {}) => {
                    const resolved = await ipcService.e2eLoadFixtureImage({
                        source,
                    });
                    const state = useAppStore.getState();
                    const imageSet = createImageSet({
                        ...overrides,
                        path: toLocalFileUrl(resolved.path),
                    });
                    const nextImageSets = [...state.imageSets];
                    if (nextImageSets.length === 1 && !nextImageSets[0].path) {
                        nextImageSets[0] = imageSet;
                    } else {
                        nextImageSets.push(imageSet);
                    }
                    state.setImageSets(nextImageSets);
                    state.setSelectedImageId(imageSet.id);
                    return waitForRendererStable();
                },
                waitStable: async (request?: E2EWaitStableRequest) => {
                    await ipcService.e2eWaitStable(request);
                    return waitForRendererStable(request);
                },
                capture: async (
                    request?: E2ECaptureRequest
                ): Promise<CaptureResult | null> => {
                    return ipcService.e2eCapture(request);
                },
            };

            window.__IOT_E2E__ = boundApi;
        };

        void register();

        return () => {
            disposed = true;
            if (boundApi && window.__IOT_E2E__ === boundApi) {
                delete window.__IOT_E2E__;
            }
        };
    }, [ipcService]);
};
