import fs from "fs";
import path from "path";

import { isSupportedImagePath } from "../../shared/constants/imageFormats";
import type {
    ResolvedSceneFile,
    SceneFile,
} from "../../shared/types/SceneFile";

export interface ResolveSceneSourcePathOptions {
    allowFixtureAlias?: boolean;
    fixturesDir?: string;
}

const SUPPORTED_IMAGE_EXTENSIONS = [
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
    ".svg",
];

const isPathInsideDirectory = (
    baseDir: string,
    targetPath: string
): boolean => {
    const relative = path.relative(baseDir, targetPath);
    return (
        relative === "" ||
        (!relative.startsWith("..") && !path.isAbsolute(relative))
    );
};

const resolveFixtureAliasPath = (
    fixturesDir: string,
    alias: string
): string => {
    const imageDir = path.resolve(fixturesDir, "images");
    const normalizedAlias = alias.trim();
    if (!normalizedAlias) {
        throw new Error("Fixture alias must not be empty.");
    }

    const aliasPath = path.resolve(imageDir, normalizedAlias);
    if (!isPathInsideDirectory(imageDir, aliasPath)) {
        throw new Error(
            `Fixture alias escapes fixtures/images: fixture:${alias}`
        );
    }

    const ext = path.extname(aliasPath).toLowerCase();
    if (ext.length > 0) {
        if (!SUPPORTED_IMAGE_EXTENSIONS.includes(ext)) {
            throw new Error(
                `Unsupported fixture alias extension: ${ext}. Supported extensions: ${SUPPORTED_IMAGE_EXTENSIONS.join(
                    ", "
                )}`
            );
        }
        if (fs.existsSync(aliasPath)) {
            return aliasPath;
        }
        throw new Error(`Fixture alias not found: fixture:${alias}`);
    }

    for (const candidateExt of SUPPORTED_IMAGE_EXTENSIONS) {
        const candidatePath = `${aliasPath}${candidateExt}`;
        if (fs.existsSync(candidatePath)) {
            return candidatePath;
        }
    }

    throw new Error(`Fixture alias not found: fixture:${alias}`);
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

    let resolvedPath: string;
    if (trimmedSource.startsWith("fixture:")) {
        if (!options.allowFixtureAlias || !options.fixturesDir) {
            throw new Error(
                `Fixture alias is not supported in this mode: ${trimmedSource}`
            );
        }
        resolvedPath = resolveFixtureAliasPath(
            options.fixturesDir,
            trimmedSource.slice("fixture:".length)
        );
    } else {
        resolvedPath = path.isAbsolute(trimmedSource)
            ? path.resolve(trimmedSource)
            : path.resolve(sceneDirectory, trimmedSource);
    }

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

    return {
        ...scene,
        images: scene.images.map((image) => ({
            path: resolveSceneSourcePath(image.source, sceneDirectory, options),
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
