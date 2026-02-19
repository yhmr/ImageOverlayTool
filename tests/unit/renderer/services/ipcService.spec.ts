/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    getIPCService,
    setIPCService,
    resetIPCService,
} from "@/renderer/services/ipcService";
import { MockIPCService } from "../../mocks/MockIPCService";
import type { ImageSet } from "@/shared/types/ImageSet";
import type { DimensionLine } from "@/shared/types/DimensionLine";
import type { ProjectFile } from "@/shared/types/ProjectFile";

describe("ipcService", () => {
    beforeEach(() => {
        resetIPCService();
    });

    describe("MockIPCService", () => {
        it("should record updateImageSets calls", async () => {
            const mock = new MockIPCService();
            const imageSets = [
                {
                    id: "test-1",
                    path: "/test.png",
                    transparency: 0,
                    rotation: 0,
                    initAnchorPos: null,
                    currentAnchorPos: null,
                },
            ];

            await mock.updateImageSets(imageSets);

            expect(mock.updateImageSetsCalls).toHaveLength(1);
            expect(mock.updateImageSetsCalls[0]).toEqual(imageSets);
        });

        it("should record updateUnitFactor calls", async () => {
            const mock = new MockIPCService();

            await mock.updateUnitFactor(2.5);
            await mock.updateUnitFactor(1.0);

            expect(mock.updateUnitFactorCalls).toHaveLength(2);
            expect(mock.updateUnitFactorCalls[0]).toBe(2.5);
            expect(mock.updateUnitFactorCalls[1]).toBe(1.0);
        });

        it("should reset recorded calls", async () => {
            const mock = new MockIPCService();

            await mock.updateUnitFactor(1.5);
            expect(mock.updateUnitFactorCalls).toHaveLength(1);

            mock.reset();

            expect(mock.updateImageSetsCalls).toHaveLength(0);
            expect(mock.updateUnitFactorCalls).toHaveLength(0);
        });
    });

    describe("setIPCService / getIPCService", () => {
        it("should allow setting a custom service", () => {
            const mock = new MockIPCService();

            setIPCService(mock);

            expect(getIPCService()).toBe(mock);
        });

        it("should switch to mock service", async () => {
            const mock = new MockIPCService();
            setIPCService(mock);

            const service = getIPCService();
            await service.updateUnitFactor(3.0);

            expect(mock.updateUnitFactorCalls).toContain(3.0);
        });
    });

    describe("IPCService implementation delegation", () => {
        const createProject = (): ProjectFile<ImageSet> => ({
            version: "1.0.0",
            window: {
                width: 100,
                height: 100,
                x: 0,
                y: 0,
                color: "#00000000",
            },
            settings: {
                unitFactor: 1,
                unit: "um",
            },
            images: [],
        });

        const createElectronApiMock = () => {
            const unsubImageSets = vi.fn();
            const unsubUnitFactor = vi.fn();
            const unsubUnit = vi.fn();
            const unsubDimensionLines = vi.fn();
            const unsubInteractionMode = vi.fn();
            const unsubRequestState = vi.fn();
            const unsubFileOpen = vi.fn();
            const unsubSelectedImageId = vi.fn();
            const unsubSelectedDimensionLineId = vi.fn();
            const unsubLanguage = vi.fn();

            const api = {
                log: {
                    debug: vi.fn().mockResolvedValue(undefined),
                    info: vi.fn().mockResolvedValue(undefined),
                    warn: vi.fn().mockResolvedValue(undefined),
                    error: vi.fn().mockResolvedValue(undefined),
                    export: vi.fn().mockResolvedValue("logs.txt"),
                },
                switchWindowSize: vi.fn().mockResolvedValue(true),
                setWindowRect: vi.fn().mockResolvedValue(undefined),
                setIgnoreMouseEvents: vi.fn().mockResolvedValue(undefined),
                setAlwaysOnTop: vi.fn().mockResolvedValue(undefined),
                closeWindow: vi.fn().mockResolvedValue(undefined),
                loadSetting: vi
                    .fn()
                    .mockResolvedValue({ language: "ja", logLevel: "info" }),
                saveSetting: vi.fn().mockResolvedValue(undefined),
                exportSettings: vi.fn().mockResolvedValue("settings.json"),
                importSettings: vi
                    .fn()
                    .mockResolvedValue({ language: "en", logLevel: "debug" }),
                onLanguageUpdated: vi.fn().mockReturnValue(unsubLanguage),
                loadWindowColor: vi.fn().mockResolvedValue("#ffffff"),
                saveWindowColor: vi.fn().mockResolvedValue(undefined),
                saveProjectAs: vi.fn().mockResolvedValue("project.iot"),
                saveProject: vi.fn().mockResolvedValue(true),
                pickProjectSavePath: vi.fn().mockResolvedValue("picked.iot"),
                materializeCacheImages: vi
                    .fn()
                    .mockResolvedValue({ "C:/tmp/cache.png": "C:/tmp/assets/cache.png" }),
                loadProject: vi
                    .fn()
                    .mockResolvedValue({ project: createProject(), filePath: "a.iot" }),
                loadProjectFromPath: vi
                    .fn()
                    .mockResolvedValue({ project: createProject(), filePath: "b.iot" }),
                loadImage: vi.fn().mockResolvedValue("C:/tmp/image.png"),
                getImageInfo: vi
                    .fn()
                    .mockResolvedValue({ exists: true, width: 640, height: 480 }),
                pasteImage: vi.fn().mockResolvedValue("C:/tmp/paste.png"),
                saveCacheImageAs: vi
                    .fn()
                    .mockResolvedValue("C:/tmp/explicit.png"),
                getPathForFile: vi.fn().mockReturnValue("C:/tmp/from-drop.png"),
                toggleImageSettingsWindow: vi.fn().mockResolvedValue(false),
                toggleDimensionSettingsWindow: vi.fn().mockResolvedValue(true),
                updateImageSets: vi.fn().mockResolvedValue(undefined),
                onImageSetsUpdated: vi.fn().mockReturnValue(unsubImageSets),
                updateDimensionLines: vi.fn().mockResolvedValue(undefined),
                onDimensionLinesUpdated: vi
                    .fn()
                    .mockReturnValue(unsubDimensionLines),
                updateUnitFactor: vi.fn().mockResolvedValue(undefined),
                onUnitFactorUpdated: vi.fn().mockReturnValue(unsubUnitFactor),
                updateUnit: vi.fn().mockResolvedValue(undefined),
                onUnitUpdated: vi.fn().mockReturnValue(unsubUnit),
                updateInteractionMode: vi.fn().mockResolvedValue(undefined),
                onInteractionModeUpdated: vi
                    .fn()
                    .mockReturnValue(unsubInteractionMode),
                requestInitialState: vi.fn().mockResolvedValue(undefined),
                onRequestStateSync: vi.fn().mockReturnValue(unsubRequestState),
                onFileOpen: vi.fn().mockReturnValue(unsubFileOpen),
                getLicenseInfo: vi.fn().mockResolvedValue([
                    {
                        name: "dep",
                        licenses: "MIT",
                        repository: "repo",
                        publisher: "publisher",
                        url: "url",
                    },
                ]),
                getAppVersion: vi.fn().mockResolvedValue("0.5.0"),
                captureScreen: vi
                    .fn()
                    .mockResolvedValue({ filePath: "capture.png", width: 10, height: 20 }),
                captureWindow: vi
                    .fn()
                    .mockResolvedValue({ filePath: "window.png", width: 30, height: 40 }),
                saveImage: vi.fn().mockResolvedValue("saved.png"),
                updateSelectedImageId: vi.fn().mockResolvedValue(undefined),
                onSelectedImageIdUpdated: vi
                    .fn()
                    .mockReturnValue(unsubSelectedImageId),
                updateSelectedDimensionLineId: vi
                    .fn()
                    .mockResolvedValue(undefined),
                onSelectedDimensionLineIdUpdated: vi
                    .fn()
                    .mockReturnValue(unsubSelectedDimensionLineId),
                updateProjectDirty: vi.fn().mockResolvedValue(undefined),
                getE2EStatus: vi.fn().mockResolvedValue({
                    enabled: true,
                    artifactsDir: "test-results/e2e-artifacts",
                    fixturesDir: "e2e/fixtures",
                }),
                e2eSetScene: vi.fn().mockResolvedValue({ images: [] }),
                e2eLoadFixtureImage: vi
                    .fn()
                    .mockResolvedValue({ path: "C:/tmp/fixture.png" }),
                e2eWaitStable: vi
                    .fn()
                    .mockResolvedValue({ stable: true, elapsedMs: 10 }),
                e2eCapture: vi.fn().mockResolvedValue({
                    filePath: "e2e-capture.png",
                    width: 50,
                    height: 60,
                }),
            };

            return {
                api,
                unsubscribers: {
                    unsubImageSets,
                    unsubUnitFactor,
                    unsubUnit,
                    unsubDimensionLines,
                    unsubInteractionMode,
                    unsubRequestState,
                    unsubFileOpen,
                    unsubSelectedImageId,
                    unsubSelectedDimensionLineId,
                    unsubLanguage,
                },
            };
        };

        it("delegates invoke-type IPC methods to window.electronAPI", async () => {
            const { api } = createElectronApiMock();
            (globalThis as any).window = { electronAPI: api };
            resetIPCService();
            const service = getIPCService();
            const project = createProject();

            await service.log.debug("d", 1);
            await service.log.info("i", 2);
            await service.log.warn("w", 3);
            await service.log.error("e", 4);
            await expect(service.log.export()).resolves.toBe("logs.txt");
            expect(api.log.debug).toHaveBeenCalledWith("d", 1);
            expect(api.log.info).toHaveBeenCalledWith("i", 2);
            expect(api.log.warn).toHaveBeenCalledWith("w", 3);
            expect(api.log.error).toHaveBeenCalledWith("e", 4);

            await expect(service.switchWindowSize()).resolves.toBe(true);
            await service.setWindowRect({ x: 1, y: 2, width: 3, height: 4 });
            await service.setIgnoreMouseEvents(true);
            await service.setAlwaysOnTop(true);
            await service.closeWindow();
            await expect(service.loadSetting()).resolves.toEqual({
                language: "ja",
                logLevel: "info",
            });
            await service.saveSetting({ language: "en", logLevel: "warn" });
            await expect(service.exportSettings()).resolves.toBe("settings.json");
            await expect(service.importSettings()).resolves.toEqual({
                language: "en",
                logLevel: "debug",
            });
            await expect(service.loadWindowColor()).resolves.toBe("#ffffff");
            await service.saveWindowColor("#222222");
            await expect(service.saveProjectAs(project)).resolves.toBe("project.iot");
            await expect(service.saveProject("save.iot", project)).resolves.toBe(true);
            await expect(service.pickProjectSavePath()).resolves.toBe("picked.iot");
            await expect(
                service.materializeCacheImages("save.iot", ["C:/tmp/cache.png"])
            ).resolves.toEqual({
                "C:/tmp/cache.png": "C:/tmp/assets/cache.png",
            });
            await expect(service.loadProject()).resolves.toEqual({
                project,
                filePath: "a.iot",
            });
            await expect(service.loadProjectFromPath("b.iot")).resolves.toEqual({
                project,
                filePath: "b.iot",
            });
            await expect(service.loadImage()).resolves.toBe("C:/tmp/image.png");
            await expect(service.getImageInfo("C:/tmp/image.png")).resolves.toEqual({
                exists: true,
                width: 640,
                height: 480,
            });
            await expect(service.pasteImage()).resolves.toBe("C:/tmp/paste.png");
            await expect(service.saveCacheImageAs("C:/tmp/paste.png")).resolves.toBe(
                "C:/tmp/explicit.png"
            );
            expect(service.getPathForFile({} as File)).toBe(
                "C:/tmp/from-drop.png"
            );
            await expect(service.toggleImageSettingsWindow()).resolves.toBe(false);
            await expect(service.toggleDimensionSettingsWindow()).resolves.toBe(
                true
            );
            await service.updateImageSets([]);
            await service.updateDimensionLines([] as DimensionLine[]);
            await service.updateUnitFactor(2.5);
            await service.updateUnit("nm");
            await service.updateInteractionMode("dimension_select");
            await service.requestInitialState();
            await expect(service.getLicenseInfo()).resolves.toHaveLength(1);
            await expect(service.getAppVersion()).resolves.toBe("0.5.0");
            await expect(service.captureScreen()).resolves.toEqual({
                filePath: "capture.png",
                width: 10,
                height: 20,
            });
            await expect(service.captureWindow()).resolves.toEqual({
                filePath: "window.png",
                width: 30,
                height: 40,
            });
            await expect(service.saveImage("data:image/png")).resolves.toBe("saved.png");
            await service.updateSelectedImageId("abc");
            await service.updateSelectedDimensionLineId("line-1");
            await service.updateProjectDirty(true);
            await expect(service.getE2EStatus()).resolves.toEqual({
                enabled: true,
                artifactsDir: "test-results/e2e-artifacts",
                fixturesDir: "e2e/fixtures",
            });
            await expect(service.e2eSetScene({ images: [] })).resolves.toEqual({
                images: [],
            });
            await expect(
                service.e2eLoadFixtureImage({ source: "fixture:placeholder" })
            ).resolves.toEqual({
                path: "C:/tmp/fixture.png",
            });
            await expect(service.e2eWaitStable({ timeoutMs: 1000 })).resolves.toEqual({
                stable: true,
                elapsedMs: 10,
            });
            await expect(service.e2eCapture({ mode: "window" })).resolves.toEqual({
                filePath: "e2e-capture.png",
                width: 50,
                height: 60,
            });

            expect(api.setWindowRect).toHaveBeenCalledWith({
                x: 1,
                y: 2,
                width: 3,
                height: 4,
            });
            expect(api.setIgnoreMouseEvents).toHaveBeenCalledWith(true);
            expect(api.setAlwaysOnTop).toHaveBeenCalledWith(true);
            expect(api.saveProject).toHaveBeenCalledWith(
                "save.iot",
                project,
                undefined
            );
            expect(api.pickProjectSavePath).toHaveBeenCalled();
            expect(api.materializeCacheImages).toHaveBeenCalledWith("save.iot", [
                "C:/tmp/cache.png",
            ]);
            expect(api.loadProjectFromPath).toHaveBeenCalledWith("b.iot");
            expect(api.getImageInfo).toHaveBeenCalledWith("C:/tmp/image.png");
            expect(api.pasteImage).toHaveBeenCalled();
            expect(api.saveCacheImageAs).toHaveBeenCalledWith("C:/tmp/paste.png");
            expect(api.getPathForFile).toHaveBeenCalled();
            expect(api.updateUnit).toHaveBeenCalledWith("nm");
            expect(api.updateInteractionMode).toHaveBeenCalledWith(
                "dimension_select"
            );
            expect(api.updateSelectedImageId).toHaveBeenCalledWith("abc");
            expect(api.updateSelectedDimensionLineId).toHaveBeenCalledWith(
                "line-1"
            );
            expect(api.updateProjectDirty).toHaveBeenCalledWith(true);
            expect(api.getE2EStatus).toHaveBeenCalled();
            expect(api.e2eSetScene).toHaveBeenCalledWith({ images: [] });
            expect(api.e2eLoadFixtureImage).toHaveBeenCalledWith({
                source: "fixture:placeholder",
            });
            expect(api.e2eWaitStable).toHaveBeenCalledWith({ timeoutMs: 1000 });
            expect(api.e2eCapture).toHaveBeenCalledWith({ mode: "window" });
        });

        it("delegates subscription IPC methods and returns unsubscriber", () => {
            const { api, unsubscribers } = createElectronApiMock();
            (globalThis as any).window = { electronAPI: api };
            resetIPCService();
            const service = getIPCService();

            const onImageSetsUpdated = vi.fn();
            const onUnitFactorUpdated = vi.fn();
            const onUnitUpdated = vi.fn();
            const onDimensionLinesUpdated = vi.fn();
            const onInteractionModeUpdated = vi.fn();
            const onRequestStateSync = vi.fn();
            const onFileOpen = vi.fn();
            const onSelectedImageIdUpdated = vi.fn();
            const onSelectedDimensionLineIdUpdated = vi.fn();
            const onLanguageUpdated = vi.fn();

            expect(service.onImageSetsUpdated(onImageSetsUpdated)).toBe(
                unsubscribers.unsubImageSets
            );
            expect(service.onUnitFactorUpdated(onUnitFactorUpdated)).toBe(
                unsubscribers.unsubUnitFactor
            );
            expect(service.onUnitUpdated(onUnitUpdated)).toBe(
                unsubscribers.unsubUnit
            );
            expect(service.onDimensionLinesUpdated(onDimensionLinesUpdated)).toBe(
                unsubscribers.unsubDimensionLines
            );
            expect(service.onInteractionModeUpdated(onInteractionModeUpdated)).toBe(
                unsubscribers.unsubInteractionMode
            );
            expect(service.onRequestStateSync(onRequestStateSync)).toBe(
                unsubscribers.unsubRequestState
            );
            expect(service.onFileOpen(onFileOpen)).toBe(unsubscribers.unsubFileOpen);
            expect(service.onSelectedImageIdUpdated(onSelectedImageIdUpdated)).toBe(
                unsubscribers.unsubSelectedImageId
            );
            expect(
                service.onSelectedDimensionLineIdUpdated(
                    onSelectedDimensionLineIdUpdated
                )
            ).toBe(unsubscribers.unsubSelectedDimensionLineId);
            expect(service.onLanguageUpdated(onLanguageUpdated)).toBe(
                unsubscribers.unsubLanguage
            );

            expect(api.onImageSetsUpdated).toHaveBeenCalledWith(onImageSetsUpdated);
            expect(api.onUnitFactorUpdated).toHaveBeenCalledWith(onUnitFactorUpdated);
            expect(api.onUnitUpdated).toHaveBeenCalledWith(onUnitUpdated);
            expect(api.onDimensionLinesUpdated).toHaveBeenCalledWith(
                onDimensionLinesUpdated
            );
            expect(api.onInteractionModeUpdated).toHaveBeenCalledWith(
                onInteractionModeUpdated
            );
            expect(api.onRequestStateSync).toHaveBeenCalledWith(onRequestStateSync);
            expect(api.onFileOpen).toHaveBeenCalledWith(onFileOpen);
            expect(api.onSelectedImageIdUpdated).toHaveBeenCalledWith(
                onSelectedImageIdUpdated
            );
            expect(api.onSelectedDimensionLineIdUpdated).toHaveBeenCalledWith(
                onSelectedDimensionLineIdUpdated
            );
            expect(api.onLanguageUpdated).toHaveBeenCalledWith(onLanguageUpdated);
        });
    });
});


