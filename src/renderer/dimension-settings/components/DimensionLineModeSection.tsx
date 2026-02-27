import { Plus } from "lucide-react";

import { Button } from "@/renderer/components/ui/button";

interface DimensionLineModeSectionProps {
    isDimensionAddMode: boolean;
    isDimensionSelectMode: boolean;
    modeLabel: string;
    onCancelAddMode: () => void;
    onDoneSelectMode: () => void;
    onEnterAddMode: () => void;
    t: (key: string) => string;
}

export function DimensionLineModeSection({
    isDimensionAddMode,
    isDimensionSelectMode,
    modeLabel,
    onCancelAddMode,
    onDoneSelectMode,
    onEnterAddMode,
    t,
}: DimensionLineModeSectionProps) {
    return (
        <div className="grid gap-3 rounded-lg border px-4 py-3">
            <div className="space-y-1">
                <p className="text-sm font-medium">
                    {t("render.dimension_line_settings.operation")}
                </p>
                <p className="text-xs text-muted-foreground">
                    {isDimensionAddMode
                        ? t(
                              "render.dimension_line_settings.helper.add_mode_waiting"
                          )
                        : t("render.dimension_line_settings.helper.add_mode")}
                </p>
            </div>
            <div className="flex items-center justify-between gap-2">
                <p
                    className="text-xs text-muted-foreground"
                    data-testid="dimension-settings.mode.label"
                >
                    {modeLabel}
                </p>
                <div className="flex items-center gap-2">
                    {isDimensionAddMode && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onCancelAddMode}
                            data-testid="dimension-settings.mode.cancel-button"
                        >
                            {t("common.cancel")}
                        </Button>
                    )}
                    {isDimensionSelectMode && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDoneSelectMode}
                            data-testid="dimension-settings.mode.done-button"
                        >
                            {t("render.dimension_line_settings.done")}
                        </Button>
                    )}
                    <Button
                        size="sm"
                        onClick={onEnterAddMode}
                        data-testid="dimension-settings.mode.add-button"
                    >
                        <Plus className="mr-1 h-4 w-4" />
                        {t("render.dimension_line_settings.add_button")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
