/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from "vitest";

import {
    getPresetColorIndex,
    matchesPresetColorShortcut,
    matchesShortcut,
} from "@/renderer/main-window/hooks/shortcuts/shortcutMatcher";

const createKeyboardEvent = (init: KeyboardEventInit): KeyboardEvent =>
    new KeyboardEvent("keydown", { bubbles: true, ...init });

describe("shortcutMatcher", () => {
    it("matches ctrl/meta shortcut with exact modifier set", () => {
        expect(
            matchesShortcut(createKeyboardEvent({ key: "O", ctrlKey: true }), {
                key: "o",
            })
        ).toBe(true);
        expect(
            matchesShortcut(
                createKeyboardEvent({ key: "o", ctrlKey: true, altKey: true }),
                { key: "o" }
            )
        ).toBe(false);
        expect(
            matchesShortcut(
                createKeyboardEvent({
                    key: "o",
                    metaKey: true,
                    shiftKey: true,
                }),
                { key: "o", shift: true }
            )
        ).toBe(true);
    });

    it("matches preset color shortcut and resolves index", () => {
        const event = createKeyboardEvent({
            key: "3",
            ctrlKey: true,
            altKey: true,
        });
        expect(matchesPresetColorShortcut(event)).toBe(true);
        expect(getPresetColorIndex(event)).toBe(2);
    });

    it("returns null index for non preset-color event", () => {
        const event = createKeyboardEvent({
            key: "3",
            ctrlKey: true,
            altKey: true,
            shiftKey: true,
        });
        expect(matchesPresetColorShortcut(event)).toBe(false);
        expect(getPresetColorIndex(event)).toBeNull();
    });
});
