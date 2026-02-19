import { useEffect } from "react";

import { isSupportedImageExtension } from "../../shared/constants/imageFormats";
import { createImageSetFromLocalFile } from "../factories/imageSetFactory";
import { useIpcService } from "../providers/IpcServiceProvider";
import { useAppStore } from "../store/useAppStore";
import { useProjectOperations } from "./useProjectOperations";

export const useFileHandler = () => {
    const { imageSets, setImageSets } = useAppStore();
    const { openProjectFromPath } = useProjectOperations();
    const ipcService = useIpcService();

    useEffect(() => {
        const unsubscribe = ipcService.onFileOpen((filePath, ext) => {
            ipcService.log.debug(`File received via IPC: ${filePath} (${ext})`);

            // Project File
            if (ext === ".iot") {
                openProjectFromPath(filePath);
                return;
            }

            // Image File
            if (isSupportedImageExtension(ext)) {
                const newImageSet = createImageSetFromLocalFile(filePath);

                // If the first item is empty (default state), replace it.
                // Otherwise append.
                // Note: We access imageSets from closure, so this effect runs when imageSets changes.
                const newImageSets = [...imageSets];
                if (newImageSets.length === 1 && !newImageSets[0].path) {
                    newImageSets[0] = newImageSet;
                } else {
                    newImageSets.push(newImageSet);
                }
                setImageSets(newImageSets);
            }
        });
        return unsubscribe;
    }, [imageSets, ipcService, setImageSets, openProjectFromPath]);
};
