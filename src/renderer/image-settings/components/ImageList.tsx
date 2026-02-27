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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/renderer/components/ui/tooltip";
import { createEmptyImageSet } from "../../factories/imageSetFactory";
import { useIpcService } from "../../providers/IpcServiceProvider";
import { useAppStore } from "../../store/useAppStore";
import { selectImageSets, selectSetImageSets } from "../../store/selectors";
import { useImageFileStatus } from "../../hooks/useImageFileStatus";

import { ImageListItem } from "./ImageListItem";

/**
 * 画像設定ウィンドウの画像リスト
 * ドラッグ&ドロップで順序変更可能
 */
export function ImageList() {
    const { t } = useTranslation();

    const imageSets = useAppStore(selectImageSets);
    const setImageSets = useAppStore(selectSetImageSets);
    const ipcService = useIpcService();
    const { statusById } = useImageFileStatus(imageSets);

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
                                                    fileStatus={
                                                        statusById[imageSet.id]
                                                    }
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
            </div>
        </TooltipProvider>
    );
}
