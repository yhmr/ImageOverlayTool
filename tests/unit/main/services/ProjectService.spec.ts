import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs/promises";
import path from "path";

import { ProjectService } from "@/main/services/ProjectService";
import { deleteClipboardCacheFileIfManaged } from "@/main/services/clipboardCacheService";

const { logWarnMock } = vi.hoisted(() => ({
    logWarnMock: vi.fn(),
}));

vi.mock("fs/promises");

vi.mock("@/main/logger", () => ({
    default: {
        info: vi.fn(),
        warn: logWarnMock,
        error: vi.fn(),
        debug: vi.fn(),
    },
}));

vi.mock("@/main/services/clipboardCacheService", () => ({
    deleteClipboardCacheFileIfManaged: vi.fn(),
}));

describe("ProjectService", () => {
    let service: ProjectService;

    beforeEach(() => {
        service = new ProjectService();
        vi.clearAllMocks();
    });

    describe("resolveAvailablePath", () => {
        it("should return original path if file does not exist", async () => {
            vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"));

            const dir = "/test/dir";
            const source = "/source/image.png";
            const expected = path.join(dir, "image.png");

            const result = await service.resolveAvailablePath(dir, source);
            expect(result).toBe(expected);
        });

        it("should return path with suffix if file exists", async () => {
            const dir = "/test/dir";
            const source = "/source/image.png";
            const resolvedPath = path.join(dir, "image-1.png");

            vi.mocked(fs.access)
                .mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new Error("ENOENT"));

            const result = await service.resolveAvailablePath(dir, source);
            expect(result).toBe(resolvedPath);
        });

        it("should fallback to .png extension when source has no extension", async () => {
            vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"));

            const result = await service.resolveAvailablePath(
                "/test/dir",
                "/source/image"
            );
            expect(result).toBe(path.join("/test/dir", "image.png"));
        });

        it("should fallback to default basename when source path is empty", async () => {
            vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"));

            const result = await service.resolveAvailablePath("/test/dir", "");
            expect(result).toBe(path.join("/test/dir", "image.png"));
        });
    });

    describe("materializeCacheImages", () => {
        it("should copy files and return replacements", async () => {
            const projectPath = "/project/test.iot";
            const cachePath = "/cache/temp.png";
            const destPath = path.join("/project", "assets", "temp.png");

            vi.mocked(fs.access).mockImplementation(async (targetPath) => {
                const value = String(targetPath);
                if (value === cachePath) {
                    return;
                }
                if (value.startsWith(path.join("/project", "assets"))) {
                    throw new Error("ENOENT");
                }
                throw new Error("ENOENT");
            });

            const result = await service.materializeCacheImages(projectPath, [cachePath]);

            expect(fs.mkdir).toHaveBeenCalledWith(path.join("/project", "assets"), {
                recursive: true,
            });
            expect(fs.copyFile).toHaveBeenCalledWith(cachePath, destPath);
            expect(deleteClipboardCacheFileIfManaged).not.toHaveBeenCalled();
            expect(result).toEqual({ [cachePath]: destPath });
        });

        it("should skip if source file does not exist", async () => {
            const projectPath = "/project/test.iot";
            const cachePath = "/cache/missing.png";

            vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"));

            const result = await service.materializeCacheImages(projectPath, [cachePath]);

            expect(fs.copyFile).not.toHaveBeenCalled();
            expect(deleteClipboardCacheFileIfManaged).not.toHaveBeenCalled();
            expect(result).toEqual({});
            expect(logWarnMock).toHaveBeenCalledWith(
                "[ProjectService] materializeCacheImages source not found",
                cachePath
            );
        });

        it("should ignore invalid cache paths and deduplicate repeated source paths", async () => {
            const projectPath = "/project/test.iot";
            const cachePath = "/cache/temp.png";
            const destPath = path.join("/project", "assets", "temp.png");

            vi.mocked(fs.access).mockImplementation(async (targetPath) => {
                if (String(targetPath) === cachePath) {
                    return;
                }
                throw new Error("ENOENT");
            });

            const mixedPaths = ["", cachePath, cachePath, null, undefined] as unknown as string[];
            const result = await service.materializeCacheImages(projectPath, mixedPaths);

            expect(fs.copyFile).toHaveBeenCalledTimes(1);
            expect(fs.copyFile).toHaveBeenCalledWith(cachePath, destPath);
            expect(result).toEqual({ [cachePath]: destPath });
        });
    });

    describe("deleteManagedClipboardCacheFiles", () => {
        it("should delete managed cache paths after deduplication", async () => {
            await service.deleteManagedClipboardCacheFiles([
                "/cache/temp.png",
                "/cache/temp.png",
                "/cache/other.png",
            ]);

            expect(deleteClipboardCacheFileIfManaged).toHaveBeenCalledTimes(2);
            expect(deleteClipboardCacheFileIfManaged).toHaveBeenNthCalledWith(
                1,
                "/cache/temp.png"
            );
            expect(deleteClipboardCacheFileIfManaged).toHaveBeenNthCalledWith(
                2,
                "/cache/other.png"
            );
        });

        it("should ignore invalid paths", async () => {
            const mixedPaths = ["", null, undefined, "/cache/valid.png"] as unknown as string[];
            await service.deleteManagedClipboardCacheFiles(mixedPaths);

            expect(deleteClipboardCacheFileIfManaged).toHaveBeenCalledTimes(1);
            expect(deleteClipboardCacheFileIfManaged).toHaveBeenCalledWith(
                "/cache/valid.png"
            );
        });
    });
});
