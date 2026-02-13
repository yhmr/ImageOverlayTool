import { expect, test, describe, vi, beforeEach } from "vitest";
import { ProjectRepository } from "@/main/repositories/ProjectRepository";
import { ProjectFile } from "@/shared/types/ProjectFile";
import fs from "fs/promises";
import { UNIT_FACTOR_MIN } from "@/shared/constants/unitFactor";

// Mock fs/promises
vi.mock("fs/promises");

describe("ProjectRepository", () => {
    let repository: ProjectRepository;
    const mockProjectFile: ProjectFile = {
        version: "1.0.0",
        window: {
            width: 800,
            height: 600,
            x: 0,
            y: 0,
            color: "#000000",
        },
        settings: {
            unitFactor: 1,
            unit: "mm",
        },
        images: [],
    };

    beforeEach(() => {
        repository = new ProjectRepository();
        vi.clearAllMocks();
    });

    test("saveProject should write json to file", async () => {
        const filePath = "/test/path/project.json";
        await repository.saveProject(filePath, mockProjectFile);

        expect(fs.writeFile).toHaveBeenCalledWith(
            filePath,
            JSON.stringify(mockProjectFile, null, 2),
            "utf-8"
        );
    });

    test("saveProject should keep camelCase anchor keys", async () => {
        const filePath = "/test/path/project.json";
        await repository.saveProject(filePath, {
            ...mockProjectFile,
            images: [
                {
                    id: "img-1",
                    path: "a.png",
                    transparency: 0,
                    rotation: 0,
                    initAnchorPos: {
                        lt: { x: 0, y: 0 },
                        lb: { x: 0, y: 10 },
                        rt: { x: 10, y: 0 },
                        rb: { x: 10, y: 10 },
                    },
                    currentAnchorPos: {
                        lt: { x: 1, y: 1 },
                        lb: { x: 1, y: 11 },
                        rt: { x: 11, y: 1 },
                        rb: { x: 11, y: 11 },
                    },
                },
            ],
        });

        const written = vi.mocked(fs.writeFile).mock.calls[0][1] as string;
        const parsed = JSON.parse(written);

        expect(parsed.images[0].initAnchorPos).toBeTruthy();
        expect(parsed.images[0].currentAnchorPos).toBeTruthy();
        expect(parsed.images[0].init_anchor_pos).toBeUndefined();
        expect(parsed.images[0].current_anchor_pos).toBeUndefined();
    });

    test("loadProject should read file and parse json", async () => {
        const filePath = "/test/path/project.json";

        vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockProjectFile));

        const result = await repository.loadProject(filePath);

        expect(fs.readFile).toHaveBeenCalledWith(filePath, "utf-8");
        expect(result).toEqual(mockProjectFile);
    });

    test("loadProject should migrate legacy snake_case anchors and defaults", async () => {
        const filePath = "/test/path/legacy.iot";
        const legacyProject = {
            window: {
                width: 640,
                height: 480,
                x: 10,
                y: 20,
                color: "#11223344",
            },
            settings: {
                unitFactor: 2.5,
            },
            images: [
                {
                    path: "/tmp/a.png",
                    transparency: 25,
                    rotation: 15,
                    init_anchor_pos: {
                        lt: { x: 0, y: 0 },
                        lb: { x: 0, y: 10 },
                        rt: { x: 10, y: 0 },
                        rb: { x: 10, y: 10 },
                    },
                    current_anchor_pos: {
                        lt: { x: 1, y: 1 },
                        lb: { x: 1, y: 11 },
                        rt: { x: 11, y: 1 },
                        rb: { x: 11, y: 11 },
                    },
                },
            ],
        };

        vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(legacyProject));

        const result = await repository.loadProject(filePath);
        const firstImage = result.images[0] as {
            initAnchorPos: unknown;
            currentAnchorPos: unknown;
        };

        expect(result.version).toBe("1.0.0");
        expect(result.settings.unit).toBe("um");
        expect(result.dimensionLines).toBeUndefined();
        expect(firstImage.initAnchorPos).toEqual(
            legacyProject.images[0].init_anchor_pos
        );
        expect(firstImage.currentAnchorPos).toEqual(
            legacyProject.images[0].current_anchor_pos
        );
    });

    test("loadProject should reject invalid schema", async () => {
        const filePath = "/test/path/invalid.iot";
        const invalidProject = {
            version: "1.0.0",
            window: {
                width: 800,
                height: 600,
                x: 0,
                y: 0,
                color: "#000000",
            },
            settings: {
                unitFactor: 1,
                unit: "um",
            },
            images: {},
        };

        vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(invalidProject));

        await expect(repository.loadProject(filePath)).rejects.toThrow(
            "images must be an array"
        );
    });

    test("loadProject should sanitize invalid unitFactor values", async () => {
        const filePath = "/test/path/invalid-unit-factor.iot";
        const payload = {
            ...mockProjectFile,
            settings: {
                unitFactor: -999,
                unit: "um",
            },
            images: [],
        };

        vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(payload));

        const result = await repository.loadProject(filePath);

        expect(result.settings.unitFactor).toBe(UNIT_FACTOR_MIN);
    });
});
