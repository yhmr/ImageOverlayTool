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

/**
 * 画像設定ウィンドウの画像リスト
 * ドラッグ&ドロップで順序変更可能
 */
export function ImageList() {
    const { t } = useTranslation();

    const { imageSets, setImageSets, unitFactor, setUnitFactor } =
        useAppStore();

    // 新しいImageSetを追加
    const handleAddImageSet = () => {
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
            <div className="flex flex-col gap-2 p-4">
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="image-list">
                        {(provided: DroppableProvided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="flex flex-col gap-2"
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
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>
                            {t(
                                "render.image_setting_dlg.tooltip.add",
                                "画像を追加"
                            )}
                        </p>
                    </TooltipContent>
                </Tooltip>

                {/* 単位設定 */}
                <div className="grid w-full max-w-sm items-center gap-1.5 mt-2">
                    <Label htmlFor="unitFactor">
                        {t("render.setting_dlg.unitFactor", "単位係数")}
                    </Label>
                    <Input
                        type="number"
                        id="unitFactor"
                        value={unitFactor}
                        onChange={(e) => setUnitFactor(Number(e.target.value))}
                        onWheel={(e: React.WheelEvent<HTMLInputElement>) => {
                            e.currentTarget.blur();
                        }}
                        className="w-[100px]"
                    />
                </div>
            </div>
        </TooltipProvider>
    );
}
