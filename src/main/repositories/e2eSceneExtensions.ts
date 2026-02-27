import type { E2ESceneExtensions } from "../../shared/types/E2EControl";
import type { InteractionMode } from "../../shared/types/InteractionMode";

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
    typeof value === "object" && value !== null;

const parseOptionalString = (
    value: unknown,
    pathLabel: string
): string | undefined => {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== "string") {
        throw new Error(`Invalid scene file: ${pathLabel} must be a string.`);
    }
    return value;
};

const parseOptionalNullableString = (
    value: unknown,
    pathLabel: string
): string | null | undefined => {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    if (typeof value !== "string") {
        throw new Error(
            `Invalid scene file: ${pathLabel} must be a string or null.`
        );
    }
    return value;
};

const parseOptionalBoolean = (
    value: unknown,
    pathLabel: string
): boolean | undefined => {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== "boolean") {
        throw new Error(`Invalid scene file: ${pathLabel} must be a boolean.`);
    }
    return value;
};

const parseOptionalInteractionMode = (
    value: unknown
): InteractionMode | undefined => {
    if (value === undefined) {
        return undefined;
    }
    if (
        value === "default" ||
        value === "dimension_add" ||
        value === "dimension_select"
    ) {
        return value;
    }
    throw new Error(
        "Invalid scene file: interactionMode must be one of default/dimension_add/dimension_select."
    );
};

export const parseE2ESceneExtensions = (value: unknown): E2ESceneExtensions => {
    if (!isRecord(value)) {
        throw new Error("Invalid scene file: root must be an object.");
    }

    const parsed: E2ESceneExtensions = {};
    const name = parseOptionalString(value.name, "name");
    const interactionMode = parseOptionalInteractionMode(value.interactionMode);
    const selectedImageId = parseOptionalNullableString(
        value.selectedImageId,
        "selectedImageId"
    );
    const selectedDimensionLineId = parseOptionalNullableString(
        value.selectedDimensionLineId,
        "selectedDimensionLineId"
    );
    const uiHidden = parseOptionalBoolean(value.uiHidden, "uiHidden");

    if (name !== undefined) {
        parsed.name = name;
    }
    if (interactionMode !== undefined) {
        parsed.interactionMode = interactionMode;
    }
    if (selectedImageId !== undefined) {
        parsed.selectedImageId = selectedImageId;
    }
    if (selectedDimensionLineId !== undefined) {
        parsed.selectedDimensionLineId = selectedDimensionLineId;
    }
    if (uiHidden !== undefined) {
        parsed.uiHidden = uiHidden;
    }

    return parsed;
};
