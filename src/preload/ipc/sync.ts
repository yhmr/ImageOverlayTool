import { IPC_CHANNELS, IPC_EVENTS } from "../../shared/ipc/channels";
import type { DimensionLine } from "../../shared/types/DimensionLine";
import type { ImageSet } from "../../shared/types/ImageSet";
import type { InteractionMode } from "../../shared/types/InteractionMode";
import { invokeIpc, onIpcEvent } from "./client";

type Unit = "nm" | "um" | "mm";

export const createSyncApi = () => ({
    updateImageSets: (imageSets: ImageSet[]) =>
        invokeIpc(IPC_CHANNELS.sync.updateImageSets, imageSets),
    onImageSetsUpdated: (callback: (imageSets: ImageSet[]) => void) =>
        onIpcEvent(IPC_EVENTS.imageSetsUpdated, callback),
    updateDimensionLines: (dimensionLines: DimensionLine[]) =>
        invokeIpc(IPC_CHANNELS.sync.updateDimensionLines, dimensionLines),
    onDimensionLinesUpdated: (
        callback: (dimensionLines: DimensionLine[]) => void
    ) => onIpcEvent(IPC_EVENTS.dimensionLinesUpdated, callback),
    updateUnit: (unit: Unit) => invokeIpc(IPC_CHANNELS.sync.updateUnit, unit),
    onUnitUpdated: (callback: (unit: Unit) => void) =>
        onIpcEvent(IPC_EVENTS.unitUpdated, callback),
    updateInteractionMode: (mode: InteractionMode) =>
        invokeIpc(IPC_CHANNELS.sync.updateInteractionMode, mode),
    onInteractionModeUpdated: (callback: (mode: InteractionMode) => void) =>
        onIpcEvent(IPC_EVENTS.interactionModeUpdated, callback),
    updateUnitFactor: (unitFactor: number) =>
        invokeIpc(IPC_CHANNELS.sync.updateUnitFactor, unitFactor),
    onUnitFactorUpdated: (callback: (unitFactor: number) => void) =>
        onIpcEvent(IPC_EVENTS.unitFactorUpdated, callback),
    updateSelectedImageId: (id: string | null) =>
        invokeIpc(IPC_CHANNELS.sync.updateSelectedImageId, id),
    onSelectedImageIdUpdated: (callback: (id: string | null) => void) =>
        onIpcEvent(IPC_EVENTS.selectedImageIdUpdated, callback),
    updateSelectedDimensionLineId: (id: string | null) =>
        invokeIpc(IPC_CHANNELS.sync.updateSelectedDimensionLineId, id),
    onSelectedDimensionLineIdUpdated: (callback: (id: string | null) => void) =>
        onIpcEvent(IPC_EVENTS.selectedDimensionLineIdUpdated, callback),
    updateProjectDirty: (isDirty: boolean) =>
        invokeIpc(IPC_CHANNELS.sync.updateProjectDirty, isDirty),
    requestInitialState: () => invokeIpc(IPC_CHANNELS.sync.requestInitialState),
    onRequestStateSync: (callback: () => void) =>
        onIpcEvent(IPC_EVENTS.requestStateSync, callback),
});
