import { useEffect } from "react";

import { useIpcService } from "../providers/IpcServiceProvider";
import { useAppStore } from "../store/useAppStore";

const CLICK_THROUGH_TARGET_SELECTOR = "[data-clickthrough-target]";
const CLICK_THROUGH_ALLOW_SELECTOR = "[data-clickthrough-allow]";

const isEditableElement = (element: HTMLElement): boolean => {
    const tagName = element.tagName;
    return (
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        element.isContentEditable
    );
};

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
    const isClickThroughMode = useAppStore((state) => state.isClickThroughMode);
    const setClickThroughMode = useAppStore(
        (state) => state.setClickThroughMode
    );

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const target = event.target;
            if (target instanceof HTMLElement && isEditableElement(target)) {
                return;
            }

            if (
                (event.ctrlKey || event.metaKey) &&
                event.shiftKey &&
                !event.altKey &&
                event.key.toLowerCase() === "m"
            ) {
                event.preventDefault();
                const current = useAppStore.getState().isClickThroughMode;
                setClickThroughMode(!current);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [setClickThroughMode]);

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
