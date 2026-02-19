import { useCallback, useState } from "react";

import { useIpcService } from "../../providers/IpcServiceProvider";
import { useAppStore } from "../../store/useAppStore";

export interface WindowColorPickerController {
    isOpen: boolean;
    open: () => void;
    setOpen: (open: boolean) => void;
    windowColor: string;
    setWindowColor: (color: string) => void;
    saveWindowColor: () => void;
}

// 背景色ピッカーの開閉状態と保存処理を1箇所で管理する。
export function useWindowColorPickerController(): WindowColorPickerController {
    const ipcService = useIpcService();
    const windowColor = useAppStore((state) => state.windowColor);
    const setWindowColor = useAppStore((state) => state.setWindowColor);
    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback(() => {
        setIsOpen(true);
    }, []);

    const setOpen = useCallback((openState: boolean) => {
        setIsOpen(openState);
    }, []);

    const saveWindowColor = useCallback(() => {
        void ipcService.saveWindowColor(windowColor);
    }, [ipcService, windowColor]);

    return {
        isOpen,
        open,
        setOpen,
        windowColor,
        setWindowColor,
        saveWindowColor,
    };
}
