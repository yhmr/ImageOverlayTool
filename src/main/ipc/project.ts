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

/**
 * プロジェクトファイルの保存・読み込みや、画像キャッシュの実体化など、
 * プロジェクト管理全般に関わるメインプロセスのIPCハンドラーを登録します。
 *
 * @param repository プロジェクトデータの読み書きを行うリポジトリ
 * @param options E2Eテストモードなどの付加的なオプション
 */
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
