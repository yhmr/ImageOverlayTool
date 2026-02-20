import fs from "fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    type SettingsSnapshot,
    DEFAULT_WINDOW_COLOR_PRESETS,
} from "@/shared/types/AppConfig";
import "./appConfigTestDoubles";
import { invokeIpcHandler } from "../../../support/helpers/ipcTestHelper";
import {
    AppConfigIntegrationContext,
    setupAppConfigIntegration,
} from "./appConfigTestHarness";
import { mockShowSaveDialog } from "./appConfigTestDoubles";

describe("Main integration: appConfig export", () => {
    let context: AppConfigIntegrationContext;

    beforeEach(async () => {
        context = await setupAppConfigIntegration();
    });

    afterEach(async () => {
        await context.cleanup();
    });

    it("setting:export writes snapshot file to selected path", async () => {
        context.store.set("setting", {
            language: "en",
            logLevel: "warn",
        });
        context.store.set("window.color", "#11223344");

        const exportedFilePath = await invokeIpcHandler("setting:export", {
            sender: {},
        });

        expect(exportedFilePath).toBe(context.exportPath);
        const exported = JSON.parse(
            await fs.readFile(context.exportPath, "utf8")
        ) as SettingsSnapshot;
        expect(exported.setting).toEqual({
            language: "en",
            logLevel: "warn",
        });
        expect(exported.window).toEqual({
            color: "#11223344",
            colorPresets: [...DEFAULT_WINDOW_COLOR_PRESETS],
        });
    });

    it("setting:export returns null when save dialog is canceled", async () => {
        mockShowSaveDialog.mockResolvedValueOnce({
            canceled: true,
            filePath: undefined,
        });

        const exportedFilePath = await invokeIpcHandler("setting:export", {
            sender: {},
        });

        expect(exportedFilePath).toBeNull();
    });
});
