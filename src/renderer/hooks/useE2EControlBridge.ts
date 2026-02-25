import { useEffect } from "react";

import type { CaptureResult } from "../../shared/types/CaptureResult";
import type {
    E2ECaptureRequest,
    E2EResolvedSceneFile,
    E2EWaitStableRequest,
    E2EWaitStableResult,
} from "../../shared/types/E2EControl";
import { createImageSet, toLocalFileUrl } from "../factories/imageSetFactory";
import { useIpcService } from "../providers/IpcServiceProvider";
import { applyResolvedSceneFile } from "../services/sceneFileApplicator";
import { runAsSystemMutation } from "../store/temporalHistory";
import { useAppStore } from "../store/useAppStore";

const POLL_INTERVAL_MS = 16;
const DEFAULT_STABLE_TIMEOUT_MS = 5000;

const wait = (ms: number): Promise<void> =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

const isRendererStable = (): boolean => {
    const { imageSets } = useAppStore.getState();
    return imageSets.every((imageSet) => {
        if (!imageSet.path) {
            return true;
        }
        return Boolean(imageSet.initAnchorPos && imageSet.currentAnchorPos);
    });
};

const waitForRendererStable = async (
    request?: E2EWaitStableRequest
): Promise<E2EWaitStableResult> => {
    const start = Date.now();
    const timeoutMs = request?.timeoutMs ?? DEFAULT_STABLE_TIMEOUT_MS;

    while (Date.now() - start <= timeoutMs) {
        if (isRendererStable()) {
            return {
                stable: true,
                elapsedMs: Date.now() - start,
            };
        }

        await wait(POLL_INTERVAL_MS);
    }

    return {
        stable: false,
        elapsedMs: Date.now() - start,
    };
};

const applySceneExtensions = (scene: E2EResolvedSceneFile): void => {
    runAsSystemMutation(
        () => useAppStore.temporal,
        () => {
            const state = useAppStore.getState();
            if (scene.uiHidden !== undefined) {
                state.setUIHidden(scene.uiHidden);
            }
            if (scene.interactionMode !== undefined) {
                state.setInteractionMode(scene.interactionMode);
            }
            if (scene.selectedDimensionLineId !== undefined) {
                state.setSelectedDimensionLineId(scene.selectedDimensionLineId);
            }
            if (scene.selectedImageId !== undefined) {
                state.setSelectedImageId(scene.selectedImageId);
            }
            state.markProjectSaved();
        }
    );
};

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
                    applyResolvedSceneFile(resolvedScene);
                    applySceneExtensions(resolvedScene);
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
