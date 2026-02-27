import { isOptionToken, normalizeArgv } from "./cliArgs";

export type HelpTopic = "all" | "startup" | "control" | "examples";

export interface CliHelpRequest {
    topic: HelpTopic;
}

const HELP_FLAGS = new Set(["--help", "-h"]);
const HELP_TOPICS = new Set<HelpTopic>([
    "all",
    "startup",
    "control",
    "examples",
]);

const normalizeHelpTopic = (value: string): HelpTopic => {
    const topic = value.toLowerCase() as HelpTopic;
    if (!HELP_TOPICS.has(topic)) {
        throw new Error(
            `Unknown help topic: ${value}. Use one of: all, startup, control, examples.`
        );
    }
    return topic;
};

export const resolveCliHelpRequest = (
    commandLine: string[],
    isPackaged: boolean
): CliHelpRequest | null => {
    const argv = normalizeArgv(commandLine, isPackaged);

    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];

        if (HELP_FLAGS.has(token)) {
            const maybeTopic = argv[index + 1];
            if (!maybeTopic || isOptionToken(maybeTopic)) {
                return { topic: "all" };
            }
            return { topic: normalizeHelpTopic(maybeTopic) };
        }

        if (token.startsWith("--help=")) {
            const [, rawTopic] = token.split("=", 2);
            if (!rawTopic) {
                return { topic: "all" };
            }
            return { topic: normalizeHelpTopic(rawTopic) };
        }
    }

    return null;
};

const HELP_HEADER = `ImageOverlayTool CLI Help

Routing rules:
  - Startup options: parsed from primary-instance startup argv.
  - Control commands: sent to an already-running instance via second-instance.
  - If no instance is running, control commands are not accepted as startup options.
  - Topic help: --help startup | --help control | --help examples`;

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
  ImageOverlayTool.exe --scene "C:/work/default.scene.json"
  ImageOverlayTool.exe --images "C:/img/a.png" "C:/img/b.png" --opacity 50
  ImageOverlayTool.exe --add-image "C:/img/ref.png" --opacity 40
  ImageOverlayTool.exe --set-opacity 30
  ImageOverlayTool.exe --switch-scene "C:/work/layout-v2.scene.json"
  ImageOverlayTool.exe --export "C:/output/overlay.png"`;

export const renderCliHelp = (topic: HelpTopic): string => {
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
