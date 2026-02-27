import { isOptionToken, normalizeArgv } from "./cliArgs";

export type HelpTopic = "all" | "startup" | "control" | "examples";
export type HelpFormat = "text" | "json";

type CliHelpErrorCode = "HELP_UNKNOWN_TOPIC" | "HELP_UNKNOWN_FORMAT";

export interface CliHelpRequest {
    topic: HelpTopic;
    format: HelpFormat;
}

export class CliHelpParseError extends Error {
    readonly code: CliHelpErrorCode;
    readonly formatHint: HelpFormat;

    constructor(
        code: CliHelpErrorCode,
        message: string,
        options: { formatHint?: HelpFormat } = {}
    ) {
        super(message);
        this.name = "CliHelpParseError";
        this.code = code;
        this.formatHint = options.formatHint ?? "text";
    }
}

const HELP_FLAGS = new Set(["--help", "-h"]);
const HELP_TOPICS = new Set<HelpTopic>([
    "all",
    "startup",
    "control",
    "examples",
]);
const HELP_FORMATS = new Set<HelpFormat>(["text", "json"]);

const normalizeHelpTopic = (value: string): HelpTopic => {
    const topic = value.toLowerCase() as HelpTopic;
    if (!HELP_TOPICS.has(topic)) {
        throw new CliHelpParseError(
            "HELP_UNKNOWN_TOPIC",
            `Unknown help topic: ${value}. Use one of: all, startup, control, examples.`
        );
    }
    return topic;
};

const normalizeHelpFormat = (
    value: string,
    formatHint: HelpFormat
): HelpFormat => {
    const format = value.toLowerCase() as HelpFormat;
    if (!HELP_FORMATS.has(format)) {
        throw new CliHelpParseError(
            "HELP_UNKNOWN_FORMAT",
            `Unknown help format: ${value}. Use one of: text, json.`,
            { formatHint }
        );
    }
    return format;
};

export const resolveCliHelpRequest = (
    commandLine: string[],
    isPackaged: boolean
): CliHelpRequest | null => {
    const argv = normalizeArgv(commandLine, isPackaged);
    let topic: HelpTopic = "all";
    let format: HelpFormat = "text";
    const hasHelpFlag = argv.some(
        (token) => HELP_FLAGS.has(token) || token.startsWith("--help=")
    );

    if (!hasHelpFlag) {
        return null;
    }

    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];

        if (token === "--format") {
            const value = argv[index + 1];
            if (!value || isOptionToken(value)) {
                throw new CliHelpParseError(
                    "HELP_UNKNOWN_FORMAT",
                    "--format requires a value (text|json).",
                    { formatHint: format }
                );
            }
            format = normalizeHelpFormat(value, format);
            index += 1;
            continue;
        }

        if (token.startsWith("--format=")) {
            const [, rawFormat] = token.split("=", 2);
            if (!rawFormat) {
                throw new CliHelpParseError(
                    "HELP_UNKNOWN_FORMAT",
                    "--format requires a value (text|json).",
                    { formatHint: format }
                );
            }
            format = normalizeHelpFormat(rawFormat, format);
        }
    }

    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];

        if (HELP_FLAGS.has(token)) {
            const maybeTopic = argv[index + 1];
            if (maybeTopic && !isOptionToken(maybeTopic)) {
                try {
                    topic = normalizeHelpTopic(maybeTopic);
                } catch (error) {
                    if (error instanceof CliHelpParseError) {
                        throw new CliHelpParseError(error.code, error.message, {
                            formatHint: format,
                        });
                    }
                    throw error;
                }
                index += 1;
            }
            continue;
        }

        if (token.startsWith("--help=")) {
            const [, rawTopic] = token.split("=", 2);
            if (!rawTopic) {
                continue;
            }
            try {
                topic = normalizeHelpTopic(rawTopic);
            } catch (error) {
                if (error instanceof CliHelpParseError) {
                    throw new CliHelpParseError(error.code, error.message, {
                        formatHint: format,
                    });
                }
                throw error;
            }
        }
    }

    return { topic, format };
};

