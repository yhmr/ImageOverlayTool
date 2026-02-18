import { useEffect, useMemo, useRef, useState } from "react";

import type { ImageSet } from "../../shared/types/ImageSet";
import type { ImageInfoResult } from "../../shared/types/ImageInfo";
import { useIpcService } from "../providers/IpcServiceProvider";

export interface ImageFileStatus {
    checked: boolean;
    exists: boolean;
    width?: number;
    height?: number;
}

const isSameStatusMap = (
    current: Record<string, ImageFileStatus>,
    next: Record<string, ImageFileStatus>
): boolean => {
    const currentKeys = Object.keys(current);
    const nextKeys = Object.keys(next);
    if (currentKeys.length !== nextKeys.length) {
        return false;
    }

    for (const key of nextKeys) {
        const a = current[key];
        const b = next[key];
        if (
            !a ||
            !b ||
            a.checked !== b.checked ||
            a.exists !== b.exists ||
            a.width !== b.width ||
            a.height !== b.height
        ) {
            return false;
        }
    }

    return true;
};

export const useImageFileStatus = (imageSets: ImageSet[]) => {
    const ipcService = useIpcService();
    const [statusById, setStatusById] = useState<
        Record<string, ImageFileStatus>
    >({});
    const pathCacheRef = useRef<Map<string, ImageInfoResult>>(new Map());

    useEffect(() => {
        let isCancelled = false;

        const run = async () => {
            const uniquePaths = Array.from(
                new Set(
                    imageSets
                        .map((imageSet) => imageSet.path)
                        .filter((value): value is string => Boolean(value))
                )
            );

            const cache = pathCacheRef.current;
            const nextCache = new Map(cache);

            await Promise.all(
                uniquePaths.map(async (path) => {
                    if (cache.has(path)) {
                        return;
                    }
                    try {
                        const info = await ipcService.getImageInfo(path);
                        nextCache.set(path, info);
                    } catch {
                        nextCache.set(path, { exists: false });
                    }
                })
            );

            if (isCancelled) {
                return;
            }

            pathCacheRef.current = nextCache;
            const nextStatus: Record<string, ImageFileStatus> = {};
            for (const imageSet of imageSets) {
                if (!imageSet.path) {
                    continue;
                }

                const info = nextCache.get(imageSet.path) ?? { exists: false };
                nextStatus[imageSet.id] = {
                    checked: true,
                    exists: info.exists,
                    width: info.exists ? info.width : undefined,
                    height: info.exists ? info.height : undefined,
                };
            }
            setStatusById((current) =>
                isSameStatusMap(current, nextStatus) ? current : nextStatus
            );
        };

        void run();
        return () => {
            isCancelled = true;
        };
    }, [imageSets, ipcService]);

    const missingCount = useMemo(() => {
        let count = 0;
        for (const imageSet of imageSets) {
            if (!imageSet.path) {
                continue;
            }
            const status = statusById[imageSet.id];
            if (status?.checked && !status.exists) {
                count += 1;
            }
        }
        return count;
    }, [imageSets, statusById]);

    return { statusById, missingCount };
};
