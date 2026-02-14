import { useTranslation } from "react-i18next";
import { RotateCw } from "lucide-react";
import { Slider } from "@/renderer/components/ui/slider";
import { Input } from "@/renderer/components/ui/input";

interface RotationControlProps {
    rotation: number;
    onRotationChange: (value: number[]) => void;
    onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function RotationControl(props: RotationControlProps) {
    const { rotation, onRotationChange, onInputChange } = props;
    const { t } = useTranslation();

    return (
        <div className="flex items-center gap-4 mt-2">
            <span className="text-xs w-[72px] shrink-0 whitespace-nowrap text-muted-foreground">
                {t("render.image_settings.rotation")}
            </span>
            <RotateCw className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Slider
                value={[rotation]}
                min={-180}
                max={180}
                onValueChange={onRotationChange}
                className="flex-grow"
                data-testid="settings.image-item.rotation.slider"
            />
            <Input
                type="number"
                value={Math.round(rotation)}
                onChange={onInputChange}
                className="w-[68px] h-7 shrink-0 text-right text-xs"
                data-testid="settings.image-item.rotation.input"
            />
        </div>
    );
}
