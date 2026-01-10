import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { useSelector, RootState } from "../store/store";
import { setImageSets, setAllImageSets } from "../store/imageSetsSlice";
import { setUnitFactor, setWindowColor, setCanvasState, resetProject } from "../store/projectSlice";
import { ProjectFile } from "../../shared/types/ProjectFile";
import { ImageSet } from "../types/ImageSet";

export const useProjectOperations = () => {
    const dispatch = useDispatch();
    const { imageSets } = useSelector((state: RootState) => state.imageSets);
    const { unit_factor, windowColor, canvas } = useSelector((state: RootState) => state.project);

    // 現在のプロジェクトファイルパス
    const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);

    // 新規プロジェクト
    const handleNewProject = useCallback(() => {
        // Clear images
        dispatch(setImageSets([]));
        // Reset project settings
        dispatch(resetProject());
        // Clear current file path
        setCurrentFilePath(null);
    }, [dispatch]);

    // プロジェクトの開く
    const handleOpenProject = useCallback(async () => {
        const result = await window.electronAPI.loadProject();
        if (result) {
            const { project, filePath } = result;
            // Restore images
            dispatch(setAllImageSets(project.images));
            // Restore settings
            dispatch(setUnitFactor(project.settings.unit_factor));

            // Restore canvas
            if (project.canvas) {
                dispatch(setCanvasState(project.canvas));
            } else {
                dispatch(setCanvasState({ x: 0, y: 0, scale: 1 }));
            }

            // Restore window settings
            if (project.window) {
                // Color & Transparency
                if (project.window.color) {
                    dispatch(setWindowColor(project.window.color));
                    await window.electronAPI.saveWindowColor(project.window.color);
                }

                // Position & Size
                // Opacity (from schema) if present and supported?
                // Currently sticking to rect.
                await window.electronAPI.setWindowRect({
                    x: project.window.x,
                    y: project.window.y,
                    width: project.window.width,
                    height: project.window.height
                });
            }

            setCurrentFilePath(filePath);
        }
    }, [dispatch]);

    // プロジェクトの保存
    const handleSaveProjectAs = useCallback(async () => {
        const project: ProjectFile<ImageSet> = {
            version: "1.0.0",
            window: {
                width: window.outerWidth,
                height: window.outerHeight,
                x: window.screenX,
                y: window.screenY,
                color: windowColor,
            },
            settings: {
                unit_factor: unit_factor
            },
            canvas: canvas,
            images: imageSets
        };

        const filePath = await window.electronAPI.saveProjectAs(project);
        if (filePath) {
            setCurrentFilePath(filePath);
        }
    }, [imageSets, unit_factor, windowColor, canvas]);

    // プロジェクトの保存
    const handleSaveProject = useCallback(async () => {
        if (!currentFilePath) {
            // ファイルが存在しない場合は、Save As
            await handleSaveProjectAs();
            return;
        }

        const project: ProjectFile<ImageSet> = {
            version: "1.0.0",
            window: {
                width: window.outerWidth,
                height: window.outerHeight,
                x: window.screenX,
                y: window.screenY,
                color: windowColor,
            },
            settings: {
                unit_factor: unit_factor
            },
            canvas: canvas,
            images: imageSets
        };

        await window.electronAPI.saveProject(currentFilePath, project);

    }, [currentFilePath, imageSets, unit_factor, windowColor, canvas, handleSaveProjectAs]);

    // プロジェクトの保存
    const handleSaveProjectReference = useCallback(async () => {
        if (!currentFilePath) {
            await handleSaveProjectAs();
        } else {
            await handleSaveProject();
        }
    }, [currentFilePath, handleSaveProject, handleSaveProjectAs]);

    return {
        handleNewProject,
        handleOpenProject,
        handleSaveProject: handleSaveProjectReference,
        handleSaveProjectAs
    };
};
