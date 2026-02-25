import { describe, expect, it } from "vitest";

import { parseE2ESceneExtensions } from "@/main/repositories/e2eSceneExtensions";

describe("parseE2ESceneExtensions", () => {
    it("parses all supported extension fields", () => {
        const parsed = parseE2ESceneExtensions({
            name: "scene-name",
            interactionMode: "dimension_select",
            selectedImageId: "img-1",
            selectedDimensionLineId: null,
            uiHidden: true,
        });

        expect(parsed).toEqual({
            name: "scene-name",
            interactionMode: "dimension_select",
            selectedImageId: "img-1",
            selectedDimensionLineId: null,
            uiHidden: true,
        });
    });

    it("returns an empty extension object when fields are absent", () => {
        const parsed = parseE2ESceneExtensions({
            version: "1.0.0",
            images: [],
        });

        expect(parsed).toEqual({});
    });

    it("throws when root is not an object", () => {
        expect(() => parseE2ESceneExtensions(null)).toThrow(
            "Invalid scene file: root must be an object."
        );
    });

    it("throws when interactionMode is invalid", () => {
        expect(() =>
            parseE2ESceneExtensions({
                interactionMode: "invalid-mode",
            })
        ).toThrow(
            "interactionMode must be one of default/dimension_add/dimension_select"
        );
    });

    it("throws when selectedImageId has invalid type", () => {
        expect(() =>
            parseE2ESceneExtensions({
                selectedImageId: 123,
            })
        ).toThrow("selectedImageId must be a string or null.");
    });

    it("throws when uiHidden has invalid type", () => {
        expect(() =>
            parseE2ESceneExtensions({
                uiHidden: "yes",
            })
        ).toThrow("uiHidden must be a boolean.");
    });
});
