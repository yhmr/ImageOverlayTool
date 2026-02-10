import UUID from "uuidjs";

import type { AnchorPos } from "../../shared/types/AnchorPos";
import type { ImageSet } from "../../shared/types/ImageSet";

type ImageSetFactoryOptions = {
    id?: string;
    path?: string;
    transparency?: number;
    rotation?: number;
    initAnchorPos?: AnchorPos | null;
    currentAnchorPos?: AnchorPos | null;
    locked?: boolean;
};

export const toLocalFileUrl = (filePath: string): string =>
    `local-file://${filePath.replace(/\\/g, "/")}`;

export const createImageSet = (
    options: ImageSetFactoryOptions = {}
): ImageSet => ({
    id: options.id ?? UUID.generate(),
    path: options.path ?? "",
    transparency: options.transparency ?? 0,
    rotation: options.rotation ?? 0,
    initAnchorPos: options.initAnchorPos ?? null,
    currentAnchorPos: options.currentAnchorPos ?? null,
    locked: options.locked ?? false,
});

export const createEmptyImageSet = (): ImageSet => createImageSet();

export const createImageSetFromLocalFile = (
    filePath: string,
    options: Omit<ImageSetFactoryOptions, "path"> = {}
): ImageSet =>
    createImageSet({
        ...options,
        path: toLocalFileUrl(filePath),
    });
