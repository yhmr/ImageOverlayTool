import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "./appConfigTestDoubles";
import { invokeIpcHandler } from "../../../support/helpers/ipcTestHelper";
import {
    AppConfigIntegrationContext,
    setupAppConfigIntegration,
} from "./appConfigTestHarness";

describe("Main integration: appConfig save", () => {
    let context: AppConfigIntegrationContext;

    beforeEach(async () => {
        context = await setupAppConfigIntegration();
    });

    afterEach(async () => {
        await context.cleanup();
    });

    it("setting:save persists setting values", async () => {
        await invokeIpcHandler("setting:save", { sender: {} }, {
            language: "en",
            logLevel: "debug",
        });

        expect(context.store.get("setting.language")).toBe("en");
        expect(context.store.get("setting.logLevel")).toBe("debug");
    });

    it("window_color:save persists window color", async () => {
        await invokeIpcHandler("window_color:save", { sender: {} }, "#12345678");

        expect(context.store.get("window.color")).toBe("#12345678");
    });
});
