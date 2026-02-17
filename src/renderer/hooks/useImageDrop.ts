import { useCallback } from "react";
import type { DragEventHandler } from "react";

import { isSupportedImagePath } from "../../shared/constants/imageFormats";
import { useIpcService } from "../providers/IpcServiceProvider";
import { useAppStore } from "../store/useAppStore";

type FileWithPath = File & {
    path?: string;
};

const toPathFromFileUrl = (value: string): string | null => {
    try {
        const url = new URL(value.trim());
        if (url.protocol !== "file:") {
            return null;
        }

        let resolvedPath = decodeURIComponent(`${url.host}${url.pathname}`);
        if (!resolvedPath) {
            return null;
        }

        if (/^\/[a-zA-Z]:\//.test(resolvedPath)) {
            resolvedPath = resolvedPath.slice(1);
        } else if (/^[a-zA-Z]\//.test(resolvedPath)) {
            resolvedPath = resolvedPath.charAt(0) + ":" + resolvedPath.slice(1);
        }

        return resolvedPath;
    } catch {
        return null;
    }
};

const extractPathsFromUriList = (dataTransfer: DataTransfer): string[] => {
    const uriList = dataTransfer.getData("text/uri-list");
    if (!uriList) {
        return [];
    }

    return uriList
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("#"))
        .map((line) => toPathFromFileUrl(line))
        .filter((line): line is string => Boolean(line));
};

export const useImageDrop = () => {
    const ipcService = useIpcService();
    const addImageSetWithPath = useAppStore(
        (state) => state.addImageSetWithPath
    );

    const onDragOver = useCallback<DragEventHandler<HTMLElement>>((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
    }, []);

    const onDrop = useCallback<DragEventHandler<HTMLElement>>(
        (event) => {
            event.preventDefault();

            const files = Array.from(
                event.dataTransfer.files
            ) as FileWithPath[];
            const candidatePaths: string[] = [];

            for (const file of files) {
                if (typeof file.path === "string" && file.path.length > 0) {
                    candidatePaths.push(file.path);
                    continue;
                }

                try {
                    const pathFromWebUtils = ipcService.getPathForFile(file);
                    if (pathFromWebUtils) {
                        candidatePaths.push(pathFromWebUtils);
                    }
                } catch {
                    // noop: fallback to URI list parsing
                }
            }

            candidatePaths.push(...extractPathsFromUriList(event.dataTransfer));

            for (const path of new Set(candidatePaths)) {
                if (!isSupportedImagePath(path)) {
                    continue;
                }
                addImageSetWithPath(path);
            }
        },
        [addImageSetWithPath, ipcService]
    );

    return {
        onDragOver,
        onDrop,
    };
};
