import fs from "fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { SettingsSnapshot } from "@/shared/types/AppConfig";
import "./appConfigTestDoubles";
import { invokeIpcHandler } from "../../../support/helpers/ipcTestHelper";
import {
    AppConfigIntegrationContext,
    setupAppConfigIntegration,
} from "./appConfigTestHarness";
import { mockShowOpenDialog } from "./appConfigTestDoubles";

describe("Main integration: appConfig import", () => {
    let context: AppConfigIntegrationContext;

    const writeValidImportSnapshot = async () => {
        const importSnapshot: SettingsSnapshot = {
            version: 1,
            exportedAt: new Date().toISOString(),
            setting: {
                language: "ja",
                logLevel: "error",
            },
            window: {
                color: "#55667788",
            },
        };
        await fs.writeFile(
            context.importPath,
            JSON.stringify(importSnapshot),
            "utf8"
        );
    };

    beforeEach(async () => {
        context = await setupAppConfigIntegration();
    });

    afterEach(async () => {
        await context.cleanup();
    });

    it("setting:import returns imported settings", async () => {
        await writeValidImportSnapshot();
        const importedSettings = await invokeIpcHandler("setting:import", {
            sender: {},
        });

        expect(importedSettings).toEqual({
            language: "ja",
            logLevel: "error",
        });
    });

    it("setting:import persists imported settings", async () => {
        await writeValidImportSnapshot();
        await invokeIpcHandler("setting:import", {
            sender: {},
        });

        const loadedSettings = await invokeIpcHandler("setting:load", {
            sender: {},
        });

        expect(loadedSettings).toEqual({
            language: "ja",
            logLevel: "error",
        });
    });

    it("setting:import persists imported window color", async () => {
        await writeValidImportSnapshot();
        await invokeIpcHandler("setting:import", {
            sender: {},
        });

        const loadedWindowColor = await invokeIpcHandler("window_color:load", {
            sender: {},
        });

        expect(loadedWindowColor).toBe("#55667788");
    });

    it("setting:import returns null when open dialog is canceled", async () => {
        mockShowOpenDialog.mockResolvedValueOnce({
            canceled: true,
            filePaths: [],
        });

        const imported = await invokeIpcHandler("setting:import", {
            sender: {},
        });

        expect(imported).toBeNull();
    });

    it("setting:import throws for invalid snapshot format", async () => {
        await fs.writeFile(
            context.importPath,
            JSON.stringify({ version: 1, exportedAt: "invalid" }),
            "utf8"
        );

        await expect(
            invokeIpcHandler("setting:import", {
                sender: {},
            })
        ).rejects.toThrow("Invalid settings file format.");
    });
});
