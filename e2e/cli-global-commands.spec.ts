import path from "path";
import { expect, test } from "@playwright/test";

import {
    resolveFixtureScenePath,
    runCliCommandWithResult,
} from "./helpers/electronHarness";

type CliJsonResult<TData = unknown> = {
    ok: boolean;
    code: string;
    message: string;
    warnings: string[];
    data?: TData;
};

const parseCliJson = <TData = unknown>(raw: string): CliJsonResult<TData> => {
    return JSON.parse(raw) as CliJsonResult<TData>;
};

test("help command returns JSON payload", async () => {
    const result = await runCliCommandWithResult(["--help", "--format", "json"]);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    const payload = parseCliJson<{
        sections: Array<{ id: string; content: string }>;
    }>(result.stdout);
    expect(payload.ok).toBe(true);
    expect(payload.code).toBe("CLI_HELP");
    expect(payload.data?.sections.length).toBeGreaterThan(0);
});

test("scene-template command returns v1 template JSON payload", async () => {
    const result = await runCliCommandWithResult([
        "--scene-template",
        "v1",
        "--format",
        "json",
    ]);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    const payload = parseCliJson<{
        version: string;
        images: unknown[];
        canvas: { scale: number };
    }>(result.stdout);
    expect(payload.ok).toBe(true);
    expect(payload.code).toBe("CLI_SCENE_TEMPLATE");
    expect(payload.data?.version).toBe("1.0.0");
    expect(payload.data?.images).toEqual([]);
    expect(payload.data?.canvas.scale).toBe(1);
});

test("validate-scene command succeeds for fixture scene in JSON mode", async () => {
    const scenePath = resolveFixtureScenePath("default.scene.json");
    const result = await runCliCommandWithResult([
        "--validate-scene",
        scenePath,
        "--format",
        "json",
    ]);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    const payload = parseCliJson<{
        scenePath: string;
        imageCount: number;
    }>(result.stdout);
    expect(payload.ok).toBe(true);
    expect(payload.code).toBe("CLI_SCENE_VALIDATION_OK");
    expect(payload.data?.scenePath).toBe(scenePath);
    expect(payload.data?.imageCount).toBeGreaterThan(0);
});

test("validate-scene command returns validation error for missing scene", async () => {
    const missingScenePath = path.join(
        process.cwd(),
        "e2e",
        "fixtures",
        "scenes",
        "missing.scene.json"
    );
    const result = await runCliCommandWithResult([
        "--validate-scene",
        missingScenePath,
        "--format",
        "json",
    ]);

    expect(result.status).toBe(3);
    expect(result.stdout).toBe("");
    const payload = parseCliJson<{
        scenePath: string;
        errors: Array<{ message: string }>;
    }>(result.stderr);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("CLI_SCENE_VALIDATION_FAILED");
    expect(payload.data?.scenePath).toBe(missingScenePath);
    expect(payload.data?.errors.length).toBeGreaterThan(0);
});

test("help command returns invalid-argument JSON for unknown topic", async () => {
    const result = await runCliCommandWithResult([
        "--help",
        "unknown-topic",
        "--format",
        "json",
    ]);

    expect(result.status).toBe(2);
    expect(result.stdout).toBe("");
    const payload = parseCliJson<{ reasonCode: string }>(result.stderr);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("CLI_INVALID_ARGUMENT");
    expect(payload.data?.reasonCode).toBe("HELP_UNKNOWN_TOPIC");
});

