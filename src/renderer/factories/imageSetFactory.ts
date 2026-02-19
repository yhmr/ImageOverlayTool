import UUID from "uuidjs";

import type { AnchorPos } from "../../shared/types/AnchorPos";
import type { ImageSet } from "../../shared/types/ImageSet";
export {
    toLocalFileUrl,
    fromLocalFileUrl,
} from "../../shared/utils/localFileUrl";
import { toLocalFileUrl } from "../../shared/utils/localFileUrl";

type ImageSetFactoryOptions = {
    id?: string;
    path?: string;
    sourceType?: ImageSet["sourceType"];
    transparency?: number;
    rotation?: number;
    initAnchorPos?: AnchorPos | null;
    currentAnchorPos?: AnchorPos | null;
    locked?: boolean;
    visible?: boolean;
    filters?: ImageSet["filters"];
};

export const createImageSet = (
    options: ImageSetFactoryOptions = {}
): ImageSet => ({
    id: options.id ?? UUID.generate(),
    path: options.path ?? "",
    sourceType: options.sourceType ?? "file",
    transparency: options.transparency ?? 0,
    rotation: options.rotation ?? 0,
    initAnchorPos: options.initAnchorPos ?? null,
    currentAnchorPos: options.currentAnchorPos ?? null,
    locked: options.locked ?? false,
    visible: options.visible ?? true,
    filters: options.filters ?? {
        binarization: { enabled: false, threshold: 128 },
        hsv: { enabled: false, h: 0, s: 0, v: 0 },
    },
});

export const createEmptyImageSet = (): ImageSet => createImageSet();

export const createImageSetFromLocalFile = (
    filePath: string,
    options: Omit<ImageSetFactoryOptions, "path"> = {}
): ImageSet =>
    createImageSet({
        ...options,
        path: toLocalFileUrl(filePath),
        sourceType: options.sourceType ?? "file",
    });

export const createImageSetFromCacheFile = (
    filePath: string,
    options: Omit<ImageSetFactoryOptions, "path" | "sourceType"> = {}
): ImageSet =>
    createImageSetFromLocalFile(filePath, {
        ...options,
        sourceType: "cache",
    });
