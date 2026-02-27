import { describe, expect, it } from "vitest";

import {
    CliHelpParseError,
    renderCliHelp,
    resolveCliHelpRequest,
} from "@/main/bootstrap/cliHelp";

describe("cliHelp", () => {
    it("returns null when help flag is not specified", () => {
        expect(
            resolveCliHelpRequest(["node", "index.js", "--scene", "a.scene.json"], false)
        ).toBeNull();
    });

    it("parses --help with default topic", () => {
        expect(resolveCliHelpRequest(["node", "index.js", "--help"], false)).toEqual({
            topic: "all",
            format: "text",
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
            format: "text",
        });
    });

    it("parses --help=<topic> form", () => {
        expect(
            resolveCliHelpRequest(["node", "index.js", "--help=control"], false)
        ).toEqual({
            topic: "control",
            format: "text",
        });
    });

    it("parses -h short form", () => {
        expect(resolveCliHelpRequest(["node", "index.js", "-h", "examples"], false)).toEqual(
            {
                topic: "examples",
                format: "text",
            }
        );
    });

    it("parses --format json for help output", () => {
        expect(
            resolveCliHelpRequest(
                ["node", "index.js", "--help", "startup", "--format", "json"],
                false
            )
        ).toEqual({
            topic: "startup",
            format: "json",
        });
    });

    it("throws for unknown topic", () => {
        expect(() =>
            resolveCliHelpRequest(["node", "index.js", "--help", "unknown"], false)
        ).toThrow("Unknown help topic: unknown");
    });

    it("keeps json format hint when topic is invalid", () => {
        let caught: unknown;
        try {
            resolveCliHelpRequest(
                ["node", "index.js", "--format", "json", "--help", "unknown"],
                false
            );
        } catch (error) {
            caught = error;
        }

        expect(caught).toBeInstanceOf(CliHelpParseError);
        expect(caught).toMatchObject({
            code: "HELP_UNKNOWN_TOPIC",
            formatHint: "json",
        });
    });

    it("throws CliHelpParseError for unknown format", () => {
        let caught: unknown;
        try {
            resolveCliHelpRequest(
                ["node", "index.js", "--help", "--format", "yaml"],
                false
            );
        } catch (error) {
            caught = error;
        }

        expect(caught).toBeInstanceOf(CliHelpParseError);
        expect(caught).toMatchObject({
            code: "HELP_UNKNOWN_FORMAT",
            formatHint: "text",
        });
    });

    it("renders all sections for all-topic help", () => {
        const text = renderCliHelp({ topic: "all", format: "text" });
        expect(text).toContain("Routing rules:");
        expect(text).toContain("Startup options:");
        expect(text).toContain("Control commands");
        expect(text).toContain("Examples:");
        expect(text).toContain("--scene-template v1");
    });

    it("renders json help payload", () => {
        const jsonText = renderCliHelp({ topic: "control", format: "json" });
        const payload = JSON.parse(jsonText) as {
            kind: string;
            topic: string;
            format: string;
            sections: Array<{ id: string; content: string }>;
        };

        expect(payload.kind).toBe("help");
        expect(payload.topic).toBe("control");
        expect(payload.format).toBe("json");
        expect(payload.sections).toHaveLength(1);
        expect(payload.sections[0]?.id).toBe("control");
    });
});
