import { useCallback } from "react";

import { useIpcService } from "../../providers/IpcServiceProvider";
import { useAppStore } from "../../store/useAppStore";
import { selectAddImageSetWithPath } from "../../store/selectors";

export const useImagePaste = () => {
    const ipcService = useIpcService();
    const addImageSetWithPath = useAppStore(selectAddImageSetWithPath);

    const pasteImage = useCallback(async (): Promise<void> => {
        const pastedPath = await ipcService.pasteImage();
        if (!pastedPath) {
            return;
        }

        addImageSetWithPath(pastedPath, { sourceType: "cache" });
    }, [addImageSetWithPath, ipcService]);

    return { pasteImage };
};
