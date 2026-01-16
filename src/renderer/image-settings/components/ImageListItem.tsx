import { useTranslation } from "react-i18next";

import { useAppStore } from "../../store/useAppStore";
import { ImageSet } from "../../../shared/types/ImageSet";
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

import { Card, CardContent } from "@/renderer/components/ui/card";

import { ImageItemHeader } from "./ImageItemHeader";
import { TransparencyControl } from "./TransparencyControl";
import { RotationControl } from "./RotationControl";
import { logger } from "../../services/loggerService";

interface ImageListItemProps {
    imageSet: ImageSet;
    index: number;
    dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

/**
 * 画像リストの各アイテム
 * パス表示、透過度スライダー、削除ボタンを含む
 */
export function ImageListItem(props: ImageListItemProps) {
    const { imageSet, index, dragHandleProps } = props;
    const { t } = useTranslation();

    const { imageSets, updateImageSet, setImageSets } = useAppStore();

    // ファイルオープン
    const handleFileOpen = async () => {
        logger.debug("Opening file dialog for image slot", { index });
        const res = await window.electronAPI.loadImage();
        if (res) {
            logger.info(`Image loaded for slot ${index}: ${res}`);
            const newImageSet = { ...imageSets[index] };
            newImageSet.path = `local-file://${res.replace(/\\/g, "/")}`;
            // ファイル読み込み直しの場合は、すべてのパラメータを初期化
            newImageSet.transparency = 0.0;
            newImageSet.rotation = 0;
            newImageSet.init_anchor_pos = null;
            newImageSet.current_anchor_pos = null;
            updateImageSet({ index: index, imageSet: newImageSet });
        } else {
            logger.debug("Image loading canceled by user");
        }
    };

    // 削除
    const handleDelete = () => {
        const newImageSets = [...imageSets];
        newImageSets.splice(index, 1);
        setImageSets(newImageSets);
    };

    // 透過度変更 (shadcn Slider returns number[])
    const handleTransparencyChange = (value: number[]) => {
        const newImageSet = { ...imageSet };
        newImageSet.transparency = value[0];
        updateImageSet({ index: index, imageSet: newImageSet });
    };

    // 回転変更
    const handleRotationChange = (value: number[]) => {
        if (!imageSet.current_anchor_pos) return;

        const newImageSet = { ...imageSet };
        newImageSet.rotation = value[0];

        updateImageSet({ index: index, imageSet: newImageSet });
    };

    // 回転入力変更 (Input)
    const handleRotationInputChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = Number(event.target.value);
        if (isNaN(value)) return;

        if (!imageSet.current_anchor_pos) return;
        const newImageSet = { ...imageSet };
        newImageSet.rotation = value;
        updateImageSet({ index: index, imageSet: newImageSet });
    };

    // ファイル名を抽出（パスから）
    const fileName = imageSet.path
        ? imageSet.path.split("/").pop() || imageSet.path
        : t("render.image_settings.no_image", "画像未選択");

    return (
        <Card className="mb-2">
            <CardContent className="p-3">
                <ImageItemHeader
                    path={imageSet.path}
                    fileName={fileName}
                    onFileOpen={handleFileOpen}
                    onDelete={handleDelete}
                    dragHandleProps={dragHandleProps}
                />

                {/* 透過度スライダー */}
                {imageSet.path && (
                    <TransparencyControl
                        transparency={imageSet.transparency}
                        onChange={handleTransparencyChange}
                    />
                )}

                {/* 回転スライダー */}
                {imageSet.path && imageSet.current_anchor_pos && (
                    <RotationControl
                        rotation={imageSet.rotation || 0}
                        onRotationChange={handleRotationChange}
                        onInputChange={handleRotationInputChange}
                    />
                )}
            </CardContent>
        </Card>
    );
}
