/**
 * ログ出力モジュール
 * electron-logを使用して、メインプロセスとレンダラープロセスのログを統一管理する
 */
import { app } from "electron";
import log from "electron-log/main";

// electron-logを初期化（レンダラープロセスからのIPC通信を有効化）
log.initialize();

// ログレベル設定
// 開発時: debug, 本番時: info
log.transports.file.level = app.isPackaged ? "info" : "debug";
log.transports.console.level = "debug";

// テスト環境ではログ出力を抑制
if (process.env.NODE_ENV === "test") {
    log.transports.file.level = false;
    log.transports.console.level = false;
}

// ファイルローテーション設定（10MB）
log.transports.file.maxSize = 10 * 1024 * 1024;

// ログフォーマット設定
log.transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}";
log.transports.console.format = "[{h}:{i}:{s}.{ms}] [{level}] {text}";

export default log;
