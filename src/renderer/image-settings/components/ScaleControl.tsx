import { useTranslation } from "react-i18next";
import { ZoomIn } from "lucide-react";

import { Slider } from "@/renderer/components/ui/slider";

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const SCALE_STEP = 0.01;

interface ScaleControlProps {
    scale: number;
    onChange: (value: number[]) => void;
}

export function ScaleControl(props: ScaleControlProps) {
    const { scale, onChange } = props;
    const { t } = useTranslation();

    return (
        <div className="flex items-center gap-4 mt-2">
            <span className="text-xs w-[72px] shrink-0 whitespace-nowrap text-muted-foreground">
                {t("render.image_settings.scale")}
            </span>
            <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Slider
                value={[scale]}
                min={MIN_SCALE}
                max={MAX_SCALE}
                step={SCALE_STEP}
                onValueChange={onChange}
                className="flex-grow"
                data-testid="settings.image-item.scale.slider"
            />
            <span
                className="text-xs w-[52px] shrink-0 text-right tabular-nums"
                data-testid="settings.image-item.scale.value"
            >
                {Math.round(scale * 100)}%
            </span>
        </div>
    );
}
