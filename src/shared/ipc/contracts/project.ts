import type { ImageSet } from "../../types/ImageSet";
import type { ProjectFile } from "../../types/ProjectFile";
import type { ResolvedSceneFile } from "../../types/SceneFile";
import { defineInvokeContract, type InvokeContract } from "../contract";
import { IPC_CHANNELS } from "../channels";

/** プロジェクト保存処理に用いるペイロードの型 */
export type SaveProjectPayload = {
    filePath: string;
    project: ProjectFile<ImageSet>;
    cacheImagePathsToDelete?: string[];
};

/** キャッシュ画像の実体化(ファイル化)に伴うリクエストペイロードの型 */
export type MaterializeCacheImagesPayload = {
    projectFilePath: string;
    cacheImagePaths: string[];
};

/** プロジェクト読み込み結果の型 */
export type LoadProjectResult = {
    project: ProjectFile<ImageSet>;
    filePath: string;
} | null;

/**
 * プロジェクト管理関連のIPC通信におけるRequest/Responseの型定義群
 */
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

/**
 * シーン(構成情報)管理関連のIPC通信におけるRequest/Responseの型定義群
 */
export type SceneInvokeContracts = {
    loadFromPath: InvokeContract<[filePath: string], ResolvedSceneFile>;
};

/** プロジェクト管理関連IPC通信の契約定義オブジェクト */
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

/** シーン管理関連IPC通信の契約定義オブジェクト */
export const sceneIpcContracts: SceneInvokeContracts = {
    loadFromPath: defineInvokeContract(IPC_CHANNELS.scene.loadFromPath),
};
