import fs from "fs";
import path from "path";

import { isSupportedImagePath } from "../../../shared/constants/imageFormats";

const SCENE_FILE_SUFFIX = ".scene.json";
const OUTPUT_IMAGE_FILE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);

const resolvePathFromWorkingDirectory = (
    inputPath: string,
    workingDirectory: string
): string => path.resolve(workingDirectory, inputPath);

const resolveExistingFilePath = (
    inputPath: string,
    optionName: string,
    workingDirectory: string
): string => {
    const resolvedPath = resolvePathFromWorkingDirectory(
        inputPath,
        workingDirectory
    );
    if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
        throw new Error(`${optionName} file not found: ${inputPath}`);
    }
    return resolvedPath;
};

export const resolveImagePath = (
    inputPath: string,
    workingDirectory: string
): string => {
    const resolvedPath = resolveExistingFilePath(
        inputPath,
        "--add-image",
        workingDirectory
    );
    if (!isSupportedImagePath(resolvedPath)) {
        throw new Error(`Unsupported image format: ${inputPath}`);
    }
    return resolvedPath;
};

export const resolveScenePath = (
    inputPath: string,
    workingDirectory: string
): string => {
    const resolvedPath = resolveExistingFilePath(
        inputPath,
        "--switch-scene",
        workingDirectory
    );
    if (!resolvedPath.toLowerCase().endsWith(SCENE_FILE_SUFFIX)) {
        throw new Error("--switch-scene requires a .scene.json path.");
    }
    return resolvedPath;
};

export const resolveOutputImagePath = (
    inputPath: string,
    workingDirectory: string,
    optionName: "--capture-window" | "--save-stage"
): string => {
    const resolvedPath = resolvePathFromWorkingDirectory(
        inputPath,
        workingDirectory
    );
    const ext = path.extname(resolvedPath).toLowerCase();
    if (!OUTPUT_IMAGE_FILE_EXTENSIONS.has(ext)) {
        throw new Error(`${optionName} supports only .png / .jpg / .jpeg.`);
    }
    return resolvedPath;
};
