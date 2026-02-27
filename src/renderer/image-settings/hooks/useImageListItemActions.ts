import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

import type { ImageSet } from "../../../shared/types/ImageSet";
import {
    fromLocalFileUrl,
    toLocalFileUrl,
} from "../../factories/imageSetFactory";
import { useIpcService } from "../../providers/IpcServiceProvider";
import {
    selectImageSets,
    selectSelectedImageId,
    selectSetImageSets,
    selectSetSelectedImageId,
    selectUpdateImageSet,
} from "../../store/selectors";
import { useAppStore } from "../../store/useAppStore";
import {
    applyScaleToImageSet,
    calculateImageScale,
    createDefaultFilters,
    createResetImageSet,
    resetImageSetTransformation,
    resolveRelinkInitAnchorPos,
} from "../utils/imageListItemUtils";

interface UseImageListItemActionsParams {
    imageSet: ImageSet;
    index: number;
    isMissing: boolean;
}

export const useImageListItemActions = ({
    imageSet,
    index,
    isMissing,
}: UseImageListItemActionsParams) => {
    const { t } = useTranslation();
    const ipcService = useIpcService();
    const updateImageSet = useAppStore(selectUpdateImageSet);
    const setImageSets = useAppStore(selectSetImageSets);
    const selectedImageId = useAppStore(selectSelectedImageId);
    const setSelectedImageId = useAppStore(selectSetSelectedImageId);
    const imageSets = useAppStore(selectImageSets);

    const isSelected = selectedImageId === imageSet.id;
    const isCacheImage = (imageSet.sourceType ?? "file") === "cache";
    const imageScale = calculateImageScale(imageSet);
    const filters = imageSet.filters ?? createDefaultFilters();
    const fileName = imageSet.path
        ? imageSet.path.split("/").pop() || imageSet.path
        : t("render.image_settings.no_image");

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

    const openFile = async () => {
        ipcService.log.debug("Opening file dialog for image slot", { index });
        const res = await ipcService.loadImage();
        if (!res) {
            ipcService.log.debug("Image loading canceled by user");
            return;
        }

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
    };

    const deleteImageSet = () => {
        const newImageSets = imageSets.filter(
            (item) => item.id !== imageSet.id
        );
        setImageSets(newImageSets);
    };

    const changeTransparency = (value: number[]) => {
        const nextTransparency = value[0];
        if (!Number.isFinite(nextTransparency)) return;

        patchImageSet({ transparency: nextTransparency });
    };

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

    const changeRotationInput = (event: ChangeEvent<HTMLInputElement>) => {
        const value = Number(event.target.value);
        if (isNaN(value)) return;
        if (!imageSet.currentAnchorPos) return;

        patchImageSet({ rotation: value });
    };

    const toggleLock = () => {
        patchImageSet({
            locked: !imageSet.locked,
        });
    };

    const toggleVisible = () => {
        patchImageSet({
            visible: !(imageSet.visible ?? true),
        });
    };

    const resetTransformation = () => {
        const nextImageSet = resetImageSetTransformation(imageSet);
        if (!nextImageSet) return;

        commitImageSet(nextImageSet);
    };

    const changeFilters = (nextFilters: ImageSet["filters"]) => {
        patchImageSet({ filters: nextFilters });
    };

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

        commitImageSet({
            ...imageSet,
            path: toLocalFileUrl(savedPath),
            sourceType: "file",
        });
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

    return {
        isSelected,
        isCacheImage,
        imageScale,
        filters,
        fileName,
        openFile,
        deleteImageSet,
        toggleLock,
        toggleVisible,
        changeTransparency,
        changeRotation,
        changeScale,
        changeRotationInput,
        resetTransformation,
        changeFilters,
        saveCacheImageAs,
        relinkMissingImage,
        selectImage: () => setSelectedImageId(imageSet.id),
    };
};
