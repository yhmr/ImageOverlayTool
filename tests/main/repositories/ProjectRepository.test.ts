import { expect, test, describe, vi, beforeEach } from "vitest";
import { ProjectRepository } from "@/main/repositories/ProjectRepository";
import { ProjectFile } from "@/shared/types/ProjectFile";
import fs from "fs/promises";

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

    test("saveProject should serialize image anchors as legacy snake_case", async () => {
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

        expect(parsed.images[0].init_anchor_pos).toBeTruthy();
        expect(parsed.images[0].current_anchor_pos).toBeTruthy();
        expect(parsed.images[0].initAnchorPos).toBeUndefined();
        expect(parsed.images[0].currentAnchorPos).toBeUndefined();
    });

    test("loadProject should read file and parse json", async () => {
        const filePath = "/test/path/project.json";

        vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockProjectFile));

        const result = await repository.loadProject(filePath);

        expect(fs.readFile).toHaveBeenCalledWith(filePath, "utf-8");
        expect(result).toEqual(mockProjectFile);
    });

    test("loadProject should convert legacy snake_case anchors to camelCase", async () => {
        const filePath = "/test/path/project.json";
        vi.mocked(fs.readFile).mockResolvedValue(
            JSON.stringify({
                ...mockProjectFile,
                images: [
                    {
                        id: "img-legacy",
                        path: "legacy.png",
                        transparency: 0,
                        rotation: 0,
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
            })
        );

        const result = await repository.loadProject(filePath);

        expect(result.images[0]).toMatchObject({
            id: "img-legacy",
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
        });
        expect((result.images[0] as Record<string, unknown>).init_anchor_pos).toBeUndefined();
        expect((result.images[0] as Record<string, unknown>).current_anchor_pos).toBeUndefined();
    });
});
