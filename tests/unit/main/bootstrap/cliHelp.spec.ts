import { describe, expect, it } from "vitest";

import { renderCliHelp, resolveCliHelpRequest } from "@/main/bootstrap/cliHelp";

describe("cliHelp", () => {
    it("returns null when help flag is not specified", () => {
        expect(
            resolveCliHelpRequest(["node", "index.js", "--scene", "a.scene.json"], false)
        ).toBeNull();
    });

    it("parses --help with default topic", () => {
        expect(resolveCliHelpRequest(["node", "index.js", "--help"], false)).toEqual({
            topic: "all",
        });
    });

    it("parses topic argument after --help", () => {
        expect(
            resolveCliHelpRequest(
                ["node", "index.js", "--help", "startup"],
                false
            )
        ).toEqual({
            topic: "startup",
        });
    });

    it("parses --help=<topic> form", () => {
        expect(
            resolveCliHelpRequest(["node", "index.js", "--help=control"], false)
        ).toEqual({
            topic: "control",
        });
    });

    it("parses -h short form", () => {
        expect(resolveCliHelpRequest(["node", "index.js", "-h", "examples"], false)).toEqual(
            {
                topic: "examples",
            }
        );
    });

    it("throws for unknown topic", () => {
        expect(() =>
            resolveCliHelpRequest(["node", "index.js", "--help", "unknown"], false)
        ).toThrow("Unknown help topic: unknown");
    });

    it("renders all sections for all-topic help", () => {
        const text = renderCliHelp("all");
        expect(text).toContain("Routing rules:");
        expect(text).toContain("Startup options:");
        expect(text).toContain("Control commands");
        expect(text).toContain("Examples:");
    });
});
