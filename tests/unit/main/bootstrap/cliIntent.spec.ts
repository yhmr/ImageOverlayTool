import { describe, expect, it } from "vitest";

import { isFlatControlCommandInvocation } from "@/main/bootstrap/cliIntent";

describe("cliIntent", () => {
    it("detects flat control command options without subcommand", () => {
        expect(
            isFlatControlCommandInvocation(
                ["node", "index.js", "--switch-scene", "a.scene.json"],
                false
            )
        ).toBe(true);
    });

    it("does not detect control options when control subcommand is explicit", () => {
        expect(
            isFlatControlCommandInvocation(
                ["node", "index.js", "control", "--set-opacity", "30"],
                false
            )
        ).toBe(false);
    });

    it("does not detect startup options as control intent", () => {
        expect(
            isFlatControlCommandInvocation(
                ["node", "index.js", "--images", "a.png"],
                false
            )
        ).toBe(false);
    });
});
