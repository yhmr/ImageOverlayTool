import { useState, useCallback } from "react";
import { getIPCService } from "../services/ipcService";

export const useWindowOperations = () => {
    // スクリーンサイズ
    const [full, setFull] = useState(false);

    const handleSwitchFullScreen = useCallback(async () => {
        const ipcService = getIPCService();
        ipcService.log.debug("Toggling fullscreen mode");
        const res = await ipcService.switchWindowSize();
        setFull(res);
    }, []);

    // Windowを閉じる
    const handleCloseWindow = useCallback(() => {
        const ipcService = getIPCService();
        ipcService.log.info("Close button clicked");
        ipcService.closeWindow();
    }, []);

    return {
        full,
        handleSwitchFullScreen,
        handleCloseWindow,
    };
};
