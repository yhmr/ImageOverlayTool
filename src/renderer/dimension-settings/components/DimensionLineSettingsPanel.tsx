import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";
import { Label } from "@/renderer/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/renderer/components/ui/select";
import { Switch } from "@/renderer/components/ui/switch";
import { cn } from "@/renderer/lib/utils";
import { useIpcService } from "@/renderer/providers/IpcServiceProvider";
import { useAppStore } from "@/renderer/store/useAppStore";
import { sanitizeDimensionLineColor } from "@/shared/constants/dimensionLine";
import {
    UNIT_FACTOR_MAX,
    UNIT_FACTOR_MIN,
} from "@/shared/constants/unitFactor";
import type { DimensionLine } from "@/shared/types/DimensionLine";

const formatLineLength = (
    line: DimensionLine,
    unitFactor: number,
    unit: "nm" | "um" | "mm"
): string => {
    const dx = line.end.x - line.start.x;
    const dy = line.end.y - line.start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const realDistance = distance * unitFactor;
    return `${realDistance.toFixed(2)} ${unit}`;
};

export function DimensionLineSettingsPanel() {
    const { t } = useTranslation();
    const ipcService = useIpcService();
    const {
        interactionMode,
        setInteractionMode,
        unitFactor,
        setUnitFactor,
        unit,
        setUnit,
        dimensionLines,
        updateDimensionLine,
        removeDimensionLine,
        selectedDimensionLineId,
        setSelectedDimensionLineId,
    } = useAppStore();

    const isDimensionMode = interactionMode === "dimension";

    return (
        <div className="grid gap-4 p-4" data-testid="dimension-settings.panel">
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div className="space-y-1">
                    <p className="text-sm font-medium">
                        {t("render.dimension_line_settings.draw_mode")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {t("render.dimension_line_settings.helper.draw_mode")}
                    </p>
                </div>
                <Switch
                    checked={isDimensionMode}
                    onCheckedChange={(checked) => {
                        const mode = checked ? "dimension" : "default";
                        setInteractionMode(mode);
                        void ipcService.updateInteractionMode(mode);
                    }}
                    data-testid="dimension-settings.mode.switch"
                />
            </div>

            <div className="grid gap-2 rounded-lg border p-4">
                <div className="flex items-center gap-4">
                    <div className="grid gap-1.5">
                        <Label htmlFor="dimension-unit-factor">
                            {t("render.dimension_line_settings.unitFactor")}
                        </Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                id="dimension-unit-factor"
                                value={unitFactor}
                                min={UNIT_FACTOR_MIN}
                                max={UNIT_FACTOR_MAX}
                                step="any"
                                onChange={(e) => {
                                    const value = e.currentTarget.valueAsNumber;
                                    if (Number.isNaN(value)) {
                                        return;
                                    }
                                    setUnitFactor(value);
                                }}
                                onWheel={(e) => {
                                    e.currentTarget.blur();
                                }}
                                className="w-[120px]"
                                data-testid="dimension-settings.unit.factor-input"
                            />
                            <span className="text-sm text-muted-foreground">
                                {unit}/pix
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="dimension-unit-select">
                            {t("render.dimension_line_settings.unit")}
                        </Label>
                        <Select
                            value={unit}
                            onValueChange={(value: "nm" | "um" | "mm") =>
                                setUnit(value)
                            }
                        >
                            <SelectTrigger
                                id="dimension-unit-select"
                                className="w-[100px]"
                                data-testid="dimension-settings.unit.select"
                            >
                                <SelectValue
                                    placeholder={t(
                                        "render.dimension_line_settings.unit"
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="nm">nm</SelectItem>
                                <SelectItem value="um">um</SelectItem>
                                <SelectItem value="mm">mm</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    {t("render.dimension_line_settings.helper.unitFactor")}
                </p>
            </div>

            <div className="grid gap-2">
                <p className="text-sm font-medium">
                    {t("render.dimension_line_settings.list.title")}
                </p>
                <div
                    className="max-h-72 overflow-y-auto rounded-lg border p-2"
                    data-testid="dimension-settings.list"
                >
                    {dimensionLines.length === 0 && (
                        <p className="p-2 text-sm text-muted-foreground">
                            {t("render.dimension_line_settings.list.empty")}
                        </p>
                    )}

                    {dimensionLines.map((line, index) => {
                        const colorValue = sanitizeDimensionLineColor(
                            line.color
                        );
                        const isSelected = selectedDimensionLineId === line.id;
                        const length = formatLineLength(line, unitFactor, unit);

                        return (
                            <div
                                key={line.id}
                                className={cn(
                                    "mb-2 flex items-center gap-3 rounded-md border px-3 py-2 last:mb-0",
                                    isSelected && "border-primary"
                                )}
                                onClick={() =>
                                    setSelectedDimensionLineId(line.id)
                                }
                                data-testid={`dimension-settings.line.${index}`}
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium">
                                        {t(
                                            "render.dimension_line_settings.list.line_name",
                                            { index: index + 1 }
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {length}
                                    </p>
                                </div>

                                <Input
                                    type="color"
                                    value={colorValue}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) =>
                                        updateDimensionLine({
                                            ...line,
                                            color: e.currentTarget.value,
                                        })
                                    }
                                    className="h-9 w-12 p-1"
                                    data-testid={`dimension-settings.line.${index}.color`}
                                />

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeDimensionLine(line.id);
                                        if (
                                            selectedDimensionLineId === line.id
                                        ) {
                                            setSelectedDimensionLineId(null);
                                        }
                                    }}
                                    data-testid={`dimension-settings.line.${index}.delete`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
