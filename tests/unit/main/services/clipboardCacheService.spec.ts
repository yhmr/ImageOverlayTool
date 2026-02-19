import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs/promises";
import crypto from "crypto";
import path from "path";
import type { Stats } from "fs";
import { app } from "electron";
import type { NativeImage } from "electron";

import {
    cleanupClipboardCache,
    deleteClipboardCacheFileIfManaged,
    ensureClipboardCacheDirectory,
    isManagedClipboardCachePath,
    saveClipboardImageToCache,
} from "@/main/services/clipboardCacheService";

const { mockWarn } = vi.hoisted(() => ({
    mockWarn: vi.fn(),
}));

vi.mock("fs/promises");

vi.mock("electron", () => ({
    app: {
        getPath: vi.fn(),
    },
}));

vi.mock("@/main/logger", () => ({
    default: {
        warn: mockWarn,
        info: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
    },
}));

const asNativeImage = (image: {
    isEmpty: () => boolean;
    toPNG: () => Buffer;
}): NativeImage => image as unknown as NativeImage;

const createDirent = (name: string, isFile: boolean) => ({
    name,
    isFile: () => isFile,
});

const createStats = (size: number, mtimeMs: number): Stats =>
    ({
        size,
        mtimeMs,
    }) as unknown as Stats;

