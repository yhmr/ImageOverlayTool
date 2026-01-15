import { useEffect } from "react";
import { useImageSetsStore } from "../store/useImageSetsStore";
import { useProjectOperations } from "./useProjectOperations";
import UUID from "uuidjs";
import { ImageSet } from "../types/ImageSet";

export const useFileHandler = () => {
  const { imageSets, setImageSets } = useImageSetsStore();
  const { handleLoadProjectFromPath } = useProjectOperations();

  useEffect(() => {
    const unsubscribe = window.electronAPI.onFileOpen((filePath, ext) => {
      // Project File
      if (ext === ".iot") {
        handleLoadProjectFromPath(filePath);
        return;
      }

      // Image File
      const imageExts = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"];
      if (imageExts.includes(ext.toLowerCase())) {
        const newSet: ImageSet = {
          id: UUID.generate(),
          path: `local-file://${filePath.replace(/\\/g, "/")}`,
          transparency: 0,
          rotation: 0,
          init_anchor_pos: null,
          current_anchor_pos: null,
        };

        // If the first item is empty (default state), replace it.
        // Otherwise append.
        // Note: We access imageSets from closure, so this effect runs when imageSets changes.
        const newImageSets = [...imageSets];
        if (newImageSets.length === 1 && !newImageSets[0].path) {
          newImageSets[0] = newSet;
        } else {
          newImageSets.push(newSet);
        }
        setImageSets(newImageSets);
      }
    });
    return unsubscribe;
  }, [imageSets, setImageSets, handleLoadProjectFromPath]);
};
