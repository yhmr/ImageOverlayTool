import { IProjectRepository, ProjectRepository } from "./ProjectRepository";

export class ProjectRepositoryFactory {
    /**
     * Repositoryのインスタンスを生成して返す
     * @param type Repositoryの種類 (デフォルト: PRODUCTION)
     */
    static create(): IProjectRepository {
        return new ProjectRepository();
    }
}
