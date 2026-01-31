import { ProjectFile } from "@/shared/types/ProjectFile";
import { IProjectRepository } from "@/main/repositories/ProjectRepository";

export class MockProjectRepository implements IProjectRepository {
    private projects: Map<string, ProjectFile> = new Map();

    async saveProject(filePath: string, project: ProjectFile): Promise<void> {
        this.projects.set(filePath, project);
    }

    async loadProject(filePath: string): Promise<ProjectFile> {
        const project = this.projects.get(filePath);
        if (!project) {
            // Return a default empty project if not found in mock
            return {
                version: "1.0.0",
                window: {
                    width: 800,
                    height: 600,
                    x: 0,
                    y: 0,
                    color: "#00000000",
                },
                settings: {
                    unitFactor: 1,
                    unit: "um",
                },
                images: [],
            };
        }
        return project;
    }
}
