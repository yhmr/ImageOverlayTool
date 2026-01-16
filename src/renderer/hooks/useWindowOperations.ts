import { useState, useCallback } from "react";
import { logger } from "../services/loggerService";

export const useWindowOperations = () => {
    // スクリーンサイズ
    const [full, setFull] = useState(false);

    const handleSwitchFullScreen = useCallback(async () => {
        logger.debug("Toggling fullscreen mode");
        const res = await window.electronAPI.switchWindowSize();
        setFull(res);
    }, []);

    // Windowを閉じる
    const handleCloseWindow = useCallback(() => {
        logger.info("Close button clicked");
        window.electronAPI.closeWindow();
    }, []);

    return {
        full,
        handleSwitchFullScreen,
        handleCloseWindow,
    };
};
