import type { IProjectRepository } from "../../repositories/ProjectRepository";
import type { ProjectService } from "../../services/ProjectService";

/** プロジェクトハンドラー群で共有される依存関係や設定(コンテキスト) */
export interface ProjectHandlerContext {
    /** プロジェクトファイルの読み書きを担うリポジトリ */
    repository: IProjectRepository;
    /** プロジェクト固有のビジネスロジックを扱うサービス */
    projectService: ProjectService;
}
