import { useState, useCallback, useEffect, RefObject } from "react";
import Konva from "konva";

export const useStageControls = (
    stageRef: RefObject<Konva.Stage | null>,
    onUpdate?: (newPos: { x: number; y: number; scale: number }) => void
) => {
    const [stageSize, setStageSize] = useState({ height: 100, width: 100 });

    const handleResize = useCallback(() => {
        const container = document.querySelector(
            ".image-area"
        ) as HTMLDivElement;
        if (container) {
            setStageSize({
                width: container.offsetWidth,
                height: container.offsetHeight,
            });
        }
    }, []);

    const onWheel = useCallback(
        (e: Konva.KonvaEventObject<WheelEvent>) => {
            e.evt.preventDefault(); // 通常のイベントを防ぐ
            if (stageRef.current) {
                const stage = stageRef.current;
                const oldScale = stage.scaleX();
                const point = stage.getPointerPosition();

                if (point) {
                    const mousePointTo = {
                        x: (point.x - stage.x()) / oldScale,
                        y: (point.y - stage.y()) / oldScale,
                    };

                    const newScale =
                        e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1; // 拡縮の倍率

                    const newPos = {
                        x: point.x - mousePointTo.x * newScale,
                        y: point.y - mousePointTo.y * newScale,
                    };

                    if (onUpdate) {
                        onUpdate({ x: newPos.x, y: newPos.y, scale: newScale });
                    } else {
                        stage.scale({ x: newScale, y: newScale });
                        stage.position(newPos);
                    }
                }
            }
        },
        [stageRef, onUpdate]
    );

    useEffect(() => {
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [handleResize]);

    return { stageSize, onWheel };
};
