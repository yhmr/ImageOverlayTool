import fs from "fs";
import path from "path";

import type { ResolvedSceneFile } from "../../shared/types/SceneFile";
import { parseSceneFile } from "./sceneSchema";
import {
    resolveSceneFile,
    type ResolveSceneSourcePathOptions,
} from "./sceneResolver";

export interface LoadedSceneDocument {
    scenePath: string;
    source: unknown;
    resolvedScene: ResolvedSceneFile;
}

export const loadResolvedSceneDocumentFromPath = async (
    scenePath: string,
    options: ResolveSceneSourcePathOptions = {}
): Promise<LoadedSceneDocument> => {
    const normalizedScenePath = path.resolve(scenePath);
    const rawText = await fs.promises.readFile(normalizedScenePath, "utf-8");
    const source = JSON.parse(rawText) as unknown;
    const parsed = parseSceneFile(source);
    const resolvedScene = resolveSceneFile(
        parsed,
        normalizedScenePath,
        options
    );

    return {
        scenePath: normalizedScenePath,
        source,
        resolvedScene,
    };
};

export const loadResolvedSceneFileFromPath = async (
    scenePath: string,
    options: ResolveSceneSourcePathOptions = {}
): Promise<ResolvedSceneFile> => {
    const document = await loadResolvedSceneDocumentFromPath(
        scenePath,
        options
    );
    return document.resolvedScene;
};
