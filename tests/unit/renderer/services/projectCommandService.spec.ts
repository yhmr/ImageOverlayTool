/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createProjectCommandService } from "@/renderer/services/projectCommandService";
import * as imageSetFactory from "@/renderer/factories/imageSetFactory";
import type { IIPCService } from "@/renderer/services/ipcService";
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
    };
    const confirmCacheImageMaterialization = vi.fn<
        () => Promise<boolean>
    >();

    const mutations = {
        loadProject: vi.fn(),
        resetAll: vi.fn(),
        setCurrentProjectFilePath: vi.fn(),
        markProjectSaved: vi.fn(),
        replaceImageSetsAfterSave: vi.fn(),
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
        confirmCacheImageMaterialization.mockResolvedValue(true);
    });

const createService = (
        overrides: Partial<Parameters<typeof createProjectCommandService>[0]> = {}
    ) =>
        createProjectCommandService({
            ipcService: mockIpc as unknown as IIPCService,
            readSnapshot: () => snapshot,
            readCurrentProjectFilePath: () => null,
            readWindowState: () => ({
                width: window.outerWidth,
                height: window.outerHeight,
                x: window.screenX,
                y: window.screenY,
            }),
            confirmCacheImageMaterialization,
            mutations,
            ...overrides,
        });

    const createCacheSnapshot = () => ({
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
    });

    it("openProject should apply loaded project", async () => {
        const loaded = {
            project: createSampleProject(),
            filePath: "C:/tmp/sample.iot",
        };
        mockIpc.loadProject.mockResolvedValue(loaded);

        const service = createService({
            ipcService: mockIpc as unknown as IIPCService,
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

    it("createProjectFile should build a snapshot-based project payload", () => {
        const service = createService({
            ipcService: mockIpc as unknown as IIPCService,
            readSnapshot: () => snapshot,
            readCurrentProjectFilePath: () => null,
            mutations,
        });

        expect(service.createProjectFile()).toEqual(
            expect.objectContaining({
                version: "1.0.0",
                settings: { unitFactor: 1, unit: "um" },
                canvas: { x: 0, y: 0, scale: 1 },
                images: [],
                dimensionLines: [],
                window: expect.objectContaining({
                    width: window.outerWidth,
                    height: window.outerHeight,
                    x: window.screenX,
                    y: window.screenY,
                    color: "#000000",
                }),
            })
        );
    });

    it("openProject should no-op when load is canceled", async () => {
        mockIpc.loadProject.mockResolvedValue(null);

        const service = createService({
            ipcService: mockIpc as unknown as IIPCService,
            readSnapshot: () => snapshot,
            readCurrentProjectFilePath: () => null,
            mutations,
        });

        await service.openProject();

        expect(mutations.loadProject).not.toHaveBeenCalled();
        expect(mutations.setCurrentProjectFilePath).not.toHaveBeenCalled();
        expect(mockIpc.setWindowRect).not.toHaveBeenCalled();
    });

    it("openProjectFromPath should no-op when load returns null", async () => {
        mockIpc.loadProjectFromPath.mockResolvedValue(null);

        const service = createService({
            ipcService: mockIpc as unknown as IIPCService,
            readSnapshot: () => snapshot,
            readCurrentProjectFilePath: () => null,
            mutations,
        });

        await service.openProjectFromPath("C:/tmp/missing.iot");

        expect(mutations.loadProject).not.toHaveBeenCalled();
        expect(mutations.setCurrentProjectFilePath).not.toHaveBeenCalled();
        expect(mockIpc.setWindowRect).not.toHaveBeenCalled();
    });

    it("openProjectFromPath should apply loaded project", async () => {
        const loaded = {
            project: createSampleProject(),
            filePath: "C:/tmp/from-path.iot",
        };
        mockIpc.loadProjectFromPath.mockResolvedValue(loaded);
        const service = createService({
            ipcService: mockIpc as unknown as IIPCService,
            readSnapshot: () => snapshot,
            readCurrentProjectFilePath: () => null,
            mutations,
        });

        await service.openProjectFromPath("C:/tmp/from-path.iot");

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

    it("openProject should apply project even when window state is missing", async () => {
        const { window: _windowState, ...projectWithoutWindow } =
            createSampleProject();
        const loaded = {
            project: projectWithoutWindow,
            filePath: "C:/tmp/no-window.iot",
        };
        mockIpc.loadProject.mockResolvedValue(loaded);
        const service = createService({
            ipcService: mockIpc as unknown as IIPCService,
            readSnapshot: () => snapshot,
            readCurrentProjectFilePath: () => null,
            mutations,
        });

        await service.openProject();

        expect(mutations.loadProject).toHaveBeenCalledWith(projectWithoutWindow);
        expect(mutations.setCurrentProjectFilePath).toHaveBeenCalledWith(
            "C:/tmp/no-window.iot"
        );
        expect(mockIpc.setWindowRect).not.toHaveBeenCalled();
    });

    it("saveProject should fallback to saveProjectAs when current path is missing", async () => {
        mockIpc.saveProjectAs.mockResolvedValue("C:/tmp/new.iot");

        const service = createService({
            ipcService: mockIpc as unknown as IIPCService,
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

    it("saveProjectAs should keep state unchanged when user cancels save dialog", async () => {
        mockIpc.saveProjectAs.mockResolvedValue(null);

        const service = createService({
            ipcService: mockIpc as unknown as IIPCService,
            readSnapshot: () => snapshot,
            readCurrentProjectFilePath: () => null,
            mutations,
        });

        await service.saveProjectAs();

        expect(mutations.setCurrentProjectFilePath).not.toHaveBeenCalled();
        expect(mutations.markProjectSaved).not.toHaveBeenCalled();
    });

    it("saveProjectAs should treat images without sourceType as non-cache", async () => {
        mockIpc.saveProjectAs.mockResolvedValue("C:/tmp/non-cache.iot");
        const snapshotWithImplicitFileType = {
            ...snapshot,
            imageSets: [
                {
                    id: "implicit-file",
                    path: "local-file://C:/tmp/plain.png",
                    transparency: 0,
                    rotation: 0,
                    initAnchorPos: null,
                    currentAnchorPos: null,
                } as ImageSet,
            ],
        };
        const service = createService({
            ipcService: mockIpc as unknown as IIPCService,
            readSnapshot: () => snapshotWithImplicitFileType,
            readCurrentProjectFilePath: () => null,
            mutations,
        });

        await service.saveProjectAs();

        expect(mockIpc.materializeCacheImages).not.toHaveBeenCalled();
        expect(mockIpc.pickProjectSavePath).not.toHaveBeenCalled();
        expect(mockIpc.saveProjectAs).toHaveBeenCalledTimes(1);
        expect(mutations.setCurrentProjectFilePath).toHaveBeenCalledWith(
            "C:/tmp/non-cache.iot"
        );
        expect(mutations.markProjectSaved).toHaveBeenCalledTimes(1);
    });

    it("saveProject should write to current file path", async () => {
        const service = createService({
            ipcService: mockIpc as unknown as IIPCService,
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
            }),
            undefined
        );
        expect(mutations.markProjectSaved).toHaveBeenCalledTimes(1);
        expect(mutations.replaceImageSetsAfterSave).not.toHaveBeenCalled();
    });

    it("newProject should reset store and clear current path", async () => {
        const service = createService({
            ipcService: mockIpc as unknown as IIPCService,
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

        const cacheSnapshot = createCacheSnapshot();

        const service = createService({
            ipcService: mockIpc as unknown as IIPCService,
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
            }),
            ["C:/cache/pasted.png"]
        );
        expect(mutations.replaceImageSetsAfterSave).toHaveBeenCalledWith([
            expect.objectContaining({
                path: "local-file://C:/tmp/assets/pasted.png",
                sourceType: "file",
            }),
        ]);
    });

    it("saveProject should reject save and open image settings when user cancels cache move", async () => {
        confirmCacheImageMaterialization.mockResolvedValue(false);

        const cacheSnapshot = createCacheSnapshot();

        const service = createService({
            ipcService: mockIpc as unknown as IIPCService,
            readSnapshot: () => cacheSnapshot,
            readCurrentProjectFilePath: () => "C:/tmp/current.iot",
            mutations,
        });

        await service.saveProject();

        expect(mockIpc.toggleImageSettingsWindow).toHaveBeenCalledTimes(1);
        expect(mockIpc.saveProject).not.toHaveBeenCalled();
    });

    it("saveProjectAs with cache should do nothing when target path is not selected", async () => {
        mockIpc.pickProjectSavePath.mockResolvedValue(null);

        const service = createService({
            ipcService: mockIpc as unknown as IIPCService,
            readSnapshot: () => createCacheSnapshot(),
            readCurrentProjectFilePath: () => null,
            mutations,
        });

        await service.saveProjectAs();

        expect(mockIpc.pickProjectSavePath).toHaveBeenCalledTimes(1);
        expect(mockIpc.materializeCacheImages).not.toHaveBeenCalled();
        expect(mockIpc.saveProject).not.toHaveBeenCalled();
        expect(mutations.markProjectSaved).not.toHaveBeenCalled();
    });

    it("saveProjectAs with cache should save to picked path after materialization", async () => {
        mockIpc.pickProjectSavePath.mockResolvedValue("C:/tmp/new-cache.iot");
        mockIpc.materializeCacheImages.mockResolvedValue({
            "C:/cache/pasted.png": "C:/tmp/assets/pasted.png",
        });

        const service = createService({
            ipcService: mockIpc as unknown as IIPCService,
            readSnapshot: () => createCacheSnapshot(),
            readCurrentProjectFilePath: () => null,
            mutations,
        });

        await service.saveProjectAs();

        expect(mockIpc.saveProject).toHaveBeenCalledWith(
            "C:/tmp/new-cache.iot",
            expect.objectContaining({
                images: [
                    expect.objectContaining({
                        path: "local-file://C:/tmp/assets/pasted.png",
                        sourceType: "file",
                    }),
                ],
            }),
            ["C:/cache/pasted.png"]
        );
        expect(mutations.replaceImageSetsAfterSave).toHaveBeenCalledWith([
            expect.objectContaining({
                path: "local-file://C:/tmp/assets/pasted.png",
                sourceType: "file",
            }),
        ]);
        expect(mutations.setCurrentProjectFilePath).toHaveBeenCalledWith(
            "C:/tmp/new-cache.iot"
        );
        expect(mutations.markProjectSaved).toHaveBeenCalledTimes(1);
    });

    it("saveProjectAs with cache should stop when user cancels materialization confirm", async () => {
        confirmCacheImageMaterialization.mockResolvedValue(false);
        mockIpc.pickProjectSavePath.mockResolvedValue("C:/tmp/new-cache.iot");

        const service = createService({
            ipcService: mockIpc as unknown as IIPCService,
            readSnapshot: () => createCacheSnapshot(),
            readCurrentProjectFilePath: () => null,
            mutations,
        });

        await service.saveProjectAs();

        expect(mockIpc.toggleImageSettingsWindow).toHaveBeenCalledTimes(1);
        expect(mockIpc.saveProject).not.toHaveBeenCalled();
        expect(mutations.markProjectSaved).not.toHaveBeenCalled();
    });

    it("saveProject should throw when cache materialization misses required replacements", async () => {
        mockIpc.materializeCacheImages.mockResolvedValue({});
        const service = createService({
            ipcService: mockIpc as unknown as IIPCService,
            readSnapshot: () => createCacheSnapshot(),
            readCurrentProjectFilePath: () => "C:/tmp/current.iot",
            mutations,
        });

        await expect(service.saveProject()).rejects.toThrow(
            "Failed to materialize cache images: C:/cache/pasted.png"
        );
    });

    it("saveProject should keep non-cache images and cache images with invalid local path unchanged", async () => {
        mockIpc.materializeCacheImages.mockResolvedValue({
            "C:/cache/pasted.png": "C:/tmp/assets/pasted.png",
        });
        const mixedSnapshot = {
            ...snapshot,
            imageSets: [
                {
                    id: "cache-valid",
                    path: "local-file://C:/cache/pasted.png",
                    sourceType: "cache" as const,
                    transparency: 0,
                    rotation: 0,
                    initAnchorPos: null,
                    currentAnchorPos: null,
                },
                {
                    id: "cache-invalid",
                    path: "not-local-path",
                    sourceType: "cache" as const,
                    transparency: 0,
                    rotation: 0,
                    initAnchorPos: null,
                    currentAnchorPos: null,
                },
                {
                    id: "normal-file",
                    path: "local-file://C:/images/original.png",
                    sourceType: "file" as const,
                    transparency: 0,
                    rotation: 0,
                    initAnchorPos: null,
                    currentAnchorPos: null,
                },
            ],
        };
        const service = createService({
            ipcService: mockIpc as unknown as IIPCService,
            readSnapshot: () => mixedSnapshot,
            readCurrentProjectFilePath: () => "C:/tmp/current.iot",
            mutations,
        });

        await service.saveProject();

        expect(mockIpc.saveProject).toHaveBeenCalledWith(
            "C:/tmp/current.iot",
            expect.objectContaining({
                images: [
                    expect.objectContaining({
                        id: "cache-valid",
                        path: "local-file://C:/tmp/assets/pasted.png",
                        sourceType: "file",
                    }),
                    expect.objectContaining({
                        id: "cache-invalid",
                        path: "not-local-path",
                        sourceType: "cache",
                    }),
                    expect.objectContaining({
                        id: "normal-file",
                        path: "local-file://C:/images/original.png",
                        sourceType: "file",
                    }),
                ],
            }),
            ["C:/cache/pasted.png"]
        );
    });

    it("saveProject should keep cache image unchanged when replacement key does not match resolved source path", async () => {
        const fromLocalFileUrlSpy = vi.spyOn(
            imageSetFactory,
            "fromLocalFileUrl"
        );
        fromLocalFileUrlSpy
            .mockImplementationOnce(() => "C:/cache/pasted.png")
            .mockImplementationOnce(() => "C:/cache/other.png");
        mockIpc.materializeCacheImages.mockResolvedValue({
            "C:/cache/pasted.png": "C:/tmp/assets/pasted.png",
        });
        const cacheSnapshot = createCacheSnapshot();
        const service = createService({
            ipcService: mockIpc as unknown as IIPCService,
            readSnapshot: () => cacheSnapshot,
            readCurrentProjectFilePath: () => "C:/tmp/current.iot",
            mutations,
        });

        await service.saveProject();

        expect(mockIpc.saveProject).toHaveBeenCalledWith(
            "C:/tmp/current.iot",
            expect.objectContaining({
                images: [
                    expect.objectContaining({
                        path: "local-file://C:/cache/pasted.png",
                        sourceType: "cache",
                    }),
                ],
            }),
            ["C:/cache/pasted.png"]
        );
        fromLocalFileUrlSpy.mockRestore();
    });

    it("saveProject should keep implicit file-type images unchanged during cache materialization", async () => {
        mockIpc.materializeCacheImages.mockResolvedValue({
            "C:/cache/pasted.png": "C:/tmp/assets/pasted.png",
        });
        const mixedSnapshot = {
            ...snapshot,
            imageSets: [
                {
                    id: "cache",
                    path: "local-file://C:/cache/pasted.png",
                    sourceType: "cache" as const,
                    transparency: 0,
                    rotation: 0,
                    initAnchorPos: null,
                    currentAnchorPos: null,
                },
                {
                    id: "implicit-file",
                    path: "local-file://C:/images/plain.png",
                    transparency: 0,
                    rotation: 0,
                    initAnchorPos: null,
                    currentAnchorPos: null,
                } as ImageSet,
            ],
        };
        const service = createService({
            ipcService: mockIpc as unknown as IIPCService,
            readSnapshot: () => mixedSnapshot,
            readCurrentProjectFilePath: () => "C:/tmp/current.iot",
            mutations,
        });

        await service.saveProject();

        expect(mockIpc.saveProject).toHaveBeenCalledWith(
            "C:/tmp/current.iot",
            expect.objectContaining({
                images: [
                    expect.objectContaining({
                        id: "cache",
                        sourceType: "file",
                        path: "local-file://C:/tmp/assets/pasted.png",
                    }),
                    expect.objectContaining({
                        id: "implicit-file",
                        path: "local-file://C:/images/plain.png",
                    }),
                ],
            }),
            ["C:/cache/pasted.png"]
        );
    });
});

