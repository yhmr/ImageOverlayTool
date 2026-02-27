import { Trash2 } from "lucide-react";

import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";
import { Label } from "@/renderer/components/ui/label";
import { Switch } from "@/renderer/components/ui/switch";
import { cn } from "@/renderer/utils/cn";
import { sanitizeDimensionLineColor } from "@/shared/constants/dimensionLine";
import type { DimensionLine } from "@/shared/types/DimensionLine";

interface DimensionLineListSectionProps {
    dimensionLines: DimensionLine[];
    selectedDimensionLineId: string | null;
    unitFactor: number;
    unit: "nm" | "um" | "mm";
    onSelectLine: (id: string) => void;
    onUpdateLine: (line: DimensionLine) => void;
    onDeleteLine: (id: string) => void;
    t: (key: string, options?: Record<string, unknown>) => string;
}

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

export function DimensionLineListSection({
    dimensionLines,
    selectedDimensionLineId,
    unitFactor,
    unit,
    onSelectLine,
    onUpdateLine,
    onDeleteLine,
    t,
}: DimensionLineListSectionProps) {
    return (
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
                    const colorValue = sanitizeDimensionLineColor(line.color);
                    const isSelected = selectedDimensionLineId === line.id;
                    const length = formatLineLength(line, unitFactor, unit);

                    return (
                        <div
                            key={line.id}
                            className={cn(
                                "mb-2 flex items-center gap-3 rounded-md border px-3 py-2 last:mb-0",
                                isSelected && "border-primary"
                            )}
                            onClick={() => onSelectLine(line.id)}
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
                                    onUpdateLine({
                                        ...line,
                                        color: e.currentTarget.value,
                                    })
                                }
                                className="h-9 w-12 p-1"
                                data-testid={`dimension-settings.line.${index}.color`}
                            />

                            <div
                                className="flex items-center gap-2"
                                onClick={(e) => e.stopPropagation()}
                                data-testid={`dimension-settings.line.${index}.show-unit`}
                            >
                                <Label className="text-xs whitespace-nowrap">
                                    {t(
                                        "render.dimension_line_settings.list.show_unit_label"
                                    )}
                                </Label>
                                <Switch
                                    checked={line.showUnitLabel !== false}
                                    onCheckedChange={(checked) =>
                                        onUpdateLine({
                                            ...line,
                                            showUnitLabel: checked,
                                        })
                                    }
                                    data-testid={`dimension-settings.line.${index}.show-unit-switch`}
                                />
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteLine(line.id);
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
    );
}
