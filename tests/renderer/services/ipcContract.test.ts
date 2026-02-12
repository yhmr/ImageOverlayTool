/**
 * @vitest-environment node
 */
import { describe, expect, expectTypeOf, it } from "vitest";
import type { IElectronAPI } from "@/renderer/env";
import type { IIPCService } from "@/renderer/services/ipcService";

describe("ipc contract", () => {
    it("keeps renderer IPC types mutually compatible", () => {
        expectTypeOf<IIPCService>().toMatchTypeOf<IElectronAPI>();
        expectTypeOf<IElectronAPI>().toMatchTypeOf<IIPCService>();
        expect(true).toBe(true);
    });

    it("keeps core IPC method signatures aligned", () => {
        expectTypeOf<IIPCService["switchWindowSize"]>().toEqualTypeOf<
            IElectronAPI["switchWindowSize"]
        >();
        expectTypeOf<IIPCService["setWindowRect"]>().toEqualTypeOf<
            IElectronAPI["setWindowRect"]
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

        expectTypeOf<IIPCService["saveProject"]>().toEqualTypeOf<
            IElectronAPI["saveProject"]
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

        expectTypeOf<IIPCService["requestInitialState"]>().toEqualTypeOf<
            IElectronAPI["requestInitialState"]
        >();
        expectTypeOf<IIPCService["toggleImageSettingsWindow"]>().toEqualTypeOf<
            IElectronAPI["toggleImageSettingsWindow"]
        >();
        expectTypeOf<IIPCService["getLicenseInfo"]>().toEqualTypeOf<
            IElectronAPI["getLicenseInfo"]
        >();
        expectTypeOf<IIPCService["log"]["export"]>().toEqualTypeOf<
            IElectronAPI["log"]["export"]
        >();

        expect(true).toBe(true);
    });
});
