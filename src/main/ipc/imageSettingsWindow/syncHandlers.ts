import { ipcMain } from "electron";
import { DimensionLine } from "../../../shared/types/DimensionLine";
import { ImageSet } from "../../../shared/types/ImageSet";
import type { InteractionMode } from "../../../shared/types/InteractionMode";
import type { Unit } from "../../../shared/ipc/contracts/sync";
import {
    syncEventContracts,
    syncIpcContracts,
} from "../../../shared/ipc/contracts";
import log from "../../logger";
import { broadcastToOtherWindows } from "../../windows/broadcast";
import type { ImageSettingsWindowHandlerDependencies } from "./types";

/**
 * ドラッグによる画像や寸法線の変更、単位変更など、
 * 異なるウィンドウ(メイン / 設定ウィンドウ等)間で状態を同期するためのIPCハンドラーを登録します。
 *
 * あるウィンドウからの更新要求を受け取り、送信元以外のすべてのウィンドウへ状態をブロードキャストします。
 *
 * @param windowManager ウィンドウコレクションやプロジェクトのDirty状態を管理するオブジェクト
 */
export const registerSyncHandlers = (
    windowManager: ImageSettingsWindowHandlerDependencies
): void => {
    ipcMain.handle(
        syncIpcContracts.updateImageSets.channel,
        (event, imageSets: ImageSet[]) => {
            log.debug(
                `[IPC] imageSets:update called with ${imageSets.length} images`
            );
            broadcastToOtherWindows(
                windowManager,
                event.sender.id,
                syncEventContracts.imageSetsUpdated.event,
                imageSets
            );
        }
    );

    ipcMain.handle(
        syncIpcContracts.updateDimensionLines.channel,
        (event, dimensionLines: DimensionLine[]) => {
            log.debug(
                `[IPC] dimensionLines:update called with ${dimensionLines.length} lines`
            );
            broadcastToOtherWindows(
                windowManager,
                event.sender.id,
                syncEventContracts.dimensionLinesUpdated.event,
                dimensionLines
            );
        }
    );

    ipcMain.handle(
        syncIpcContracts.updateUnitFactor.channel,
        (event, unitFactor: number) => {
            log.debug(
                `[IPC] unitFactor:update called with value: ${unitFactor}`
            );
            broadcastToOtherWindows(
                windowManager,
                event.sender.id,
                syncEventContracts.unitFactorUpdated.event,
                unitFactor
            );
        }
    );

    ipcMain.handle(syncIpcContracts.updateUnit.channel, (event, unit: Unit) => {
        log.debug(`[IPC] unit:update called with value: ${unit}`);
        broadcastToOtherWindows(
            windowManager,
            event.sender.id,
            syncEventContracts.unitUpdated.event,
            unit
        );
    });

    ipcMain.handle(
        syncIpcContracts.updateInteractionMode.channel,
        (event, mode: InteractionMode) => {
            log.debug(
                `[IPC] interactionMode:update called with value: ${mode}`
            );
            broadcastToOtherWindows(
                windowManager,
                event.sender.id,
                syncEventContracts.interactionModeUpdated.event,
                mode
            );
        }
    );

    ipcMain.handle(
        syncIpcContracts.updateSelectedImageId.channel,
        (event, id: string | null) => {
            log.debug(`[IPC] selectedImageId:update called with value: ${id}`);
            broadcastToOtherWindows(
                windowManager,
                event.sender.id,
                syncEventContracts.selectedImageIdUpdated.event,
                id
            );
        }
    );

    ipcMain.handle(
        syncIpcContracts.updateSelectedDimensionLineId.channel,
        (event, id: string | null) => {
            log.debug(
                `[IPC] selectedDimensionLineId:update called with value: ${id}`
            );
            broadcastToOtherWindows(
                windowManager,
                event.sender.id,
                syncEventContracts.selectedDimensionLineIdUpdated.event,
                id
            );
        }
    );

    ipcMain.handle(
        syncIpcContracts.updateProjectDirty.channel,
        (_event, isDirty) => {
            windowManager.setProjectDirty(Boolean(isDirty));
        }
    );

    ipcMain.handle(syncIpcContracts.requestInitialState.channel, (event) => {
        log.debug("[IPC] state:requestInitial called");
        broadcastToOtherWindows(
            windowManager,
            event.sender.id,
            syncEventContracts.requestStateSync.event
        );
    });
};
