import {
    fromLocalFileUrl,
    toLocalFileUrl,
} from "../../factories/imageSetFactory";
import type { ImageSet } from "../../../shared/types/ImageSet";

/**
 * 対象の画像セット（ImageSet）群の中から、一時的なキャッシュファイル（D&Dなどで
 * 追加された未保存の画像）として扱われているもののローカルファイルパスを抽出する。
 */
export const getCacheImageLocalPaths = (imageSets: ImageSet[]): string[] =>
    imageSets
        .filter((imageSet) => (imageSet.sourceType ?? "file") === "cache")
        .map((imageSet) => fromLocalFileUrl(imageSet.path))
        .filter((value): value is string => Boolean(value));

/**
 * キャッシュ画像を正式な保存先へ移動（実体化）した結果を表すインターフェース。
 */
export interface CacheImageResolutionResult {
    nextImageSets: ImageSet[];
    cacheImagePathsToDelete: string[];
    missingPaths: string[];
}

/**
 * キャッシュとして扱われていた画像データを、正式な保存先（移動先）のパスへ書き換えた
 * 新しいImageSetの配列を生成する。
 *
 * @param imageSets 現在の画像データ群
 * @param replacementMap キャッシュ画像の元パスから引越し先のパスへのマッピング
 * @param cacheImagePaths 処置対象となるキャッシュ画像のパス一覧（指定がなければ自動抽出）
 */
export const resolveCacheImagePaths = (
    imageSets: ImageSet[],
    replacementMap: Record<string, string>,
    cacheImagePaths: string[] = getCacheImageLocalPaths(imageSets)
): CacheImageResolutionResult => {
    const missingPaths = cacheImagePaths.filter(
        (path) => !replacementMap[path]
    );

    const nextImageSets = imageSets.map((imageSet) => {
        if ((imageSet.sourceType ?? "file") !== "cache") {
            return imageSet;
        }

        const sourcePath = fromLocalFileUrl(imageSet.path);
        if (!sourcePath) {
            return imageSet;
        }

        const destinationPath = replacementMap[sourcePath];
        if (!destinationPath) {
            return imageSet;
        }

        return {
            ...imageSet,
            path: toLocalFileUrl(destinationPath),
            sourceType: "file" as const,
        };
    });

    return {
        nextImageSets,
        cacheImagePathsToDelete: [...new Set(cacheImagePaths)],
        missingPaths,
    };
};
