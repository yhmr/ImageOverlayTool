import React, { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useDispatch } from "react-redux";
import { useSelector, RootState, AppDispatch } from "../../store/store";
import { setImageSets, updateImageSet } from "../../store/imageSetsSlice";

import {
    Card,
    CardContent,
    IconButton,
    Slider,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import ClearIcon from "@mui/icons-material/Clear";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

import { ImageSet } from "../../types/ImageSet";

import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

interface ImageListItemProps {
    imageSet: ImageSet;
    index: number;
    dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

/**
 * 画像リストの各アイテム
 * パス表示、透過度スライダー、削除ボタンを含む
 */
export const ImageListItem = memo(function ImageListItem(
    props: ImageListItemProps
) {
    const { imageSet, index, dragHandleProps } = props;
    const { t } = useTranslation();

    const { imageSets } = useSelector((state: RootState) => state.imageSets);
    const dispatch = useDispatch<AppDispatch>();

    // ファイルオープン
    const handleFileOpen = useCallback(async () => {
        const res = await window.electronAPI.openFile();
        if (res) {
            const newImageSet = { ...imageSets[index] };
            newImageSet.path = `local-file://${res.replace(/\\/g, "/")}`;
            // ファイル読み込み直しの場合は、すべてのパラメータを初期化
            newImageSet.transparency = 0.0;
            newImageSet.init_anchor_pos = null;
            newImageSet.current_anchor_pos = null;
            dispatch(updateImageSet({ index: index, imageSet: newImageSet }));
        }
    }, [dispatch, imageSets, index]);

    // 削除
    const handleDelete = useCallback(() => {
        const newImageSets = [...imageSets];
        newImageSets.splice(index, 1);
        dispatch(setImageSets(newImageSets));
    }, [dispatch, imageSets, index]);

    // 透過度変更
    const handleTransparencyChange = useCallback(
        (_event: Event, value: number | number[]) => {
            if (typeof value !== "number") return;
            const newImageSet = { ...imageSet };
            newImageSet.transparency = value;
            dispatch(updateImageSet({ index: index, imageSet: newImageSet }));
        },
        [dispatch, imageSet, index]
    );

    // ファイル名を抽出（パスから）
    const fileName = imageSet.path
        ? imageSet.path.split("/").pop() || imageSet.path
        : t("render.image_settings.no_image", "画像未選択");

    return (
        <Card
            variant="outlined"
            sx={{
                mb: 1,
            }}
        >
            <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    {/* ドラッグハンドル */}
                    <div {...dragHandleProps} style={{ display: "flex", cursor: "grab" }}>
                        <DragIndicatorIcon sx={{ color: "text.secondary" }} />
                    </div>

                    {/* ファイル名 */}
                    <Typography
                        variant="body2"
                        sx={{
                            flexGrow: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                        title={imageSet.path}
                    >
                        {fileName}
                    </Typography>

                    {/* ファイルオープンボタン */}
                    <Tooltip title={t("render.image_setting_dlg.tooltip.load_image", "画像を開く")}>
                        <IconButton size="small" onClick={handleFileOpen}>
                            <FileOpenIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    {/* 削除ボタン */}
                    <Tooltip title={t("render.image_setting_dlg.tooltip.delete_image", "削除")}>
                        <IconButton size="small" onClick={handleDelete}>
                            <ClearIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>

                {/* 透過度スライダー */}
                {imageSet.path && (
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ minWidth: 50 }}>
                            {t("render.image_settings.transparency", "透過度")}
                        </Typography>
                        <Slider
                            size="small"
                            max={1}
                            min={0}
                            value={imageSet.transparency}
                            step={0.01}
                            valueLabelDisplay="auto"
                            valueLabelFormat={(x) => Math.round(x * 100) + "%"}
                            onChange={handleTransparencyChange}
                            sx={{ flexGrow: 1 }}
                        />
                        <Typography variant="caption" sx={{ minWidth: 35, textAlign: "right" }}>
                            {Math.round(imageSet.transparency * 100)}%
                        </Typography>
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
});
