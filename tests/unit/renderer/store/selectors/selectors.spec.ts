/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it } from "vitest";

import {
    selectHasUnsavedChanges,
    selectImageSets,
    selectIsWindowFrameVisible,
    selectProjectDataChangeOrigin,
    selectSetProjectDataChangeOrigin,
    selectSetUnit,
    selectSetUnitFactor,
    selectSetWindowColor,
    selectSetWindowColorPresets,
    selectSetWindowFrameVisible,
    selectUnit,
    selectUnitFactor,
    selectWindowColor,
    selectWindowColorPresets,
} from "@/renderer/store/selectors";
import { useAppStore } from "@/renderer/store/useAppStore";

describe("store selectors", () => {
    beforeEach(() => {
        useAppStore.getState().resetAll();
    });

    it("reads and updates project data through selectors", () => {
        const initialState = useAppStore.getState();
        expect(selectImageSets(initialState)).toBe(initialState.imageSets);
        expect(selectHasUnsavedChanges(initialState)).toBe(false);

        selectSetUnitFactor(initialState)(2.5);
        selectSetUnit(useAppStore.getState())("mm");
        selectSetWindowColor(useAppStore.getState())("#11223344");

        const nextState = useAppStore.getState();
        expect(selectUnitFactor(nextState)).toBe(2.5);
        expect(selectUnit(nextState)).toBe("mm");
        expect(selectWindowColor(nextState)).toBe("#11223344");
        expect(selectHasUnsavedChanges(nextState)).toBe(true);
    });

    it("reads and updates app config through selectors", () => {
        const initialState = useAppStore.getState();
        expect(selectWindowColorPresets(initialState)).toEqual(
            initialState.windowColorPresets
        );
        expect(selectIsWindowFrameVisible(initialState)).toBe(
            initialState.isWindowFrameVisible
        );

        selectSetWindowColorPresets(initialState)(["#AABBCC", "#11223344"]);
        selectSetWindowFrameVisible(useAppStore.getState())(true);

        const nextState = useAppStore.getState();
        expect(selectWindowColorPresets(nextState)).toEqual([
            "#AABBCC",
            "#11223344",
        ]);
        expect(selectIsWindowFrameVisible(nextState)).toBe(true);
    });

    it("reads and updates sync origin through selectors", () => {
        const initialState = useAppStore.getState();
        expect(selectProjectDataChangeOrigin(initialState)).toBe("local");

        selectSetProjectDataChangeOrigin(initialState)("remote");
        expect(selectProjectDataChangeOrigin(useAppStore.getState())).toBe(
            "remote"
        );
    });
});
