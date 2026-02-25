import type { DimensionLine } from "../../../shared/types/DimensionLine";
import type { ImageSet } from "../../../shared/types/ImageSet";
import type { InteractionMode } from "../../../shared/types/InteractionMode";
import { getElectronApi } from "./electronApi";
import type {
    IDimensionLineSyncIPCService,
    IImageSyncIPCService,
    IInteractionModeSyncIPCService,
    IProjectDirtySyncIPCService,
    ISelectedDimensionLineSyncIPCService,
    ISelectedImageSyncIPCService,
    IStateSyncIPCService,
    IUnitSyncIPCService,
    Unit,
} from "./types";

export const createSyncIPCService = (): IImageSyncIPCService &
    IDimensionLineSyncIPCService &
    IUnitSyncIPCService &
    IInteractionModeSyncIPCService &
    IStateSyncIPCService &
    ISelectedImageSyncIPCService &
    ISelectedDimensionLineSyncIPCService &
    IProjectDirtySyncIPCService => ({
    updateImageSets: (imageSets: ImageSet[]) =>
        getElectronApi().updateImageSets(imageSets),
    onImageSetsUpdated: (callback: (imageSets: ImageSet[]) => void) =>
        getElectronApi().onImageSetsUpdated(callback),
    updateDimensionLines: (dimensionLines: DimensionLine[]) =>
        getElectronApi().updateDimensionLines(dimensionLines),
    onDimensionLinesUpdated: (
        callback: (dimensionLines: DimensionLine[]) => void
    ) => getElectronApi().onDimensionLinesUpdated(callback),
    updateUnitFactor: (factor: number) =>
        getElectronApi().updateUnitFactor(factor),
    onUnitFactorUpdated: (callback: (factor: number) => void) =>
        getElectronApi().onUnitFactorUpdated(callback),
    updateUnit: (unit: Unit) => getElectronApi().updateUnit(unit),
    onUnitUpdated: (callback: (unit: Unit) => void) =>
        getElectronApi().onUnitUpdated(callback),
    updateInteractionMode: (mode: InteractionMode) =>
        getElectronApi().updateInteractionMode(mode),
    onInteractionModeUpdated: (callback: (mode: InteractionMode) => void) =>
        getElectronApi().onInteractionModeUpdated(callback),
    requestInitialState: () => getElectronApi().requestInitialState(),
    onRequestStateSync: (callback: () => void) =>
        getElectronApi().onRequestStateSync(callback),
    onAlwaysOnTopShortcutTriggered: (callback: () => void) =>
        getElectronApi().onAlwaysOnTopShortcutTriggered(callback),
    onClickThroughShortcutTriggered: (callback: () => void) =>
        getElectronApi().onClickThroughShortcutTriggered(callback),
    onFileOpen: (callback: (filePath: string, ext: string) => void) =>
        getElectronApi().onFileOpen(callback),
    updateSelectedImageId: (id: string | null) =>
        getElectronApi().updateSelectedImageId(id),
    onSelectedImageIdUpdated: (callback: (id: string | null) => void) =>
        getElectronApi().onSelectedImageIdUpdated(callback),
    updateSelectedDimensionLineId: (id: string | null) =>
        getElectronApi().updateSelectedDimensionLineId(id),
    onSelectedDimensionLineIdUpdated: (callback: (id: string | null) => void) =>
        getElectronApi().onSelectedDimensionLineIdUpdated(callback),
    updateProjectDirty: (isDirty: boolean) =>
        getElectronApi().updateProjectDirty(isDirty),
});
