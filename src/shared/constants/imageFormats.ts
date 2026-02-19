export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "svg"];

export const IMAGE_FILTERS = [
    {
        name: "Image",
        extensions: [...IMAGE_EXTENSIONS],
    },
];

const IMAGE_EXTENSION_SET = new Set<string>(IMAGE_EXTENSIONS);

export const isSupportedImageExtension = (value: string): boolean => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
        return false;
    }

    const extension = normalized.startsWith(".")
        ? normalized.slice(1)
        : normalized;

    return IMAGE_EXTENSION_SET.has(extension);
};

export const isSupportedImagePath = (filePath: string): boolean => {
    const normalizedPath = filePath.trim().replace(/\\/g, "/");
    const extensionIndex = normalizedPath.lastIndexOf(".");
    if (extensionIndex < 0) {
        return false;
    }

    const extension = normalizedPath.slice(extensionIndex + 1);
    return isSupportedImageExtension(extension);
};
