// src/main/protocol.ts
import { protocol, net } from 'electron';
import { pathToFileURL } from 'url';

/**
 * カスタムプロトコルの登録
 */
export function registerLocalResourceProtocol() {
  // 1. 特権スキームの登録（app.whenReadyの前に呼ぶ必要があるため別関数にする）
  protocol.registerSchemesAsPrivileged([
    { 
      scheme: 'local-file', 
      privileges: { 
        standard: true, 
        secure: true, 
        supportFetchAPI: true, 
        bypassCSP: true 
      } 
    }
  ]);
}

/**
 * プロトコルのハンドリング設定
 */
export function setupProtocolHandler() {
  protocol.handle("local-file", (request) => {
    // 1. プロトコル名を除去
    const urlPath = request.url.replace("local-file://", "");
    let decodedPath = decodeURIComponent(urlPath);

    // 2. OSごとのパス修復（Windows/Linux両対応）
    if (process.platform === 'win32') {
      // Windows: c/Users -> C:/Users 
      if (decodedPath.match(/^[a-zA-Z]\//)) {
        decodedPath = decodedPath.charAt(0).toUpperCase() + ":" + decodedPath.substring(1);
      }
    } else {
      // Linux/macOS: 先頭がスラッシュでなければ補完
      if (!decodedPath.startsWith('/')) {
        decodedPath = '/' + decodedPath;
      }
    }

    try {
      const finalFileUrl = pathToFileURL(decodedPath).toString();
      return net.fetch(finalFileUrl);
    } catch (e) {
      console.error("Protocol error:", e);
      return new Response("Not Found", { status: 404 });
    }
  });
}