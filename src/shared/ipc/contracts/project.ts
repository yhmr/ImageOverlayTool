import type { ImageSet } from "../../types/ImageSet";
import type { ProjectFile } from "../../types/ProjectFile";
import type { ResolvedSceneFile } from "../../types/SceneFile";
import { defineInvokeContract, type InvokeContract } from "../contract";
import { IPC_CHANNELS } from "../channels";

export type SaveProjectPayload = {
    filePath: string;
    project: ProjectFile<ImageSet>;
    cacheImagePathsToDelete?: string[];
};

export type MaterializeCacheImagesPayload = {
    projectFilePath: string;
    cacheImagePaths: string[];
};

export type LoadProjectResult = {
    project: ProjectFile<ImageSet>;
    filePath: string;
} | null;

export type ProjectInvokeContracts = {
    saveAs: InvokeContract<[project: ProjectFile<ImageSet>], string | null>;
    save: InvokeContract<[payload: SaveProjectPayload], boolean>;
    load: InvokeContract<[], LoadProjectResult>;
    loadFromPath: InvokeContract<[filePath: string], LoadProjectResult>;
    pickSavePath: InvokeContract<[], string | null>;
    materializeCacheImages: InvokeContract<
        [payload: MaterializeCacheImagesPayload],
        Record<string, string>
    >;
};

export type SceneInvokeContracts = {
    loadFromPath: InvokeContract<[filePath: string], ResolvedSceneFile>;
};

export const projectIpcContracts: ProjectInvokeContracts = {
    saveAs: defineInvokeContract(IPC_CHANNELS.project.saveAs),
    save: defineInvokeContract(IPC_CHANNELS.project.save),
    load: defineInvokeContract(IPC_CHANNELS.project.load),
    loadFromPath: defineInvokeContract(IPC_CHANNELS.project.loadFromPath),
    pickSavePath: defineInvokeContract(IPC_CHANNELS.project.pickSavePath),
    materializeCacheImages: defineInvokeContract(
        IPC_CHANNELS.project.materializeCacheImages
    ),
};

export const sceneIpcContracts: SceneInvokeContracts = {
    loadFromPath: defineInvokeContract(IPC_CHANNELS.scene.loadFromPath),
};
