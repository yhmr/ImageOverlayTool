import { useCallback, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { ProjectFile } from "../../shared/types/ProjectFile";
import { ImageSet } from "../types/ImageSet";

export const useProjectOperations = () => {
  const {
    unitFactor,
    windowColor,
    canvas,
    dimensionLines,
    setUnitFactor,
    setWindowColor,
    setCanvasState,
    setDimensionLines,
    imageSets,
    setImageSets,
    // loadProjectData, resetProjectData, etc are available in useAppStore
    loadProject,
    resetAll,
  } = useAppStore();

  // 現在のプロジェクトファイルパス
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);

  // 新規プロジェクト
  const handleNewProject = useCallback(async () => {
    // 統合されたリセットアクション
    resetAll();
    setCurrentFilePath(null);
  }, [resetAll]);

  // プロジェクト情報の適用
  const applyProject = useCallback(
    async (project: ProjectFile<ImageSet>, filePath: string) => {
      // ストアの一括更新アクションを使用
      loadProject(project);

      // ウィンドウサイズ・位置の復元 (Electron側)
      if (project.window) {
        // 現在のウィンドウ状態と比較して変更が必要かチェックしてもいいが、
        // ユーザーが意図して保存した状態なので強制的に適用する
        // ただし、colorはstoreで管理しているので、geometryだけ適用
        await window.electronAPI.setWindowRect({
          x: project.window.x,
          y: project.window.y,
          width: project.window.width,
          height: project.window.height,
        });
      }

      setCurrentFilePath(filePath);
    },
    [loadProject]
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
        unitFactor: unitFactor,
      },
      canvas: canvas,
      images: imageSets,
      dimensionLines: dimensionLines,
    };

    const filePath = await window.electronAPI.saveProjectAs(project);
    if (filePath) {
      setCurrentFilePath(filePath);
    }
  }, [imageSets, unitFactor, windowColor, canvas, dimensionLines]);

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
        unitFactor: unitFactor,
      },
      canvas: canvas,
      images: imageSets,
      dimensionLines: dimensionLines,
    };

    await window.electronAPI.saveProject(currentFilePath, project);
  }, [
    currentFilePath,
    imageSets,
    unitFactor,
    windowColor,
    canvas,
    dimensionLines,
    handleSaveProjectAs,
  ]);

  // プロジェクトの保存 (参照用)
  const handleSaveProjectReference = useCallback(async () => {
    if (!currentFilePath) {
      await handleSaveProjectAs();
    } else {
      await handleSaveProject();
    }
  }, [currentFilePath, handleSaveProject, handleSaveProjectAs]);

  return {
    currentFilePath,
    handleNewProject,
    handleOpenProject,
    handleLoadProjectFromPath,
    handleSaveProject: handleSaveProjectReference,
    handleSaveProjectAs,
  };
};
