import { IProjectRepository } from "../repositories/ProjectRepository";
import { ProjectService } from "../services/ProjectService";
import { registerProjectCacheHandlers } from "./project/cacheHandlers";
import { registerProjectLoadHandlers } from "./project/loadHandlers";
import { registerProjectSaveHandlers } from "./project/saveHandlers";
import type {
    ProjectHandlerContext,
    ProjectHandlerOptions,
} from "./project/types";

export type { ProjectHandlerOptions };

export const registerProjectHandlers = (
    repository: IProjectRepository,
    options?: ProjectHandlerOptions
) => {
    const context: ProjectHandlerContext = {
        repository,
        projectService: new ProjectService(),
        testMode: options?.testMode,
    };

    registerProjectSaveHandlers(context);
    registerProjectLoadHandlers(context);
    registerProjectCacheHandlers(context);
};
