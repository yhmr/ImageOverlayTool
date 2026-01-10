import { useState, useCallback } from "react";

export const useWindowOperations = () => {
    // スクリーンサイズ
    const [full, setFull] = useState(false);

    const handleSwitchFullScreen = useCallback(async () => {
        const res = await window.electronAPI.switchWindowSize();
        setFull(res);
    }, []);

    // Windowを閉じる
    const handleCloseWindow = useCallback(() => {
        window.electronAPI.closeWindow();
    }, []);

    return {
        full,
        handleSwitchFullScreen,
        handleCloseWindow,
    };
};
