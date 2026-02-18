import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { useTranslation } from "react-i18next";
import { RefreshCcw, Save } from "lucide-react";

import { Card, CardContent } from "@/renderer/components/ui/card";
import { Button } from "@/renderer/components/ui/button";
import { ImageSet } from "../../../shared/types/ImageSet";
import {
    fromLocalFileUrl,
    toLocalFileUrl,
} from "../../factories/imageSetFactory";
import { useIpcService } from "../../providers/IpcServiceProvider";
import { useAppStore } from "../../store/useAppStore";
import type { ImageFileStatus } from "../../hooks/useImageFileStatus";
import { ImageItemHeader } from "./ImageItemHeader";
import { RotationControl } from "./RotationControl";
import { ScaleControl } from "./ScaleControl";
import { TransparencyControl } from "./TransparencyControl";
import { FilterControl } from "./FilterControl";
import { MissingImageWarning } from "./MissingImageWarning";
import {
    applyScaleToImageSet,
    calculateImageScale,
    createDefaultFilters,
    createResetImageSet,
    resetImageSetTransformation,
    resolveRelinkInitAnchorPos,
} from "./imageListItemHelpers";

interface ImageListItemProps {
    imageSet: ImageSet;
    index: number;
    fileStatus?: ImageFileStatus;
    dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

/**
 * 画像リストの各アイテム
 * パス表示、透過度スライダー、削除ボタンを含む
 */
export function ImageListItem(props: ImageListItemProps) {
    const { imageSet, index, fileStatus, dragHandleProps } = props;
    const { t } = useTranslation();
    const ipcService = useIpcService();

    const {
        updateImageSet,
        setImageSets,
        selectedImageId,
        setSelectedImageId,
    } = useAppStore();
    const isMissing = Boolean(
        imageSet.path && fileStatus?.checked && !fileStatus.exists
    );

    const notifyRelinkFailure = (error: unknown) => {
        void ipcService.log.warn("Relink failed", { index, error });
        try {
            window.alert(t("render.image_settings.relink_failed"));
        } catch {
            // noop
        }
    };

    const commitImageSet = (nextImageSet: ImageSet) => {
        updateImageSet({ id: imageSet.id, imageSet: nextImageSet });
    };

    const patchImageSet = (patch: Partial<ImageSet>) => {
        commitImageSet({
            ...imageSet,
            ...patch,
        });
    };

    const applyRelink = async (selectedPath: string) => {
        const nextPath = toLocalFileUrl(selectedPath);
        const nextInfo = await ipcService.getImageInfo(nextPath);

        const nextImageSet: ImageSet = {
            ...imageSet,
            path: nextPath,
            sourceType: "file",
            initAnchorPos: resolveRelinkInitAnchorPos(
                imageSet.initAnchorPos,
                nextInfo
            ),
        };

        commitImageSet(nextImageSet);
    };

    // ファイルオープン
    const openFile = async () => {
        ipcService.log.debug("Opening file dialog for image slot", { index });
        const res = await ipcService.loadImage();
        if (res) {
            ipcService.log.info(`Image loaded for slot ${index}: ${res}`);
            if (isMissing) {
                try {
                    await applyRelink(res);
                } catch (error) {
                    notifyRelinkFailure(error);
                }
                return;
            }
            commitImageSet(createResetImageSet(imageSet, toLocalFileUrl(res)));
        } else {
            ipcService.log.debug("Image loading canceled by user");
        }
    };

    // 削除
    const deleteImageSet = () => {
        const newImageSets = useAppStore
            .getState()
            .imageSets.filter((item) => item.id !== imageSet.id);
        setImageSets(newImageSets);
    };

    // 透過度変更 (shadcn Slider returns number[])
    const changeTransparency = (value: number[]) => {
        const nextTransparency = value[0];
        if (!Number.isFinite(nextTransparency)) return;

        patchImageSet({ transparency: nextTransparency });
    };

    // 回転変更
    const changeRotation = (value: number[]) => {
        if (!imageSet.currentAnchorPos) return;

        const nextRotation = value[0];
        if (!Number.isFinite(nextRotation)) return;

        patchImageSet({ rotation: nextRotation });
    };

    const changeScale = (value: number[]) => {
        const nextImageSet = applyScaleToImageSet(imageSet, value[0]);
        if (!nextImageSet) return;

        commitImageSet(nextImageSet);
    };

    // 回転入力変更 (Input)
    const changeRotationInput = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = Number(event.target.value);
        if (isNaN(value)) return;

        if (!imageSet.currentAnchorPos) return;
        patchImageSet({ rotation: value });
    };

