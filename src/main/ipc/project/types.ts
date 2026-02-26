import type { IProjectRepository } from "../../repositories/ProjectRepository";
import type { ProjectService } from "../../services/ProjectService";

export interface ProjectHandlerOptions {
    testMode?: {
        enabled: boolean;
        projectFilePath: string;
    };
}

export interface ProjectHandlerContext {
    repository: IProjectRepository;
    projectService: ProjectService;
    testMode?: ProjectHandlerOptions["testMode"];
}
