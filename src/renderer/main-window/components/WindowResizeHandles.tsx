import { useMemo, type MouseEvent as ReactMouseEvent } from "react";

import { useIpcService } from "../../providers/IpcServiceProvider";

const MIN_WIDTH = 320;
const MIN_HEIGHT = 240;

type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

type WindowRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

const clampRect = (
    initialRect: WindowRect,
    direction: ResizeDirection,
    deltaX: number,
    deltaY: number,
    minimumSize: { width: number; height: number }
): WindowRect => {
    let { x, y, width, height } = initialRect;

    if (direction.includes("e")) {
        width = Math.max(minimumSize.width, initialRect.width + deltaX);
    }
    if (direction.includes("s")) {
        height = Math.max(minimumSize.height, initialRect.height + deltaY);
    }
    if (direction.includes("w")) {
        width = Math.max(minimumSize.width, initialRect.width - deltaX);
        x = initialRect.x + (initialRect.width - width);
    }
    if (direction.includes("n")) {
        height = Math.max(minimumSize.height, initialRect.height - deltaY);
        y = initialRect.y + (initialRect.height - height);
    }

    return { x, y, width, height };
};

export interface WindowResizeHandlesProps {
    testIdPrefix?: string;
    minWidth?: number;
    minHeight?: number;
}

export function WindowResizeHandles(props: WindowResizeHandlesProps = {}) {
    const {
        testIdPrefix = "main",
        minWidth = MIN_WIDTH,
        minHeight = MIN_HEIGHT,
    } = props;
    const ipcService = useIpcService();
    const isWindows = useMemo(
        () => navigator.userAgent.toLowerCase().includes("windows"),
        []
    );

    const beginResize =
        (direction: ResizeDirection) => (event: ReactMouseEvent) => {
            event.preventDefault();

            const initialRect: WindowRect = {
                x: window.screenX,
                y: window.screenY,
                width: window.outerWidth,
                height: window.outerHeight,
            };
            const initialMouse = { x: event.screenX, y: event.screenY };

            let latestMouse: { x: number; y: number } | null = null;
            let frameRequested = false;

            const applyResize = (): void => {
                frameRequested = false;
                if (!latestMouse) {
                    return;
                }

                const deltaX = latestMouse.x - initialMouse.x;
                const deltaY = latestMouse.y - initialMouse.y;
                const nextRect = clampRect(
                    initialRect,
                    direction,
                    deltaX,
                    deltaY,
                    { width: minWidth, height: minHeight }
                );
                void ipcService.setWindowRect(nextRect);
            };

            const onMouseMove = (moveEvent: MouseEvent): void => {
                latestMouse = { x: moveEvent.screenX, y: moveEvent.screenY };
                if (frameRequested) {
                    return;
                }
                frameRequested = true;
                requestAnimationFrame(applyResize);
            };

            const onMouseUp = (): void => {
                window.removeEventListener("mousemove", onMouseMove);
                window.removeEventListener("mouseup", onMouseUp);
            };

            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
        };

    if (!isWindows) {
        return null;
    }

    const handles: ResizeDirection[] = [
        "n",
        "s",
        "e",
        "w",
        "ne",
        "nw",
        "se",
        "sw",
    ];

    return (
        <div
            className="window-resize-handles"
            aria-hidden="true"
            data-clickthrough-allow
        >
            {handles.map((direction) => (
                <div
                    key={direction}
                    className={`window-resize-handle window-resize-handle-${direction}`}
                    onMouseDown={beginResize(direction)}
                    data-testid={`${testIdPrefix}.window.resize.${direction}`}
                    data-clickthrough-allow
                />
            ))}
        </div>
    );
}
