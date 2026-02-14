import React from "react";
import { useTranslation } from "react-i18next";
import { Settings2 } from "lucide-react";

import { Button } from "@/renderer/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/renderer/components/ui/popover";
import { Switch } from "@/renderer/components/ui/switch";
import { Label } from "@/renderer/components/ui/label";
import { Slider } from "@/renderer/components/ui/slider";
import { ImageSet } from "../../../shared/types/ImageSet";

interface FilterControlProps {
    filters: ImageSet["filters"];
    onFilterChange: (filters: ImageSet["filters"]) => void;
}

export function FilterControl({ filters, onFilterChange }: FilterControlProps) {
    const { t } = useTranslation();

    // デフォルト値の安全な取得
    const binarization = filters?.binarization ?? {
        enabled: false,
        threshold: 128,
    };
    const hsv = filters?.hsv ?? { enabled: false, h: 0, s: 0, v: 0 };

    const handleBinarizationChange = (
        updates: Partial<typeof binarization>
    ) => {
        onFilterChange({
            ...filters,
            binarization: { ...binarization, ...updates },
        });
    };

    const handleHSVChange = (updates: Partial<typeof hsv>) => {
        onFilterChange({
            ...filters,
            hsv: { ...hsv, ...updates },
        });
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    data-testid="settings.filters.trigger"
                >
                    <Settings2 className="mr-2 h-4 w-4" />
                    {t("render.image_settings.filters")}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">
                            {t("render.image_settings.filters")}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            {/* 必要なら説明文 */}
                        </p>
                    </div>

                    {/* 2値化 */}
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="binarization-switch">
                                {t("render.image_settings.binarization")}
                            </Label>
                            <Switch
                                id="binarization-switch"
                                checked={binarization.enabled}
                                data-testid="settings.filters.binarization.switch"
                                onCheckedChange={(checked) =>
                                    handleBinarizationChange({
                                        enabled: checked,
                                    })
                                }
                            />
                        </div>
                        {binarization.enabled && (
                            <div className="ml-2 border-l pl-4 grid gap-2">
                                <Label className="text-xs">
                                    {t("render.image_settings.threshold")}:{" "}
                                    {binarization.threshold}
                                </Label>
                                <Slider
                                    min={0}
                                    max={255}
                                    step={1}
                                    value={[binarization.threshold]}
                                    data-testid="settings.filters.binarization.threshold"
                                    onValueChange={(val) =>
                                        handleBinarizationChange({
                                            threshold: val[0],
                                        })
                                    }
                                />
                            </div>
                        )}
                    </div>

                    {/* HSV */}
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="hsv-switch">
                                {t("render.image_settings.hsv")}
                            </Label>
                            <Switch
                                id="hsv-switch"
                                checked={hsv.enabled}
                                data-testid="settings.filters.hsv.switch"
                                onCheckedChange={(checked) =>
                                    handleHSVChange({ enabled: checked })
                                }
                            />
                        </div>
                        {hsv.enabled && (
                            <div className="ml-2 border-l pl-4 grid gap-3">
                                <div className="grid gap-1">
                                    <Label className="text-xs">
                                        {t("render.image_settings.hue")}:{" "}
                                        {hsv.h}
                                    </Label>
                                    <Slider
                                        min={-180}
                                        max={180}
                                        step={1}
                                        value={[hsv.h]}
                                        data-testid="settings.filters.hsv.h"
                                        onValueChange={(val) =>
                                            handleHSVChange({ h: val[0] })
                                        }
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label className="text-xs">
                                        {t("render.image_settings.saturation")}:{" "}
                                        {hsv.s}
                                    </Label>
                                    <Slider
                                        min={-100}
                                        max={100}
                                        step={1}
                                        value={[hsv.s]}
                                        data-testid="settings.filters.hsv.s"
                                        onValueChange={(val) =>
                                            handleHSVChange({ s: val[0] })
                                        }
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label className="text-xs">
                                        {t("render.image_settings.value")}:{" "}
                                        {hsv.v}
                                    </Label>
                                    <Slider
                                        min={-100}
                                        max={100}
                                        step={1}
                                        value={[hsv.v]}
                                        data-testid="settings.filters.hsv.v"
                                        onValueChange={(val) =>
                                            handleHSVChange({ v: val[0] })
                                        }
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
