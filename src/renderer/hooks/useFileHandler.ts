import { useEffect } from "react";

import { getIPCService } from "../services/ipcService";
import { createImageSetFromLocalFile } from "../factories/imageSetFactory";
import { useAppStore } from "../store/useAppStore";
import { useProjectOperations } from "./useProjectOperations";

export const useFileHandler = () => {
    const { imageSets, setImageSets } = useAppStore();
    const { handleLoadProjectFromPath } = useProjectOperations();

    useEffect(() => {
        const ipcService = getIPCService();
        const unsubscribe = ipcService.onFileOpen((filePath, ext) => {
            ipcService.log.debug(`File received via IPC: ${filePath} (${ext})`);

            // Project File
            if (ext === ".iot") {
                handleLoadProjectFromPath(filePath);
                return;
            }

            // Image File
            const imageExts = [
                ".png",
                ".jpg",
                ".jpeg",
                ".webp",
                ".gif",
                ".svg",
            ];
            if (imageExts.includes(ext.toLowerCase())) {
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
    }, [imageSets, setImageSets, handleLoadProjectFromPath]);
};
