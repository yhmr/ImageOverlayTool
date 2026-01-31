import { useTranslation } from "react-i18next";
import { Slider } from "@/renderer/components/ui/slider";

interface TransparencyControlProps {
    transparency: number;
    onChange: (value: number[]) => void;
}

export function TransparencyControl(props: TransparencyControlProps) {
    const { transparency, onChange } = props;
    const { t } = useTranslation();

    return (
        <div className="flex items-center gap-3 mt-2">
            <span className="text-xs min-w-[50px] text-muted-foreground">
                {t("render.image_settings.transparency")}
            </span>
            <Slider
                value={[transparency]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={onChange}
                className="flex-grow"
            />
            <span className="text-xs min-w-[35px] text-right">
                {Math.round(transparency * 100)}%
            </span>
        </div>
    );
}
