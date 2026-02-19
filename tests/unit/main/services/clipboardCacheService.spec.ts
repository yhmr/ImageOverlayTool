import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs/promises";
import crypto from "crypto";
import path from "path";
import { app } from "electron";
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

describe("clipboardCacheService", () => {
    const userDataDir = path.join("C:", "Users", "tester", "AppData", "Roaming");
    const cacheDir = path.join(userDataDir, "clipboard-cache");

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(app.getPath).mockReturnValue(userDataDir);
    });

    it("ensureClipboardCacheDirectory creates cache directory and returns path", async () => {
        vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);

        const result = await ensureClipboardCacheDirectory();

        expect(fs.mkdir).toHaveBeenCalledWith(cacheDir, { recursive: true });
        expect(result).toBe(cacheDir);
    });

    it("saveClipboardImageToCache throws when clipboard image is empty", async () => {
        await expect(
            saveClipboardImageToCache({
                isEmpty: () => true,
            } as any)
        ).rejects.toThrow("Clipboard image is empty");
    });

    it("saveClipboardImageToCache stores image as png with deterministic name", async () => {
        vi.spyOn(Date, "now").mockReturnValue(1700000000000);
        vi.spyOn(crypto, "randomUUID").mockReturnValue(
            "00000000-0000-4000-8000-000000000001"
        );
        vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined as any);

        const pngBuffer = Buffer.from("png");
        const result = await saveClipboardImageToCache({
            isEmpty: () => false,
            toPNG: () => pngBuffer,
        } as any);

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
        await deleteClipboardCacheFileIfManaged(path.join(userDataDir, "other", "a.png"));

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
        vi.mocked(fs.unlink).mockResolvedValue(undefined as any);
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
            { name: "expired.png", isFile: () => true },
            { name: "recent-a.png", isFile: () => true },
            { name: "recent-b.png", isFile: () => true },
            { name: "recent-c.png", isFile: () => true },
            { name: "subdir", isFile: () => false },
        ] as any);
        vi.mocked(fs.stat).mockImplementation(async (targetPath: any) => {
            const p = String(targetPath);
            if (p.endsWith("expired.png")) {
                return {
                    size: 10,
                    mtimeMs: now - 7 * 24 * 60 * 60 * 1000 - 1,
                } as any;
            }
            if (p.endsWith("recent-a.png")) {
                return {
                    size: 300 * 1024 * 1024,
                    mtimeMs: now - 1000,
                } as any;
            }
            if (p.endsWith("recent-b.png")) {
                return {
                    size: 300 * 1024 * 1024,
                    mtimeMs: now - 2000,
                } as any;
            }
            return {
                size: 300 * 1024 * 1024,
                mtimeMs: now - 3000,
            } as any;
        });
        vi.mocked(fs.unlink).mockResolvedValue(undefined as any);

        await cleanupClipboardCache();

        const deletedPaths = vi.mocked(fs.unlink).mock.calls.map((call) =>
            String(call[0])
        );
        expect(deletedPaths).toHaveLength(3);
        expect(deletedPaths.some((p) => p.endsWith("expired.png"))).toBe(true);
        expect(deletedPaths.some((p) => p.endsWith("recent-c.png"))).toBe(true);
        expect(deletedPaths.some((p) => p.endsWith("recent-b.png"))).toBe(true);
    });

    it("cleanupClipboardCache logs stat failures and continues", async () => {
        vi.mocked(fs.access).mockResolvedValue(undefined);
        vi.mocked(fs.readdir).mockResolvedValue([
            { name: "broken.png", isFile: () => true },
        ] as any);
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
