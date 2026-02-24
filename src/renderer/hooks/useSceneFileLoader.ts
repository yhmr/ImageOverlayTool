import { useCallback } from "react";

import i18n from "../../i18n/configs";
import { sanitizeUnitFactor } from "../../shared/constants/unitFactor";
import type { ImageSet } from "../../shared/types/ImageSet";
import type { ProjectFile } from "../../shared/types/ProjectFile";
import type { ResolvedSceneFile } from "../../shared/types/SceneFile";
import { createImageSet, toLocalFileUrl } from "../factories/imageSetFactory";
import { useIpcService } from "../providers/IpcServiceProvider";
import { runAsSystemMutation } from "../store/temporalHistory";
import { useAppStore, type AppState } from "../store/useAppStore";

const SCENE_FILE_SUFFIX = ".scene.json";

export const isSceneFilePath = (filePath: string): boolean =>
    filePath.toLowerCase().endsWith(SCENE_FILE_SUFFIX);

const createSceneImageSet = (
    image: ResolvedSceneFile["images"][number]
): ImageSet =>
    createImageSet({
        id: image.id,
        path: toLocalFileUrl(image.path),
        transparency: image.transparency,
        rotation: image.rotation,
        locked: image.locked,
        visible: image.visible,
        filters: image.filters,
    });

const buildProjectFromResolvedScene = (
    scene: ResolvedSceneFile,
    current: AppState
): ProjectFile<ImageSet> => ({
    version: "1.0.0",
    window: {
        width: window.innerWidth,
        height: window.innerHeight,
        x: 0,
        y: 0,
        color: scene.window?.color ?? current.windowColor,
    },
    settings: {
        unitFactor: sanitizeUnitFactor(scene.unitFactor ?? current.unitFactor),
        unit: scene.unit ?? current.unit,
    },
    canvas: scene.canvas ?? current.canvas,
    images: scene.images.map((image) => createSceneImageSet(image)),
    dimensionLines: scene.dimensionLines ?? [],
});

const toErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
};

export const useSceneFileLoader = () => {
    const ipcService = useIpcService();

    return useCallback(
        async (filePath: string): Promise<void> => {
            try {
                const scene = await ipcService.loadSceneFromPath(filePath);
                const current = useAppStore.getState();
                const project = buildProjectFromResolvedScene(scene, current);

                current.loadProject(project);

                runAsSystemMutation(
                    () => useAppStore.temporal,
                    () => {
                        const state = useAppStore.getState();
                        const alwaysOnTop = scene.window?.alwaysOnTop ?? false;
                        const clickThrough =
                            alwaysOnTop && Boolean(scene.window?.clickThrough);

                        state.setAlwaysOnTopMode(alwaysOnTop);
                        state.setClickThroughMode(clickThrough);

                        if (scene.window?.showWindowFrame !== undefined) {
                            state.setWindowFrameVisible(
                                scene.window.showWindowFrame
                            );
                        }

                        state.setCurrentProjectFilePath(null);
                        state.markProjectSaved();
                    }
                );
            } catch (error) {
                const message = toErrorMessage(error);
                void ipcService.log.error("Scene file load failed", {
                    filePath,
                    message,
                });
                window.alert(
                    i18n.t("render.scene_load.failed", {
                        message,
                    })
                );
            }
        },
        [ipcService]
    );
};
