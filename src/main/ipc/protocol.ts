// src/main/protocol.ts
import fs from "fs/promises";
import path from "path";
import { protocol, net } from "electron";
import { pathToFileURL } from "url";
import log from "../logger";

const ALLOWED_LOCAL_FILE_EXTENSIONS = new Set([
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
    ".svg",
    ".bmp",
    ".avif",
    ".tif",
    ".tiff",
]);

const resolveLocalFilePathFromUrl = (requestUrl: string): string | null => {
    try {
        const url = new URL(requestUrl);

        if (url.protocol !== "local-file:") {
            return null;
        }

        if (process.platform !== "win32") {
            // POSIXでは host を許可しない（local-file:///abs/path のみ許可）
            if (url.host.length > 0) {
                return null;
            }

            const resolvedPath = decodeURIComponent(url.pathname);
            const normalizedPath = path.normalize(resolvedPath);
            return path.isAbsolute(normalizedPath) ? normalizedPath : null;
        }

        let resolvedPath = decodeURIComponent(`${url.host}${url.pathname}`);

        // URL pathname starts with "/" on Windows absolute paths
        if (/^\/[a-zA-Z]:\//.test(resolvedPath)) {
            resolvedPath = resolvedPath.slice(1);
        } else if (/^[a-zA-Z]\//.test(resolvedPath)) {
            resolvedPath =
                resolvedPath.charAt(0).toUpperCase() +
                ":" +
                resolvedPath.slice(1);
        }

        const normalizedPath = path.normalize(resolvedPath);
        if (!path.isAbsolute(normalizedPath)) {
            return null;
        }

        return normalizedPath;
    } catch {
        return null;
    }
};

/**
 * カスタムプロトコルの登録
 */
export function registerLocalResourceProtocol() {
    // 1. 特権スキームの登録（app.whenReadyの前に呼ぶ必要があるため別関数にする）
    protocol.registerSchemesAsPrivileged([
        {
            scheme: "local-file",
            privileges: {
                standard: true,
                secure: true,
                supportFetchAPI: false,
                bypassCSP: false,
            },
        },
    ]);
}

/**
 * プロトコルのハンドリング設定
 */
export function setupProtocolHandler() {
    protocol.handle("local-file", async (request) => {
        if (request.method !== "GET") {
            return new Response("Method Not Allowed", { status: 405 });
        }

        const localPath = resolveLocalFilePathFromUrl(request.url);
        if (!localPath) {
            return new Response("Bad Request", { status: 400 });
        }

        const extension = path.extname(localPath).toLowerCase();
        if (!ALLOWED_LOCAL_FILE_EXTENSIONS.has(extension)) {
            return new Response("Forbidden", { status: 403 });
        }

        try {
            const stat = await fs.stat(localPath);
            if (!stat.isFile()) {
                return new Response("Not Found", { status: 404 });
            }

            const finalFileUrl = pathToFileURL(localPath).toString();
            return net.fetch(finalFileUrl);
        } catch (e) {
            log.error("Protocol error:", e);
            return new Response("Not Found", { status: 404 });
        }
    });
}