    // ロック切り替え
    const toggleLock = () => {
        patchImageSet({
            // undefinedの場合はfalseとして扱う
            locked: !imageSet.locked,
        });
    };

    // 表示切り替え
    const toggleVisible = () => {
        patchImageSet({
            visible: !(imageSet.visible ?? true),
        });
    };

    // 変形解除
    const resetTransformation = () => {
        const nextImageSet = resetImageSetTransformation(imageSet);
        if (!nextImageSet) return;

        commitImageSet(nextImageSet);
    };

    // フィルタ変更
    const changeFilters = (filters: ImageSet["filters"]) => {
        patchImageSet({ filters });
    };

    // ファイル名を抽出（パスから）
    const fileName = imageSet.path
        ? imageSet.path.split("/").pop() || imageSet.path
        : t("render.image_settings.no_image");

    const isSelected = selectedImageId === imageSet.id;
    const isCacheImage = (imageSet.sourceType ?? "file") === "cache";

    const saveCacheImageAs = async () => {
        if (!isCacheImage) {
            return;
        }

        const localPath = fromLocalFileUrl(imageSet.path);
        if (!localPath) {
            return;
        }

        const savedPath = await ipcService.saveCacheImageAs(localPath);
        if (!savedPath) {
            return;
        }

        const newImageSet = {
            ...imageSet,
            path: toLocalFileUrl(savedPath),
            sourceType: "file" as const,
        };
        commitImageSet(newImageSet);
    };

    const relinkMissingImage = async () => {
        const selectedPath = await ipcService.loadImage();
        if (!selectedPath) {
            return;
        }
        try {
            await applyRelink(selectedPath);
        } catch (error) {
            notifyRelinkFailure(error);
        }
    };

    const imageScale = calculateImageScale(imageSet);
    const filters = imageSet.filters ?? createDefaultFilters();

    return (
        <Card
            className={`mb-2 transition-colors cursor-pointer ${
                isSelected
                    ? "border-primary border-2"
                    : isMissing
                    ? "border-destructive/70 border-dashed"
                    : isCacheImage
                    ? "border-muted-foreground/30 border-dashed"
                    : "hover:border-muted-foreground/30"
            }`}
            onClick={() => setSelectedImageId(imageSet.id)}
            data-testid="settings.image-item.card"
        >
            <CardContent className="p-3 space-y-3">
                <ImageItemHeader
                    path={imageSet.path}
                    fileName={fileName}
                    sourceType={imageSet.sourceType}
                    isMissing={isMissing}
                    isLocked={imageSet.locked}
                    isVisible={imageSet.visible}
                    onFileOpen={openFile}
                    onToggleLock={toggleLock}
                    onToggleVisible={toggleVisible}
                    onDelete={deleteImageSet}
                    dragHandleProps={dragHandleProps}
                />

                {isMissing && (
                    <MissingImageWarning
                        message={t("render.image_settings.missing_file")}
                        relinkLabel={t("render.image_settings.relink")}
                        onRelink={() => void relinkMissingImage()}
                    />
                )}

                {/* 透過度スライダー */}
                {imageSet.path && !isMissing && (
                    <TransparencyControl
                        transparency={imageSet.transparency}
                        onChange={changeTransparency}
                    />
                )}

                {/* 拡大/縮小スライダー */}
                {imageSet.path &&
                    !isMissing &&
                    imageSet.initAnchorPos &&
                    imageSet.currentAnchorPos && (
                        <ScaleControl
                            scale={imageScale}
                            onChange={changeScale}
                        />
                    )}

                {/* 回転スライダー */}
                {imageSet.path && !isMissing && imageSet.currentAnchorPos && (
                    <RotationControl
                        rotation={imageSet.rotation || 0}
                        onRotationChange={changeRotation}
                        onInputChange={changeRotationInput}
                    />
                )}

                {/* アクションボタン群 */}
                {imageSet.path && !isMissing && (
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
                                filters={filters}
                                onFilterChange={changeFilters}
                            />
                        </div>
                    </div>
                )}

                {isCacheImage && imageSet.path && !isMissing && (
                    <Button
                        variant="default" // Cache save is important action
                        size="sm"
                        className="w-full"
                        onClick={() => void saveCacheImageAs()}
                        data-testid="settings.image-item.save-cache-image-as"
                        title={t(
                            "render.image_settings.tooltip.save_cache_image_as"
                        )}
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {t("render.image_settings.tooltip.save_cache_image_as")}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
