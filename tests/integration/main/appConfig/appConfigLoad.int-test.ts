import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "./appConfigTestDoubles";
import { invokeIpcHandler } from "../../../support/helpers/ipcTestHelper";
import {
    AppConfigIntegrationContext,
    setupAppConfigIntegration,
} from "./appConfigTestHarness";

describe("Main integration: appConfig load", () => {
    let context: AppConfigIntegrationContext;

    beforeEach(async () => {
        context = await setupAppConfigIntegration();
    });

    afterEach(async () => {
        await context.cleanup();
    });

    it("setting:load returns current setting snapshot", async () => {
        context.store.set("setting", {
            language: "en",
            logLevel: "warn",
        });

        const loadedSettings = await invokeIpcHandler("setting:load", {
            sender: {},
        });

        expect(loadedSettings).toEqual({
            language: "en",
            logLevel: "warn",
        });
    });

    it("window_color:load returns current window color", async () => {
        context.store.set("window.color", "#AABBCCDD");

        const loadedWindowColor = await invokeIpcHandler("window_color:load", {
            sender: {},
        });

        expect(loadedWindowColor).toBe("#AABBCCDD");
    });
});
