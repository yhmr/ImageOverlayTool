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

describe("Main integration: appConfig language broadcast", () => {
    let context: AppConfigIntegrationContext;

    const expectLanguageBroadcastedToAllWindows = (
        language: string,
        ctx: AppConfigIntegrationContext
    ) => {
        expect(ctx.languageBroadcastSends).toHaveLength(2);
        for (const send of ctx.languageBroadcastSends) {
            expect(send).toHaveBeenCalledTimes(1);
            expect(send).toHaveBeenCalledWith(
                IPC_EVENTS.languageUpdated,
                language
            );
        }
    };

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
        const loadedSettings = await invokeIpcHandler("setting:load", {
            sender: {},
        });

        expect(loadedSettings).toEqual({
            language: "en",
            logLevel: "debug",
        });
        expectLanguageBroadcastedToAllWindows("en", context);
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

        const importedSettings = await invokeIpcHandler("setting:import", {
            sender: {},
        });

        expect(importedSettings).toEqual({
            language: "ja",
            logLevel: "error",
        });
        expectLanguageBroadcastedToAllWindows("ja", context);
    });
});
