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
        setSelectedDimensionLineId,
    } = useAppStore();

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (
                (e.key === "Delete" || e.key === "Backspace") &&
                selectedDimensionLineId
            ) {
                removeDimensionLine(selectedDimensionLineId);
                setSelectedDimensionLineId(null);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [
        selectedDimensionLineId,
        removeDimensionLine,
        setSelectedDimensionLineId,
    ]);
};
