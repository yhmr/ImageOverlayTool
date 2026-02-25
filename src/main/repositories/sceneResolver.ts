import fs from "fs";
import path from "path";

import { isSupportedImagePath } from "../../shared/constants/imageFormats";
import type {
    ResolvedSceneFile,
    SceneFile,
} from "../../shared/types/SceneFile";

export interface ResolveSceneSourcePathOptions {
    imagePathAliases?: Record<string, string>;
}

interface ParsedImagePathAliasSource {
    aliasName: string;
    subPath: string;
}

const parseImagePathAliasSource = (
    source: string
): ParsedImagePathAliasSource | null => {
    if (!source.startsWith("@")) {
        return null;
    }

    const body = source.slice(1);
    const slashIndex = body.indexOf("/");
    const backslashIndex = body.indexOf("\\");
    const separatorIndex =
        slashIndex === -1
            ? backslashIndex
            : backslashIndex === -1
            ? slashIndex
            : Math.min(slashIndex, backslashIndex);

    const aliasName = (
        separatorIndex === -1 ? body : body.slice(0, separatorIndex)
    ).trim();
    const subPath =
        separatorIndex === -1 ? "" : body.slice(separatorIndex + 1).trim();

    if (aliasName.length === 0) {
        throw new Error(
            `Invalid scene image source alias syntax: ${source}. Use @alias/path format.`
        );
    }

    if (separatorIndex !== -1 && subPath.length === 0) {
        throw new Error(
            `Invalid scene image source alias syntax: ${source}. Use @alias/path format.`
        );
    }

    return {
        aliasName,
        subPath,
    };
};

const resolveImagePathAliasSourcePath = (
    sceneDirectory: string,
    source: string,
    imagePathAliases?: Record<string, string>
): string => {
    const parsed = parseImagePathAliasSource(source);
    if (!parsed) {
        return source;
    }

    const aliasTarget = imagePathAliases?.[parsed.aliasName];
    if (!aliasTarget) {
        throw new Error(
            `Scene image alias is not defined: @${parsed.aliasName}. Define imagePathAliases.${parsed.aliasName}.`
        );
    }

    const resolvedAliasBase = path.isAbsolute(aliasTarget)
        ? path.resolve(aliasTarget)
        : path.resolve(sceneDirectory, aliasTarget);

    if (!parsed.subPath) {
        return resolvedAliasBase;
    }

    return path.resolve(resolvedAliasBase, parsed.subPath);
};

export const resolveSceneSourcePath = (
    source: string,
    sceneDirectory: string,
    options: ResolveSceneSourcePathOptions = {}
): string => {
    const trimmedSource = source.trim();
    if (!trimmedSource) {
        throw new Error("Scene image source must not be empty.");
    }

    const aliasResolvedPath = resolveImagePathAliasSourcePath(
        sceneDirectory,
        trimmedSource,
        options.imagePathAliases
    );

    const resolvedPath = path.isAbsolute(aliasResolvedPath)
        ? path.resolve(aliasResolvedPath)
        : path.resolve(sceneDirectory, aliasResolvedPath);

    if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
        throw new Error(`Scene image file not found: ${resolvedPath}`);
    }

    if (!isSupportedImagePath(resolvedPath)) {
        throw new Error(`Unsupported scene image format: ${resolvedPath}`);
    }

    return resolvedPath;
};

export const resolveSceneFile = (
    scene: SceneFile,
    scenePath: string,
    options: ResolveSceneSourcePathOptions = {}
): ResolvedSceneFile => {
    const sceneDirectory = path.dirname(scenePath);
    const imagePathAliases = {
        ...(options.imagePathAliases ?? {}),
        ...(scene.imagePathAliases ?? {}),
    };

    return {
        ...scene,
        images: scene.images.map((image) => ({
            path: resolveSceneSourcePath(image.source, sceneDirectory, {
                ...options,
                imagePathAliases,
            }),
            id: image.id,
            transparency: image.transparency,
            rotation: image.rotation,
            initAnchorPos: image.initAnchorPos,
            currentAnchorPos: image.currentAnchorPos,
            locked: image.locked,
            visible: image.visible,
            filters: image.filters,
        })),
    };
};
