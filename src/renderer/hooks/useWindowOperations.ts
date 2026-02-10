import { useState, useCallback } from "react";
import { getIPCService } from "../services/ipcService";

export const useWindowOperations = () => {
    // スクリーンサイズ
    const [isMaximized, setIsMaximized] = useState(false);

    const handleToggleMaximized = useCallback(async () => {
        const ipcService = getIPCService();
        ipcService.log.debug("Toggling fullscreen mode");
        const res = await ipcService.switchWindowSize();
        setIsMaximized(res);
    }, []);

    // Windowを閉じる
    const handleCloseWindow = useCallback(() => {
        const ipcService = getIPCService();
        ipcService.log.info("Close button clicked");
        ipcService.closeWindow();
    }, []);

    return {
        isMaximized,
        handleToggleMaximized,
        handleCloseWindow,
    };
};

