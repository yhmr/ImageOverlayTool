import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";

/**
 * 寸法線モード時のキーボードイベントを処理するフック
 * Delete/Backspaceキーで選択中の寸法線を削除する
 */
export const useDimensionKeyboard = () => {
    const {
        selectedDimensionLineId,
        removeDimensionLine,
        selectDimensionLine,
    } = useAppStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                (e.key === "Delete" || e.key === "Backspace") &&
                selectedDimensionLineId
            ) {
                removeDimensionLine(selectedDimensionLineId);
                selectDimensionLine(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedDimensionLineId, removeDimensionLine, selectDimensionLine]);
};
