import { useTranslation } from "react-i18next";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type {
    DropResult,
    DroppableProvided,
    DraggableProvided,
} from "@hello-pangea/dnd";
import { arrayMoveImmutable } from "array-move";
import { Plus } from "lucide-react";

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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/renderer/components/ui/tooltip";
import { createEmptyImageSet } from "../../factories/imageSetFactory";
import { useIpcService } from "../../providers/IpcServiceProvider";
import { useAppStore } from "../../store/useAppStore";
import {
    UNIT_FACTOR_MAX,
    UNIT_FACTOR_MIN,
} from "../../../shared/constants/unitFactor";

import { ImageListItem } from "./ImageListItem";

/**
 * 画像設定ウィンドウの画像リスト
 * ドラッグ&ドロップで順序変更可能
 */
export function ImageList() {
    const { t } = useTranslation();

    const {
        imageSets,
        setImageSets,
        unitFactor,
        setUnitFactor,
        unit,
        setUnit,
    } = useAppStore();
    const ipcService = useIpcService();

    // 新しいImageSetを追加
    const addImageSet = () => {
        ipcService.log.info("Adding new empty image slot");
        const newImageSets = [...imageSets];
        newImageSets.push(createEmptyImageSet());
        setImageSets(newImageSets);
    };

    // ドロップ実行
    const onDragEnd = (result: DropResult) => {
        if (!result.destination) {
            return;
        }
        setImageSets(
            arrayMoveImmutable(
                imageSets,
                result.source.index,
                result.destination.index
            )
        );
    };

    return (
        <TooltipProvider>
            <div
                className="flex flex-col gap-2 p-4"
                data-testid="settings.image-list.root"
            >
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="image-list">
                        {(provided: DroppableProvided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="flex flex-col gap-2"
                                data-testid="settings.image-list.items"
                            >
                                {imageSets.map((imageSet, index) => (
                                    <Draggable
                                        draggableId={imageSet.id}
                                        index={index}
                                        key={imageSet.id}
                                    >
                                        {(provided: DraggableProvided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                style={
                                                    provided.draggableProps
                                                        .style
                                                }
                                            >
                                                <ImageListItem
                                                    imageSet={imageSet}
                                                    index={index}
                                                    dragHandleProps={
                                                        provided.dragHandleProps
                                                    }
                                                />
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                {/* 画像追加ボタン */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={addImageSet}
                            className="self-start"
                            data-testid="settings.image-list.add"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t("render.image_settings.tooltip.add")}</p>
                    </TooltipContent>
                </Tooltip>

                {/* 単位設定 */}
                <div className="flex flex-col gap-2 mt-4 p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="unitFactor">
                                {t("render.setting_dlg.unitFactor")}
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    id="unitFactor"
                                    value={unitFactor}
                                    min={UNIT_FACTOR_MIN}
                                    max={UNIT_FACTOR_MAX}
                                    step="any"
                                    onChange={(e) => {
                                        const value =
                                            e.currentTarget.valueAsNumber;
                                        if (Number.isNaN(value)) {
                                            return;
                                        }
                                        setUnitFactor(value);
                                    }}
                                    onWheel={(
                                        e: React.WheelEvent<HTMLInputElement>
                                    ) => {
                                        e.currentTarget.blur();
                                    }}
                                    className="w-[100px]"
                                    data-testid="settings.unit.factor-input"
                                />
                                <span className="text-sm text-muted-foreground">
                                    {unit}/pix
                                </span>
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="unit">
                                {t("render.setting_dlg.unit")}
                            </Label>
                            <Select
                                value={unit}
                                onValueChange={(value: "nm" | "um" | "mm") =>
                                    setUnit(value)
                                }
                            >
                                <SelectTrigger
                                    id="unit"
                                    className="w-[100px]"
                                    data-testid="settings.unit.select"
                                >
                                    <SelectValue
                                        placeholder={t(
                                            "render.setting_dlg.unit"
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
                        {t("render.setting_dlg.helper.unitFactor")}
                    </p>
                </div>
            </div>
        </TooltipProvider>
    );
}
