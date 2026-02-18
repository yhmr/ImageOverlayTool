/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createProjectCommandService } from "@/renderer/services/projectCommandService";
import type { ProjectFile } from "@/shared/types/ProjectFile";
import type { ImageSet } from "@/shared/types/ImageSet";

const createSampleProject = (): ProjectFile<ImageSet> => ({
    version: "1.0.0",
    window: { width: 1280, height: 720, x: 10, y: 20, color: "#111111" },
    settings: { unitFactor: 2, unit: "um" },
    canvas: { x: 1, y: 2, scale: 1.5 },
    images: [
        {
            id: "img-1",
            path: "local-file://C:/tmp/a.png",
            transparency: 0,
            rotation: 0,
            initAnchorPos: null,
            currentAnchorPos: null,
            locked: false,
        },
    ],
    dimensionLines: [],
});

describe("projectCommandService", () => {
    const mockIpc = {
        loadProject: vi.fn(),
        loadProjectFromPath: vi.fn(),
        saveProjectAs: vi.fn(),
        saveProject: vi.fn(),
        pickProjectSavePath: vi.fn(),
        materializeCacheImages: vi.fn(),
        toggleImageSettingsWindow: vi.fn(),
        setWindowRect: vi.fn(),
        log: {
            info: vi.fn(),
        },
    } as any;

    const mutations = {
        loadProject: vi.fn(),
        resetAll: vi.fn(),
        setCurrentProjectFilePath: vi.fn(),
        markProjectSaved: vi.fn(),
    };

    const snapshot = {
        unitFactor: 1,
        unit: "um" as const,
        windowColor: "#000000",
        canvas: { x: 0, y: 0, scale: 1 },
        imageSets: [] as ImageSet[],
        dimensionLines: [] as ProjectFile<ImageSet>["dimensionLines"],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    });

    it("openProject should apply loaded project", async () => {
        const loaded = {
            project: createSampleProject(),
            filePath: "C:/tmp/sample.iot",
        };
        mockIpc.loadProject.mockResolvedValue(loaded);

        const service = createProjectCommandService({
            ipcService: mockIpc,
            readSnapshot: () => snapshot,
            readCurrentProjectFilePath: () => null,
            mutations,
        });

        await service.openProject();

        expect(mutations.loadProject).toHaveBeenCalledWith(loaded.project);
        expect(mutations.setCurrentProjectFilePath).toHaveBeenCalledWith(
            loaded.filePath
        );
        expect(mockIpc.setWindowRect).toHaveBeenCalledWith({
            x: 10,
            y: 20,
            width: 1280,
            height: 720,
        });
    });

    it("saveProject should fallback to saveProjectAs when current path is missing", async () => {
        mockIpc.saveProjectAs.mockResolvedValue("C:/tmp/new.iot");

        const service = createProjectCommandService({
            ipcService: mockIpc,
            readSnapshot: () => snapshot,
            readCurrentProjectFilePath: () => null,
            mutations,
        });

        await service.saveProject();

        expect(mockIpc.saveProjectAs).toHaveBeenCalledTimes(1);
        expect(mutations.setCurrentProjectFilePath).toHaveBeenCalledWith(
            "C:/tmp/new.iot"
        );
        expect(mutations.markProjectSaved).toHaveBeenCalledTimes(1);
        expect(mockIpc.saveProject).not.toHaveBeenCalled();
    });

    it("saveProject should write to current file path", async () => {
        const service = createProjectCommandService({
            ipcService: mockIpc,
            readSnapshot: () => snapshot,
            readCurrentProjectFilePath: () => "C:/tmp/current.iot",
            mutations,
        });

        await service.saveProject();

        expect(mockIpc.saveProject).toHaveBeenCalledWith(
            "C:/tmp/current.iot",
            expect.objectContaining({
                version: "1.0.0",
                settings: { unitFactor: 1, unit: "um" },
                canvas: { x: 0, y: 0, scale: 1 },
            })
        );
        expect(mutations.markProjectSaved).toHaveBeenCalledTimes(1);
    });

    it("newProject should reset store and clear current path", async () => {
        const service = createProjectCommandService({
            ipcService: mockIpc,
            readSnapshot: () => snapshot,
            readCurrentProjectFilePath: () => "C:/tmp/current.iot",
            mutations,
        });

        await service.newProject();

        expect(mutations.resetAll).toHaveBeenCalledTimes(1);
        expect(mutations.setCurrentProjectFilePath).toHaveBeenCalledWith(null);
    });

    it("saveProject should materialize cache images before saving", async () => {
        mockIpc.materializeCacheImages.mockResolvedValue({
            "C:/cache/pasted.png": "C:/tmp/assets/pasted.png",
        });

        const cacheSnapshot = {
            ...snapshot,
            imageSets: [
                {
                    id: "cache-1",
                    path: "local-file://C:/cache/pasted.png",
                    sourceType: "cache" as const,
                    transparency: 0,
                    rotation: 0,
                    initAnchorPos: null,
                    currentAnchorPos: null,
                },
            ],
        };

        const service = createProjectCommandService({
            ipcService: mockIpc,
            readSnapshot: () => cacheSnapshot,
            readCurrentProjectFilePath: () => "C:/tmp/current.iot",
            mutations,
        });

        await service.saveProject();

        expect(mockIpc.materializeCacheImages).toHaveBeenCalledWith(
            "C:/tmp/current.iot",
            ["C:/cache/pasted.png"]
        );
        expect(mockIpc.saveProject).toHaveBeenCalledWith(
            "C:/tmp/current.iot",
            expect.objectContaining({
                images: [
                    expect.objectContaining({
                        path: "local-file://C:/tmp/assets/pasted.png",
                        sourceType: "file",
                    }),
                ],
            })
        );
    });

    it("saveProject should reject save and open image settings when user cancels cache move", async () => {
        (globalThis.confirm as any).mockReturnValue(false);

        const cacheSnapshot = {
            ...snapshot,
            imageSets: [
                {
                    id: "cache-1",
                    path: "local-file://C:/cache/pasted.png",
                    sourceType: "cache" as const,
                    transparency: 0,
                    rotation: 0,
                    initAnchorPos: null,
                    currentAnchorPos: null,
                },
            ],
        };

        const service = createProjectCommandService({
            ipcService: mockIpc,
            readSnapshot: () => cacheSnapshot,
            readCurrentProjectFilePath: () => "C:/tmp/current.iot",
            mutations,
        });

        await service.saveProject();

        expect(mockIpc.toggleImageSettingsWindow).toHaveBeenCalledTimes(1);
        expect(mockIpc.saveProject).not.toHaveBeenCalled();
    });
});
