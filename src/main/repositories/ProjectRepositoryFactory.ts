import { IProjectRepository, ProjectRepository } from "./ProjectRepository";
import { MockProjectRepository } from "./MockProjectRepository";
import { RepositoryType } from "./ConfigRepositoryFactory"; // Reuse the enum

export class ProjectRepositoryFactory {
  /**
   * Repositoryのインスタンスを生成して返す
   * @param type Repositoryの種類 (デフォルト: PRODUCTION)
   */
  static create(
    type: RepositoryType = RepositoryType.PRODUCTION
  ): IProjectRepository {
    switch (type) {
      case RepositoryType.MOCK:
        return new MockProjectRepository();
      case RepositoryType.PRODUCTION:
      default:
        return new ProjectRepository();
    }
  }
}
