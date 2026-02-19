export const DIMENSION_LINE_COLOR_DEFAULT = "#2563eb";

const HEX_COLOR_PATTERN = /^#[\da-fA-F]{6}$/;
const HEX_COLOR_WITH_ALPHA_PATTERN = /^#[\da-fA-F]{8}$/;

export const sanitizeDimensionLineColor = (value: unknown): string => {
    if (typeof value !== "string") {
        return DIMENSION_LINE_COLOR_DEFAULT;
    }

    const trimmed = value.trim();
    if (HEX_COLOR_PATTERN.test(trimmed)) {
        return trimmed.toLowerCase();
    }

    if (HEX_COLOR_WITH_ALPHA_PATTERN.test(trimmed)) {
        return trimmed.slice(0, 7).toLowerCase();
    }

    return DIMENSION_LINE_COLOR_DEFAULT;
};
