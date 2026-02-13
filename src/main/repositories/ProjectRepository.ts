import fs from "fs/promises";
import { ProjectFile } from "../../shared/types/ProjectFile";
import { parseAndMigrateProjectFile } from "./projectSchema";

export interface IProjectRepository {
    saveProject(filePath: string, project: ProjectFile): Promise<void>;
    loadProject(filePath: string): Promise<ProjectFile>;
}

export class ProjectRepository implements IProjectRepository {
    async saveProject(filePath: string, project: ProjectFile): Promise<void> {
        const data = JSON.stringify(project, null, 2);
        await fs.writeFile(filePath, data, "utf-8");
    }

    async loadProject(filePath: string): Promise<ProjectFile> {
        const data = await fs.readFile(filePath, "utf-8");
        const parsed: unknown = JSON.parse(data);
        return parseAndMigrateProjectFile(parsed);
    }
}
