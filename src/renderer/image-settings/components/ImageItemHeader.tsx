import { useTranslation } from "react-i18next";
import { FolderOpen, Trash2, GripVertical } from "lucide-react";
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

import { Button } from "@/renderer/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/renderer/components/ui/tooltip";

interface ImageItemHeaderProps {
    path: string;
    fileName: string;
    onFileOpen: () => void;
    onDelete: () => void;
    dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

export function ImageItemHeader(props: ImageItemHeaderProps) {
    const { path, fileName, onFileOpen, onDelete, dragHandleProps } = props;
    const { t } = useTranslation();

    return (
        <div className="flex items-center gap-2 mb-2">
            {/* ドラッグハンドル */}
            <div
                {...dragHandleProps}
                className="flex cursor-grab text-muted-foreground"
            >
                <GripVertical className="h-5 w-5" />
            </div>

            {/* ファイル名 */}
            <div
                className="flex-grow overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium"
                title={path}
            >
                {fileName}
            </div>

            <TooltipProvider>
                {/* ファイルオープンボタン */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={onFileOpen}
                        >
                            <FolderOpen className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>
                            {t(
                                "render.image_setting_dlg.tooltip.load_image",
                                "画像を開く"
                            )}
                        </p>
                    </TooltipContent>
                </Tooltip>

                {/* 削除ボタン */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={onDelete}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>
                            {t(
                                "render.image_setting_dlg.tooltip.delete_image",
                                "削除"
                            )}
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
