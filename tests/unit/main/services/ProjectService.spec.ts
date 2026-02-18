import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectService } from '@/main/services/ProjectService';
import fs from 'fs/promises';
import path from 'path';
import { deleteClipboardCacheFileIfManaged } from '@/main/services/clipboardCacheService';
const { logWarnMock } = vi.hoisted(() => ({
    logWarnMock: vi.fn(),
}));

// fs/promises のモック
vi.mock('fs/promises');

// logger のモック
vi.mock('@/main/logger', () => ({
    default: {
        info: vi.fn(),
        warn: logWarnMock,
        error: vi.fn(),
        debug: vi.fn(),
    },
}));

// clipboardCacheService のモック
vi.mock('@/main/services/clipboardCacheService', () => ({
    deleteClipboardCacheFileIfManaged: vi.fn(),
}));

describe('ProjectService', () => {
    let service: ProjectService;

    beforeEach(() => {
        service = new ProjectService();
        vi.clearAllMocks();
    });

    describe('resolveAvailablePath', () => {
        it('should return original path if file does not exist', async () => {
            // fs.access がエラーを投げればファイルが存在しないとみなされる
            (fs.access as any).mockRejectedValue(new Error('ENOENT'));

            const dir = '/test/dir';
            const source = '/source/image.png';
            const expected = path.join(dir, 'image.png');

            const result = await service.resolveAvailablePath(dir, source);
            expect(result).toBe(expected);
        });

        it('should return path with suffix if file exists', async () => {
            const dir = '/test/dir';
            const source = '/source/image.png';
            const conflictPath = path.join(dir, 'image.png');
            const resolvedPath = path.join(dir, 'image-1.png');

            // 1回目の access (image.png) は成功（存在）、2回目 (image-1.png) は失敗（不在）
            (fs.access as any)
                .mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new Error('ENOENT'));

            const result = await service.resolveAvailablePath(dir, source);
            expect(result).toBe(resolvedPath);
        });

        it('should fallback to .png extension when source has no extension', async () => {
            (fs.access as any).mockRejectedValue(new Error('ENOENT'));

            const result = await service.resolveAvailablePath('/test/dir', '/source/image');
            expect(result).toBe(path.join('/test/dir', 'image.png'));
        });

        it('should fallback to default basename when source path is empty', async () => {
            (fs.access as any).mockRejectedValue(new Error('ENOENT'));

            const result = await service.resolveAvailablePath('/test/dir', '');
            expect(result).toBe(path.join('/test/dir', 'image.png'));
        });
    });

    describe('materializeCacheImages', () => {
        it('should copy files and return replacements', async () => {
            const projectPath = '/project/test.iot';
            const cachePath = '/cache/temp.png';
            const destPath = path.join('/project', 'assets', 'temp.png');

            // fileExists が常に false (出力先にはファイルがない) を返すように設定
            // ただし、入力ファイル (cachePath) の存在チェックは true である必要がある
            // ProjectServiceの実装では:
            // 1. fileExists(sourcePath) -> true
            // 2. resolveAvailablePath -> fileExists(destPath) -> false

            // accessモックの挙動をパスに応じて切り替える
            (fs.access as any).mockImplementation(async (p: string) => {
                if (p === cachePath) return undefined; // exists
                if (p.startsWith(path.join('/project', 'assets'))) throw new Error('ENOENT'); // dest not exists
                throw new Error('ENOENT');
            });

            const result = await service.materializeCacheImages(projectPath, [cachePath]);

            expect(fs.mkdir).toHaveBeenCalledWith(path.join('/project', 'assets'), { recursive: true });
            expect(fs.copyFile).toHaveBeenCalledWith(cachePath, destPath);
            expect(deleteClipboardCacheFileIfManaged).toHaveBeenCalledWith(cachePath);
            expect(result).toEqual({ [cachePath]: destPath });
        });

        it('should skip if source file does not exist', async () => {
            const projectPath = '/project/test.iot';
            const cachePath = '/cache/missing.png';

            (fs.access as any).mockRejectedValue(new Error('ENOENT'));

            const result = await service.materializeCacheImages(projectPath, [cachePath]);

            expect(fs.copyFile).not.toHaveBeenCalled();
            expect(deleteClipboardCacheFileIfManaged).not.toHaveBeenCalled();
            expect(result).toEqual({});
            expect(logWarnMock).toHaveBeenCalledWith(
                '[ProjectService] materializeCacheImages source not found',
                cachePath
            );
        });

        it('should ignore invalid cache paths and deduplicate repeated source paths', async () => {
            const projectPath = '/project/test.iot';
            const cachePath = '/cache/temp.png';
            const destPath = path.join('/project', 'assets', 'temp.png');

            (fs.access as any).mockImplementation(async (p: string) => {
                if (p === cachePath) return undefined;
                throw new Error('ENOENT');
            });

            const result = await service.materializeCacheImages(projectPath, [
                '',
                cachePath,
                cachePath,
                null as any,
                undefined as any,
            ]);

            expect(fs.copyFile).toHaveBeenCalledTimes(1);
            expect(fs.copyFile).toHaveBeenCalledWith(cachePath, destPath);
            expect(result).toEqual({ [cachePath]: destPath });
        });
    });
});
