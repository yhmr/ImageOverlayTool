import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { useTranslation } from "react-i18next";
import { RefreshCcw } from "lucide-react";

import { Card, CardContent } from "@/renderer/components/ui/card";
import { Button } from "@/renderer/components/ui/button";
import { ImageSet } from "../../../shared/types/ImageSet";
import { toLocalFileUrl } from "../../factories/imageSetFactory";
import { resetTransformation as resetAnchors } from "../../utils/anchorUtils";
import { useIpcService } from "../../providers/IpcServiceProvider";
import { useAppStore } from "../../store/useAppStore";
import { ImageItemHeader } from "./ImageItemHeader";
import { RotationControl } from "./RotationControl";
import { TransparencyControl } from "./TransparencyControl";
import { FilterControl } from "./FilterControl";

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
    const ipcService = useIpcService();

    const {
        imageSets,
        updateImageSet,
        setImageSets,
        selectedImageId,
        setSelectedImageId,
    } = useAppStore();

    // ファイルオープン
    const openFile = async () => {
        ipcService.log.debug("Opening file dialog for image slot", { index });
        const res = await ipcService.loadImage();
        if (res) {
            ipcService.log.info(`Image loaded for slot ${index}: ${res}`);
            const newImageSet = { ...imageSets[index] };
            newImageSet.path = toLocalFileUrl(res);
            // ファイル読み込み直しの場合は、すべてのパラメータを初期化
            newImageSet.transparency = 0.0;
            newImageSet.rotation = 0;
            newImageSet.initAnchorPos = null;
            newImageSet.currentAnchorPos = null;
            // フィルタ系もリセット
            newImageSet.visible = true;
            newImageSet.filters = {
                binarization: { enabled: false, threshold: 128 },
                hsv: { enabled: false, h: 0, s: 0, v: 0 },
            };

            updateImageSet({ index: index, imageSet: newImageSet });
        } else {
            ipcService.log.debug("Image loading canceled by user");
        }
    };

    // 削除
    const deleteImageSet = () => {
        const newImageSets = [...imageSets];
        newImageSets.splice(index, 1);
        setImageSets(newImageSets);
    };

    // 透過度変更 (shadcn Slider returns number[])
    const changeTransparency = (value: number[]) => {
        const newImageSet = { ...imageSet };
        newImageSet.transparency = value[0];
        updateImageSet({ index: index, imageSet: newImageSet });
    };

    // 回転変更
    const changeRotation = (value: number[]) => {
        if (!imageSet.currentAnchorPos) return;

        const newImageSet = { ...imageSet };
        newImageSet.rotation = value[0];

        updateImageSet({ index: index, imageSet: newImageSet });
    };

    // 回転入力変更 (Input)
    const changeRotationInput = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = Number(event.target.value);
        if (isNaN(value)) return;

        if (!imageSet.currentAnchorPos) return;
        const newImageSet = { ...imageSet };
        newImageSet.rotation = value;
        updateImageSet({ index: index, imageSet: newImageSet });
    };

    // ロック切り替え
    const toggleLock = () => {
        const newImageSet = { ...imageSet };
        // undefinedの場合はfalseとして扱う
        newImageSet.locked = !newImageSet.locked;
        updateImageSet({ index: index, imageSet: newImageSet });
    };

    // 表示切り替え
    const toggleVisible = () => {
        const newImageSet = { ...imageSet };
        newImageSet.visible = !(newImageSet.visible ?? true);
        updateImageSet({ index: index, imageSet: newImageSet });
    };

    // 変形解除
    const resetTransformation = () => {
        if (!imageSet.initAnchorPos || !imageSet.currentAnchorPos) return;
        const newAnchorPos = resetAnchors(
            imageSet.initAnchorPos,
            imageSet.currentAnchorPos
        );
        const newImageSet = {
            ...imageSet,
            currentAnchorPos: newAnchorPos,
            rotation: 0,
        };
        updateImageSet({ index, imageSet: newImageSet });
    };

    // フィルタ変更
    const changeFilters = (filters: ImageSet["filters"]) => {
        const newImageSet = { ...imageSet, filters };
        updateImageSet({ index: index, imageSet: newImageSet });
    };

    // ファイル名を抽出（パスから）
    const fileName = imageSet.path
        ? imageSet.path.split("/").pop() || imageSet.path
        : t("render.image_settings.no_image");

    const isSelected = selectedImageId === imageSet.id;

    return (
        <Card
            className={`mb-2 transition-colors cursor-pointer ${
                isSelected
                    ? "border-primary border-2"
                    : "hover:border-muted-foreground/30"
            }`}
            onClick={() => setSelectedImageId(imageSet.id)}
            data-testid="settings.image-item.card"
        >
            <CardContent className="p-3 space-y-3">
                <ImageItemHeader
                    path={imageSet.path}
                    fileName={fileName}
                    isLocked={imageSet.locked}
                    isVisible={imageSet.visible}
                    onFileOpen={openFile}
                    onToggleLock={toggleLock}
                    onToggleVisible={toggleVisible}
                    onDelete={deleteImageSet}
                    dragHandleProps={dragHandleProps}
                />

                {/* 透過度スライダー */}
                {imageSet.path && (
                    <TransparencyControl
                        transparency={imageSet.transparency}
                        onChange={changeTransparency}
                    />
                )}

                {/* 回転スライダー */}
                {imageSet.path && imageSet.currentAnchorPos && (
                    <RotationControl
                        rotation={imageSet.rotation || 0}
                        onRotationChange={changeRotation}
                        onInputChange={changeRotationInput}
                    />
                )}

                {/* アクションボタン群 */}
                {imageSet.path && (
                    <div className="flex gap-2">
                        {/* 変形解除ボタン */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={resetTransformation}
                            data-testid="settings.image-item.reset-transformation"
                            title={t(
                                "render.image_settings.tooltip.reset_transformation"
                            )}
                        >
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            {t("render.image_settings.reset_transformation")}
                        </Button>

                        {/* フィルタ設定ボタン (Popover) */}
                        <div className="flex-1">
                            <FilterControl
                                filters={imageSet.filters}
                                onFilterChange={changeFilters}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
