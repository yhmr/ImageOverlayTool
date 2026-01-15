import { useCallback, useState } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { useImageSetsStore } from "../store/useImageSetsStore";
import { ProjectFile } from "../../shared/types/ProjectFile";
import { ImageSet } from "../types/ImageSet";

export const useProjectOperations = () => {
  const {
    unit_factor,
    windowColor,
    canvas,
    dimensionLines,
    setUnitFactor,
    setWindowColor,
    setCanvasState,
    resetProject,
    setDimensionLines,
  } = useProjectStore();

  const { imageSets, setImageSets, setAllImageSets } = useImageSetsStore();

  // 現在のプロジェクトファイルパス
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);

  // 新規プロジェクト
  const handleNewProject = useCallback(() => {
    // Clear images
    setImageSets([]);
    // Reset project settings
    resetProject();
    // Clear current file path
    setCurrentFilePath(null);
  }, [setImageSets, resetProject]);

  // プロジェクト情報の適用
  const applyProject = useCallback(
    async (project: ProjectFile<ImageSet>, filePath: string) => {
      // Restore images
      setAllImageSets(project.images);
      // Restore settings
      setUnitFactor(project.settings.unit_factor);

      // Restore canvas
      if (project.canvas) {
        setCanvasState(project.canvas);
      } else {
        setCanvasState({ x: 0, y: 0, scale: 1 });
      }

      // Restore dimension lines
      if (project.dimensionLines) {
        setDimensionLines(project.dimensionLines);
      } else {
        setDimensionLines([]);
      }

      // Restore window settings
      if (project.window) {
        // Color & Transparency
        if (project.window.color) {
          setWindowColor(project.window.color);
          await window.electronAPI.saveWindowColor(project.window.color);
        }

        // Position & Size
        await window.electronAPI.setWindowRect({
          x: project.window.x,
          y: project.window.y,
          width: project.window.width,
          height: project.window.height,
        });
      }

      setCurrentFilePath(filePath);
    },
    [
      setAllImageSets,
      setUnitFactor,
      setCanvasState,
      setDimensionLines,
      setWindowColor,
    ]
  );

  // プロジェクトの開く
  const handleOpenProject = useCallback(async () => {
    const result = await window.electronAPI.loadProject();
    if (result) {
      await applyProject(
        result.project as ProjectFile<ImageSet>,
        result.filePath
      );
    }
  }, [applyProject]);

  // パスからプロジェクトを開く
  const handleLoadProjectFromPath = useCallback(
    async (path: string) => {
      const result = await window.electronAPI.loadProjectFromPath(path);
      if (result) {
        await applyProject(
          result.project as ProjectFile<ImageSet>,
          result.filePath
        );
      }
    },
    [applyProject]
  );

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
        unit_factor: unit_factor,
      },
      canvas: canvas,
      images: imageSets,
      dimensionLines: dimensionLines,
    };

    const filePath = await window.electronAPI.saveProjectAs(project);
    if (filePath) {
      setCurrentFilePath(filePath);
    }
  }, [imageSets, unit_factor, windowColor, canvas, dimensionLines]);

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
        unit_factor: unit_factor,
      },
      canvas: canvas,
      images: imageSets,
      dimensionLines: dimensionLines,
    };

    await window.electronAPI.saveProject(currentFilePath, project);
  }, [
    currentFilePath,
    imageSets,
    unit_factor,
    windowColor,
    canvas,
    dimensionLines,
    handleSaveProjectAs,
  ]);

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
    handleLoadProjectFromPath,
    handleSaveProject: handleSaveProjectReference,
    handleSaveProjectAs,
  };
};