describe("clipboardCacheService", () => {
    const userDataDir = path.join("C:", "Users", "tester", "AppData", "Roaming");
    const cacheDir = path.join(userDataDir, "clipboard-cache");

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(app.getPath).mockReturnValue(userDataDir);
    });

    it("ensureClipboardCacheDirectory creates cache directory and returns path", async () => {
        vi.mocked(fs.mkdir).mockResolvedValue(undefined);

        const result = await ensureClipboardCacheDirectory();

        expect(fs.mkdir).toHaveBeenCalledWith(cacheDir, { recursive: true });
        expect(result).toBe(cacheDir);
    });

    it("saveClipboardImageToCache throws when clipboard image is empty", async () => {
        await expect(
            saveClipboardImageToCache(
                asNativeImage({
                    isEmpty: () => true,
                    toPNG: () => Buffer.from(""),
                })
            )
        ).rejects.toThrow("Clipboard image is empty");
    });

    it("saveClipboardImageToCache stores image as png with deterministic name", async () => {
        vi.spyOn(Date, "now").mockReturnValue(1700000000000);
        vi.spyOn(crypto, "randomUUID").mockReturnValue(
            "00000000-0000-4000-8000-000000000001"
        );
        vi.mocked(fs.mkdir).mockResolvedValue(undefined);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined);

        const pngBuffer = Buffer.from("png");
        const result = await saveClipboardImageToCache(
            asNativeImage({
                isEmpty: () => false,
                toPNG: () => pngBuffer,
            })
        );

        const expectedPath = path.join(
            cacheDir,
            "clipboard-1700000000000-00000000-0000-4000-8000-000000000001.png"
        );
        expect(fs.writeFile).toHaveBeenCalledWith(expectedPath, pngBuffer);
        expect(result).toBe(expectedPath);
    });

    it("isManagedClipboardCachePath accepts only paths under managed directory", () => {
        const managedPath = path.join(cacheDir, "a.png");
        const outsidePath = path.join(userDataDir, "clipboard-cache-evil", "a.png");

        expect(isManagedClipboardCachePath("")).toBe(false);
        expect(isManagedClipboardCachePath(managedPath)).toBe(true);
        expect(isManagedClipboardCachePath(outsidePath)).toBe(false);
    });

    it("deleteClipboardCacheFileIfManaged ignores unmanaged path", async () => {
        await deleteClipboardCacheFileIfManaged(
            path.join(userDataDir, "other", "a.png")
        );

        expect(fs.access).not.toHaveBeenCalled();
        expect(fs.unlink).not.toHaveBeenCalled();
    });

    it("deleteClipboardCacheFileIfManaged skips missing managed file", async () => {
        vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"));

        await deleteClipboardCacheFileIfManaged(path.join(cacheDir, "missing.png"));

        expect(fs.unlink).not.toHaveBeenCalled();
    });

    it("deleteClipboardCacheFileIfManaged deletes existing managed file", async () => {
        vi.mocked(fs.access).mockResolvedValue(undefined);
        vi.mocked(fs.unlink).mockResolvedValue(undefined);
        const filePath = path.join(cacheDir, "present.png");

        await deleteClipboardCacheFileIfManaged(filePath);

        expect(fs.unlink).toHaveBeenCalledWith(filePath);
    });

    it("deleteClipboardCacheFileIfManaged swallows unlink failures and logs warn", async () => {
        vi.mocked(fs.access).mockResolvedValue(undefined);
        vi.mocked(fs.unlink).mockRejectedValue(new Error("locked"));
        const filePath = path.join(cacheDir, "locked.png");

        await deleteClipboardCacheFileIfManaged(filePath);

        expect(mockWarn).toHaveBeenCalledWith(
            "[clipboard-cache] Failed to delete cache file",
            expect.objectContaining({ targetPath: filePath })
        );
    });

    it("cleanupClipboardCache returns early when cache directory does not exist", async () => {
        vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"));

        await cleanupClipboardCache();

        expect(fs.readdir).not.toHaveBeenCalled();
    });

    it("cleanupClipboardCache logs and returns when readdir fails", async () => {
        vi.mocked(fs.access).mockResolvedValue(undefined);
        vi.mocked(fs.readdir).mockRejectedValue(new Error("read failed"));

        await cleanupClipboardCache();

        expect(mockWarn).toHaveBeenCalledWith(
            "[clipboard-cache] Failed to read cache directory",
            expect.any(Error)
        );
    });

    it("cleanupClipboardCache removes expired files and prunes oldest files when size exceeds cap", async () => {
        const now = 10000000000;
        vi.spyOn(Date, "now").mockReturnValue(now);
        vi.mocked(fs.access).mockResolvedValue(undefined);
        vi.mocked(fs.readdir).mockResolvedValue([
            createDirent("expired.png", true),
            createDirent("recent-a.png", true),
            createDirent("recent-b.png", true),
            createDirent("recent-c.png", true),
            createDirent("subdir", false),
        ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);
        vi.mocked(fs.stat).mockImplementation(async (targetPath) => {
            const filePath = String(targetPath);
            if (filePath.endsWith("expired.png")) {
                return createStats(10, now - 7 * 24 * 60 * 60 * 1000 - 1);
            }
            if (filePath.endsWith("recent-a.png")) {
                return createStats(300 * 1024 * 1024, now - 1000);
            }
            if (filePath.endsWith("recent-b.png")) {
                return createStats(300 * 1024 * 1024, now - 2000);
            }
            return createStats(300 * 1024 * 1024, now - 3000);
        });
        vi.mocked(fs.unlink).mockResolvedValue(undefined);

        await cleanupClipboardCache();

        expect(fs.unlink).toHaveBeenCalledTimes(3);
        expect(fs.unlink).toHaveBeenCalledWith(path.join(cacheDir, "expired.png"));
        expect(fs.unlink).toHaveBeenCalledWith(path.join(cacheDir, "recent-c.png"));
        expect(fs.unlink).toHaveBeenCalledWith(path.join(cacheDir, "recent-b.png"));
    });

    it("cleanupClipboardCache logs stat failures and continues", async () => {
        vi.mocked(fs.access).mockResolvedValue(undefined);
        vi.mocked(fs.readdir).mockResolvedValue([
            createDirent("broken.png", true),
        ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);
        vi.mocked(fs.stat).mockRejectedValue(new Error("stat failed"));

        await cleanupClipboardCache();

        expect(mockWarn).toHaveBeenCalledWith(
            "[clipboard-cache] Failed to stat cache file",
            expect.objectContaining({
                filePath: path.join(cacheDir, "broken.png"),
            })
        );
    });
});
