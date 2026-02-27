import { Input } from "@/renderer/components/ui/input";
import { Label } from "@/renderer/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/renderer/components/ui/select";
import {
    UNIT_FACTOR_MAX,
    UNIT_FACTOR_MIN,
} from "@/shared/constants/unitFactor";

interface DimensionLineUnitSectionProps {
    unitFactor: number;
    unit: "nm" | "um" | "mm";
    setUnitFactor: (factor: number) => void;
    setUnit: (unit: "nm" | "um" | "mm") => void;
    t: (key: string) => string;
}

export function DimensionLineUnitSection({
    unitFactor,
    unit,
    setUnitFactor,
    setUnit,
    t,
}: DimensionLineUnitSectionProps) {
    return (
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
                            <SelectItem
                                value="nm"
                                data-testid="dimension-settings.unit.option.nm"
                            >
                                nm
                            </SelectItem>
                            <SelectItem
                                value="um"
                                data-testid="dimension-settings.unit.option.um"
                            >
                                um
                            </SelectItem>
                            <SelectItem
                                value="mm"
                                data-testid="dimension-settings.unit.option.mm"
                            >
                                mm
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <p className="text-xs text-muted-foreground">
                {t("render.dimension_line_settings.helper.unitFactor")}
            </p>
        </div>
    );
}
