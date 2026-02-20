import { useEffect } from "react";

import { useIpcService } from "../providers/IpcServiceProvider";
import { useAppStore } from "../store/useAppStore";

const CLICK_THROUGH_TARGET_SELECTOR = "[data-clickthrough-target]";
const CLICK_THROUGH_ALLOW_SELECTOR = "[data-clickthrough-allow]";

const shouldIgnoreMouseEvents = (element: HTMLElement | null): boolean => {
    if (!element) {
        return false;
    }
    if (element.closest(CLICK_THROUGH_ALLOW_SELECTOR)) {
        return false;
    }
    return Boolean(element.closest(CLICK_THROUGH_TARGET_SELECTOR));
};

export const useClickThroughMode = (): void => {
    const ipcService = useIpcService();
    const isAlwaysOnTopMode = useAppStore((state) => state.isAlwaysOnTopMode);
    const isClickThroughMode = useAppStore((state) => state.isClickThroughMode);

    useEffect(() => {
        const unsubscribeAlwaysOnTop =
            ipcService.onAlwaysOnTopShortcutTriggered(() => {
                const state = useAppStore.getState();
                state.setAlwaysOnTopMode(!state.isAlwaysOnTopMode);
            });

        const unsubscribe = ipcService.onClickThroughShortcutTriggered(() => {
            const state = useAppStore.getState();
            const nextClickThrough = !state.isClickThroughMode;
            if (nextClickThrough && !state.isAlwaysOnTopMode) {
                state.setAlwaysOnTopMode(true);
            }
            if (!nextClickThrough) {
                state.setAlwaysOnTopMode(false);
                return;
            }
            state.setClickThroughMode(true);
        });

        return () => {
            unsubscribeAlwaysOnTop();
            unsubscribe();
        };
    }, [ipcService]);

    useEffect(() => {
        void ipcService.setAlwaysOnTop(isAlwaysOnTopMode);
        return () => {
            void ipcService.setAlwaysOnTop(false);
        };
    }, [ipcService, isAlwaysOnTopMode]);

    useEffect(() => {
        let lastIgnoreMouseEvents = false;

        const applyIgnoreMouseEvents = (ignore: boolean) => {
            if (lastIgnoreMouseEvents === ignore) {
                return;
            }
            lastIgnoreMouseEvents = ignore;
            void ipcService.setIgnoreMouseEvents(ignore);
        };

        if (!isClickThroughMode) {
            applyIgnoreMouseEvents(false);
            return () => {
                void ipcService.setIgnoreMouseEvents(false);
            };
        }

        const onMouseMove = (event: MouseEvent): void => {
            const hoveredElement = document.elementFromPoint(
                event.clientX,
                event.clientY
            );
            applyIgnoreMouseEvents(
                hoveredElement instanceof HTMLElement
                    ? shouldIgnoreMouseEvents(hoveredElement)
                    : false
            );
        };

        const onMouseLeave = (): void => {
            applyIgnoreMouseEvents(false);
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseleave", onMouseLeave);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseleave", onMouseLeave);
            void ipcService.setIgnoreMouseEvents(false);
        };
    }, [ipcService, isClickThroughMode]);
};
