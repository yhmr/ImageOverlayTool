import fs from "fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { IPC_EVENTS } from "@/shared/ipc/channels";
import type { SettingsSnapshot } from "@/shared/types/AppConfig";
import "./appConfigTestDoubles";
import { invokeIpcHandler } from "../../../support/helpers/ipcTestHelper";
import {
    AppConfigIntegrationContext,
    setupAppConfigIntegration,
} from "./appConfigTestHarness";
import {
    mockInitializeMainI18n,
    mockSetLogLevel,
} from "./appConfigTestDoubles";

describe("Main integration: appConfig language broadcast", () => {
    let context: AppConfigIntegrationContext;

    beforeEach(async () => {
        context = await setupAppConfigIntegration();
    });

    afterEach(async () => {
        await context.cleanup();
    });

    it("setting:save emits languageUpdated for all windows", async () => {
        await invokeIpcHandler("setting:save", { sender: {} }, {
            language: "en",
            logLevel: "debug",
        });

        expect(mockSetLogLevel).toHaveBeenCalledWith("debug");
        expect(mockInitializeMainI18n).toHaveBeenCalledWith("en");
        expect(context.languageBroadcastSend).toHaveBeenCalledWith(
            IPC_EVENTS.languageUpdated,
            "en"
        );
    });

    it("setting:import emits languageUpdated for all windows", async () => {
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

        await invokeIpcHandler("setting:import", {
            sender: {},
        });

        expect(mockSetLogLevel).toHaveBeenCalledWith("error");
        expect(mockInitializeMainI18n).toHaveBeenCalledWith("ja");
        expect(context.languageBroadcastSend).toHaveBeenCalledWith(
            IPC_EVENTS.languageUpdated,
            "ja"
        );
    });
});
