import fs from "fs";
import path from "path";

import { isSupportedImagePath } from "../../shared/constants/imageFormats";
import type { LaunchIntent } from "../../shared/types/LaunchIntent";
import type { Point } from "../../shared/types/Point";
import type { Size } from "../../shared/types/Size";
import {
    CLICK_THROUGH_REQUIRES_ALWAYS_ON_TOP_WARNING,
    resolveLaunchIntentFromScene,
} from "../repositories/launchIntent";
import { loadResolvedSceneFileFromPath } from "../repositories/sceneLoader";
import { parseStartupArgs } from "./startupParser";

export interface StartupWindowOptions {
    position?: Point;
    size?: Size;
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

const resolvePathFromWorkingDirectory = (
    inputPath: string,
    workingDirectory: string
): string => path.resolve(workingDirectory, inputPath);

const resolveExistingImagePath = (
    inputPath: string,
    workingDirectory: string
): string => {
    const resolvedPath = resolvePathFromWorkingDirectory(
        inputPath,
        workingDirectory
    );

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
    scenePathInput: string,
    workingDirectory: string
): Promise<Pick<StartupLaunchPlan, "launchIntent" | "warnings">> => {
    const scenePath = resolvePathFromWorkingDirectory(
        scenePathInput,
        workingDirectory
    );
    const resolvedScene = await loadResolvedSceneFileFromPath(scenePath);
    const { launchIntent, warnings } =
        resolveLaunchIntentFromScene(resolvedScene);
    return { launchIntent, warnings };
};

export const resolveStartupLaunchPlan = async (
    commandLine: string[],
    isPackaged: boolean,
    workingDirectory: string = process.cwd()
): Promise<StartupLaunchPlan> => {
    const parsed = parseStartupArgs(commandLine, isPackaged);
    const baseWorkingDirectory =
        workingDirectory.trim().length > 0 ? workingDirectory : process.cwd();
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

        const sceneResult = await resolveSceneLaunchIntent(
            parsed.scenePath,
            baseWorkingDirectory
        );
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
        positionalResolvedPath = resolvePathFromWorkingDirectory(
            parsed.positionalPath,
            baseWorkingDirectory
        );
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
                positionalResolvedPath,
                baseWorkingDirectory
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
        resolveExistingImagePath(imagePath, baseWorkingDirectory)
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
