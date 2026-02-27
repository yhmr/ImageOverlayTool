import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    CliRouteParseError,
    resolveSecondInstanceCliRoute,
    resolveStartupCliRoute,
} from "@/main/bootstrap/cliRouter";
import { resolveSecondInstanceCommand } from "@/main/bootstrap/secondInstanceCommand";
import { resolveStartupLaunchPlan } from "@/main/bootstrap/startupLaunch";

vi.mock("@/main/bootstrap/startupLaunch", () => ({
    resolveStartupLaunchPlan: vi.fn(),
}));

vi.mock("@/main/bootstrap/secondInstanceCommand", () => ({
    resolveSecondInstanceCommand: vi.fn(),
}));

describe("cliRouter", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(resolveSecondInstanceCommand).mockReturnValue(null);
        vi.mocked(resolveStartupLaunchPlan).mockResolvedValue({
            skipSplash: false,
            filePath: undefined,
            launchIntent: undefined,
            windowOptions: {
                fullscreen: false,
                minimize: false,
            },
            warnings: [],
        });
    });

    it("resolves startup route for startup entrypoint", async () => {
        const route = await resolveStartupCliRoute(
            ["node", "index.js", "startup", "--images", "a.png"],
            false
        );

        expect(route).toEqual({
            kind: "startup",
            startupLaunchPlan: expect.objectContaining({
                skipSplash: false,
            }),
        });
        expect(resolveStartupLaunchPlan).toHaveBeenCalledWith(
            ["node", "index.js", "startup", "--images", "a.png"],
            false
        );
    });

    it("wraps startup parse errors with startup stage", async () => {
        vi.mocked(resolveStartupLaunchPlan).mockRejectedValue(
            new Error("invalid startup option")
        );

        await expect(
            resolveStartupCliRoute(["node", "index.js", "startup", "--scene"], false)
        ).rejects.toMatchObject({
            name: "CliRouteParseError",
            stage: "startup",
            message: "invalid startup option",
        });
    });

    it("resolves control route for second-instance command", async () => {
        vi.mocked(resolveSecondInstanceCommand).mockReturnValue({
            kind: "app-control",
            command: {
                kind: "set-opacity",
                opacity: 0.3,
            },
        });

        const route = await resolveSecondInstanceCliRoute(
            ["node", "index.js", "control", "--set-opacity", "30"],
            false
        );

        expect(route).toEqual({
            kind: "control",
            command: {
                kind: "app-control",
                command: {
                    kind: "set-opacity",
                    opacity: 0.3,
                },
            },
        });
        expect(resolveStartupLaunchPlan).not.toHaveBeenCalled();
    });

    it("falls back to startup route when no second-instance command exists", async () => {
        vi.mocked(resolveSecondInstanceCommand).mockReturnValue(null);

        const route = await resolveSecondInstanceCliRoute(
            ["node", "index.js", "startup", "--images", "a.png"],
            false
        );

        expect(route.kind).toBe("startup");
        expect(resolveStartupLaunchPlan).toHaveBeenCalledWith(
            ["node", "index.js", "startup", "--images", "a.png"],
            false
        );
    });

    it("wraps control parse errors with control stage", async () => {
        vi.mocked(resolveSecondInstanceCommand).mockImplementation(() => {
            throw new Error("invalid control command");
        });

        await expect(
            resolveSecondInstanceCliRoute(
                ["node", "index.js", "control", "--set-opacity"],
                false
            )
        ).rejects.toBeInstanceOf(CliRouteParseError);

        await expect(
            resolveSecondInstanceCliRoute(
                ["node", "index.js", "control", "--set-opacity"],
                false
            )
        ).rejects.toMatchObject({
            stage: "control",
            message: "invalid control command",
        });
    });

    it("wraps startup parse errors in second-instance flow with startup stage", async () => {
        vi.mocked(resolveSecondInstanceCommand).mockReturnValue(null);
        vi.mocked(resolveStartupLaunchPlan).mockRejectedValue(
            new Error("invalid startup option")
        );

        await expect(
            resolveSecondInstanceCliRoute(
                ["node", "index.js", "startup", "--scene"],
                false
            )
        ).rejects.toMatchObject({
            stage: "startup",
            message: "invalid startup option",
        });
    });

    it("forwards working directory to parser and startup resolver", async () => {
        vi.mocked(resolveSecondInstanceCommand).mockReturnValue(null);

        await resolveSecondInstanceCliRoute(
            ["node", "index.js", "startup", "--images", "a.png"],
            false,
            "D:/cli-cwd"
        );

        expect(resolveSecondInstanceCommand).toHaveBeenCalledWith(
            ["node", "index.js", "startup", "--images", "a.png"],
            false,
            "D:/cli-cwd"
        );
        expect(resolveStartupLaunchPlan).toHaveBeenCalledWith(
            ["node", "index.js", "startup", "--images", "a.png"],
            false,
            "D:/cli-cwd"
        );
    });
});
