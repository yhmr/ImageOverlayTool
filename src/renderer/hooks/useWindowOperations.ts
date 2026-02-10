import { useCallback, useState } from "react";

import { useIpcService } from "../providers/IpcServiceProvider";

export const useWindowOperations = () => {
    // スクリーンサイズ
    const [isMaximized, setIsMaximized] = useState(false);
    const ipcService = useIpcService();

    const handleToggleMaximized = useCallback(async () => {
        ipcService.log.debug("Toggling fullscreen mode");
        const res = await ipcService.switchWindowSize();
        setIsMaximized(res);
    }, [ipcService]);

    // Windowを閉じる
    const handleCloseWindow = useCallback(() => {
        ipcService.log.info("Close button clicked");
        void ipcService.closeWindow();
    }, [ipcService]);

    return {
        isMaximized,
        handleToggleMaximized,
        handleCloseWindow,
    };
};
