import { defineEventContract, type EventContract } from "../contract";
import { IPC_EVENTS } from "../channels";

/**
 * アプリケーション全体に関するイベント通信の型定義一覧
 */
export type AppEventContracts = {
    /** OSやExplorerからファイルが開かれた際に発火するイベント */
    fileOpen: EventContract<[payload: { filePath: string; ext: string }]>;
};

/**
 * アプリケーション全体イベントの契約定義オブジェクト
 */
export const appEventContracts: AppEventContracts = {
    fileOpen: defineEventContract(IPC_EVENTS.fileOpen),
};
