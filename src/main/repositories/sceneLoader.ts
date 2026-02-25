import fs from "fs";
import path from "path";

import type { ResolvedSceneFile } from "../../shared/types/SceneFile";
import { parseSceneFile } from "./sceneSchema";
import {
    resolveSceneFile,
    type ResolveSceneSourcePathOptions,
} from "./sceneResolver";

export const loadResolvedSceneFileFromPath = async (
    scenePath: string,
    options: ResolveSceneSourcePathOptions = {}
): Promise<ResolvedSceneFile> => {
    const normalizedScenePath = path.resolve(scenePath);
    const rawText = await fs.promises.readFile(normalizedScenePath, "utf-8");
    const parsed = parseSceneFile(JSON.parse(rawText) as unknown);
    return resolveSceneFile(parsed, normalizedScenePath, options);
};
