import { describe, expect, it } from "vitest";

import { resolveCliSubcommandArgv } from "@/main/bootstrap/cliSubcommand";

describe("cliSubcommand", () => {
    it("returns startup subcommand and strips first token", () => {
        expect(resolveCliSubcommandArgv(["startup", "--scene", "a.scene.json"])).toEqual(
            {
                subcommand: "startup",
                argv: ["--scene", "a.scene.json"],
            }
        );
    });

    it("returns control subcommand and strips first token", () => {
        expect(resolveCliSubcommandArgv(["control", "--set-opacity", "30"])).toEqual({
            subcommand: "control",
            argv: ["--set-opacity", "30"],
        });
    });

    it("returns null subcommand when no explicit subcommand is provided", () => {
        expect(resolveCliSubcommandArgv(["--images", "a.png"])).toEqual({
            subcommand: null,
            argv: ["--images", "a.png"],
        });
    });
});
