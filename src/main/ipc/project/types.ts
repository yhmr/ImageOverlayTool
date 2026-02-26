import type { IProjectRepository } from "../../repositories/ProjectRepository";
import type { ProjectService } from "../../services/ProjectService";

/** プロジェクトハンドラー群の拡張・初期化オプション */
export interface ProjectHandlerOptions {
    /** E2Eテスト用のモード設定情報 */
    testMode?: {
        enabled: boolean;
        projectFilePath: string;
    };
}

/** プロジェクトハンドラー群で共有される依存関係や設定(コンテキスト) */
export interface ProjectHandlerContext {
    /** プロジェクトファイルの読み書きを担うリポジトリ */
    repository: IProjectRepository;
    /** プロジェクト固有のビジネスロジックを扱うサービス */
    projectService: ProjectService;
    /** E2Eテスト用のモード設定情報 */
    testMode?: ProjectHandlerOptions["testMode"];
}
