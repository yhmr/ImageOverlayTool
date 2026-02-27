/**
 * @vitest-environment node
 */
import { describe, expect, expectTypeOf, it } from "vitest";
import type { IElectronAPI } from "@/renderer/env";
import type { IIPCService } from "@/renderer/services/ipcService";
import type {
    MaterializeCacheImagesPayload,
    SaveProjectPayload,
} from "@/shared/ipc/contracts/project";

describe("ipc contract", () => {
    it("keeps preload bridge API contract-shaped", () => {
        expectTypeOf<IElectronAPI["log"]["write"]>().toBeFunction();
        expectTypeOf<IElectronAPI["saveProject"]>().parameters.toEqualTypeOf<
            [payload: SaveProjectPayload]
        >();
        expectTypeOf<IElectronAPI["materializeCacheImages"]>().parameters.toEqualTypeOf<
            [payload: MaterializeCacheImagesPayload]
        >();
    });

    it("keeps passthrough IPC method signatures aligned", () => {
        expectTypeOf<IIPCService["minimizeWindow"]>().toEqualTypeOf<
            IElectronAPI["minimizeWindow"]
        >();
        expectTypeOf<IIPCService["switchWindowSize"]>().toEqualTypeOf<
            IElectronAPI["switchWindowSize"]
        >();
        expectTypeOf<IIPCService["setWindowRect"]>().toEqualTypeOf<
            IElectronAPI["setWindowRect"]
        >();
        expectTypeOf<IIPCService["setIgnoreMouseEvents"]>().toEqualTypeOf<
            IElectronAPI["setIgnoreMouseEvents"]
        >();
        expectTypeOf<IIPCService["setAlwaysOnTop"]>().toEqualTypeOf<
            IElectronAPI["setAlwaysOnTop"]
        >();

        expectTypeOf<IIPCService["loadSetting"]>().toEqualTypeOf<
            IElectronAPI["loadSetting"]
        >();
        expectTypeOf<IIPCService["saveSetting"]>().toEqualTypeOf<
            IElectronAPI["saveSetting"]
        >();
        expectTypeOf<IIPCService["exportSettings"]>().toEqualTypeOf<
            IElectronAPI["exportSettings"]
        >();
        expectTypeOf<IIPCService["importSettings"]>().toEqualTypeOf<
            IElectronAPI["importSettings"]
        >();
        expectTypeOf<IIPCService["saveProjectAs"]>().toEqualTypeOf<
            IElectronAPI["saveProjectAs"]
        >();
        expectTypeOf<IIPCService["loadProject"]>().toEqualTypeOf<
            IElectronAPI["loadProject"]
        >();
        expectTypeOf<IIPCService["loadProjectFromPath"]>().toEqualTypeOf<
            IElectronAPI["loadProjectFromPath"]
        >();
        expectTypeOf<IIPCService["loadSceneFromPath"]>().toEqualTypeOf<
            IElectronAPI["loadSceneFromPath"]
        >();

        expectTypeOf<IIPCService["requestInitialState"]>().toEqualTypeOf<
            IElectronAPI["requestInitialState"]
        >();
        expectTypeOf<IIPCService["onAppControlCommandApply"]>().toEqualTypeOf<
            IElectronAPI["onAppControlCommandApply"]
        >();
        expectTypeOf<IIPCService["toggleImageSettingsWindow"]>().toEqualTypeOf<
            IElectronAPI["toggleImageSettingsWindow"]
        >();
        expectTypeOf<
            IIPCService["toggleDimensionSettingsWindow"]
        >().toEqualTypeOf<IElectronAPI["toggleDimensionSettingsWindow"]>();
        expectTypeOf<IIPCService["getImageInfo"]>().toEqualTypeOf<
            IElectronAPI["getImageInfo"]
        >();
        expectTypeOf<IIPCService["getLicenseInfo"]>().toEqualTypeOf<
            IElectronAPI["getLicenseInfo"]
        >();
        expectTypeOf<IIPCService["getE2EStatus"]>().toEqualTypeOf<
            IElectronAPI["getE2EStatus"]
        >();
        expectTypeOf<IIPCService["e2eSetSceneFromPath"]>().toEqualTypeOf<
            IElectronAPI["e2eSetSceneFromPath"]
        >();
        expectTypeOf<IIPCService["log"]["export"]>().toEqualTypeOf<
            IElectronAPI["log"]["export"]
        >();
    });

    it("keeps renderer IPC ergonomic adapters", () => {
        expectTypeOf<IIPCService["log"]["debug"]>().toBeFunction();
        expectTypeOf<IIPCService["saveProject"]>().parameters.toEqualTypeOf<
            [filePath: string, project: SaveProjectPayload["project"], cacheImagePathsToDelete?: string[]]
        >();
        expectTypeOf<IIPCService["materializeCacheImages"]>().parameters.toEqualTypeOf<
            [projectFilePath: string, cacheImagePaths: string[]]
        >();
    });
});
