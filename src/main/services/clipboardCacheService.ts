import fs from "fs/promises";
import type { Dirent } from "fs";
import path from "path";
import crypto from "crypto";
import type { NativeImage } from "electron";
import { app } from "electron";

import log from "../logger";

const CLIPBOARD_CACHE_DIR = "clipboard-cache";
const MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CACHE_SIZE_BYTES = 512 * 1024 * 1024;

const getCacheDirectory = (): string =>
    path.join(app.getPath("userData"), CLIPBOARD_CACHE_DIR);

const fileExists = async (targetPath: string): Promise<boolean> => {
    try {
        await fs.access(targetPath);
        return true;
    } catch {
        return false;
    }
};

const normalizeAbsolutePath = (targetPath: string): string =>
    path.resolve(path.normalize(targetPath));

const isPathInDirectory = (
    targetPath: string,
    directoryPath: string
): boolean => {
    const normalizedPath = normalizeAbsolutePath(targetPath).toLowerCase();
    const normalizedDirectory =
        normalizeAbsolutePath(directoryPath).toLowerCase() + path.sep;
    return normalizedPath.startsWith(normalizedDirectory);
};

export const ensureClipboardCacheDirectory = async (): Promise<string> => {
    const cacheDirectory = getCacheDirectory();
    await fs.mkdir(cacheDirectory, { recursive: true });
    return cacheDirectory;
};

export const saveClipboardImageToCache = async (
    image: NativeImage
): Promise<string> => {
    if (image.isEmpty()) {
        throw new Error("Clipboard image is empty");
    }

    const cacheDirectory = await ensureClipboardCacheDirectory();
    const fileName = `clipboard-${Date.now()}-${crypto.randomUUID()}.png`;
    const destinationPath = path.join(cacheDirectory, fileName);
    await fs.writeFile(destinationPath, image.toPNG());
    return destinationPath;
};

export const isManagedClipboardCachePath = (targetPath: string): boolean => {
    if (!targetPath) {
        return false;
    }
    return isPathInDirectory(targetPath, getCacheDirectory());
};

export const deleteClipboardCacheFileIfManaged = async (
    targetPath: string
): Promise<void> => {
    if (!isManagedClipboardCachePath(targetPath)) {
        return;
    }

    if (!(await fileExists(targetPath))) {
        return;
    }

    try {
        await fs.unlink(targetPath);
    } catch (error) {
        log.warn("[clipboard-cache] Failed to delete cache file", {
            targetPath,
            error,
        });
    }
};

export const cleanupClipboardCache = async (): Promise<void> => {
    const cacheDirectory = getCacheDirectory();
    if (!(await fileExists(cacheDirectory))) {
        return;
    }

    let entries: Dirent[];
    try {
        entries = await fs.readdir(cacheDirectory, { withFileTypes: true });
    } catch (error) {
        log.warn("[clipboard-cache] Failed to read cache directory", error);
        return;
    }

    const now = Date.now();
    type CacheFile = {
        filePath: string;
        size: number;
        mtimeMs: number;
    };
    const files: CacheFile[] = [];

    for (const entry of entries) {
        if (!entry.isFile()) {
            continue;
        }
        const filePath = path.join(cacheDirectory, entry.name);
        try {
            const stat = await fs.stat(filePath);
            files.push({
                filePath,
                size: stat.size,
                mtimeMs: stat.mtimeMs,
            });
        } catch (error) {
            log.warn("[clipboard-cache] Failed to stat cache file", {
                filePath,
                error,
            });
        }
    }

    // 期限切れファイルを並列削除
    const expiredFiles = files.filter(
        (file) => now - file.mtimeMs > MAX_CACHE_AGE_MS
    );
    await Promise.allSettled(
        expiredFiles.map((file) =>
            deleteClipboardCacheFileIfManaged(file.filePath)
        )
    );

    const remainingFiles = files
        .filter((file) => now - file.mtimeMs <= MAX_CACHE_AGE_MS)
        .sort((a, b) => a.mtimeMs - b.mtimeMs);
    let totalBytes = remainingFiles.reduce((sum, file) => sum + file.size, 0);

    // サイズ超過分は古い順に削除（順序依存のため直列）
    for (const file of remainingFiles) {
        if (totalBytes <= MAX_CACHE_SIZE_BYTES) {
            break;
        }
        await deleteClipboardCacheFileIfManaged(file.filePath);
        totalBytes -= file.size;
    }
};