const HELP_HEADER = `ImageOverlayTool CLI Help

Routing rules:
  - Startup options: parsed from primary-instance startup argv.
  - Control commands: sent to an already-running instance via second-instance.
  - If no instance is running, control commands are not accepted as startup options.
  - Topic help: --help startup | --help control | --help examples
  - Output format: --format text | --format json`;

const STARTUP_HELP = `Startup options:
  --scene <path>                Load .scene.json at startup (exclusive)
  --images <path1> <path2> ...  Load one or more images
  --opacity <0-100>             Initial image opacity
  --position <x,y>              Window position
  --size <w,h>                  Window size
  --always-on-top               Start always on top
  --click-through               Start click-through mode (requires always-on-top)
  --fullscreen                  Start in fullscreen mode
  --silent                      Skip splash screen
  --minimize                    Start minimized`;

const CONTROL_HELP = `Control commands (for already-running instance):
  --add-image <path> [--opacity <0-100>]
  --set-opacity <0-100>
  --switch-scene <path.scene.json>
  --export <path.png|path.jpg|path.jpeg>`;

const EXAMPLES_HELP = `Examples:
  ImageOverlayTool.exe --scene-template v1
  ImageOverlayTool.exe --scene "C:/work/default.scene.json"
  ImageOverlayTool.exe --images "C:/img/a.png" "C:/img/b.png" --opacity 50
  ImageOverlayTool.exe --add-image "C:/img/ref.png" --opacity 40
  ImageOverlayTool.exe --set-opacity 30
  ImageOverlayTool.exe --switch-scene "C:/work/layout-v2.scene.json"
  ImageOverlayTool.exe --export "C:/output/overlay.png"`;

interface CliHelpSection {
    id: Exclude<HelpTopic, "all">;
    content: string;
}

const HELP_SECTIONS: CliHelpSection[] = [
    { id: "startup", content: STARTUP_HELP },
    { id: "control", content: CONTROL_HELP },
    { id: "examples", content: EXAMPLES_HELP },
];

const renderCliHelpText = (topic: HelpTopic): string => {
    if (topic === "startup") {
        return [HELP_HEADER, STARTUP_HELP].join("\n\n");
    }
    if (topic === "control") {
        return [HELP_HEADER, CONTROL_HELP].join("\n\n");
    }
    if (topic === "examples") {
        return [HELP_HEADER, EXAMPLES_HELP].join("\n\n");
    }
    return [HELP_HEADER, STARTUP_HELP, CONTROL_HELP, EXAMPLES_HELP].join(
        "\n\n"
    );
};

export interface CliHelpJsonPayload {
    kind: "help";
    topic: HelpTopic;
    format: "json";
    routingRules: string[];
    sections: Array<{
        id: CliHelpSection["id"];
        content: string;
    }>;
}

export const buildCliHelpPayload = (topic: HelpTopic): CliHelpJsonPayload => {
    const sections =
        topic === "all"
            ? HELP_SECTIONS
            : HELP_SECTIONS.filter((section) => section.id === topic);

    return {
        kind: "help",
        topic,
        format: "json",
        routingRules: [
            "Startup options: parsed from primary-instance startup argv.",
            "Control commands: sent to an already-running instance via second-instance.",
            "If no instance is running, control commands are not accepted as startup options.",
        ],
        sections: sections.map((section) => ({
            id: section.id,
            content: section.content,
        })),
    };
};

const renderCliHelpJson = (topic: HelpTopic): string => {
    const payload = buildCliHelpPayload(topic);

    return JSON.stringify(payload, null, 2);
};

export const renderCliHelp = (request: CliHelpRequest): string => {
    if (request.format === "json") {
        return renderCliHelpJson(request.topic);
    }
    return renderCliHelpText(request.topic);
};
