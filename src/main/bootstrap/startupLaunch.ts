import fs from "fs";
import path from "path";

import { isSupportedImagePath } from "../../shared/constants/imageFormats";
import type { LaunchIntent } from "../../shared/types/LaunchIntent";
import {
    CLICK_THROUGH_REQUIRES_ALWAYS_ON_TOP_WARNING,
    resolveLaunchIntentFromScene,
} from "../repositories/launchIntent";
import { loadResolvedSceneFileFromPath } from "../repositories/sceneLoader";

interface WindowPositionOption {
    x: number;
    y: number;
}

interface WindowSizeOption {
    width: number;
    height: number;
}

interface ParsedStartupArgs {
    scenePath?: string;
    images: string[];
    positionalPath?: string;
    opacity?: number;
    position?: WindowPositionOption;
    size?: WindowSizeOption;
    alwaysOnTop: boolean;
    clickThrough: boolean;
    fullscreen: boolean;
    silent: boolean;
    minimize: boolean;
}

export interface StartupWindowOptions {
    position?: WindowPositionOption;
    size?: WindowSizeOption;
    fullscreen: boolean;
    minimize: boolean;
}

export interface StartupLaunchPlan {
    skipSplash: boolean;
    filePath?: string;
    launchIntent?: LaunchIntent;
    windowOptions: StartupWindowOptions;
    warnings: string[];
}

const SCENE_FILE_SUFFIX = ".scene.json";
const PROJECT_FILE_EXTENSION = ".iot";

const normalizeArgv = (commandLine: string[], isPackaged: boolean): string[] =>
    isPackaged ? commandLine.slice(1) : commandLine.slice(2);

const isOptionToken = (value: string): boolean => value.startsWith("--");

const parseCommaSeparatedPair = (
    value: string,
    optionName: string
): [number, number] => {
    const [rawA, rawB] = value.split(",");
    if (rawA === undefined || rawB === undefined) {
        throw new Error(`${optionName} must be in "a,b" format.`);
    }

    const a = Number(rawA);
    const b = Number(rawB);
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
        throw new Error(`${optionName} must contain finite numeric values.`);
    }

    return [a, b];
};

const parseOpacity = (value: string): number => {
    const opacity = Number(value);
    if (!Number.isFinite(opacity) || opacity < 0 || opacity > 100) {
        throw new Error("--opacity must be between 0 and 100.");
    }
    return opacity;
};

const parsePosition = (value: string): WindowPositionOption => {
    const [x, y] = parseCommaSeparatedPair(value, "--position");
    return { x, y };
};

const parseSize = (value: string): WindowSizeOption => {
    const [width, height] = parseCommaSeparatedPair(value, "--size");
    if (width <= 0 || height <= 0) {
        throw new Error("--size must be positive values.");
    }
    return { width, height };
};

const resolveExistingImagePath = (inputPath: string): string => {
    const resolvedPath = path.resolve(inputPath);

    if (!isSupportedImagePath(resolvedPath)) {
        throw new Error(`Unsupported image format: ${inputPath}`);
    }
    if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
        throw new Error(`Image file not found: ${inputPath}`);
    }

    return resolvedPath;
};

const isSceneFilePath = (inputPath: string): boolean =>
    inputPath.toLowerCase().endsWith(SCENE_FILE_SUFFIX);

const parseStartupArgs = (
    commandLine: string[],
    isPackaged: boolean
): ParsedStartupArgs => {
    const argv = normalizeArgv(commandLine, isPackaged);
    const positional: string[] = [];

    const parsed: ParsedStartupArgs = {
        images: [],
        alwaysOnTop: false,
        clickThrough: false,
        fullscreen: false,
        silent: false,
        minimize: false,
    };

    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];

        if (!isOptionToken(token)) {
            positional.push(token);
            continue;
        }

        if (token === "--scene") {
            const value = argv[index + 1];
            if (!value || isOptionToken(value)) {
                throw new Error("--scene requires a path.");
            }
            parsed.scenePath = value;
            index += 1;
            continue;
        }

        if (token === "--images") {
            const values: string[] = [];
            while (argv[index + 1] && !isOptionToken(argv[index + 1])) {
                values.push(argv[index + 1]);
                index += 1;
            }
            if (values.length === 0) {
                throw new Error("--images requires one or more paths.");
            }
            parsed.images.push(...values);
            continue;
        }

        if (token === "--opacity") {
            const value = argv[index + 1];
            if (!value || isOptionToken(value)) {
                throw new Error("--opacity requires a numeric value.");
            }
            parsed.opacity = parseOpacity(value);
            index += 1;
            continue;
        }

        if (token === "--position") {
            const value = argv[index + 1];
            if (!value || isOptionToken(value)) {
                throw new Error("--position requires x,y.");
            }
            parsed.position = parsePosition(value);
            index += 1;
            continue;
        }

        if (token === "--size") {
            const value = argv[index + 1];
            if (!value || isOptionToken(value)) {
                throw new Error("--size requires w,h.");
            }
            parsed.size = parseSize(value);
            index += 1;
            continue;
        }

        if (token === "--always-on-top") {
            parsed.alwaysOnTop = true;
            continue;
        }

        if (token === "--click-through") {
            parsed.clickThrough = true;
            continue;
        }

        if (token === "--fullscreen") {
            parsed.fullscreen = true;
            continue;
        }

        if (token === "--silent") {
            parsed.silent = true;
            continue;
        }

        if (token === "--minimize") {
            parsed.minimize = true;
            continue;
        }

        if (token === "--e2e") {
            continue;
        }

        throw new Error(`Unknown startup option: ${token}`);
    }

    if (positional.length > 1) {
        throw new Error("Only one positional file path is supported.");
    }

    if (positional.length === 1) {
        parsed.positionalPath = positional[0];
    }

    return parsed;
};

