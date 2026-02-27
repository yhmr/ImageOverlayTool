import { defineEventContract, type EventContract } from "../contract";
import { IPC_EVENTS } from "../channels";
import type { LaunchIntent } from "../../types/LaunchIntent";

/**
 * アプリケーション全体に関するイベント通信の型定義一覧
 */
export type AppEventContracts = {
    /** OSやExplorerからファイルが開かれた際に発火するイベント */
    fileOpen: EventContract<[payload: { filePath: string; ext: string }]>;
    /** 起動引数から構築されたLaunchIntentを適用するイベント */
    launchIntentApply: EventContract<[payload: LaunchIntent]>;
};

/**
 * アプリケーション全体イベントの契約定義オブジェクト
 */
export const appEventContracts: AppEventContracts = {
    fileOpen: defineEventContract(IPC_EVENTS.fileOpen),
    launchIntentApply: defineEventContract(IPC_EVENTS.launchIntentApply),
};
