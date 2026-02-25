import { sanitizeUnitFactor } from "../../shared/constants/unitFactor";
import type { ImageSet } from "../../shared/types/ImageSet";
import type { ProjectFile } from "../../shared/types/ProjectFile";
import type { ResolvedSceneFile } from "../../shared/types/SceneFile";
import { createImageSet, toLocalFileUrl } from "../factories/imageSetFactory";
import { useAppStore, type AppState } from "../store/useAppStore";
import { runAsSystemMutation } from "../store/temporalHistory";

const createSceneImageSet = (
    image: ResolvedSceneFile["images"][number]
): ImageSet =>
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

export const applyResolvedSceneFile = (scene: ResolvedSceneFile): void => {
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
                state.setWindowFrameVisible(scene.window.showWindowFrame);
            }

            state.setCurrentProjectFilePath(null);
            state.markProjectSaved();
        }
    );
};
