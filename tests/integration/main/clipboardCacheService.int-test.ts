import fs from "fs/promises";
import os from "os";
import path from "path";
import type { NativeImage } from "electron";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetPath } = vi.hoisted(() => ({
    mockGetPath: vi.fn(),
}));

vi.mock("electron", () => ({
    app: {
        isPackaged: true,
        getPath: mockGetPath,
    },
}));

vi.mock("@/main/logger", () => ({
    default: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

import {
    cleanupClipboardCache,
    deleteClipboardCacheFileIfManaged,
    ensureClipboardCacheDirectory,
    isManagedClipboardCachePath,
    saveClipboardImageToCache,
} from "@/main/services/clipboardCacheService";

const DAY_MS = 24 * 60 * 60 * 1000;

const createFakeNativeImage = (pngData: Buffer): NativeImage =>
    ({
        isEmpty: () => false,
        toPNG: () => pngData,
    }) as unknown as NativeImage;

describe("Main integration: clipboard cache service", () => {
    let tempRootDir: string;
    let userDataDir: string;
    let cacheDir: string;

    beforeEach(async () => {
        vi.clearAllMocks();

        tempRootDir = await fs.mkdtemp(path.join(os.tmpdir(), "iot-int-"));
        userDataDir = path.join(tempRootDir, "user-data");
        cacheDir = path.join(userDataDir, "clipboard-cache");
        mockGetPath.mockReturnValue(userDataDir);
    });

    afterEach(async () => {
        await fs.rm(tempRootDir, { recursive: true, force: true });
    });

    it("creates clipboard cache directory on demand", async () => {
        const createdPath = await ensureClipboardCacheDirectory();

        expect(createdPath).toBe(cacheDir);
        await expect(fs.access(cacheDir)).resolves.toBeUndefined();
    });

    it("saves clipboard image data to managed cache path", async () => {
        const image = createFakeNativeImage(Buffer.from("png"));

        const savedPath = await saveClipboardImageToCache(image);

        expect(isManagedClipboardCachePath(savedPath)).toBe(true);
        await expect(fs.readFile(savedPath, "utf8")).resolves.toBe("png");
    });

    it("throws when clipboard image is empty", async () => {
        const emptyImage = {
            isEmpty: () => true,
            toPNG: () => Buffer.alloc(0),
        } as unknown as NativeImage;

        await expect(saveClipboardImageToCache(emptyImage)).rejects.toThrow(
            "Clipboard image is empty"
        );
    });

    it("returns managed-path judgement for inside/outside cache paths", async () => {
        await ensureClipboardCacheDirectory();
        const managedPath = path.join(cacheDir, "inside.png");
        const unmanagedPath = path.join(tempRootDir, "outside.png");

        expect(isManagedClipboardCachePath(managedPath)).toBe(true);
        expect(isManagedClipboardCachePath(unmanagedPath)).toBe(false);
        expect(isManagedClipboardCachePath("")).toBe(false);
    });

    it("deletes only managed cache files", async () => {
        await ensureClipboardCacheDirectory();
        const managedPath = path.join(cacheDir, "managed.png");
        const unmanagedPath = path.join(tempRootDir, "outside.png");
        await fs.writeFile(managedPath, "managed");
        await fs.writeFile(unmanagedPath, "outside");

        await deleteClipboardCacheFileIfManaged(managedPath);
        await deleteClipboardCacheFileIfManaged(unmanagedPath);

        await expect(fs.access(managedPath)).rejects.toThrow();
        await expect(fs.readFile(unmanagedPath, "utf8")).resolves.toBe("outside");
    });

    it("cleanup returns without side effects when cache directory does not exist", async () => {
        await cleanupClipboardCache();
        await expect(fs.access(cacheDir)).rejects.toThrow();
    });

    it("cleanup removes expired files and keeps recent files", async () => {
        await ensureClipboardCacheDirectory();
        const oldPath = path.join(cacheDir, "old.png");
        const recentPath = path.join(cacheDir, "recent.png");
        const oldDate = new Date(Date.now() - 8 * DAY_MS);
        const recentDate = new Date(Date.now() - DAY_MS);
        await fs.writeFile(oldPath, "old");
        await fs.writeFile(recentPath, "recent");
        await fs.utimes(oldPath, oldDate, oldDate);
        await fs.utimes(recentPath, recentDate, recentDate);

        await cleanupClipboardCache();

        await expect(fs.access(oldPath)).rejects.toThrow();
        await expect(fs.readFile(recentPath, "utf8")).resolves.toBe("recent");
    });

    it("cleanup prunes oldest files when total cache size exceeds cap", async () => {
        await ensureClipboardCacheDirectory();
        const oldest = path.join(cacheDir, "oldest.bin");
        const middle = path.join(cacheDir, "middle.bin");
        const newest = path.join(cacheDir, "newest.bin");
        const now = Date.now();
        const size = 180 * 1024 * 1024;

        for (const filePath of [oldest, middle, newest]) {
            const handle = await fs.open(filePath, "w");
            await handle.truncate(size);
            await handle.close();
        }
        await fs.utimes(oldest, new Date(now - 3 * DAY_MS), new Date(now - 3 * DAY_MS));
        await fs.utimes(middle, new Date(now - 2 * DAY_MS), new Date(now - 2 * DAY_MS));
        await fs.utimes(newest, new Date(now - DAY_MS), new Date(now - DAY_MS));

        await cleanupClipboardCache();

        await expect(fs.access(oldest)).rejects.toThrow();
        await expect(fs.access(middle)).resolves.toBeUndefined();
        await expect(fs.access(newest)).resolves.toBeUndefined();
    });
});
