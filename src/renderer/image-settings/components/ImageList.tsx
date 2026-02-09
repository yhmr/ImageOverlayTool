import UUID from "uuidjs";
import { useTranslation } from "react-i18next";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type {
    DropResult,
    DroppableProvided,
    DraggableProvided,
} from "@hello-pangea/dnd";
import { arrayMoveImmutable } from "array-move";
import { Plus } from "lucide-react";

import { useAppStore } from "../../store/useAppStore";
import { getIPCService } from "../../services/ipcService";

import { ImageListItem } from "./ImageListItem";

import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";
import { Label } from "@/renderer/components/ui/label";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/renderer/components/ui/tooltip";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/renderer/components/ui/select";

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

    // 新しいImageSetを追加
    const handleAddImageSet = () => {
        getIPCService().log.info("Adding new empty image slot");
        const newImageSets = [...imageSets];
        newImageSets.push({
            id: UUID.generate(),
            path: "",
            transparency: 0,
            rotation: 0,
            init_anchor_pos: null,
            current_anchor_pos: null,
        });
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
                            onClick={handleAddImageSet}
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
                                    onChange={(e) =>
                                        setUnitFactor(Number(e.target.value))
                                    }
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
                                    <SelectValue placeholder="単位" />
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
