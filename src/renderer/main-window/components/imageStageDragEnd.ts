import type Konva from "konva";

export const bindStageDragEndDisable = (stage: Konva.Stage): (() => void) => {
    const onStageDragEnd = () => {
        stage.draggable(false);
    };

    stage.on("dragend", onStageDragEnd);

    return () => {
        stage.off("dragend", onStageDragEnd);
    };
};
