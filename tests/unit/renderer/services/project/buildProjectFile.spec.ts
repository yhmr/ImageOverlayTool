/**
 * @vitest-environment node
 */
import { describe, expect, it } from "vitest";

import { buildProjectFile } from "@/renderer/main-window/services/project/buildProjectFile";

describe("buildProjectFile", () => {
    it("builds a project payload from snapshot and injected window state", () => {
        const project = buildProjectFile(
            {
                unitFactor: 2.5,
                unit: "mm",
                windowColor: "#11223344",
                canvas: { x: 10, y: 20, scale: 1.2 },
                imageSets: [],
                dimensionLines: [],
            },
            {
                width: 1280,
                height: 720,
                x: 100,
                y: 200,
            }
        );

        expect(project).toEqual({
            version: "1.0.0",
            window: {
                width: 1280,
                height: 720,
                x: 100,
                y: 200,
                color: "#11223344",
            },
            settings: {
                unitFactor: 2.5,
                unit: "mm",
            },
            canvas: { x: 10, y: 20, scale: 1.2 },
            images: [],
            dimensionLines: [],
        });
    });
});
