import { useTranslation } from "react-i18next";

import { useAppStore } from "@/renderer/store/useAppStore";
import {
    selectDimensionLines,
    selectInteractionMode,
    selectRemoveDimensionLine,
    selectSelectedDimensionLineId,
    selectSetInteractionMode,
    selectSetSelectedDimensionLineId,
    selectSetUnit,
    selectSetUnitFactor,
    selectUnit,
    selectUnitFactor,
    selectUpdateDimensionLine,
} from "@/renderer/store/selectors";
import type { InteractionMode } from "@/shared/types/InteractionMode";
import { DimensionLineListSection } from "./DimensionLineListSection";
import { DimensionLineModeSection } from "./DimensionLineModeSection";
import { DimensionLineUnitSection } from "./DimensionLineUnitSection";

export function DimensionLineSettingsPanel() {
    const { t } = useTranslation();
    const interactionMode = useAppStore(selectInteractionMode);
    const setInteractionMode = useAppStore(selectSetInteractionMode);
    const unitFactor = useAppStore(selectUnitFactor);
    const setUnitFactor = useAppStore(selectSetUnitFactor);
    const unit = useAppStore(selectUnit);
    const setUnit = useAppStore(selectSetUnit);
    const dimensionLines = useAppStore(selectDimensionLines);
    const updateDimensionLine = useAppStore(selectUpdateDimensionLine);
    const removeDimensionLine = useAppStore(selectRemoveDimensionLine);
    const selectedDimensionLineId = useAppStore(selectSelectedDimensionLineId);
    const setSelectedDimensionLineId = useAppStore(
        selectSetSelectedDimensionLineId
    );

    const isDimensionAddMode = interactionMode === "dimension_add";
    const isDimensionSelectMode = interactionMode === "dimension_select";

    const updateInteractionMode = (mode: InteractionMode) => {
        setInteractionMode(mode);
    };

    const modeLabel = isDimensionAddMode
        ? t("render.dimension_line_settings.mode.add")
        : isDimensionSelectMode
        ? t("render.dimension_line_settings.mode.select")
        : t("render.dimension_line_settings.mode.default");

    const exitDimensionMode = () => {
        setSelectedDimensionLineId(null);
        updateInteractionMode("default");
    };

    const enterDimensionAddMode = () => {
        setSelectedDimensionLineId(null);
        updateInteractionMode("dimension_add");
    };

    const selectDimensionLine = (id: string) => {
        updateInteractionMode("dimension_select");
        setSelectedDimensionLineId(id);
    };

    const deleteDimensionLine = (id: string) => {
        removeDimensionLine(id);
        if (selectedDimensionLineId === id) {
            setSelectedDimensionLineId(null);
            if (isDimensionSelectMode) {
                updateInteractionMode("default");
            }
        }
    };

    return (
        <div className="grid gap-4 p-4" data-testid="dimension-settings.panel">
            <DimensionLineModeSection
                isDimensionAddMode={isDimensionAddMode}
                isDimensionSelectMode={isDimensionSelectMode}
                modeLabel={modeLabel}
                onCancelAddMode={exitDimensionMode}
                onDoneSelectMode={exitDimensionMode}
                onEnterAddMode={enterDimensionAddMode}
                t={t}
            />

            <DimensionLineUnitSection
                unitFactor={unitFactor}
                unit={unit}
                setUnitFactor={setUnitFactor}
                setUnit={setUnit}
                t={t}
            />

            <DimensionLineListSection
                dimensionLines={dimensionLines}
                selectedDimensionLineId={selectedDimensionLineId}
                unitFactor={unitFactor}
                unit={unit}
                onSelectLine={selectDimensionLine}
                onUpdateLine={updateDimensionLine}
                onDeleteLine={deleteDimensionLine}
                t={t}
            />
        </div>
    );
}
