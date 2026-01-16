/**
 * レンダラープロセス用ロガーサービス
 * preload経由でメインプロセスにログを送信する
 */

/**
 * ロガーインターフェース
 */
export const logger = {
    debug: (message: string, ...params: unknown[]): void => {
        window.electronAPI.log.debug(message, ...params);
    },

    info: (message: string, ...params: unknown[]): void => {
        window.electronAPI.log.info(message, ...params);
    },

    warn: (message: string, ...params: unknown[]): void => {
        window.electronAPI.log.warn(message, ...params);
    },

    error: (message: string, ...params: unknown[]): void => {
        window.electronAPI.log.error(message, ...params);
    },
};

export default logger;
