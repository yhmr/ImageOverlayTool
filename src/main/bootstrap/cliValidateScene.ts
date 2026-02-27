import fs from "fs";
import path from "path";

import type { ResolvedSceneFile } from "../../shared/types/SceneFile";
import { resolveLaunchIntentFromScene } from "../repositories/launchIntent";
import { parseSceneFile } from "../repositories/sceneSchema";
import { resolveSceneFile } from "../repositories/sceneResolver";
import { isOptionToken, normalizeArgv } from "./cliArgs";
import type { CliOutputFormat } from "./cliResult";

type CliValidateSceneErrorCode =
    | "VALIDATE_SCENE_PATH_REQUIRED"
    | "VALIDATE_SCENE_UNKNOWN_FORMAT";

export interface CliValidateSceneRequest {
    scenePath: string;
    format: CliOutputFormat;
}

export interface SceneValidationResult {
    scenePath: string;
    resolvedScene: ResolvedSceneFile;
    warnings: string[];
}

export class CliValidateSceneParseError extends Error {
    readonly code: CliValidateSceneErrorCode;
    readonly formatHint: CliOutputFormat;

    constructor(
        code: CliValidateSceneErrorCode,
        message: string,
        options: { formatHint?: CliOutputFormat } = {}
    ) {
        super(message);
        this.name = "CliValidateSceneParseError";
        this.code = code;
        this.formatHint = options.formatHint ?? "text";
    }
}

const VALIDATE_SCENE_FLAG = "--validate-scene";
const SUPPORTED_OUTPUT_FORMATS = new Set<CliOutputFormat>(["text", "json"]);

const normalizeOutputFormat = (
    value: string,
    formatHint: CliOutputFormat
): CliOutputFormat => {
    const format = value.toLowerCase() as CliOutputFormat;
    if (!SUPPORTED_OUTPUT_FORMATS.has(format)) {
        throw new CliValidateSceneParseError(
            "VALIDATE_SCENE_UNKNOWN_FORMAT",
            `Unknown output format: ${value}. Use one of: text, json.`,
            { formatHint }
        );
    }
    return format;
};

const parseOutputFormat = (argv: string[]): CliOutputFormat => {
    let format: CliOutputFormat = "text";

    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];
        if (token === "--format") {
            const value = argv[index + 1];
            if (!value || isOptionToken(value)) {
                throw new CliValidateSceneParseError(
                    "VALIDATE_SCENE_UNKNOWN_FORMAT",
                    "--format requires a value (text|json).",
                    { formatHint: format }
                );
            }
            format = normalizeOutputFormat(value, format);
            index += 1;
            continue;
        }

        if (token.startsWith("--format=")) {
            const [, rawFormat] = token.split("=", 2);
            if (!rawFormat) {
                throw new CliValidateSceneParseError(
                    "VALIDATE_SCENE_UNKNOWN_FORMAT",
                    "--format requires a value (text|json).",
                    { formatHint: format }
                );
            }
            format = normalizeOutputFormat(rawFormat, format);
        }
    }

    return format;
};

export const resolveCliValidateSceneRequest = (
    commandLine: string[],
    isPackaged: boolean
): CliValidateSceneRequest | null => {
    const argv = normalizeArgv(commandLine, isPackaged);
    const hasValidateSceneFlag = argv.some(
        (token) =>
            token === VALIDATE_SCENE_FLAG ||
            token.startsWith(`${VALIDATE_SCENE_FLAG}=`)
    );

    if (!hasValidateSceneFlag) {
        return null;
    }

    const format = parseOutputFormat(argv);
    let scenePath: string | null = null;

    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];
        if (token === VALIDATE_SCENE_FLAG) {
            const value = argv[index + 1];
            if (!value || isOptionToken(value)) {
                throw new CliValidateSceneParseError(
                    "VALIDATE_SCENE_PATH_REQUIRED",
                    "--validate-scene requires a path.",
                    { formatHint: format }
                );
            }
            scenePath = path.resolve(value);
            index += 1;
            continue;
        }

        if (token.startsWith(`${VALIDATE_SCENE_FLAG}=`)) {
            const [, rawPath] = token.split("=", 2);
            if (!rawPath) {
                throw new CliValidateSceneParseError(
                    "VALIDATE_SCENE_PATH_REQUIRED",
                    "--validate-scene requires a path.",
                    { formatHint: format }
                );
            }
            scenePath = path.resolve(rawPath);
        }
    }

    if (!scenePath) {
        throw new CliValidateSceneParseError(
            "VALIDATE_SCENE_PATH_REQUIRED",
            "--validate-scene requires a path.",
            { formatHint: format }
        );
    }

    return {
        scenePath,
        format,
    };
};

const resolveWarnings = (scene: ResolvedSceneFile): string[] =>
    resolveLaunchIntentFromScene(scene).warnings;

export const validateSceneFromPath = (
    scenePath: string
): SceneValidationResult => {
    const normalizedScenePath = path.resolve(scenePath);
    const rawText = fs.readFileSync(normalizedScenePath, "utf-8");
    const source = JSON.parse(rawText) as unknown;
    const parsed = parseSceneFile(source);
    const resolvedScene = resolveSceneFile(parsed, normalizedScenePath);
    const warnings = resolveWarnings(resolvedScene);

    return {
        scenePath: normalizedScenePath,
        resolvedScene,
        warnings,
    };
};

export const renderSceneValidationText = (
    result: SceneValidationResult
): string => {
    const header = `Scene validation succeeded: ${result.scenePath}`;
    if (result.warnings.length === 0) {
        return header;
    }
    return [header, "Warnings:", ...result.warnings.map((w) => `- ${w}`)].join(
        "\n"
    );
};