const buildWindowIntent = (
    alwaysOnTop: boolean,
    clickThrough: boolean,
    warnings: string[]
): LaunchIntent["window"] => {
    if (!alwaysOnTop && !clickThrough) {
        return undefined;
    }

    if (clickThrough && !alwaysOnTop) {
        warnings.push(CLICK_THROUGH_REQUIRES_ALWAYS_ON_TOP_WARNING);
    }

    return {
        alwaysOnTop,
        clickThrough: alwaysOnTop && clickThrough,
    };
};

const resolveSceneLaunchIntent = async (
    scenePathInput: string
): Promise<Pick<StartupLaunchPlan, "launchIntent" | "warnings">> => {
    const scenePath = path.resolve(scenePathInput);
    const resolvedScene = await loadResolvedSceneFileFromPath(scenePath);
    const { launchIntent, warnings } =
        resolveLaunchIntentFromScene(resolvedScene);
    return { launchIntent, warnings };
};

export const resolveStartupLaunchPlan = async (
    commandLine: string[],
    isPackaged: boolean
): Promise<StartupLaunchPlan> => {
    const parsed = parseStartupArgs(commandLine, isPackaged);
    const warnings: string[] = [];
    const hasStateOptions =
        parsed.opacity !== undefined ||
        parsed.position !== undefined ||
        parsed.size !== undefined ||
        parsed.alwaysOnTop ||
        parsed.clickThrough ||
        parsed.fullscreen;

    const plan: StartupLaunchPlan = {
        skipSplash: parsed.silent,
        windowOptions: {
            position: parsed.position,
            size: parsed.size,
            fullscreen: parsed.fullscreen,
            minimize: parsed.minimize,
        },
        warnings,
    };

    if (parsed.scenePath) {
        if (
            parsed.images.length > 0 ||
            parsed.positionalPath ||
            hasStateOptions
        ) {
            throw new Error(
                "--scene is exclusive and cannot be combined with file/image/state options."
            );
        }

        const sceneResult = await resolveSceneLaunchIntent(parsed.scenePath);
        plan.launchIntent = sceneResult.launchIntent;
        warnings.push(...sceneResult.warnings);
        return plan;
    }

    if (parsed.images.length > 0 && parsed.positionalPath) {
        throw new Error(
            "Positional file path cannot be used together with --images."
        );
    }

    let imageInputs = parsed.images;
    let positionalResolvedPath: string | undefined;

    if (parsed.positionalPath) {
        positionalResolvedPath = path.resolve(parsed.positionalPath);
        const positionalExt = path
            .extname(positionalResolvedPath)
            .toLowerCase();

        if (isSceneFilePath(positionalResolvedPath)) {
            if (hasStateOptions) {
                throw new Error(
                    "Scene file input is exclusive and cannot be combined with state options."
                );
            }
            const sceneResult = await resolveSceneLaunchIntent(
                positionalResolvedPath
            );
            plan.launchIntent = sceneResult.launchIntent;
            warnings.push(...sceneResult.warnings);
            return plan;
        }

        if (positionalExt === PROJECT_FILE_EXTENSION) {
            if (parsed.opacity !== undefined) {
                throw new Error("--opacity requires image input.");
            }
            plan.filePath = positionalResolvedPath;
            const windowIntent = buildWindowIntent(
                parsed.alwaysOnTop,
                parsed.clickThrough,
                warnings
            );
            if (windowIntent) {
                plan.launchIntent = {
                    window: windowIntent,
                    images: [],
                };
            }
            return plan;
        }

        if (isSupportedImagePath(positionalResolvedPath)) {
            imageInputs = [positionalResolvedPath];
        } else {
            plan.filePath = positionalResolvedPath;
            const windowIntent = buildWindowIntent(
                parsed.alwaysOnTop,
                parsed.clickThrough,
                warnings
            );
            if (windowIntent) {
                plan.launchIntent = {
                    window: windowIntent,
                    images: [],
                };
            }
            return plan;
        }
    }

    if (imageInputs.length === 0) {
        if (parsed.opacity !== undefined) {
            throw new Error("--opacity requires image input.");
        }

        const windowIntent = buildWindowIntent(
            parsed.alwaysOnTop,
            parsed.clickThrough,
            warnings
        );
        if (windowIntent) {
            plan.launchIntent = {
                window: windowIntent,
                images: [],
            };
        }
        return plan;
    }

    const resolvedImagePaths = imageInputs.map((imagePath) =>
        resolveExistingImagePath(imagePath)
    );
    const normalizedTransparency =
        parsed.opacity !== undefined ? parsed.opacity / 100 : undefined;

    plan.launchIntent = {
        window: buildWindowIntent(
            parsed.alwaysOnTop,
            parsed.clickThrough,
            warnings
        ),
        images: resolvedImagePaths.map((imagePath, index) => ({
            id: `cli-image-${index + 1}`,
            path: imagePath,
            transparency: normalizedTransparency,
        })),
    };

    return plan;
};
