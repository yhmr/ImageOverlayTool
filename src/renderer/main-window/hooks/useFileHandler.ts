import { useEffect } from "react";

import { isSupportedImageExtension } from "../../../shared/constants/imageFormats";
import type { AppControlCommand } from "../../../shared/types/AppControlCommand";
import { createImageSetFromLocalFile } from "../../factories/imageSetFactory";
import { useIpcService } from "../../providers/IpcServiceProvider";
import { useAppStore } from "../../store/useAppStore";
import { useProjectOperations } from "./useProjectOperations";
import { isSceneFilePath, useSceneFileLoader } from "./useSceneFileLoader";
import { applyLaunchIntent } from "../services/sceneFileApplicator";

const appendImageFromPath = (
    imagePath: string,
    options: { opacity?: number } = {}
): void => {
    const newImageSet = createImageSetFromLocalFile(imagePath, {
        transparency: options.opacity,
    });
    const state = useAppStore.getState();

    // If the first item is empty (default state), replace it.
    // Otherwise append.
    const newImageSets = [...state.imageSets];
    if (newImageSets.length === 1 && !newImageSets[0].path) {
        newImageSets[0] = newImageSet;
    } else {
        newImageSets.push(newImageSet);
    }
    state.setImageSets(newImageSets);
};

const applyAppControlCommand = (command: AppControlCommand): void => {
    if (command.kind === "add-image") {
        appendImageFromPath(command.imagePath, {
            opacity: command.opacity,
        });
        return;
    }

    if (command.kind === "set-opacity") {
        const state = useAppStore.getState();
        const nextImageSets = state.imageSets.map((imageSet) => {
            if (!imageSet.path) {
                return imageSet;
            }
            return {
                ...imageSet,
                transparency: command.opacity,
            };
        });
        state.setImageSets(nextImageSets);
    }
};

export const useFileHandler = () => {
    const { openProjectFromPath } = useProjectOperations();
    const ipcService = useIpcService();
    const loadSceneFile = useSceneFileLoader();

    useEffect(() => {
        const unsubscribe = ipcService.onFileOpen(({ filePath, ext }) => {
            ipcService.log.debug(`File received via IPC: ${filePath} (${ext})`);

            // Scene File
            if (isSceneFilePath(filePath)) {
                void loadSceneFile(filePath);
                return;
            }

            // Project File
            if (ext === ".iot") {
                void openProjectFromPath(filePath);
                return;
            }

            // Image File
            if (isSupportedImageExtension(ext)) {
                appendImageFromPath(filePath);
            }
        });
        return unsubscribe;
    }, [ipcService, loadSceneFile, openProjectFromPath]);

    useEffect(() => {
        return ipcService.onLaunchIntentApply((launchIntent) => {
            void ipcService.log.debug("Launch intent received via IPC.");
            applyLaunchIntent(launchIntent);
        });
    }, [ipcService]);

    useEffect(() => {
        return ipcService.onAppControlCommandApply((command) => {
            void ipcService.log.debug("App control command received via IPC.");
            applyAppControlCommand(command);
        });
    }, [ipcService]);
};
