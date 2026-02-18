import type { InteractionMode } from "@/shared/types/InteractionMode";

export type PointerSession = "idle" | "stage_pan" | "dimension_interaction";

export interface PointerPolicy {
    dragButtons: number[];
    stageDraggable: boolean;
}

/*
状態遷移（mousedown時）
- default モード: 左/中/右 -> stage_pan
- dimension_select モード: 左 -> dimension_interaction
- dimension_select モード: 中/右 -> stage_pan

mouseup時
- 常に idle に戻す（呼び出し元で実施）
*/
const PAN_DRAG_BUTTONS = [1, 2];
const DIMENSION_DRAG_BUTTONS = [0];

export const resolvePointerButton = (evt: MouseEvent | TouchEvent): number => {
    return "button" in evt ? evt.button : 0;
};

// mousedown時に開始するポインターセッションを決定する。
export const resolveSessionOnMouseDown = (
    interactionMode: InteractionMode,
    pointerButton: number
): PointerSession => {
    if (interactionMode === "default") {
        return "stage_pan";
    }
    if (pointerButton === 1 || pointerButton === 2) {
        return "stage_pan";
    }
    return "dimension_interaction";
};

// 抽象的なセッション状態を、Konvaの具体的なドラッグ設定へ変換する。
export const resolvePointerPolicy = (
    interactionMode: InteractionMode,
    session: PointerSession
): PointerPolicy => {
    const shouldPan = interactionMode === "default" || session === "stage_pan";
    return {
        dragButtons: shouldPan ? PAN_DRAG_BUTTONS : DIMENSION_DRAG_BUTTONS,
        stageDraggable: shouldPan,
    };
};
