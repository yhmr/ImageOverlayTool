import fs from "fs/promises";
import path from "path";
import log from "../logger";
import { deleteClipboardCacheFileIfManaged } from "./clipboardCacheService";

export class ProjectService {
    private async fileExists(targetPath: string): Promise<boolean> {
        try {
            await fs.access(targetPath);
            return true;
        } catch {
            return false;
        }
    }

    public async resolveAvailablePath(
        directoryPath: string,
        sourcePath: string
    ): Promise<string> {
        const ext = path.extname(sourcePath) || ".png";
        const baseName = path.basename(sourcePath, ext) || "image";
        let candidateName = `${baseName}${ext}`;
        let candidatePath = path.join(directoryPath, candidateName);
        let suffix = 1;

        while (await this.fileExists(candidatePath)) {
            candidateName = `${baseName}-${suffix}${ext}`;
            candidatePath = path.join(directoryPath, candidateName);
            suffix += 1;
        }

        return candidatePath;
    }

    public async materializeCacheImages(
        projectFilePath: string,
        cacheImagePaths: string[]
    ): Promise<Record<string, string>> {
        const projectDirectory = path.dirname(projectFilePath);
        const assetsDirectory = path.join(projectDirectory, "assets");
        await fs.mkdir(assetsDirectory, { recursive: true });

        const replacements: Record<string, string> = {};
        for (const sourcePath of new Set(cacheImagePaths)) {
            if (!sourcePath || typeof sourcePath !== "string") {
                continue;
            }

            if (!(await this.fileExists(sourcePath))) {
                log.warn(
                    "[ProjectService] materializeCacheImages source not found",
                    sourcePath
                );
                continue;
            }

            const destinationPath = await this.resolveAvailablePath(
                assetsDirectory,
                sourcePath
            );
            await fs.copyFile(sourcePath, destinationPath);
            replacements[sourcePath] = destinationPath;
        }

        return replacements;
    }

    public async deleteManagedClipboardCacheFiles(
        cacheImagePaths: string[]
    ): Promise<void> {
        for (const sourcePath of new Set(cacheImagePaths)) {
            if (!sourcePath || typeof sourcePath !== "string") {
                continue;
            }
            await deleteClipboardCacheFileIfManaged(sourcePath);
        }
    }
}
