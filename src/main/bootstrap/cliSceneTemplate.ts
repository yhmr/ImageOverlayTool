import {
    SCENE_FILE_VERSION,
    type SceneFile,
} from "../../shared/types/SceneFile";
import { isOptionToken, normalizeArgv } from "./cliArgs";
import type { CliOutputFormat } from "./cliResult";

type SceneTemplateVersion = "v1";
type CliSceneTemplateErrorCode =
    | "SCENE_TEMPLATE_VERSION_REQUIRED"
    | "SCENE_TEMPLATE_UNKNOWN_VERSION"
    | "SCENE_TEMPLATE_UNKNOWN_FORMAT";

export interface CliSceneTemplateRequest {
    version: SceneTemplateVersion;
    format: CliOutputFormat;
}

export class CliSceneTemplateParseError extends Error {
    readonly code: CliSceneTemplateErrorCode;
    readonly formatHint: CliOutputFormat;

    constructor(
        code: CliSceneTemplateErrorCode,
        message: string,
        options: { formatHint?: CliOutputFormat } = {}
    ) {
        super(message);
        this.name = "CliSceneTemplateParseError";
        this.code = code;
        this.formatHint = options.formatHint ?? "text";
    }
}

const SCENE_TEMPLATE_FLAG = "--scene-template";
const HELP_FORMATS = new Set<CliOutputFormat>(["text", "json"]);

const normalizeOutputFormat = (
    value: string,
    formatHint: CliOutputFormat
): CliOutputFormat => {
    const format = value.toLowerCase() as CliOutputFormat;
    if (!HELP_FORMATS.has(format)) {
        throw new CliSceneTemplateParseError(
            "SCENE_TEMPLATE_UNKNOWN_FORMAT",
            `Unknown help format: ${value}. Use one of: text, json.`,
            { formatHint }
        );
    }
    return format;
};

const normalizeSceneTemplateVersion = (
    value: string,
    formatHint: CliOutputFormat
): SceneTemplateVersion => {
    const version = value.toLowerCase();
    if (version !== "v1") {
        throw new CliSceneTemplateParseError(
            "SCENE_TEMPLATE_UNKNOWN_VERSION",
            `Unknown scene-template version: ${value}. Use: v1.`,
            { formatHint }
        );
    }
    return "v1";
};

const parseOutputFormat = (argv: string[]): CliOutputFormat => {
    let format: CliOutputFormat = "text";

    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];

        if (token === "--format") {
            const value = argv[index + 1];
            if (!value || isOptionToken(value)) {
                throw new CliSceneTemplateParseError(
                    "SCENE_TEMPLATE_UNKNOWN_FORMAT",
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
                throw new CliSceneTemplateParseError(
                    "SCENE_TEMPLATE_UNKNOWN_FORMAT",
                    "--format requires a value (text|json).",
                    { formatHint: format }
                );
            }
            format = normalizeOutputFormat(rawFormat, format);
        }
    }

    return format;
};

export const resolveCliSceneTemplateRequest = (
    commandLine: string[],
    isPackaged: boolean
): CliSceneTemplateRequest | null => {
    const argv = normalizeArgv(commandLine, isPackaged);
    const hasSceneTemplate = argv.some(
        (token) =>
            token === SCENE_TEMPLATE_FLAG ||
            token.startsWith(`${SCENE_TEMPLATE_FLAG}=`)
    );

    if (!hasSceneTemplate) {
        return null;
    }

    const format = parseOutputFormat(argv);
    let version: SceneTemplateVersion | null = null;

    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];
        if (token === SCENE_TEMPLATE_FLAG) {
            const value = argv[index + 1];
            if (!value || isOptionToken(value)) {
                throw new CliSceneTemplateParseError(
                    "SCENE_TEMPLATE_VERSION_REQUIRED",
                    "--scene-template requires a version (v1).",
                    { formatHint: format }
                );
            }
            version = normalizeSceneTemplateVersion(value, format);
            index += 1;
            continue;
        }

        if (token.startsWith(`${SCENE_TEMPLATE_FLAG}=`)) {
            const [, rawVersion] = token.split("=", 2);
            if (!rawVersion) {
                throw new CliSceneTemplateParseError(
                    "SCENE_TEMPLATE_VERSION_REQUIRED",
                    "--scene-template requires a version (v1).",
                    { formatHint: format }
                );
            }
            version = normalizeSceneTemplateVersion(rawVersion, format);
        }
    }

    if (!version) {
        throw new CliSceneTemplateParseError(
            "SCENE_TEMPLATE_VERSION_REQUIRED",
            "--scene-template requires a version (v1).",
            { formatHint: format }
        );
    }

    return { version, format };
};

const buildSceneTemplateV1 = (): SceneFile => ({
    version: SCENE_FILE_VERSION,
    window: {
        color: "#00000000",
        alwaysOnTop: false,
        clickThrough: false,
        showWindowFrame: false,
    },
    unitFactor: 1,
    unit: "um",
    canvas: {
        x: 0,
        y: 0,
        scale: 1,
    },
    imagePathAliases: {
        assets: "./images",
        shared: "D:/overlay-assets",
    },
    images: [],
    dimensionLines: [],
});

export const buildSceneTemplate = (
    version: SceneTemplateVersion
): SceneFile => {
    if (version === "v1") {
        return buildSceneTemplateV1();
    }

    return buildSceneTemplateV1();
};

export const renderSceneTemplate = (
    request: CliSceneTemplateRequest
): string => {
    const template = buildSceneTemplate(request.version);
    return JSON.stringify(template, null, 2);
};
