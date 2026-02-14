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
        <div className="flex items-center gap-3 mt-2">
            <span className="text-xs min-w-[50px] text-muted-foreground">
                {t("render.image_settings.scale")}
            </span>
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
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
                className="text-xs min-w-[45px] text-right"
                data-testid="settings.image-item.scale.value"
            >
                {Math.round(scale * 100)}%
            </span>
        </div>
    );
}
