/**
 * local-file:// URL のパース・生成ユーティリティ
 *
 * メインプロセスとレンダラーの両方で使用される。
 */

const LOCAL_FILE_PREFIX = "local-file://";

/**
 * ファイルパスを local-file:// URL に変換する。
 * バックスラッシュをスラッシュに置換する。
 */
export const toLocalFileUrl = (filePath: string): string =>
    `${LOCAL_FILE_PREFIX}${filePath.replace(/\\/g, "/")}`;

/**
 * local-file:// URL をファイルパスに変換する。
 * URL 解析に失敗した場合は null を返す。
 *
 * Windows のドライブレター表記（`local-file:///C:/...` / `local-file://C/...`）を正しく処理する。
 */
export const fromLocalFileUrl = (value: string): string | null => {
    if (!value || typeof value !== "string") {
        return null;
    }
    if (!value.startsWith(LOCAL_FILE_PREFIX)) {
        return null;
    }

    try {
        const url = new URL(value);
        let resolvedPath = decodeURIComponent(`${url.host}${url.pathname}`);
        // /C:/path → C:/path
        if (/^\/[a-zA-Z]:\//.test(resolvedPath)) {
            resolvedPath = resolvedPath.slice(1);
            // C/path → C:/path
        } else if (/^[a-zA-Z]\//.test(resolvedPath)) {
            resolvedPath = resolvedPath.charAt(0) + ":" + resolvedPath.slice(1);
        }
        return resolvedPath;
    } catch {
        return null;
    }
};
