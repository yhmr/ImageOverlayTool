import { useEffect } from "react";

import type { CaptureResult } from "../../shared/types/CaptureResult";
import type {
    E2ECaptureRequest,
    E2EResolvedScene,
    E2EResolvedSceneImage,
    E2ESceneInput,
    E2EWaitStableRequest,
    E2EWaitStableResult,
} from "../../shared/types/E2EControl";
import { sanitizeUnitFactor } from "../../shared/constants/unitFactor";
import type { ProjectFile } from "../../shared/types/ProjectFile";
import type { ImageSet } from "../../shared/types/ImageSet";
import { createImageSet, toLocalFileUrl } from "../factories/imageSetFactory";
import { useIpcService } from "../providers/IpcServiceProvider";
import { useAppStore } from "../store/useAppStore";
import { runAsSystemMutation } from "../store/temporalHistory";

const POLL_INTERVAL_MS = 16;
const DEFAULT_STABLE_TIMEOUT_MS = 5000;

const wait = (ms: number): Promise<void> =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

const createSceneImageSet = (image: E2EResolvedSceneImage): ImageSet =>
    createImageSet({
        id: image.id,
        path: toLocalFileUrl(image.path),
        transparency: image.transparency,
        rotation: image.rotation,
        initAnchorPos: image.initAnchorPos,
        currentAnchorPos: image.currentAnchorPos,
        locked: image.locked,
        visible: image.visible,
        filters: image.filters,
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

const applyResolvedScene = (scene: E2EResolvedScene): void => {
    const current = useAppStore.getState();
    const sceneImageSets = scene.images.map((image) =>
        createSceneImageSet(image)
    );
    const nextProject: ProjectFile<ImageSet> = {
        version: "1.0.0",
        window: {
            width: window.innerWidth,
            height: window.innerHeight,
            x: 0,
            y: 0,
            color: scene.windowColor ?? current.windowColor,
        },
        settings: {
            unitFactor: sanitizeUnitFactor(
                scene.unitFactor ?? current.unitFactor
            ),
            unit: scene.unit ?? current.unit,
        },
        canvas: scene.canvas ?? current.canvas,
        images: sceneImageSets,
        dimensionLines: scene.dimensionLines ?? [],
    };

    useAppStore.getState().loadProject(nextProject);

    runAsSystemMutation(
        () => useAppStore.temporal,
        () => {
            const state = useAppStore.getState();
            if (scene.uiHidden !== undefined) {
                state.setUIHidden(scene.uiHidden);
            }
            if (scene.interactionMode) {
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
                setScene: async (scene: E2ESceneInput) => {
                    const resolvedScene = await ipcService.e2eSetScene(scene);
                    applyResolvedScene(resolvedScene);
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
